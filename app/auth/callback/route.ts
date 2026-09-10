import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { vincularIndicacaoPeloCookie } from "@/lib/indicacao/vincular"
import { vincularPrimeiroToquePeloCookie } from "@/lib/atribuicao/vincular"
import { origemPublica } from "@/lib/auth/origem-publica"

// Origem pública (atrás do proxy do Coolify o request.url enxerga
// localhost:3000): ver lib/auth/origem-publica.ts, dividida com /auth/confirm.
const publicOrigin = origemPublica

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const origin = publicOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Cadastro pelo Google vai DIRETO pro destino, sem /comecar (decisão do
      // Marcos, 10/09/2026: quem cria conta cai no painel; criar marca é
      // escolha, aberta pelo botão do painel).
      const res = NextResponse.redirect(`${origin}${next}`)
      // Quem veio pelo Google não passa pelo signUp com metadata; o cookie
      // nx_ref (posto em /cadastro?ref=) é o que carrega a indicação.
      try {
        const jar = await cookies()
        const ref = jar.get("nx_ref")?.value
        if (ref && data.user) {
          await vincularIndicacaoPeloCookie(data.user.id, ref)
          res.cookies.set("nx_ref", "", { path: "/", maxAge: 0 })
        }
      } catch (e) {
        console.warn("[auth/callback] indicação pelo cookie falhou:", e)
      }
      // Mesma lógica pro primeiro toque (nx_ft): quem veio pelo Google também
      // não passa pelo signUp com metadata. Sempre chama; o guard de coluna
      // null dentro da função torna idempotente pra quem já foi carimbado.
      if (data.user) {
        await vincularPrimeiroToquePeloCookie(data.user.id)
      }
      return res
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
