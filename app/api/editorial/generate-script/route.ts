import { NextResponse } from "next/server"
import { generateContent } from "@/lib/generation/claude"
import { motivoRejeicaoCapa } from "@/lib/carousel/cover-guard"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Geração text-only do CARROSSEL — etapa de aprovação.
 *
 * Gera APENAS o roteiro (texto de cada slide: título, subtítulo, corpo,
 * image_prompt) + a legenda do Instagram. NÃO gera imagens aqui — as imagens
 * só são criadas depois que o usuário aprova o roteiro (em /teste).
 *
 * Espelha o que o post-único faz via /api/post-unico/free-generate?text_only.
 *
 * Body:
 * {
 *   topic: string,                              // obrigatório (>= 10 chars)
 *   objective?: "sell" | "inform" | "engage" | "community",
 *   brandName?: string,
 *   handle?: string,
 *   tone?: string,
 *   audience?: string,
 *   visualStyle?: string,
 *   colors?: string[],
 *   template?: "editorial" | "cinematic" | "hybrid",
 *   desiredSlides?: number
 * }
 *
 * Resposta:
 * { project_title, caption, hook_alternatives, slides: ClaudeSlide[], metrics }
 */
interface RequestBody {
  topic?: string
  objective?: "sell" | "inform" | "engage" | "community"
  brandName?: string
  handle?: string
  tone?: string
  audience?: string
  visualStyle?: string
  colors?: string[]
  template?: "editorial" | "cinematic" | "hybrid"
  desiredSlides?: number
  /** Abordagem do wizard (viral, educativo, dados…) — muda o registro do texto. */
  abordagem?: string
  /** Títulos do roteiro anterior rejeitado — força variação real na regeração. */
  avoidTitles?: string[]
  /** Registro editorial da extração do link (noticia/educativo/opiniao/case). */
  registro?: string
  /** Entidade protagonista da notícia (nome exato da extração). */
  protagonista?: string
  /** Fonte do fato (ex: "revista Wallpaper*"). */
  fonte?: string
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "JSON inválido no body" }, { status: 400 })
  }

  const topic = (body.topic ?? "").trim()
  if (topic.length < 10) {
    return NextResponse.json(
      { error: "Tema deve ter pelo menos 10 caracteres" },
      { status: 400 },
    )
  }

  const objective = (["sell", "inform", "engage", "community"] as const).includes(
    body.objective as never,
  )
    ? (body.objective as "sell" | "inform" | "engage" | "community")
    : "inform"
  const template = (["editorial", "cinematic", "hybrid"] as const).includes(
    body.template as never,
  )
    ? (body.template as "editorial" | "cinematic" | "hybrid")
    : "editorial"
  // Geração limitada a no máximo 7 slides por carrossel.
  const nSlides =
    typeof body.desiredSlides === "number" && body.desiredSlides >= 3
      ? Math.min(body.desiredSlides, 7)
      : 7

  const registro =
    typeof body.registro === "string" &&
    ["noticia", "educativo", "opiniao", "case"].includes(body.registro)
      ? body.registro
      : undefined
  const protagonista =
    typeof body.protagonista === "string" ? body.protagonista.trim() : ""
  const fonte = typeof body.fonte === "string" ? body.fonte.trim() : ""

  try {
    const baseInput = {
      topic,
      objective,
      template,
      brandName: body.brandName?.trim() || "Marca Demo",
      toneOfVoice:
        body.tone?.trim() ||
        "Direto, autoral, com toque de humor seco. Frases curtas. Sem rodeio.",
      targetAudience:
        body.audience?.trim() || "criadores de conteúdo no Instagram",
      visualStyle:
        body.visualStyle?.trim() ||
        "Cinematográfico, alto contraste, editorial dark",
      brandColors:
        Array.isArray(body.colors) && body.colors.length
          ? body.colors
          : ["#1668E3", "#0A0A0F", "#FAF8F5"],
      nSlides,
      abordagem: typeof body.abordagem === "string" ? body.abordagem : undefined,
      avoidTitles: Array.isArray(body.avoidTitles)
        ? body.avoidTitles.filter((t): t is string => typeof t === "string").slice(0, 30)
        : undefined,
      registro,
      protagonista: protagonista || undefined,
      fonte: fonte || undefined,
    }

    let result = await generateContent(baseInput)

    // Validação em código da capa. O prompt PEDE o sujeito nomeado e proíbe
    // abrir com "Você", mas regra de prompt o modelo ignora (foi o que produziu
    // "VOCÊ TORCEU PELA VILÃ", sem nomear a série). Vale pra qualquer registro
    // vindo de link: capa editorial é capa de sujeito, nunca de conceito.
    // Uma regeração corretiva, e só uma: se falhar de novo, segue com o
    // resultado (capa imperfeita é melhor que geração quebrada).
    if (registro) {
      const cover = result.data.slides?.[0]
      const motivo = cover ? motivoRejeicaoCapa(cover, protagonista) : null
      if (cover && motivo) {
        console.warn(
          `[editorial/generate-script] capa rejeitada ("${cover.title}"): ${motivo}`,
        )
        const retry = await generateContent({
          ...baseInput,
          rejectedCover: cover.title,
          rejectedCoverReason: motivo,
        })
        result = {
          ...retry,
          metrics: {
            ...retry.metrics,
            ms: result.metrics.ms + retry.metrics.ms,
            inputTokens: result.metrics.inputTokens + retry.metrics.inputTokens,
            outputTokens:
              result.metrics.outputTokens + retry.metrics.outputTokens,
            cacheCreationInputTokens:
              result.metrics.cacheCreationInputTokens +
              retry.metrics.cacheCreationInputTokens,
            cacheReadInputTokens:
              result.metrics.cacheReadInputTokens +
              retry.metrics.cacheReadInputTokens,
            costUsd: result.metrics.costUsd + retry.metrics.costUsd,
          },
        }
      }
    }

    return NextResponse.json({
      project_title: result.data.project_title,
      caption: result.data.caption ?? "",
      // Os 2 hooks de capa descartados (arquétipos diferentes do escolhido) —
      // o usuário troca a capa sem pagar outra geração de roteiro.
      hook_alternatives: result.data.hook_alternatives ?? [],
      slides: result.data.slides,
      metrics: result.metrics,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[editorial/generate-script]", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
