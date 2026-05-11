import { NextResponse } from "next/server"
import { generateImage } from "@/lib/generation/fal"
import { searchUnsplash } from "@/lib/generation/unsplash"

export const runtime = "nodejs"
export const maxDuration = 60

interface RequestBody {
  mode: "ai" | "unsplash"
  prompt?: string
  query?: string
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (body.mode !== "ai" && body.mode !== "unsplash") {
    return NextResponse.json({ error: "mode inválido" }, { status: 400 })
  }

  try {
    if (body.mode === "ai") {
      const prompt = body.prompt?.trim()
      if (!prompt || prompt.length < 5) {
        return NextResponse.json(
          { error: "prompt obrigatório (mín 5 chars)" },
          { status: 400 },
        )
      }
      const result = await generateImage(prompt)
      return NextResponse.json({
        url: result.url,
        source: "ai",
        attribution: null,
        costUsd: result.costUsd,
        ms: result.ms,
      })
    }

    const query = body.query?.trim() || body.prompt?.trim()
    if (!query) {
      return NextResponse.json({ error: "query obrigatória" }, { status: 400 })
    }
    const result = await searchUnsplash(query)
    return NextResponse.json({
      url: result.url,
      source: "unsplash",
      attribution: result.attribution,
      costUsd: 0,
      ms: result.ms,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/image]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
