import type { ClaudeSlide } from "@/lib/generation/claude"
import type { PreviewSlide } from "@/components/carousel/slide-preview"
import type { ImageChoice } from "@/lib/tokens"
import { proxiedImageUrl } from "@/lib/proxy-image"
import {
  decideImagePolicy,
  enforceVeracity,
  fallbackScenePrompt,
} from "@/lib/carousel/image-policy"

/**
 * Carrega a imagem e devolve a proporção (largura/altura). Usada pra REJEITAR
 * wordmarks/logos: eles são muito mais largos que altos. Erro/timeout → 99
 * (tratado como "não usar"). Só roda no browser.
 */
function loadAspect(url: string): Promise<number> {
  if (typeof window === "undefined") return Promise.resolve(1)
  return new Promise((resolve) => {
    const img = new window.Image()
    const done = (v: number) => resolve(v)
    img.onload = () =>
      done(img.naturalHeight ? img.naturalWidth / img.naturalHeight : 99)
    img.onerror = () => done(99)
    img.src = url
    // rede lenta: não trava a geração
    setTimeout(() => done(99), 6000)
  })
}

/** Acima disto a imagem é "larga demais" — provável logo/wordmark. */
const WORDMARK_ASPECT = 1.7

/** Tudo ligado — o comportamento de antes da escolha do usuário existir. */
const ALL_IMAGES: ImageChoice = { cover: true, slides: true }

/**
 * Recebe os slides text-only do roteiro (ClaudeSlide) e gera a imagem de cada um,
 * devolvendo PreviewSlide[] pronto pro editor/preview.
 *
 * Cascata por slide (degrada de FAMÍLIA, nunca de PRECISÃO):
 *  0. CAPA: foto do próprio artigo de origem (og:image), quando o post veio de
 *     um link. É a imagem certa, é grátis e economiza os 25 tokens da capa.
 *  1. image_entity → foto REAL validada (Wikimedia estrito: o nome que voltou
 *     tem que ser o nome pedido; entidade-pessoa exige P31=Q5 + P18).
 *  2. Rede de segurança: nome próprio no texto → foto real da pessoa.
 *  3. Imagem gerada por IA, com a TRAVA DE VERACIDADE aplicada ao prompt:
 *     se o slide nomeia uma pessoa real e não achamos foto dela, o prompt sai
 *     proibido de conter rosto. Ou é a pessoa certa, ou não é pessoa nenhuma.
 *
 * `choice` é o que o usuário marcou no wizard e controla APENAS o passo 3 (a
 * IA, que é o que custa token). As fotos reais do Wikimedia continuam ligadas
 * mesmo com tudo desmarcado: elas são gratuitas, e "sem imagem de IA" não
 * deveria significar "carrossel sem imagem nenhuma".
 *
 * Roda os slides em paralelo. Nenhum slide fica sem tentar — se tudo falhar,
 * o slide volta sem imagem (image.url = null) e o editor permite trocar à mão.
 */
export async function generateCarouselImages(
  slides: ClaudeSlide[],
  choice: ImageChoice = ALL_IMAGES,
  opts: { coverPhotoUrl?: string | null } = {},
): Promise<PreviewSlide[]> {
  return Promise.all(
    slides.map(async (slide, i): Promise<PreviewSlide> => {
      // Capa = order_index 0 (com a posição no array como reserva). É ela que
      // decide tanto o modelo quanto o preço: 25 tokens contra 2.
      const isCover =
        (typeof slide.order_index === "number" ? slide.order_index : i) === 0
      const aiAllowed = isCover ? choice.cover : choice.slides
      const role = isCover ? "cover" : "slide"
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
      const slideText = `${slide.title ?? ""} ${slide.subtitle ?? ""} ${slide.body ?? ""}`.trim()
      // Classe de imagem ANTES do prompt: é o passo que não existia e que fazia
      // "arquiteta premiada" virar "pessoa genérica numa mesa".
      const policy = decideImagePolicy({
        entity,
        entityKind: slide.image_entity_kind,
        text: slideText,
      })
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
            body: JSON.stringify({ prompt: p, aspectRatio: "4:5", role }),
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
      // Imagens extras são IA pura — se o usuário desmarcou este tipo de
      // slide, elas nem são pedidas. Eram até 2 cobranças invisíveis por slide.
      if (aiAllowed && extraPrompts.length) {
        base.extra_images = await Promise.all(extraPrompts.map((p) => genAiImage(p)))
      }

      // 0) CAPA vinda de link: a foto do próprio artigo é a imagem certa e é
      // grátis. O scraper já capturava o og:image e o pipeline jogava fora —
      // pra depois pagar 25 tokens gerando uma foto errada.
      if (isCover && opts.coverPhotoUrl) {
        // Mede pela URL proxiada: medir a URL crua de um veículo com proteção
        // de hotlink estoura o timeout e descarta uma capa perfeitamente boa.
        const aspect = await loadAspect(proxiedImageUrl(opts.coverPhotoUrl))
        if (aspect < WORDMARK_ASPECT) {
          base.image.url = opts.coverPhotoUrl
          base.image.source = "wikimedia"
          return base
        }
      }

      // 1) Entidade real → Wikimedia (foto) em modo ESTRITO: o nome que voltou
      // precisa corresponder ao nome pedido, e entidade-pessoa exige P31=Q5.
      // REGRA: JAMAIS usar wordmark/logo. Se o resultado for largo demais (logo
      // de empresa), IGNORA e cai pra IA — que gera uma cena de verdade em vez
      // de esticar um wordmark.
      if (entity) {
        try {
          const res = await fetch("/api/post-unico/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "wikimedia",
              query: entity,
              strict: true,
              requireHuman: policy.entityKind === "person",
              // Contexto do post: descarta entidade homônima de outro
              // domínio/país que passaria só pela igualdade de nome.
              context: slideText,
            }),
          })
          const data = await res.json()
          if (res.ok && data?.url) {
            const aspect = await loadAspect(data.url)
            if (aspect < WORDMARK_ASPECT) {
              base.image.url = data.url
              base.image.source = "wikimedia"
              return base
            }
            // largo = logo/wordmark → descarta e segue pro fallback de IA
          }
        } catch {
          // segue pro fallback de IA
        }
      }

      // 2) REDE DE SEGURANÇA — se a IA não marcou entidade (ou falhou) mas o
      // slide cita uma PESSOA famosa pelo nome, puxa a foto real dela. Só dispara
      // se o texto tem nome+sobrenome que resolve pra humano com foto (Wikidata),
      // então nunca puxa foto fora de contexto. Garante o caso "Tom Cruise".
      // `personDetected` = o nome do slide resolveu pra uma pessoa REAL, mesmo
      // sem foto livre. É o sinal que liga a trava de rosto quando a IA deixou
      // image_entity vazio — o caso que produziu a capa errada.
      let textNamesRealPerson = false
      if (!base.image.url) {
        const netText = `${slide.title ?? ""} ${slide.subtitle ?? ""}`.trim()
        try {
          const res = await fetch("/api/carousel/person-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: netText }),
          })
          const data = await res.json()
          if (data?.personDetected) textNamesRealPerson = true
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

      // 3) Fallback IA — só se o usuário pediu imagem de IA neste tipo de slide.
      if (!aiAllowed) return base

      // TRAVA DE VERACIDADE (regra de código, não de prompt).
      // Chegamos aqui sem foto real. Se o slide nomeia uma pessoa REAL, gerar
      // um rosto agora produziria um retrato sintético de alguém que existe —
      // exatamente o erro do caso Marilia Pellegrini. O prompt sai proibido de
      // conter rosto, e o sujeito vira a OBRA/cena em vez da pessoa.
      const basePrompt = prompt || (policy.entity ? fallbackScenePrompt(policy.entity) : "")
      if (!basePrompt) return base
      const safePrompt = enforceVeracity(basePrompt, {
        namesRealPerson: policy.namesRealPerson || textNamesRealPerson,
        hasVerifiedPhoto: false,
        text: slideText,
      })

      try {
        const res = await fetch("/api/editorial/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: safePrompt, aspectRatio: "4:5", role }),
        })
        const data = await res.json()
        if (!res.ok || !data?.success) {
          base.image.error = data?.error ?? "falha ao gerar imagem"
          return base
        }
        base.image.url = data.url
        base.image.source = "ai"

        // VALIDAÇÃO DE RELEVÂNCIA (só a capa, e só com IMAGE_RELEVANCE_CHECK=1).
        // Nada no pipeline comparava a imagem final com o assunto: uma capa
        // 100% fora de tema atravessava tudo sem disparar nada. Reprovando,
        // registra o motivo pro editor mostrar — nunca apaga a imagem, porque
        // capa nenhuma é pior que capa discutível.
        if (isCover) {
          try {
            const check = await fetch("/api/carousel/validate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: data.url,
                text: slideText,
                personName: policy.namesRealPerson ? policy.entity : null,
              }),
            })
            const verdict = await check.json()
            if (verdict?.skipped === false && verdict?.aprovada === false) {
              base.image.error = `capa possivelmente fora de tema: ${verdict.motivo ?? "sem relação com o texto"}`
            }
          } catch {
            // validação nunca bloqueia a geração
          }
        }
        return base
      } catch (err) {
        base.image.error = err instanceof Error ? err.message : "erro de rede"
        return base
      }
    }),
  )
}
