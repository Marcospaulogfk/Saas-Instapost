import { NextResponse } from "next/server"
import { generateContent } from "@/lib/generation/claude"

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
 * { project_title, caption, slides: ClaudeSlide[], metrics }
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
  const nSlides =
    typeof body.desiredSlides === "number" && body.desiredSlides >= 3
      ? Math.min(body.desiredSlides, 10)
      : 7

  try {
    const result = await generateContent({
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
          : ["#7320E6", "#0A0A0F", "#FAF8F5"],
      nSlides,
    })

    return NextResponse.json({
      project_title: result.data.project_title,
      caption: result.data.caption ?? "",
      slides: result.data.slides,
      metrics: result.metrics,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[editorial/generate-script]", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
