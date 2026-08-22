import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishCarousel } from "@/lib/instagram/meta"
import { getValidConnection } from "@/lib/instagram/connection"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Publica o carrossel/post no Instagram do usuário conectado.
 * Body: { imageUrls: string[], caption: string }
 */
export async function POST(req: Request) {
  let body: { imageUrls?: string[]; caption?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 })
  }
  const imageUrls = (body.imageUrls ?? []).filter(Boolean)
  const caption = body.caption ?? ""
  if (!imageUrls.length) {
    return NextResponse.json({ ok: false, error: "Sem imagens pra publicar." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sem sessão." }, { status: 401 })
  }

  let conn
  try {
    conn = await getValidConnection(supabase, user.id)
  } catch (e) {
    const message = e instanceof Error ? e.message : "conexão inválida"
    return NextResponse.json({ ok: false, error: message }, { status: 401 })
  }
  if (!conn) {
    return NextResponse.json(
      { ok: false, error: "Conta do Instagram não conectada." },
      { status: 400 },
    )
  }

  try {
    const result = await publishCarousel(conn.igUserId, conn.accessToken, imageUrls, caption)
    // Registro do que saiu daqui: é o que liga métrica a conteúdo gerado.
    // Best-effort (migration 0019): falha aqui não desfaz a publicação.
    await supabase
      .from("instagram_publications")
      .insert({
        user_id: user.id,
        ig_user_id: conn.igUserId,
        ig_media_id: result.id,
        caption,
        image_count: imageUrls.length,
      })
      .then(({ error }) => {
        if (error) console.warn("[instagram/publish] registro falhou", error.message)
      })
    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : "erro ao publicar"
    console.error("[instagram/publish]", e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
