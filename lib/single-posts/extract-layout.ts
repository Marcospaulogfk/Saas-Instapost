/**
 * MODO HÍBRIDO do post único: a visão MEDE o layout, a matemática posiciona.
 *
 * A Rota B2 (transcrição) quebrava porque o modelo CHUTAVA posições e
 * larguras — e a métrica das nossas fontes nunca batia com a da referência
 * bitmapada (coluna estreita, uma palavra por linha, overflow). Aqui a
 * divisão de trabalho muda:
 *
 *  - O Claude com visão olha a REFERÊNCIA (o post completo desenhado pelo
 *    nano-banana) e devolve, pra cada texto conhecido, a CAIXA medida
 *    (x/y/largura/altura em % do canvas), cor, alinhamento e classe de fonte.
 *  - Código determinístico (buildSpecFromLayout) cria os blocos HTML naquelas
 *    caixas, com o corpo da fonte CALCULADO pra caber na caixa — o modelo
 *    nunca mais escolhe font_size.
 *
 * O resultado renderiza sobre a CLEAN PLATE (a mesma arte com o texto
 * removido) e é 100% editável no editor: drag, resize e edição de texto
 * grátis — a experiência do carrossel, com o visual do bitmap.
 */
import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { imageBlockFor } from "@/lib/generation/fetch-image"
import type { SkeletonContent } from "./skeletons"
import type {
  FreeBlock,
  FreeFontKey,
  FreePostSpec,
  FreeTextBlock,
} from "./free-spec"

export interface MeasuredText {
  /** Texto EXATO como está na arte (o slot correspondente). */
  text: string
  /** Caixa em % do canvas (x/y = canto superior esquerdo). */
  x: number
  y: number
  w: number
  h: number
  /** Nº de linhas em que o texto está quebrado na arte. */
  lines: number
  color: string
  align: "left" | "center" | "right"
  font_class:
    | "condensed-heavy"
    | "condensed-light"
    | "sans-heavy"
    | "sans"
    | "serif"
    | "serif-italic"
    | "script"
  uppercase: boolean
  italic: boolean
  /** Preenchido quando o texto vive dentro de um chip/botão (pill). */
  pill_bg?: string
  /** Palavra(s) do texto numa cor de destaque diferente. */
  highlight_words?: string[]
  highlight_color?: string
}

const FONT_BY_CLASS: Record<MeasuredText["font_class"], FreeFontKey> = {
  "condensed-heavy": "anton",
  "condensed-light": "bebas",
  "sans-heavy": "archivo",
  sans: "inter",
  serif: "playfair",
  "serif-italic": "playfair_italic",
  script: "allura",
}

const LAYOUT_TOOL: Anthropic.Messages.Tool = {
  name: "entregar_layout",
  description: "Entrega as medidas de cada texto encontrado na arte.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            w: { type: "number" },
            h: { type: "number" },
            lines: { type: "number" },
            color: { type: "string" },
            align: { type: "string", enum: ["left", "center", "right"] },
            font_class: {
              type: "string",
              enum: [
                "condensed-heavy",
                "condensed-light",
                "sans-heavy",
                "sans",
                "serif",
                "serif-italic",
                "script",
              ],
            },
            uppercase: { type: "boolean" },
            italic: { type: "boolean" },
            pill_bg: { type: "string" },
            highlight_words: { type: "array", items: { type: "string" } },
            highlight_color: { type: "string" },
          },
          required: [
            "text",
            "x",
            "y",
            "w",
            "h",
            "lines",
            "color",
            "align",
            "font_class",
            "uppercase",
          ],
        },
      },
    },
    required: ["items"],
  },
}

/** Textos que podem estar pintados na arte, na ordem de leitura. */
function knownTexts(content: SkeletonContent): string[] {
  const out: string[] = []
  if (content.kicker) out.push(content.kicker)
  if (content.title) out.push(content.title)
  if (content.subtitle) out.push(content.subtitle)
  if (content.stat_value) out.push(content.stat_value)
  for (const b of content.bullets ?? []) if (b.label) out.push(b.label)
  if (content.cta_text) out.push(content.cta_text)
  return out
}

/**
 * Mede o layout da referência por visão. Lança em falha — quem chama decide o
 * fallback (bitmap puro).
 */
export async function extractTextLayout(
  referenceUrl: string,
  content: SkeletonContent,
): Promise<MeasuredText[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente")
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const lista = knownTexts(content)
  if (!lista.length) throw new Error("sem textos conhecidos pra medir")

  const prompt = `A imagem é um post de Instagram 4:5 (1080×1350). Estes textos foram desenhados nela (o desenho pode ter pequenos erros de grafia — case pelo mais parecido e devolva o texto CORRETO da lista, nunca o grafado errado):

${lista.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

Pra CADA texto da lista que aparecer na arte, MEÇA com precisão:
- x, y: canto superior esquerdo da caixa do texto, em % (x da largura, y da altura);
- w, h: largura e altura da caixa em %, JUSTAS ao texto (sem folga além do line-height);
- lines: em quantas linhas o texto está quebrado;
- color: cor hex aproximada do texto;
- align: alinhamento dentro da caixa;
- font_class: condensed-heavy (tipo Anton/Impact), condensed-light (Bebas), sans-heavy (Archivo Black), sans (Inter/Helvetica), serif (Playfair/Didot), serif-italic, script (caligráfica);
- uppercase / italic;
- pill_bg: SE o texto vive dentro de um chip/botão de cor sólida, a cor hex do chip (senão omita);
- highlight_words/highlight_color: SE parte do texto está noutra cor (ex: uma palavra em azul dentro de headline branca).

Texto da lista que NÃO aparece na arte: não inclua. Não invente itens fora da lista.`

  const res = await client.messages.create({
    model: MODEL_MECANICO,
    max_tokens: 3000,
    temperature: 0,
    tools: [LAYOUT_TOOL],
    tool_choice: { type: "tool", name: "entregar_layout" },
    messages: [
      {
        role: "user",
        content: [
          // Inline (base64) pelo mesmo motivo do compose: a Anthropic nao
          // baixa toda URL. Degrada pra URL sozinho se o download falhar.
          (await imageBlockFor(referenceUrl)) as Anthropic.Messages.ContentBlockParam,
          { type: "text", text: prompt },
        ],
      },
    ],
  })
  const block = res.content.find((b) => b.type === "tool_use")
  if (!block || block.type !== "tool_use") {
    throw new Error("visão não retornou o layout")
  }
  const items = (block.input as { items?: MeasuredText[] }).items ?? []
  // Saneamento: caixa dentro do canvas, medidas plausíveis.
  const ok = items.filter(
    (i) =>
      typeof i.text === "string" &&
      i.text.trim() &&
      i.x >= 0 &&
      i.y >= 0 &&
      i.w > 2 &&
      i.h > 0.8 &&
      i.x + i.w <= 102 &&
      i.y + i.h <= 102,
  )
  if (!ok.length) throw new Error("visão não mediu nenhum texto válido")
  return ok
}

// =============================================================================
// Builder determinístico
// =============================================================================

/** Canvas de referência: 1080×1350; 1cqw = 10.8px; 1% de altura = 13.5px. */
const CANVAS_H_PX = 1350
const CQW_PX = 10.8
/** Fator largura-média-de-glifo/corpo (mesma régua do compose). */
const CHAR_W = 0.55
const LINE_HEIGHT = 1.12

/**
 * Corpo de fonte (em cqw) que faz `text` caber na caixa medida.
 *
 * Duas restrições, vence a MENOR:
 *  - altura: `lines` linhas × corpo × line-height ≤ altura da caixa;
 *  - largura: a linha mais longa (~len/lines chars) ≤ largura da caixa.
 * O modelo nunca escolhe corpo de fonte — é daqui que sai o fim do
 * "uma palavra por linha".
 */
function fitFontCqw(text: string, wPct: number, hPct: number, lines: number): number {
  const n = Math.max(1, lines)
  const widthCqw = wPct // 1% da largura = 1cqw
  const hPx = (hPct / 100) * CANVAS_H_PX
  const byHeight = hPx / n / LINE_HEIGHT / CQW_PX
  const longestLine = Math.ceil(text.length / n)
  const byWidth = widthCqw / (CHAR_W * Math.max(2, longestLine))
  const size = Math.min(byHeight, byWidth)
  return Math.max(1.6, Math.min(16, size))
}

/** Converte as medidas num FreePostSpec editável sobre a clean plate. */
export function buildSpecFromLayout(
  cleanUrl: string,
  items: MeasuredText[],
): FreePostSpec {
  const blocks: FreeBlock[] = items.map((i, idx): FreeBlock => {
    const size = fitFontCqw(i.text, i.w, i.h, i.lines)
    const sizeStr = `min(${size.toFixed(2)}cqw, ${Math.round(size * CQW_PX)}px)`
    // Posição em cqw, NUNCA em %: é a unidade que o resize do editor grava e a
    // única que resolve igual no canvas e dentro do wrapper do modo editável
    // (width em % aplicava duas vezes e desmontava o post ao abrir no editor).
    // x/w são % da largura → cqw 1:1; y é % da ALTURA → ×1.25 no canvas 4:5.
    const yCqw = i.y * (CANVAS_H_PX / 1080)
    const position = {
      left: `${i.x.toFixed(1)}cqw`,
      top: `${yCqw.toFixed(1)}cqw`,
      width: `${Math.min(100 - i.x, i.w + 1).toFixed(1)}cqw`,
    }
    if (i.pill_bg) {
      return {
        type: "pill",
        text: i.text,
        bg: i.pill_bg,
        fg: i.color,
        font: FONT_BY_CLASS[i.font_class] ?? "inter_bold",
        font_size: sizeStr,
        text_transform: i.uppercase ? "uppercase" : "none",
        position,
        z: 5 + idx,
      }
    }
    const t: FreeTextBlock = {
      type: "text",
      text: i.text,
      font: FONT_BY_CLASS[i.font_class] ?? "inter",
      font_size: sizeStr,
      color: i.color,
      text_align: i.align,
      text_transform: i.uppercase ? "uppercase" : "none",
      line_height: LINE_HEIGHT,
      position,
      z: 5 + idx,
    }
    if (i.italic || i.font_class === "serif-italic") t.font_style = "italic"
    if (i.highlight_words?.length && i.highlight_color) {
      t.highlights = i.highlight_words
      t.highlight_color = i.highlight_color
    }
    return t
  })

  return {
    version: 1,
    background: { kind: "photo", photo_url: cleanUrl },
    blocks,
    rationale:
      "Modo híbrido: layout medido por visão na referência; camadas editáveis sobre a clean plate.",
  }
}
