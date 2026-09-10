import Link from "next/link"
import { ArrowRight, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands } from "@/lib/data/queries"
import { createClient } from "@/lib/supabase/server"
import { lerEstadoTeste } from "@/lib/teste-gratis"
import { MENSAGEM_TESTE_ESGOTADO } from "@/lib/teste-gratis-regra"

// =====================================================================
// Barreiras de TODA a criação (/dashboard/criar/*), na ordem:
//
// 1) Sem marca: desde 10/09/2026 quem cria conta cai direto no painel, sem
//    criar marca (decisão do Marcos). Sem esta barreira o wizard gerava com
//    uma "Marca Demo" de mentira (id "wizard-brand") e quebrava ao salvar.
//
// 2) Teste grátis esgotado (R4-13, rodada 4 do testador): antes a pessoa
//    preenchia os 4 passos e só no Gerar descobria que não podia. Agora o
//    aviso vem na ENTRADA, com o caminho pra assinar.
//
// Nenhuma das duas consome peça: a peça do teste só é reservada nas rotas
// de geração, que ficam depois daqui.
// =====================================================================

function Aviso({
  titulo,
  texto,
  acao,
  secundaria,
}: {
  titulo: string
  texto: string
  acao: { href: string; rotulo: string; icone: "plus" | "arrow" }
  secundaria?: { href: string; rotulo: string }
}) {
  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <div className="space-y-4 rounded-xl border border-border-subtle bg-background-secondary p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border-subtle bg-background-tertiary">
          <Sparkles className="h-7 w-7 text-brand-400" />
        </div>
        <div>
          <h2 className="text-h3 font-display font-semibold text-text-primary">{titulo}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{texto}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href={acao.href}>
              {acao.icone === "plus" ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {acao.rotulo}
            </Link>
          </Button>
          {secundaria && (
            <Button asChild variant="outline">
              <Link href={secundaria.href}>{secundaria.rotulo}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function CriarLayout({ children }: { children: React.ReactNode }) {
  const brands = await listBrands()
  if (brands.length === 0) {
    return (
      <Aviso
        titulo="Antes de criar, conte pra gente sobre a sua marca"
        texto="O conteúdo sai com o jeito da sua marca: cores, tom de voz, público e estilo. Leva uns 2 minutos, e você só faz isso uma vez."
        acao={{ href: "/onboarding", rotulo: "Criar minha marca", icone: "plus" }}
      />
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const teste = await lerEstadoTeste(supabase, user?.id)
  if (teste.esgotado) {
    return (
      <Aviso
        titulo="Seu teste grátis já foi usado"
        texto={`${MENSAGEM_TESTE_ESGOTADO} O que você já criou continua na sua Biblioteca.`}
        acao={{ href: "/pricing", rotulo: "Ver planos", icone: "arrow" }}
        secundaria={{ href: "/dashboard/projetos", rotulo: "Ir para a Biblioteca" }}
      />
    )
  }

  return children
}
