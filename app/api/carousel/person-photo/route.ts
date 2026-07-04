import { NextResponse } from "next/server"
import { searchWikimediaPerson } from "@/lib/generation/wikimedia"
import { properNounCandidates } from "@/lib/carousel/extract-entities"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * Rede de segurança de imagem: recebe o texto do slide, extrai nomes próprios e
 * retorna a foto real SÓ se resolver pra uma PESSOA (Wikidata P31=Q5) com foto.
 * Devolve { url: null } (200) quando não há pessoa — o pipeline segue pro fallback.
 */
export async function POST(req: Request) {
  let text = ""
  try {
    const body = (await req.json()) as { text?: string }
    text = (body.text ?? "").trim()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!text) return NextResponse.json({ url: null })

  const candidates = properNounCandidates(text)
  if (!candidates.length) return NextResponse.json({ url: null })

  for (const name of candidates) {
    try {
      const hit = await searchWikimediaPerson(name)
      if (hit) {
        return NextResponse.json({
          url: hit.url,
          source: "wikimedia",
          matched: name,
          attribution: { title: hit.title, sourcePage: hit.sourcePage },
        })
      }
    } catch {
      // tenta o próximo candidato
    }
  }

  return NextResponse.json({ url: null })
}
