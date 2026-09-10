import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands } from "@/lib/data/queries"

// =====================================================================
// Barreira "precisa de marca" de TODA a criação (/dashboard/criar/*).
//
// Desde 10/09/2026 quem cria conta cai direto no painel, sem passar pela
// criação de marca (decisão do Marcos). Sem esta barreira, o wizard de
// criação gerava com uma "Marca Demo" de mentira (id "wizard-brand"): a
// geração até rodava, mas salvar a peça quebrava, porque não existe marca
// com esse id. Aqui a pessoa é levada pra criar a marca NA HORA em que
// tenta criar conteúdo, que é quando a marca passa a importar.
//
// A peça do teste grátis só é reservada nas rotas de geração, que ficam
// depois desta barreira: bater aqui sem marca não consome nada.
// =====================================================================

export default async function CriarLayout({ children }: { children: React.ReactNode }) {
  const brands = await listBrands()
  if (brands.length > 0) return children

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <div className="space-y-4 rounded-xl border border-border-subtle bg-background-secondary p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-border-subtle bg-background-tertiary">
          <Sparkles className="h-7 w-7 text-brand-400" />
        </div>
        <div>
          <h2 className="text-h3 font-display font-semibold text-text-primary">
            Antes de criar, conte pra gente sobre a sua marca
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            O conteúdo sai com o jeito da sua marca: cores, tom de voz, público e
            estilo. Leva uns 2 minutos, e você só faz isso uma vez.
          </p>
        </div>
        <Button asChild>
          <Link href="/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Criar minha marca
          </Link>
        </Button>
      </div>
    </div>
  )
}
