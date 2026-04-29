import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands } from "@/lib/data/queries"
import { Wizard } from "./wizard"

export default async function CriarIaPage() {
  const brands = await listBrands()

  if (brands.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              Voce precisa de uma marca primeiro
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              A IA gera conteudo a partir da identidade da sua marca (tom de
              voz, publico, estilo, cores). Cadastre uma marca antes de criar.
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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Criar carrossel com IA</h1>
        <p className="text-muted-foreground mt-1">
          Da copy a imagem em segundos, com a identidade da sua marca.
        </p>
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
