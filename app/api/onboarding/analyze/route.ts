import { NextResponse } from "next/server"
import { extractFromUrl } from "@/lib/extract-url"
import { analyzeBrand } from "@/lib/generation/claude"

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

  let extracted
  try {
    extracted = await extractFromUrl(url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[onboarding/analyze] extract FAIL:", msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  console.log(
    `[onboarding/analyze] extracted "${extracted.title || extracted.url}" — ${extracted.text.length} chars`,
  )

  let analysis
  try {
    analysis = await analyzeBrand({
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

  const totalMs = performance.now() - overallStart
  console.log(
    `[onboarding/analyze] OK ${totalMs.toFixed(0)}ms total ` +
      `(claude=${analysis.metrics.ms.toFixed(0)}ms, $${analysis.metrics.costUsd.toFixed(4)})`,
  )

  return NextResponse.json({
    website_url: extracted.url,
    og_image: extracted.ogImage,
    analysis: analysis.data,
    metrics: {
      total_ms: totalMs,
      claude: analysis.metrics,
    },
  })
}
