import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  appId,
  baseDoApp,
  redirectUri,
  redirectUriVeioDe,
  redirectUriTinhaLixo,
  limpaCode,
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramProfile,
} from "@/lib/instagram/meta"

export const runtime = "nodejs"

/**
 * Codes já vistos, na memória deste container. A Meta só aceita cada code UMA
 * vez, e "Error validating verification code" é a MESMA frase que ela devolve
 * pra code já gasto e pra redirect_uri diferente — então sem saber se o code
 * chegou duas vezes não dá pra separar as duas causas. Se o callback estiver
 * sendo chamado em dobro (retry do proxy, extensão do navegador, o que for),
 * a segunda chegada aparece no motivo. Some quando o container reinicia, e
 * isso está ok: é diagnóstico, não é controle de acesso — quem barra repetição
 * de verdade é a própria Meta.
 */
const codesVistos = new Map<string, number>()

/** Devolve há quantos ms este code já tinha passado por aqui, ou null. */
function chegouAntes(code: string): number | null {
  const agora = Date.now()
  for (const [c, t] of codesVistos) {
    if (agora - t > 10 * 60_000) codesVistos.delete(c)
  }
  const antes = codesVistos.get(code)
  codesVistos.set(code, agora)
  return antes === undefined ? null : agora - antes
}

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
    if (motivo) u.searchParams.set("motivo", motivo.slice(0, 700))
    const res = NextResponse.redirect(u.toString())
    // Apaga com os mesmos atributos com que foram criados no /connect —
    // cookie SameSite=None só é aceito junto de Secure, inclusive pra morrer.
    const morre = { maxAge: 0, path: "/", secure: true, sameSite: "none" as const }
    res.cookies.set("ig_oauth_state", "", morre)
    res.cookies.set("ig_oauth_return", "", morre)
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

  const repetido = chegouAntes(code)
  if (repetido !== null) {
    console.error(`[instagram/callback] code repetido, ${repetido}ms depois`)
  }

  // CSRF: state tem que bater com o cookie setado no /connect.
  const cookieState = cookies.ig_oauth_state
  if (!state) return back("erro", "sem_state: a Meta voltou sem ?state")
  if (!cookieState) {
    // O state carrega a hora de emissão (ver /connect). Sem o cookie, ela é a
    // única pista de qual dos dois problemas foi: o navegador segurou o
    // cookie na volta, ou a pessoa demorou mais que os 15 min e ele expirou.
    const emitidoEm = Number(state.split(".")[1])
    const minutos = Number.isFinite(emitidoEm)
      ? ` (a volta levou ${Math.round((Date.now() - emitidoEm) / 60000)} min; o cookie vale 15)`
      : ""
    return back("erro", `sem_cookie_state: o cookie ig_oauth_state não voltou${minutos}`)
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
    // Na troca do code a Meta responde a mesma frase genérica pra três causas
    // diferentes (redirect_uri diferente, code já gasto, code vencido). Então
    // a resposta vai acompanhada do que EU mandei, entre colchetes pra espaço
    // no fim aparecer, e de quantas vezes este code passou por aqui. É
    // temporário, igual ao motivo: sai quando a conexão estiver de pé.
    const extra =
      etapa === "troca_code"
        ? ` | enviei redirect_uri=[${redirectUri(origin)}] (${redirectUriVeioDe()})` +
          ` client_id=${appId()}` +
          // As DUAS pontas do code: o fim é onde o "#_" apareceria, e sem ver
          // o fim não dá pra descartar a pegadinha.
          ` code=${code.slice(0, 8)}…${code.slice(-6)} (${code.length} chars` +
          (code === limpaCode(code) ? ")" : ", TINHA SUFIXO #_)") +
          (repetido === null
            ? " 1a chegada deste code"
            : ` 2a CHEGADA deste code, ${repetido}ms depois da 1a`) +
          (redirectUriTinhaLixo() ? " ENV_TINHA_ESPACO_NO_FIM" : "")
        : ""
    return back("erro", `${etapa}: ${msg}${extra}`)
  }
}
