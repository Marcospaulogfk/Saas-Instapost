import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { debitTokens, TOKEN_COST } from "@/lib/tokens"
import { editNanoBanana } from "@/lib/generation/nano-banana"
import { logImageUsage } from "@/lib/generation/usage-log"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Edição CIRÚRGICA da arte bitmap do post único.
 *
 * O modo bitmap (lib/features.ts) entrega o post como imagem completa do
 * nano-banana-2 — a mesma qualidade do concorrente, com a mesma limitação:
 * o texto está pintado. Esta rota é a resposta: o usuário edita os textos em
 * campos (o sistema SABE o que está escrito na arte, porque a copy aprovada
 * gerou os textos) e o nano-banana /edit troca SÓ eles, mantendo o resto da
 * arte idêntico. Várias trocas viajam numa chamada só = um débito só.
 *
 * Custo: 1 edição de imagem = mesmo preço de gerar a capa (TOKEN_COST
 * .imageCover, 25) — o Fal cobra o mesmo pra gen e pra edit. O concorrente
 * cobra 6 créditos regenerando a peça INTEIRA e sem garantia de manter o
 * design; aqui o design fica.
 */

interface Change {
  from: string
  to: string
}

interface RequestBody {
  photo_url: string
  changes: Change[]
}

const MAX_CHANGES = 8
const MAX_TEXT_LEN = 160

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const url = body?.photo_url
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "photo_url inválida" }, { status: 400 })
  }
  const changes = (body.changes ?? []).filter(
    (c) =>
      c &&
      typeof c.from === "string" &&
      typeof c.to === "string" &&
      c.from.trim() &&
      c.to.trim() &&
      c.from.trim() !== c.to.trim() &&
      c.from.length <= MAX_TEXT_LEN &&
      c.to.length <= MAX_TEXT_LEN,
  )
  if (!changes.length) {
    return NextResponse.json(
      { error: "nenhuma alteração de texto válida" },
      { status: 400 },
    )
  }
  if (changes.length > MAX_CHANGES) {
    return NextResponse.json(
      { error: `no máximo ${MAX_CHANGES} alterações por edição` },
      { status: 400 },
    )
  }

  // Auth opcional, igual à geração: sem sessão roda, só não debita.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const prompt =
    "Edit this social media design. " +
    changes
      .map((c) => `Replace the text "${c.from.trim()}" with "${c.to.trim()}".`)
      .join(" ") +
    " Render the new text in the SAME font, size, color, position and alignment as the text it replaces, in Brazilian Portuguese with perfect spelling. Keep every other element of the design exactly identical: layout, all other texts, colors, photograph, shapes, spacing. Do not add or remove anything else."

  try {
    const result = await editNanoBanana(prompt, url)
    if (user?.id) {
      try {
        await debitTokens(supabase, user.id, TOKEN_COST.imageCover)
      } catch {
        // tokens nunca quebram a edição
      }
    }
    // Medidor de COGS da edição (22/08). Best-effort.
    await logImageUsage(supabase, {
      stage: "image_edit",
      model: result.model,
      costUsd: result.costUsd,
      userId: user?.id ?? null,
      tokensCharged: user?.id ? TOKEN_COST.imageCover : 0,
      durationMs: result.ms,
    })
    return NextResponse.json({ url: result.url, ms: result.ms })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/edit-bitmap]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
