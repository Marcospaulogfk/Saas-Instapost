import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  baseDoApp,
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramProfile,
} from "@/lib/instagram/meta"

export const runtime = "nodejs"

/**
 * Callback do OAuth do Instagram. Troca o code por token de longa duração,
 * descobre o ig_user_id/username e salva a conexão do usuário. Redireciona de
 * volta pro editor com ?ig=ok (ou ?ig=erro&motivo=...).
 *
 * A origem vem de `baseDoApp(req)`, NÃO de `url.origin`: atrás do proxy do
 * Coolify o container enxerga localhost:3000 e a pessoa terminava o login em
 * https://localhost:3000/dashboard/instagram (22/09/2026). A mesma base monta
 * o redirect_uri da troca do code, então authorize e troca mandam a MESMA
 * string — que é o que a Meta exige.
 *
 * O `motivo` na query é diagnóstico: sem acesso ao log do container, o
 * console.error daqui não era lido por ninguém e toda falha virava "tente de
 * novo". Sai da URL quando o fluxo estiver de pé.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = baseDoApp(req)
  const cookies = Object.fromEntries(
    (req.headers.get("cookie") ?? "")
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const i = c.indexOf("=")
        return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]
      }),
  )
  // Volta pra página que iniciou o OAuth (cookie do /connect); o editor de
  // carrossel é só o fallback.
  const ret = cookies.ig_oauth_return ?? ""
  const returnPath =
    ret.startsWith("/") && !ret.startsWith("//") ? ret : "/dashboard/carrossel"
  const back = (status: string, motivo?: string) => {
    const u = new URL(returnPath, origin)
    u.searchParams.set("ig", status)
    if (motivo) u.searchParams.set("motivo", motivo.slice(0, 300))
    const res = NextResponse.redirect(u.toString())
    res.cookies.set("ig_oauth_state", "", { maxAge: 0, path: "/" })
    res.cookies.set("ig_oauth_return", "", { maxAge: 0, path: "/" })
    return res
  }

  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const err = url.searchParams.get("error")
  if (err) {
    const desc = url.searchParams.get("error_description") ?? ""
    return back("erro", `meta_recusou: ${err} ${desc}`.trim())
  }
  if (!code) return back("erro", "sem_code: a Meta voltou sem ?code")

  // CSRF: state tem que bater com o cookie setado no /connect.
  const cookieState = cookies.ig_oauth_state
  if (!state) return back("erro", "sem_state: a Meta voltou sem ?state")
  if (!cookieState) {
    return back("erro", "sem_cookie_state: o cookie ig_oauth_state não voltou")
  }
  if (state !== cookieState) return back("erro", "state_divergente")

  // Qual passo estava rodando quando estourou — o catch sozinho não conta.
  let etapa = "sessao"
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return back("erro", "sem_sessao: supabase.auth.getUser() voltou vazio")
    }

    etapa = "troca_code"
    const short = await exchangeCodeForToken(code, origin)
    etapa = "token_longo"
    const long = await getLongLivedToken(short.access_token)
    etapa = "perfil"
    const profile = await getInstagramProfile(long.access_token)

    const expiresAt = new Date(Date.now() + long.expiresInSec * 1000).toISOString()

    etapa = "gravar"
    // O erro do upsert era engolido: falha de banco devolvia ig=ok e a conta
    // aparecia conectada sem linha nenhuma.
    const { error } = await supabase.from("instagram_connections").upsert({
      user_id: user.id,
      ig_user_id: profile.igUserId,
      username: profile.username,
      access_token: long.access_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      console.error("[instagram/callback] gravar:", error)
      return back("erro", `gravar: ${error.message}`)
    }

    return back("ok")
  } catch (e) {
    console.error(`[instagram/callback] ${etapa}:`, e)
    const msg = e instanceof Error ? e.message : String(e)
    return back("erro", `${etapa}: ${msg}`)
  }
}
