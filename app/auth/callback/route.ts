import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Origem pública desta requisição.
 *
 * `new URL(request.url).origin` NÃO serve aqui: atrás do proxy do Coolify o
 * Next recebe a requisição no container e enxerga `localhost:3000`, então o
 * usuário era mandado pra https://localhost:3000/dashboard depois de logar
 * com o Google. Os headers X-Forwarded-* são o que carrega o domínio real —
 * e usá-los (em vez de fixar NEXT_PUBLIC_APP_URL) mantém o login funcionando
 * nos dois domínios durante a transição: quem entrou pelo antigo volta pro
 * antigo, quem entrou pelo novo volta pro novo.
 */
function publicOrigin(request: Request): string {
  const h = request.headers
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const origin = publicOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
