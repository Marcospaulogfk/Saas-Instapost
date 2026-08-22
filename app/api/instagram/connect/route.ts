import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildAuthorizeUrl, isInstagramConfigured } from "@/lib/instagram/meta"

export const runtime = "nodejs"

/**
 * Inicia o OAuth do Instagram: gera um state (CSRF, em cookie) e redireciona
 * o usuário pro login/autorização do Instagram. Volta em /api/instagram/callback.
 */
export async function GET(req: Request) {
  if (!isInstagramConfigured()) {
    return NextResponse.json(
      { error: "Instagram não configurado (INSTAGRAM_APP_ID/SECRET ausentes)." },
      { status: 503 },
    )
  }
  // Exige sessão — a conexão é por usuário.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    const origin = new URL(req.url).origin
    return NextResponse.redirect(`${origin}/login?redirect=/dashboard`)
  }

  const origin = new URL(req.url).origin
  const state = crypto.randomUUID()
  const url = buildAuthorizeUrl(origin, state)

  const res = NextResponse.redirect(url)
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  }
  res.cookies.set("ig_oauth_state", state, cookieOpts)
  // Pra onde voltar depois do OAuth. Só caminho relativo do próprio app —
  // nada de open redirect via query.
  const returnTo = new URL(req.url).searchParams.get("returnTo") ?? ""
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    res.cookies.set("ig_oauth_return", returnTo, cookieOpts)
  }
  return res
}
