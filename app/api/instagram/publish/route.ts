import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishCarousel } from "@/lib/instagram/meta"

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

  const { data: conn } = await supabase
    .from("instagram_connections")
    .select("ig_user_id, access_token, token_expires_at")
    .eq("user_id", user.id)
    .single()

  if (!conn) {
    return NextResponse.json(
      { ok: false, error: "Conta do Instagram não conectada." },
      { status: 400 },
    )
  }
  if (conn.token_expires_at && new Date(conn.token_expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "Conexão expirada — reconecte o Instagram." },
      { status: 401 },
    )
  }

  try {
    const result = await publishCarousel(
      conn.ig_user_id,
      conn.access_token,
      imageUrls,
      caption,
    )
    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : "erro ao publicar"
    console.error("[instagram/publish]", e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
