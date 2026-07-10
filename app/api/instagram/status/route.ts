import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isInstagramConfigured } from "@/lib/instagram/meta"

export const runtime = "nodejs"

/**
 * Status da conexão do Instagram do usuário logado.
 * NUNCA devolve o access_token — só username + se está conectado.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ connected: false, configured: isInstagramConfigured() })
  }

  const { data } = await supabase
    .from("instagram_connections")
    .select("username, token_expires_at")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({
    connected: Boolean(data),
    username: data?.username ?? null,
    expiresAt: data?.token_expires_at ?? null,
    configured: isInstagramConfigured(),
  })
}

/** Desconectar (remove a conexão). */
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })
  await supabase.from("instagram_connections").delete().eq("user_id", user.id)
  return NextResponse.json({ ok: true })
}
