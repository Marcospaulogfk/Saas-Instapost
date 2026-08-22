import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getValidConnection } from "@/lib/instagram/connection"
import {
  getAccountInsights,
  getFollowerSeries,
  getInstagramProfileFull,
  getMediaInsights,
  getRecentMedia,
} from "@/lib/instagram/meta"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Métricas da conta conectada (instagram_business_manage_insights):
 * perfil + totais de 30 dias + série de seguidores + últimas publicações com
 * os insights de cada uma. Nada é persistido: lê da Meta a cada abertura.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: "Sem sessão." }, { status: 401 })

  let conn
  try {
    conn = await getValidConnection(supabase, user.id)
  } catch (e) {
    const message = e instanceof Error ? e.message : "conexão inválida"
    return NextResponse.json({ ok: false, error: message, expired: true }, { status: 401 })
  }
  if (!conn) return NextResponse.json({ ok: false, connected: false }, { status: 200 })

  try {
    const [profile, account, followers, media, pubs] = await Promise.all([
      getInstagramProfileFull(conn.accessToken),
      getAccountInsights(conn.igUserId, conn.accessToken, 30),
      getFollowerSeries(conn.igUserId, conn.accessToken, 30),
      getRecentMedia(conn.accessToken, 18),
      supabase.from("instagram_publications").select("ig_media_id").eq("user_id", user.id),
    ])
    const viaSyncPost = new Set((pubs.data ?? []).map((p) => p.ig_media_id as string))
    const insights = await Promise.all(media.map((m) => getMediaInsights(m.id, conn.accessToken)))
    return NextResponse.json({
      ok: true,
      connected: true,
      profile,
      account,
      followers,
      media: media.map((m, i) => ({
        ...m,
        insights: insights[i],
        viaSyncPost: viaSyncPost.has(m.id),
      })),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "erro ao ler métricas"
    console.error("[instagram/insights]", e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
