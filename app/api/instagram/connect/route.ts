import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { baseDoApp, buildAuthorizeUrl, isInstagramConfigured } from "@/lib/instagram/meta"

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
    return NextResponse.redirect(`${baseDoApp(req)}/login?redirect=/dashboard`)
  }

  // Mesma base do /callback (baseDoApp): `new URL(req.url).origin` vira
  // localhost:3000 dentro do container do Coolify, e aí o redirect_uri do
  // authorize sairia diferente do da troca do code.
  const origin = baseDoApp(req)
  // O state leva a hora de emissão colada (uuid.timestamp). Serve pra duas
  // coisas: continua sendo o segredo aleatório que o cookie tem que repetir,
  // e, quando o cookie NÃO volta, o callback ainda consegue dizer quanto tempo
  // a pessoa levou — que é a diferença entre "o navegador segurou o cookie" e
  // "o cookie expirou no meio do caminho".
  const state = `${crypto.randomUUID()}.${Date.now()}`
  const url = buildAuthorizeUrl(origin, state)

  const res = NextResponse.redirect(url)
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    // sameSite "none", e NÃO "lax", de propósito: a tela de consentimento do
    // instagram.com envia um formulário (POST) e só depois redireciona pro
    // nosso callback. Nessa cadeia o Chrome olha quem iniciou a navegação e
    // deixa o cookie Lax de fora — em 22/09/2026 os dois cookies sumiram
    // exatamente assim, e o callback respondeu sem_cookie_state. É o padrão
    // de mercado pra callback de OAuth. Quem for "consertar" isso de volta
    // pra lax vai reabrir o mesmo buraco. Só vale com secure: true, que está
    // logo acima, e o CSRF continua inteiro: o state segue obrigatório e
    // segue tendo que bater com o cookie.
    sameSite: "none" as const,
    // 15 min, não 10: quem para no meio (login no Instagram, troca de conta,
    // uma interrupção qualquer) estourava o prazo e voltava sem cookie
    // nenhum, o que dá o MESMO erro de um cookie bloqueado. Continua sendo
    // cookie de uso único, apagado na volta.
    maxAge: 900,
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
