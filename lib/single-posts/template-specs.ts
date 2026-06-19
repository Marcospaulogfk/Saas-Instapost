/**
 * Unificação dos templates curados no sistema de "spec livre" (FreePostSpec).
 *
 * Cada template ganha um builder que devolve um FreePostSpec — assim ele
 * renderiza pelo MESMO renderizador editável dos skeletons (FreePostRenderer),
 * e o usuário pode mover / trocar fonte / mudar tamanho de QUALQUER elemento.
 *
 * Templates ainda não convertidos retornam null → o /teste cai no PostPreview
 * (layout fixo) como fallback. Conversão feita em fases.
 */
import type { PostBrand, PostContent } from "./types"
import type { FreePostSpec, FreeBlock, FreeBackground } from "./free-spec"
import { handlePill, pickColors } from "./skeletons"
import { autoTitleSize } from "@/components/single-posts/shared/autofit"

type TemplateSpecBuilder = (
  content: PostContent,
  brand: PostBrand,
  photoUrl: string | null,
) => FreePostSpec

// ── beauty-01-closeup-serif-editorial ───────────────────────────────────────
// Foto fullbleed + título serif (linha do meio italic) na metade esquerda +
// divisor accent + body. Tudo vira bloco editável.
// Deriva as linhas do título de forma robusta: title_lines (sem vazios) →
// senão quebra o title em ~3 linhas balanceadas → senão vazio.
function deriveTitleLines(content: PostContent): string[] {
  const fromLines = (content.title_lines ?? []).map((l) => (l ?? "").trim()).filter(Boolean)
  if (fromLines.length) return fromLines
  const t = (content.title ?? "").trim()
  if (!t) return []
  const words = t.split(/\s+/)
  const per = Math.max(1, Math.ceil(words.length / 3))
  const out: string[] = []
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "))
  return out
}

const buildBeauty01: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const titleLines = deriveTitleLines(content)
  const photo = photoUrl ?? content.image_url ?? null

  const bg: FreeBackground = photo
    ? {
        kind: "photo",
        photo_url: photo,
        // Escurece o lado esquerdo (onde fica o texto) pra texto branco ficar
        // legível mesmo sobre foto clara.
        photo_overlay: {
          color: "#000000",
          opacity: 0.55,
          direction: "to right",
          start: 0.5,
        },
      }
    : {
        kind: "gradient",
        gradient_from: "#2a1f18",
        gradient_to: "#5c3a2c",
        gradient_angle: 135,
      }

  // ESTRUTURA PLANA (padrão dos skeletons): título = UM bloco de texto com \n.
  // Stack de nível único com filhos-folha → auto-detach solta cada bloco
  // individualmente e todos viram editáveis (mover/fonte/tamanho) no painel.
  const outerChildren: FreeBlock[] = []
  if (titleLines.length) {
    outerChildren.push({
      type: "text",
      position: {},
      text: titleLines.join("\n"),
      font: "playfair",
      font_size: autoTitleSize(titleLines, 15, 55),
      font_weight: 500,
      color: "#FFFFFF",
      line_height: 1.05,
      letter_spacing: "-0.02em",
      text_shadow: true,
    })
  }
  outerChildren.push({
    type: "divider",
    position: { width: "min(15cqw, 60px)" },
    color: c.accent,
    thickness: 1,
  })
  if (content.body) {
    outerChildren.push({
      type: "text",
      position: {},
      text: content.body,
      font: "inter",
      font_size: "min(3cqw, 0.92rem)",
      font_weight: 400,
      color: "rgba(255,255,255,0.95)",
      line_height: 1.45,
      highlights: content.highlight_words,
      text_shadow: true,
    })
  }

  const blocks: FreeBlock[] = [
    handlePill(brand, "dark"),
    {
      type: "stack",
      position: { left: "5cqw", top: "50%", center_y: true, width: "55cqw" },
      direction: "column",
      gap: "min(4cqw, 18px)",
      align: "start",
      z: 5,
      children: outerChildren,
    },
  ]

  return { version: 1, background: bg, blocks }
}

// Registry: templateId → builder. Adicionar conforme converte cada template.
export const TEMPLATE_SPEC_BUILDERS: Record<string, TemplateSpecBuilder> = {
  "beauty-01-closeup-serif-editorial": buildBeauty01,
}

/** Devolve um FreePostSpec editável pro template, ou null se ainda não convertido. */
export function buildTemplateSpec(
  templateId: string,
  content: PostContent,
  brand: PostBrand,
  photoUrl: string | null,
): FreePostSpec | null {
  const builder = TEMPLATE_SPEC_BUILDERS[templateId]
  return builder ? builder(content, brand, photoUrl) : null
}
