import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateContent, type ClaudeSlide } from "@/lib/generation/claude"
import { generateBrandImage, getUserPlan } from "@/lib/generation/image"
import { searchUnsplash } from "@/lib/generation/unsplash"
import {
  debitTokens,
  getAvailableTokens,
  tokenCostForImage,
  TOKEN_COST,
  type Plan,
} from "@/lib/tokens"

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
  /** Qualidade EFETIVA quando source="ai" (pro=Nano Banana Pro, normal=Flux). */
  quality: "normal" | "pro"
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
  plan: Plan,
): Promise<SlideImage> {
  try {
    if (source === "unsplash") {
      const query = slide.unsplash_query || slide.image_keywords.join(" ")
      if (!process.env.UNSPLASH_ACCESS_KEY) {
        const r = await generateBrandImage(slide.image_prompt, plan)
        return {
          url: r.url,
          source: "ai",
          unsplash_id: null,
          unsplash_attribution_url: null,
          prompt: slide.image_prompt,
          ms: r.ms,
          costUsd: r.costUsd,
          quality: r.quality,
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
        quality: "normal",
        error: null,
      }
    }
    const r = await generateBrandImage(slide.image_prompt, plan)
    return {
      url: r.url,
      source: "ai",
      unsplash_id: null,
      unsplash_attribution_url: null,
      prompt: slide.image_prompt,
      ms: r.ms,
      costUsd: r.costUsd,
      quality: r.quality,
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
      quality: "normal",
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

  // Plano do user → decide Nano Banana Pro (Pro/Studio) vs Flux (resto).
  const plan = await getUserPlan(supabase)

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

  const nSlides = Math.min(Math.max(body.n_slides, 1), 7)

  // -------------------------------------------------------------------
  // Portão de saldo (antes de qualquer chamada paga).
  //
  // O débito é ATÔMICO e acontece lá no fim: sem saldo ele não debita NADA e
  // a peça sairia de graça. Aqui só dá pra ESTIMAR o custo, porque quantas
  // imagens serão de IA (e em que qualidade) só se sabe depois do Claude
  // responder. Então cobra-se o PISO do que a requisição com certeza vai
  // gastar, nunca o teto: o roteiro (sempre) mais, quando o modo é all_ai, a
  // imagem mais barata possível por slide (o piso é "normal"; se o plano
  // render "pro" o débito real vem maior). Em smart_mix/all_unsplash a
  // origem das imagens vem do Claude, então o piso é só o roteiro.
  // Estimar por baixo é deliberado: melhor deixar passar uma geração perto do
  // limite do que barrar quem tinha saldo.
  // -------------------------------------------------------------------
  const custoMinimo =
    TOKEN_COST.textOnly +
    (body.mode === "all_ai" ? tokenCostForImage("normal") * nSlides : 0)
  const saldoDisponivel = await getAvailableTokens(supabase, user.id)
  if (saldoDisponivel < custoMinimo) {
    return NextResponse.json(
      {
        error: "Tokens insuficientes para esta geração.",
        code: "sem_saldo",
        needed: custoMinimo,
        available: saldoDisponivel,
      },
      { status: 402 },
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
      nSlides,
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
      const image = await fetchImage(slide, source, plan)
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

  // -------------------------------------------------------------------
  // Débito de tokens (BEST-EFFORT, não bloqueia geração).
  // Custo = roteiro do carrossel (TOKEN_COST.textOnly) + cada imagem gerada
  // por IA conforme a qualidade REAL (capa 20 / miolo 2). Imagens de acervo
  // não custam token. UMA linha no extrato pro carrossel inteiro.
  // Qualquer falha aqui é engolida: geração nunca quebra por causa do
  // sistema de tokens.
  // -------------------------------------------------------------------
  try {
    const imageTokens = enriched
      .filter(({ image }) => image.source === "ai")
      .reduce((sum, { image }) => sum + tokenCostForImage(image.quality), 0)
    const tokensToDebit = TOKEN_COST.textOnly + imageTokens
    const debit = await debitTokens(supabase, user.id, tokensToDebit, {
      kind: "debit_carousel",
      refType: "project",
      refId: project.id,
      title: `Carrossel: ${String(claudeResult.data.project_title || body.topic).slice(0, 80)}`,
      meta: { images: imageTokens, text: TOKEN_COST.textOnly },
    })
    if (!debit.ok) {
      // O portão lá em cima usa o PISO do custo, então um débito que falha
      // aqui é peça entregue sem cobrar: precisa aparecer no log com quem e
      // quanto pra dar pra reconciliar depois.
      console.warn(
        `[projects/generate] débito de tokens falhou: user=${user.id} ` +
          `amount=${tokensToDebit} debited=${debit.debited}` +
          (debit.error ? ` (${debit.error})` : ""),
      )
    }
  } catch (err) {
    // Nunca bloquear geração por causa de tokens.
    console.warn("[projects/generate] débito de tokens falhou (ignorado):", err)
  }

  console.log(
    `[projects/generate] OK project_id=${project.id.slice(0, 8)}... ` +
      `total_cost=$${(claudeResult.metrics.costUsd + totalImageCost).toFixed(4)}`,
  )

  return NextResponse.json({ project_id: project.id })
}
