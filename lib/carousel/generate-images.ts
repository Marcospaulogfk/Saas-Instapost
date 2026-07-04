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

      // Imagens ADICIONAIS (cenas diferentes) que a IA decidiu incluir.
      // Geradas em paralelo, no máx 2, cada uma do seu próprio prompt (distinto).
      const extraPrompts = (slide.extra_image_prompts ?? [])
        .map((p) => (p ?? "").trim())
        .filter(Boolean)
        .slice(0, 2)
      async function genAiImage(p: string): Promise<PreviewSlide["image"]> {
        const img: PreviewSlide["image"] = { url: null, source: null, attribution: null, error: null }
        try {
          const res = await fetch("/api/editorial/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: p, aspectRatio: "4:5" }),
          })
          const data = await res.json()
          if (!res.ok || !data?.success) {
            img.error = data?.error ?? "falha ao gerar imagem"
            return img
          }
          img.url = data.url
          img.source = "ai"
        } catch (err) {
          img.error = err instanceof Error ? err.message : "erro de rede"
        }
        return img
      }
      if (extraPrompts.length) {
        base.extra_images = await Promise.all(extraPrompts.map((p) => genAiImage(p)))
      }

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

      // 1.5) REDE DE SEGURANÇA — se a IA não marcou entidade (ou falhou) mas o
      // slide cita uma PESSOA famosa pelo nome, puxa a foto real dela. Só dispara
      // se o texto tem nome+sobrenome que resolve pra humano com foto (Wikidata),
      // então nunca puxa foto fora de contexto. Garante o caso "Tom Cruise".
      if (!base.image.url) {
        const netText = `${slide.title ?? ""} ${slide.subtitle ?? ""}`.trim()
        try {
          const res = await fetch("/api/carousel/person-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: netText }),
          })
          const data = await res.json()
          if (res.ok && data?.url) {
            base.image.url = data.url
            base.image.source = "wikimedia"
            base.image.attribution = data.attribution ?? null
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
