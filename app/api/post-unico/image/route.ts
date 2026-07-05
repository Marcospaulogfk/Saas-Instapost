import { NextResponse } from "next/server"
import { generateImage } from "@/lib/generation/fal"
import { searchUnsplash } from "@/lib/generation/unsplash"
import { searchWikimedia } from "@/lib/generation/wikimedia"

export const runtime = "nodejs"
export const maxDuration = 60

// TODO(tokens): débito best-effort de tokens. Quando plugar auth aqui:
//   import { createClient } from "@/lib/supabase/server"
//   import { debitTokens, tokenCostForImage, resolveImageQuality } from "@/lib/tokens"
//   const supabase = await createClient()
//   const { data: { user } } = await supabase.auth.getUser()
//   // 1) ler plano do perfil (subscription_status / plano) do user
//   // 2) quality = resolveImageQuality(plano, requestedQuality)  ← GATE Nano Banana Pro
//   // 3) gerar imagem com essa quality
//   // 4) após sucesso: try { await debitTokens(supabase, user.id, tokenCostForImage(quality)) } catch {}
//   //    (NUNCA bloquear geração se o débito falhar)

interface RequestBody {
  mode: "ai" | "unsplash" | "wikimedia"
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

  if (
    body.mode !== "ai" &&
    body.mode !== "unsplash" &&
    body.mode !== "wikimedia"
  ) {
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

    if (body.mode === "wikimedia") {
      const result = await searchWikimedia(query)
      if (!result) {
        return NextResponse.json(
          {
            error: `Sem foto na Wikipedia pra "${query}". Tente outro nome ou use Unsplash/IA.`,
          },
          { status: 404 },
        )
      }
      return NextResponse.json({
        url: result.url,
        source: "wikimedia",
        attribution: {
          title: result.title,
          sourcePage: result.sourcePage,
        },
        costUsd: 0,
        ms: result.ms,
      })
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
