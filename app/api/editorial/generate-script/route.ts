import { NextResponse } from "next/server"
import { generateContent } from "@/lib/generation/claude"
import { motivoRejeicaoCapa } from "@/lib/carousel/cover-guard"
import { MODEL_ESCRITOR } from "@/lib/generation/models"
import { logGenerationUsage } from "@/lib/generation/usage-log"
import { createClient } from "@/lib/supabase/server"

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

    const result = await generateContent(baseInput)

    // Guard da capa em modo SÓ LOG. A regeração corretiva foi removida em
    // 21/08/2026 (CUSTOS-IA-MARGEM): custava +R$0,08 em ~30% das gerações e
    // não resolveu a qualidade percebida (copy seguia sendo reprovada com ela
    // ligada). O log fica pra medir a taxa real de capa sem sujeito; a
    // correção de verdade é no prompt do escritor, não em chamada extra.
    let coverRejected: string | null = null
    if (registro) {
      const cover = result.data.slides?.[0]
      const motivo = cover ? motivoRejeicaoCapa(cover, protagonista) : null
      if (cover && motivo) {
        coverRejected = motivo
        console.warn(
          `[editorial/generate-script] capa sem sujeito (só log, sem retry): "${cover.title}": ${motivo}`,
        )
      }
    }

    // Medidor de COGS (etapa 5, 21/08/2026). O stage carousel_copy existia na
    // tabela desde a 0017 mas nunca era gravado: o roteiro só aparecia no
    // retorno da API. Best-effort: nunca derruba a geração.
    await logCarouselCopyUsage(result.metrics, {
      registro,
      coverRejected,
      protagonista: protagonista || null,
    })

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

async function logCarouselCopyUsage(
  metrics: {
    ms: number
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
  },
  meta: {
    registro: string | undefined
    coverRejected: string | null
    protagonista: string | null
  },
): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await logGenerationUsage(supabase, {
      stage: "carousel_copy",
      model: MODEL_ESCRITOR,
      usage: {
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        cache_creation_input_tokens: metrics.cacheCreationInputTokens,
        cache_read_input_tokens: metrics.cacheReadInputTokens,
      },
      userId: user?.id ?? null,
      durationMs: metrics.ms,
      // Taxa real de capa sem sujeito: só manda meta quando há registro, pra
      // não quebrar o insert antes da migration 0018 em gerações sem link.
      ...(meta.registro
        ? {
            meta: {
              registro: meta.registro,
              cover_rejected: meta.coverRejected !== null,
              ...(meta.coverRejected ? { cover_reason: meta.coverRejected } : {}),
              ...(meta.protagonista ? { protagonista: meta.protagonista } : {}),
            },
          }
        : {}),
    })
  } catch (err) {
    console.warn("[editorial/generate-script] log de uso falhou:", err)
  }
}
