import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import { imageBlockFor } from "@/lib/generation/fetch-image"
import type { FreeBlock, FreePostSpec } from "@/lib/single-posts/free-spec"

// =====================================================================
// O JUIZ COM RENDER NO LOOP — a peça que faltava da fábrica.
//
// Nos pilotos de 26/08 o loop renderiza→compara→patcha→repete foi feito
// à mão e levou toda conversão de ~75% pra ~95%. Aqui ele vira código:
// o juiz VLM recebe o ORIGINAL e o RENDER lado a lado + o inventário de
// blocos numerados, devolve um score e PATCHES por bloco (posição em
// cqw, corpo, cor, alinhamento). `aplicarPatches` é puro e testado.
//
// Quem renderiza é o chamador (o painel usa o próprio navegador; o
// harness usa chrome headless) — o juiz só compara e corrige.
// =====================================================================

export interface JudgePatch {
  /** Índice do bloco em spec.blocks. */
  index: number
  /** Posição em cqw (100cqw = largura do canvas; altura 4:5 = 135cqw). */
  left?: number
  top?: number
  width?: number
  /** Corpo da fonte em cqw (vira "min(Xcqw, Ypx)"). */
  font_size_cqw?: number
  color?: string
  text_align?: "left" | "center" | "right"
  /** Texto corrigido (só quando o render mostra texto errado). */
  text?: string
}

export interface JudgeVerdict {
  score: number
  aprovado: boolean
  problemas: string[]
  patches: JudgePatch[]
}

const JUDGE_TOOL: Anthropic.Messages.Tool = {
  name: "entregar_julgamento",
  description: "Entrega o veredito da comparação e os patches de correção.",
  input_schema: {
    type: "object" as const,
    properties: {
      score: {
        type: "number",
        description: "0-100: o quanto o RENDER reproduz o ORIGINAL.",
      },
      aprovado: {
        type: "boolean",
        description: "true se o render passaria por igual ao original pra um cliente.",
      },
      problemas: { type: "array", items: { type: "string" } },
      patches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "number" },
            left: { type: "number" },
            top: { type: "number" },
            width: { type: "number" },
            font_size_cqw: { type: "number" },
            color: { type: "string" },
            text_align: { type: "string", enum: ["left", "center", "right"] },
            text: { type: "string" },
          },
          required: ["index"],
        },
      },
    },
    required: ["score", "aprovado", "problemas", "patches"],
  },
}

/** Inventário compacto dos blocos pro juiz referenciar por índice. */
function inventario(spec: FreePostSpec): string {
  return spec.blocks
    .map((b, i) => {
      const p = (b.position ?? {}) as Record<string, string | undefined>
      const texto = "text" in b ? (b as { text?: string }).text : ""
      return `${i}: ${b.type} left=${p.left ?? "?"} top=${p.top ?? "?"} width=${p.width ?? "?"} ${
        "font_size" in b ? `font=${(b as { font_size?: string }).font_size}` : ""
      } ${texto ? `"${String(texto).slice(0, 40)}"` : ""}`
    })
    .join("\n")
}

/**
 * Compara original vs render e devolve veredito + patches. O render chega
 * como data URL (PNG capturado pelo chamador).
 */
export async function julgarRender(
  originalUrl: string,
  renderDataUrl: string,
  spec: FreePostSpec,
): Promise<JudgeVerdict> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente")
  const m = renderDataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/)
  if (!m) throw new Error("renderDataUrl inválido (esperado data:image/png;base64)")
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const res = await client.messages.create({
    model: MODEL_MECANICO,
    max_tokens: 3000,
    temperature: 0,
    tools: [JUDGE_TOOL],
    tool_choice: { type: "tool", name: "entregar_julgamento" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "IMAGEM 1 — o ORIGINAL (referência aprovada):" },
          (await imageBlockFor(originalUrl)) as Anthropic.Messages.ContentBlockParam,
          { type: "text", text: "IMAGEM 2 — o RENDER da versão editável:" },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: m[1] === "png" ? "image/png" : "image/jpeg",
              data: m[2],
            },
          },
          {
            type: "text",
            text: `Compare o RENDER com o ORIGINAL. O render é montado por camadas posicionadas; sua tarefa é dizer o quanto ele reproduz o original e CORRIGIR as camadas erradas.

BLOCOS DO RENDER (índice: tipo, posição atual):
${inventario(spec)}

UNIDADES: left/width em cqw onde 100cqw = largura total do canvas. top em cqw onde o canvas 4:5 vai de 0 (topo) a 135 (base). Ex.: um texto no meio vertical tem top ≈ 65; a 80% da altura, top = 80 × 1.35 ≈ 108.

REGRAS DO PATCH:
- Corrija POSIÇÃO comparando onde o elemento está no ORIGINAL vs no RENDER (ex.: bullet que no original fica ao lado direito do ícone e no render está acima dele).
- Corrija font_size_cqw quando o texto do render é visivelmente maior/menor que no original (estime: corpo ≈ altura da letra / altura do canvas × 135).
- Corrija cor só quando claramente diferente.
- NÃO invente blocos novos nem mude texto que já confere com o original.
- Fundo (foto) não é patchável — ignore diferenças de foto.
- aprovado=true SÓ se um cliente não notaria diferença de layout relevante (score ≥ 90).

Liste os problemas em português, curtos e concretos.`,
          },
        ],
      },
    ],
  })
  const block = res.content.find((b) => b.type === "tool_use")
  if (!block || block.type !== "tool_use") throw new Error("juiz não retornou julgamento")
  const v = block.input as JudgeVerdict
  return {
    score: Math.max(0, Math.min(100, Number(v.score) || 0)),
    aprovado: !!v.aprovado,
    problemas: v.problemas ?? [],
    patches: (v.patches ?? []).filter(
      (p) => Number.isInteger(p.index) && p.index >= 0 && p.index < spec.blocks.length,
    ),
  }
}

const fmtCqw = (n: number) => `${n.toFixed(1)}cqw`

/** Aplica os patches do juiz num spec. Puro — não muta o original. */
export function aplicarPatches(spec: FreePostSpec, patches: JudgePatch[]): FreePostSpec {
  const blocks = spec.blocks.map((b) => ({ ...b }) as FreeBlock)
  for (const p of patches) {
    const b = blocks[p.index] as FreeBlock & {
      position?: Record<string, string>
      font_size?: string
      color?: string
      fg?: string
      text_align?: string
      text?: string
    }
    if (!b) continue
    const pos = { ...(b.position ?? {}) }
    if (p.left !== undefined) pos.left = fmtCqw(p.left)
    if (p.top !== undefined) pos.top = fmtCqw(p.top)
    if (p.width !== undefined) pos.width = fmtCqw(Math.max(4, p.width))
    b.position = pos
    if (p.font_size_cqw !== undefined) {
      const cqw = Math.max(1.2, Math.min(16, p.font_size_cqw))
      b.font_size = `min(${cqw.toFixed(2)}cqw, ${Math.round(cqw * 10.8)}px)`
    }
    if (p.color) {
      if (b.type === "pill") b.fg = p.color
      else b.color = p.color
    }
    if (p.text_align && b.type === "text") b.text_align = p.text_align
    if (p.text && "text" in b && p.text.trim()) b.text = p.text
  }
  return { ...spec, blocks }
}
