import { NextResponse } from "next/server"
import { searchUnsplashMulti } from "@/lib/generation/unsplash"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: Request) {
  let body: { query?: string; perPage?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const query = body.query?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "query obrigatória (mín 2 chars)" },
      { status: 400 },
    )
  }

  try {
    const result = await searchUnsplashMulti(query, body.perPage ?? 12)
    return NextResponse.json({
      results: result.results,
      ms: result.ms,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/unsplash]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
