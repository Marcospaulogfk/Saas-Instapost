import type { ClaudeSlide } from "@/lib/generation/claude"
import type { PreviewSlide } from "@/components/carousel/slide-preview"

/**
 * Recebe os slides text-only do roteiro (ClaudeSlide) e gera a imagem de cada um,
 * devolvendo PreviewSlide[] pronto pro editor/preview.
 *
 * Cascata por slide:
 *  1. Se o slide tem image_entity (empresa/pessoa real) → foto/logo real (Wikimedia).
 *  2. Senão (ou se a Wikipedia não tiver) → imagem gerada por IA com image_prompt.
 *
 * Roda os slides em paralelo. Nenhum slide fica sem tentar — se tudo falhar,
 * o slide volta sem imagem (image.url = null) e o editor permite trocar à mão.
 */
export async function generateCarouselImages(
  slides: ClaudeSlide[],
): Promise<PreviewSlide[]> {
  return Promise.all(
    slides.map(async (slide, i): Promise<PreviewSlide> => {
      const base: PreviewSlide = {
        order_index: typeof slide.order_index === "number" ? slide.order_index : i,
        title: slide.title,
        highlight_words: slide.highlight_words ?? [],
        subtitle: slide.subtitle ?? "",
        body: slide.body,
        cta_badge: slide.cta_badge,
        image: {
          url: null,
          source: null,
          attribution: null,
          error: null,
        },
      }

      const entity = (slide.image_entity ?? "").trim()
      const prompt = (slide.image_prompt ?? "").trim()

      // 1) Entidade real → Wikimedia (logo/foto)
      if (entity) {
        try {
          const res = await fetch("/api/post-unico/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "wikimedia", query: entity }),
          })
          const data = await res.json()
          if (res.ok && data?.url) {
            base.image.url = data.url
            base.image.source = "wikimedia"
            return base
          }
        } catch {
          // segue pro fallback de IA
        }
      }

      // 2) Fallback IA
      if (!prompt) return base
      try {
        const res = await fetch("/api/editorial/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspectRatio: "4:5" }),
        })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          base.image.error = data?.error ?? "falha ao gerar imagem"
          return base
        }
        base.image.url = data.url
        base.image.source = "ai"
        return base
      } catch (err) {
        base.image.error = err instanceof Error ? err.message : "erro de rede"
        return base
      }
    }),
  )
}
