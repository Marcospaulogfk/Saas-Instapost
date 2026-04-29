import { NextResponse } from "next/server"
import {
  generateContent,
  type ClaudeSlide,
  type ClaudeMetrics,
} from "@/lib/generation/claude"
import { generateImage } from "@/lib/generation/fal"
import { searchUnsplash } from "@/lib/generation/unsplash"

export const runtime = "nodejs"
export const maxDuration = 120

interface RequestBody {
  topic: string
  objective: "sell" | "inform" | "engage" | "community"
  tone: string
  audience: string
  visualStyle: string
  colors: string[]
  template: "editorial" | "cinematic" | "hybrid"
  font: string
  nSlides: number
  mode: "all_ai" | "smart_mix" | "all_unsplash"
}

interface SlideImage {
  url: string | null
  source: "ai" | "unsplash" | null
  attribution: { photographerName: string; photographerUrl: string } | null
  prompt: string | null
  unsplashQuery: string | null
  costUsd: number
  ms: number
  error: string | null
}

interface EnrichedSlide extends ClaudeSlide {
  image: SlideImage
}

interface ResponsePayload {
  project_title: string
  slides: EnrichedSlide[]
  metrics: {
    claude: ClaudeMetrics
    images: { totalCostUsd: number; parallelMs: number }
    total: { ms: number; costUsd: number }
  }
}

// TODO(creditos): aplicar cap de gasto por user/dia antes de chamar Claude
// TODO(creditos): forcar capa = sempre IA quando o sistema de creditos for plugado
// TODO(creditos): aplicar limite max_ai_per_carousel baseado no plano do user

function resolveSource(
  slide: ClaudeSlide,
  mode: RequestBody["mode"],
): "ai" | "unsplash" {
  if (mode === "all_ai") return "ai"
  if (mode === "all_unsplash") return "unsplash"
  return slide.image_source_recommended
}

async function fetchImage(
  slide: ClaudeSlide,
  source: "ai" | "unsplash",
): Promise<SlideImage> {
  try {
    if (source === "unsplash") {
      const query = slide.unsplash_query || slide.image_keywords.join(" ")
      if (!process.env.UNSPLASH_ACCESS_KEY) {
        const r = await generateImage(slide.image_prompt)
        return {
          url: r.url,
          source: "ai",
          attribution: null,
          prompt: slide.image_prompt,
          unsplashQuery: null,
          costUsd: r.costUsd,
          ms: r.ms,
          error: "Unsplash key ausente — fallback IA",
        }
      }
      const r = await searchUnsplash(query)
      return {
        url: r.url,
        source: "unsplash",
        attribution: {
          photographerName: r.attribution.photographerName,
          photographerUrl: r.attribution.photographerUrl,
        },
        prompt: null,
        unsplashQuery: query,
        costUsd: 0,
        ms: r.ms,
        error: null,
      }
    }
    const r = await generateImage(slide.image_prompt)
    return {
      url: r.url,
      source: "ai",
      attribution: null,
      prompt: slide.image_prompt,
      unsplashQuery: null,
      costUsd: r.costUsd,
      ms: r.ms,
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      url: null,
      source: null,
      attribution: null,
      prompt: source === "ai" ? slide.image_prompt : null,
      unsplashQuery:
        source === "unsplash" ? slide.unsplash_query ?? null : null,
      costUsd: 0,
      ms: 0,
      error: message,
    }
  }
}

export async function POST(req: Request) {
  const overallStart = performance.now()

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "JSON invalido no body" }, { status: 400 })
  }

  if (!body.topic || body.topic.trim().length < 10) {
    return NextResponse.json(
      { error: "Tema deve ter pelo menos 10 caracteres" },
      { status: 400 },
    )
  }

  let claudeResult
  try {
    claudeResult = await generateContent({
      topic: body.topic,
      objective: body.objective,
      template: body.template,
      brandName: "Marca de Teste",
      toneOfVoice: body.tone,
      targetAudience: body.audience,
      visualStyle: body.visualStyle,
      brandColors: body.colors,
      nSlides: body.nSlides,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[teste-gerar] Claude FAIL:", message)
    return NextResponse.json({ error: `Claude: ${message}` }, { status: 502 })
  }

  console.log(
    `[teste-gerar] Claude OK ${claudeResult.metrics.ms.toFixed(0)}ms ` +
      `(in=${claudeResult.metrics.inputTokens} out=${claudeResult.metrics.outputTokens} ` +
      `cache_read=${claudeResult.metrics.cacheReadInputTokens} ` +
      `cache_write=${claudeResult.metrics.cacheCreationInputTokens})`,
  )

  const slidesWithSource = claudeResult.data.slides.map((s) => ({
    slide: s,
    source: resolveSource(s, body.mode),
  }))

  const enriched: EnrichedSlide[] = await Promise.all(
    slidesWithSource.map(async ({ slide, source }) => {
      const image = await fetchImage(slide, source)
      console.log(
        `[teste-gerar] slide ${slide.order_index} ${image.source ?? "FAIL"}: ` +
          `${image.ms.toFixed(0)}ms ${image.error ? "ERR " + image.error : "OK"}`,
      )
      return { ...slide, image }
    }),
  )

  const totalImageCost = enriched.reduce((sum, s) => sum + s.image.costUsd, 0)
  const totalImageMs = enriched.length
    ? Math.max(...enriched.map((s) => s.image.ms))
    : 0
  const totalMs = performance.now() - overallStart

  const payload: ResponsePayload = {
    project_title: claudeResult.data.project_title,
    slides: enriched,
    metrics: {
      claude: claudeResult.metrics,
      images: { totalCostUsd: totalImageCost, parallelMs: totalImageMs },
      total: {
        ms: totalMs,
        costUsd: claudeResult.metrics.costUsd + totalImageCost,
      },
    },
  }

  return NextResponse.json(payload)
}
