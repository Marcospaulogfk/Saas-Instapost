import Link from "next/link"
import { Plus, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands } from "@/lib/data/queries"
import { Wizard } from "./wizard"

export default async function CriarIaPage() {
  const brands = await listBrands()

  if (brands.length === 0) {
    return (
      <div className="relative p-6 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-xl border border-dashed border-border-medium bg-gradient-card backdrop-blur-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-purple shadow-glow flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 font-display font-bold text-text-primary">
              Você precisa de uma marca primeiro
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
              A IA gera conteúdo a partir da identidade da sua marca (tom de
              voz, público, estilo, cores). Cadastre uma marca antes de criar.
            </p>
          </div>
          <Button asChild>
            <Link href="/onboarding">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar marca
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0 mt-1">
          <Link href="/dashboard/criar" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-h1 font-display font-bold text-text-primary">
            Criar carrossel com <span className="gradient-text">IA</span>
          </h1>
          <p className="text-text-secondary mt-1">
            Da copy à imagem em segundos, com a identidade da sua marca.
          </p>
        </div>
      </div>
      <Wizard
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          default_template: b.default_template,
          default_font: b.default_font,
        }))}
      />
    </div>
  )
}
