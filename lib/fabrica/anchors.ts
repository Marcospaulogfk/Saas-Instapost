import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { imageBlockFor } from "@/lib/generation/fetch-image"
import type { MeasuredText } from "@/lib/single-posts/extract-layout"

// =====================================================================
// ÂNCORAS da clean plate — a regra nº 2 do lote de 26/08 em código.
//
// A clean plate preserva os ELEMENTOS vazios (pills, botões, checkboxes,
// ícones) quando apaga o texto. Esses elementos marcam o lugar exato de
// cada texto: o padrão que aprovou 4/4 no lote foi alinhar o texto POR
// CIMA do elemento do fundo como camada simples — nunca desenhar uma
// pill/botão HTML duplicado (dupla borda, desalinhado).
//
// `detectAnchors` mede os elementos vazios por visão; `snapToAnchors` é
// puro (testável) e ajusta as medidas ANTES do buildSpecFromLayout.
// =====================================================================

export interface Anchor {
  kind: "pill" | "button" | "checkbox" | "icon"
  /** Caixa em % do canvas (x/y = canto superior esquerdo). */
  x: number
  y: number
  w: number
  h: number
  color?: string
}

const ANCHOR_TOOL: Anthropic.Messages.Tool = {
  name: "entregar_ancoras",
  description: "Entrega os elementos gráficos VAZIOS encontrados na imagem.",
  input_schema: {
    type: "object" as const,
    properties: {
      anchors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["pill", "button", "checkbox", "icon"],
            },
            x: { type: "number" },
            y: { type: "number" },
            w: { type: "number" },
            h: { type: "number" },
            color: { type: "string" },
          },
          required: ["kind", "x", "y", "w", "h"],
        },
      },
    },
    required: ["anchors"],
  },
}

/** Mede por visão os elementos vazios da clean plate. Lança em falha. */
export async function detectAnchors(cleanUrl: string): Promise<Anchor[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente")
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await client.messages.create({
    model: MODEL_MECANICO,
    max_tokens: 2000,
    temperature: 0,
    tools: [ANCHOR_TOOL],
    tool_choice: { type: "tool", name: "entregar_ancoras" },
    messages: [
      {
        role: "user",
        content: [
          (await imageBlockFor(cleanUrl)) as Anthropic.Messages.ContentBlockParam,
          {
            type: "text",
            text: `A imagem é o fundo de um post de Instagram 4:5 de onde o texto foi REMOVIDO. Sobraram elementos gráficos vazios que marcavam o lugar dos textos. Encontre e MEÇA cada um (x, y do canto superior esquerdo e w, h — tudo em % do canvas):
- pill: cápsula/chip arredondado de cor sólida, vazio;
- button: retângulo arredondado maior (botão de CTA), vazio ou só com borda;
- checkbox: quadradinho pequeno decorativo (marcador de lista);
- icon: ícone pequeno sem letras (tesoura, estrela, chama...).
NÃO inclua fotos, pessoas, cenário nem painéis grandes de fundo (cards que ocupam mais de metade do canvas). Só os marcadores pequenos e médios.`,
          },
        ],
      },
    ],
  })
  const block = res.content.find((b) => b.type === "tool_use")
  if (!block || block.type !== "tool_use") throw new Error("visão não retornou âncoras")
  const anchors = (block.input as { anchors?: Anchor[] }).anchors ?? []
  return anchors.filter(
    (a) => a.w > 0.5 && a.h > 0.5 && a.w <= 90 && a.h <= 30 && a.x >= 0 && a.y >= 0,
  )
}

/** Centro geométrico de uma caixa {x,y,w,h} em %. */
function centro(b: { x: number; y: number; w: number; h: number }) {
  return { cx: b.x + b.w / 2, cy: b.y + b.h / 2 }
}

/**
 * Ajusta as medidas dos textos às âncoras da clean plate. Puro.
 *
 * - Texto com `pill_bg` cujo centro cai dentro (ou muito perto) de uma âncora
 *   pill/button: o fundo JÁ desenha a cápsula — o texto perde o pill_bg (vira
 *   camada de texto simples) e a caixa é centralizada NA âncora.
 * - Texto com âncora checkbox/icon imediatamente à esquerda na mesma linha:
 *   alinha o centro vertical do texto ao do marcador (o erro típico do
 *   extrator é errar o y do terço inferior em até 13%).
 */
export function snapToAnchors(
  items: MeasuredText[],
  anchors: Anchor[],
): MeasuredText[] {
  const capsulas = anchors.filter((a) => a.kind === "pill" || a.kind === "button")
  const marcadores = anchors.filter(
    (a) => a.kind === "checkbox" || a.kind === "icon",
  )
  return items.map((item) => {
    const { cx, cy } = centro({ x: item.x, y: item.y, w: item.w, h: item.h })

    if (item.pill_bg) {
      // Âncora cujo centro está mais próximo do centro do texto, com
      // tolerância generosa (o extrator erra até ~13% no eixo y).
      const alvo = capsulas
        .map((a) => {
          const c = centro(a)
          return { a, d: Math.hypot(c.cx - cx, (c.cy - cy) * 0.8) }
        })
        .sort((p, q) => p.d - q.d)[0]
      if (alvo && alvo.d < 18) {
        const dentro = {
          ...item,
          pill_bg: undefined,
          x: alvo.a.x + alvo.a.w * 0.06,
          w: alvo.a.w * 0.88,
          y: alvo.a.y + alvo.a.h * 0.18,
          h: alvo.a.h * 0.64,
        }
        return dentro
      }
      return item
    }

    // Marcador na mesma faixa vertical cujo centro está à esquerda do CENTRO
    // do texto → é o ícone/checkbox do bullet. O extrator costuma medir a
    // caixa do texto INCLUINDO o ícone (x de partida em cima dele) e errar o
    // y — então além de alinhar o y ao centro do marcador, empurramos o x
    // pra direita dele (o caso petshop: texto desenhado sobre o ícone).
    const marcador = marcadores
      .filter((a) => {
        const c = centro(a)
        return (
          c.cx < cx && // à esquerda do centro do texto
          cx - c.cx < item.w && // na vizinhança horizontal do bloco
          Math.abs(c.cy - cy) < 10 // mesma linha, com o erro típico do extrator
        )
      })
      .sort(
        (p, q) =>
          Math.abs(centro(p).cy - cy) - Math.abs(centro(q).cy - cy),
      )[0]
    if (marcador) {
      const c = centro(marcador)
      const novoX = Math.max(item.x, marcador.x + marcador.w + 1.2)
      return {
        ...item,
        y: c.cy - item.h / 2,
        x: novoX,
        w: Math.max(6, item.w - (novoX - item.x)),
      }
    }
    return item
  })
}
