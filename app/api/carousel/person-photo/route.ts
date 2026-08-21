import { NextResponse } from "next/server"
import { lookupPerson } from "@/lib/generation/wikimedia"
import { properNounCandidates } from "@/lib/carousel/extract-entities"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * Rede de segurança de imagem: recebe o texto do slide, extrai nomes próprios e
 * retorna a foto real SÓ se resolver pra uma PESSOA (Wikidata P31=Q5) com foto.
 * Devolve { url: null } (200) quando não há pessoa — o pipeline segue pro fallback.
 *
 * Devolve também `personDetected`: o nome resolveu pra uma pessoa REAL mas sem
 * foto usável. Nesse caso o pipeline NÃO pode gerar um rosto — seria o retrato
 * de uma estranha ao lado de um nome verdadeiro (regra de veracidade R1/R2).
 */
export async function POST(req: Request) {
  let text = ""
  try {
    const body = (await req.json()) as { text?: string }
    text = (body.text ?? "").trim()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!text) return NextResponse.json({ url: null, personDetected: false })

  const candidates = properNounCandidates(text)
  if (!candidates.length) {
    return NextResponse.json({ url: null, personDetected: false })
  }

  let personDetected = false

  for (const name of candidates) {
    try {
      const { isHuman, photo } = await lookupPerson(name)
      if (isHuman) personDetected = true
      if (photo) {
        return NextResponse.json({
          url: photo.url,
          source: "wikimedia",
          matched: name,
          personDetected: true,
          attribution: { title: photo.title, sourcePage: photo.sourcePage },
        })
      }
    } catch {
      // tenta o próximo candidato
    }
  }

  return NextResponse.json({ url: null, personDetected })
}
