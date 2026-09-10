import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { origemPublica } from "@/lib/auth/origem-publica"

/**
 * Destino dos links de e-mail do Supabase (troca de senha e, se voltar a
 * ficar ligada, confirmação de cadastro).
 *
 * Aceita os DOIS formatos de link, porque o formato depende do modelo de
 * e-mail configurado no painel do Supabase, que não está versionado aqui:
 *   - token_hash + type  (modelo customizado apontando pra cá)
 *   - code               (modelo padrão com PKCE, o do @supabase/ssr)
 * Antes só o primeiro funcionava; com o modelo padrão o link caía em
 * /login?error=confirm_failed sem motivo aparente.
 *
 * O redirect usa a origem PÚBLICA: atrás do proxy do Coolify o request.url
 * enxerga localhost:3000 (ver lib/auth/origem-publica.ts).
 */
function destinoSeguro(v: string | null): string {
  // Só caminho interno: um ?next=https://outro-site viraria open redirect
  // usando o nosso domínio como isca.
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = origemPublica(request)
  const next = destinoSeguro(searchParams.get("next"))
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.warn("[auth/confirm] verifyOtp recusou:", error.message)
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.warn("[auth/confirm] exchangeCodeForSession recusou:", error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`)
}
