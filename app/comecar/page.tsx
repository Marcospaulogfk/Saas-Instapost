import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuthVisual } from "@/components/auth/auth-visual"
import { ObjetivoClient } from "./objetivo-client"
import "@/components/auth/auth.css"

export const metadata: Metadata = { title: "Como você vai usar o Nexus?" }

function nextSeguro(v: string | undefined): string {
  return v && v.startsWith("/") ? v : "/dashboard"
}

/**
 * Etapa de onboarding "estilo Canva" pós-cadastro (email/senha direto,
 * confirmação de e-mail, ou callback do Google) — sempre skippable, nunca
 * bloqueia quem acabou de criar a conta.
 *
 * NÃO é `/onboarding/*`: esse prefixo já é o wizard de configurar MARCA
 * (site/manual → objetivos de marketing → identidade → estilo). Esta etapa é
 * sobre a CONTA, roda antes daquele wizard existir de verdade.
 *
 * Protegida na mão (não em PROTECTED_PREFIXES do middleware, que trataria
 * qualquer visita sem sessão como página inteira 401/redirect padrão) — o
 * redirect pro /login abaixo já preserva o destino final.
 */
export default async function ComecarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const sp = await searchParams
  const next = nextSeguro(sp.next)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/comecar?next=${encodeURIComponent(next)}`)}`)
  }

  // Já respondeu antes (ex.: voltou pra essa URL) — não insiste de novo.
  const { data: perfil } = await supabase.from("users").select("objetivo_uso").eq("id", user.id).maybeSingle()
  if (perfil?.objetivo_uso) redirect(next)

  return (
    <div className="dark nx-auth">
      <div className="nx-auth-col">
        <main className="nx-auth-body">
          <ObjetivoClient next={next} />
        </main>
      </div>
      <AuthVisual
        tagline={
          <>
            Feito pro seu
            <br />
            jeito de criar.
          </>
        }
      />
    </div>
  )
}
