import { NextResponse } from "next/server"
import {
  clearbitLogoUrl,
  downloadLogoAsBase64,
  extractFromUrl,
  type LogoFile,
} from "@/lib/extract-url"
import { analyzeBrand, analyzeLogoColors } from "@/lib/generation/claude"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  let url: string
  try {
    const body = (await req.json()) as { url?: string }
    if (!body.url || !body.url.trim()) {
      return NextResponse.json({ error: "URL ausente" }, { status: 400 })
    }
    url = body.url.trim()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const overallStart = performance.now()

  // === Etapa 1: extrair HTML + meta da página
  let extracted
  try {
    extracted = await extractFromUrl(url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[onboarding/analyze] extract FAIL:", msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  console.log(
    `[onboarding/analyze] extracted "${extracted.title || extracted.url}" — text=${extracted.text.length} chars · logoCandidate=${extracted.logoUrl ?? "none"}`,
  )

  // === Etapa 2 + 3: tenta baixar a logo (cascata interna + Clearbit fallback)
  let logoFile: LogoFile | null = null
  let usedLogoUrl: string | null = null

  if (extracted.logoUrl) {
    logoFile = await downloadLogoAsBase64(extracted.logoUrl)
    if (logoFile) usedLogoUrl = extracted.logoUrl
  }

  if (!logoFile) {
    const fallback = clearbitLogoUrl(extracted.url)
    if (fallback) {
      console.log(`[onboarding/analyze] tentando Clearbit fallback ${fallback}`)
      logoFile = await downloadLogoAsBase64(fallback)
      if (logoFile) usedLogoUrl = fallback
    }
  }

  // === Etapa 4: análise multimodal da logo (cores)
  let logoAnalysis: Awaited<ReturnType<typeof analyzeLogoColors>> | null = null
  if (logoFile) {
    try {
      logoAnalysis = await analyzeLogoColors(logoFile)
      if (!logoAnalysis.data.is_logo) {
        console.log(
          "[onboarding/analyze] imagem nao parece uma logo — descartando",
        )
        logoAnalysis = null
        usedLogoUrl = null
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[onboarding/analyze] logo multimodal falhou: ${msg}`)
      logoAnalysis = null
    }
  }

  // === Etapa 5: análise textual (continua via texto extraído, sem web_fetch)
  let brand
  try {
    brand = await analyzeBrand({
      url: extracted.url,
      title: extracted.title,
      description: extracted.description,
      text: extracted.text,
      instagram: extracted.instagram,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[onboarding/analyze] Claude FAIL:", msg)
    return NextResponse.json(
      { error: `Analise falhou: ${msg}` },
      { status: 502 },
    )
  }

  // Se a análise multimodal devolveu cores, elas vencem as inferidas do texto
  const multimodalColors = logoAnalysis
    ? [
        logoAnalysis.data.colors.primary,
        logoAnalysis.data.colors.secondary,
        logoAnalysis.data.colors.accent,
      ]
    : null

  const finalColors = multimodalColors ?? brand.data.brand_colors

  const totalMs = performance.now() - overallStart
  const logoMs = logoAnalysis?.metrics.ms ?? 0
  const logoCost = logoAnalysis?.metrics.costUsd ?? 0
  console.log(
    `[onboarding/analyze] OK ${totalMs.toFixed(0)}ms total ` +
      `(brand=${brand.metrics.ms.toFixed(0)}ms $${brand.metrics.costUsd.toFixed(4)}, ` +
      `logo=${logoMs.toFixed(0)}ms $${logoCost.toFixed(4)})`,
  )

  return NextResponse.json({
    website_url: extracted.url,
    // Mantém shape antigo pro frontend atual
    og_image: usedLogoUrl ?? extracted.ogImage,
    analysis: {
      ...brand.data,
      brand_colors: finalColors,
    },
    // Campos novos pro frontend novo consumir
    logo: {
      found: !!logoAnalysis,
      url: usedLogoUrl,
      // base64 + media_type ficam só no servidor pra evitar payload pesado;
      // o frontend referencia pela URL (que pode ser Clearbit ou o site)
      description: logoAnalysis?.data.description ?? null,
    },
    colors: multimodalColors
      ? {
          primary: multimodalColors[0],
          secondary: multimodalColors[1],
          accent: multimodalColors[2],
        }
      : null,
    metrics: {
      total_ms: totalMs,
      brand: brand.metrics,
      logo: logoAnalysis?.metrics ?? null,
    },
  })
}
