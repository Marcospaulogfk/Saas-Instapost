import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateContent, type ClaudeSlide } from "@/lib/generation/claude"
import { generateImage } from "@/lib/generation/fal"
import { searchUnsplash } from "@/lib/generation/unsplash"

export const runtime = "nodejs"
export const maxDuration = 120

interface RequestBody {
  brand_id: string
  topic: string
  objective: "sell" | "inform" | "engage" | "community"
  template: "editorial" | "cinematic" | "hybrid"
  font_family: string
  n_slides: number
  mode: "all_ai" | "smart_mix" | "all_unsplash"
}

interface SlideImage {
  url: string | null
  source: "ai" | "unsplash" | null
  unsplash_id: string | null
  unsplash_attribution_url: string | null
  prompt: string | null
  ms: number
  costUsd: number
  error: string | null
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
          unsplash_id: null,
          unsplash_attribution_url: null,
          prompt: slide.image_prompt,
          ms: r.ms,
          costUsd: r.costUsd,
          error: "Unsplash key ausente — fallback IA",
        }
      }
      const r = await searchUnsplash(query)
      return {
        url: r.url,
        source: "unsplash",
        unsplash_id: r.attribution.unsplashId,
        unsplash_attribution_url: r.attribution.photographerUrl,
        prompt: null,
        ms: r.ms,
        costUsd: 0,
        error: null,
      }
    }
    const r = await generateImage(slide.image_prompt)
    return {
      url: r.url,
      source: "ai",
      unsplash_id: null,
      unsplash_attribution_url: null,
      prompt: slide.image_prompt,
      ms: r.ms,
      costUsd: r.costUsd,
      error: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      url: null,
      source: null,
      unsplash_id: null,
      unsplash_attribution_url: null,
      prompt: source === "ai" ? slide.image_prompt : null,
      ms: 0,
      costUsd: 0,
      error: msg,
    }
  }
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  if (!body.brand_id) {
    return NextResponse.json({ error: "brand_id obrigatorio" }, { status: 400 })
  }
  if (!body.topic || body.topic.trim().length < 10) {
    return NextResponse.json(
      { error: "Tema deve ter pelo menos 10 caracteres" },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
  }

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select(
      "id, name, brand_colors, tone_of_voice, target_audience, visual_style, default_template, default_font",
    )
    .eq("id", body.brand_id)
    .eq("user_id", user.id)
    .single()
  if (brandErr || !brand) {
    return NextResponse.json(
      { error: "Marca nao encontrada ou nao pertence a voce" },
      { status: 404 },
    )
  }

  let claudeResult
  try {
    claudeResult = await generateContent({
      topic: body.topic.trim(),
      objective: body.objective,
      template: body.template,
      brandName: brand.name,
      toneOfVoice: brand.tone_of_voice ?? "",
      targetAudience: brand.target_audience ?? "",
      visualStyle: brand.visual_style ?? "",
      brandColors: Array.isArray(brand.brand_colors)
        ? (brand.brand_colors as string[])
        : [],
      nSlides: body.n_slides,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[projects/generate] Claude FAIL:", msg)
    return NextResponse.json({ error: `Claude: ${msg}` }, { status: 502 })
  }

  console.log(
    `[projects/generate] Claude OK ${claudeResult.metrics.ms.toFixed(0)}ms ` +
      `($${claudeResult.metrics.costUsd.toFixed(4)})`,
  )

  const slidesWithSource = claudeResult.data.slides.map((s) => ({
    slide: s,
    source: resolveSource(s, body.mode),
  }))

  const enriched = await Promise.all(
    slidesWithSource.map(async ({ slide, source }) => {
      const image = await fetchImage(slide, source)
      console.log(
        `[projects/generate] slide ${slide.order_index} ${image.source ?? "FAIL"}: ${image.ms.toFixed(0)}ms`,
      )
      return { slide, image }
    }),
  )

  const totalImageCost = enriched.reduce(
    (sum, { image }) => sum + image.costUsd,
    0,
  )

  // Insert project
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .insert({
      brand_id: brand.id,
      title: claudeResult.data.project_title,
      creation_mode: "ai",
      objective: body.objective,
      status: "draft",
      format: "carousel",
      aspect_ratio: "4:5",
      dimensions: "1080x1350",
      source_type: "topic",
      template: body.template,
      font_family: body.font_family,
    })
    .select("id")
    .single()
  if (projErr || !project) {
    console.error("[projects/generate] insert project FAIL:", projErr?.message)
    return NextResponse.json(
      { error: `Erro ao salvar projeto: ${projErr?.message ?? "desconhecido"}` },
      { status: 500 },
    )
  }

  // Insert slides
  const slideRows = enriched.map(({ slide, image }) => ({
    project_id: project.id,
    order_index: slide.order_index,
    text_content: slide.title,
    image_url: image.url,
    image_prompt: image.prompt,
    image_source: image.source ?? "ai",
    unsplash_id: image.unsplash_id,
    unsplash_attribution_url: image.unsplash_attribution_url,
    editable_elements: {
      title: slide.title,
      highlight_words: slide.highlight_words,
      subtitle: slide.subtitle,
      body: slide.body ?? "",
      cta_badge: slide.cta_badge ?? "",
    },
  }))

  const { error: slidesErr } = await supabase.from("slides").insert(slideRows)
  if (slidesErr) {
    console.error("[projects/generate] insert slides FAIL:", slidesErr.message)
    // Rollback orphan project
    await supabase.from("projects").delete().eq("id", project.id)
    return NextResponse.json(
      { error: `Erro ao salvar slides: ${slidesErr.message}` },
      { status: 500 },
    )
  }

  console.log(
    `[projects/generate] OK project_id=${project.id.slice(0, 8)}... ` +
      `total_cost=$${(claudeResult.metrics.costUsd + totalImageCost).toFixed(4)}`,
  )

  return NextResponse.json({ project_id: project.id })
}
