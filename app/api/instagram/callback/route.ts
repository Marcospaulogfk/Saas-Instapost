import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramProfile,
} from "@/lib/instagram/meta"

export const runtime = "nodejs"

/**
 * Callback do OAuth do Instagram. Troca o code por token de longa duração,
 * descobre o ig_user_id/username e salva a conexão do usuário. Redireciona de
 * volta pro editor com ?ig=ok (ou ?ig=erro).
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = url.origin
  const back = (status: string) =>
    NextResponse.redirect(`${origin}/dashboard/carrossel?ig=${status}`)

  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const err = url.searchParams.get("error")
  if (err || !code) return back("erro")

  // CSRF: state tem que bater com o cookie setado no /connect.
  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ig_oauth_state="))
    ?.split("=")[1]
  if (!state || !cookieState || state !== cookieState) return back("erro")

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return back("erro")

    const short = await exchangeCodeForToken(code, origin)
    const long = await getLongLivedToken(short.access_token)
    const profile = await getInstagramProfile(long.access_token)

    const expiresAt = new Date(Date.now() + long.expiresInSec * 1000).toISOString()

    await supabase.from("instagram_connections").upsert({
      user_id: user.id,
      ig_user_id: profile.igUserId,
      username: profile.username,
      access_token: long.access_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })

    const res = back("ok")
    res.cookies.set("ig_oauth_state", "", { maxAge: 0, path: "/" })
    return res
  } catch (e) {
    console.error("[instagram/callback]", e)
    return back("erro")
  }
}
