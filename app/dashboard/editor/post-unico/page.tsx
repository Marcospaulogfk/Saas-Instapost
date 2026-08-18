import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands, getProfile } from "@/lib/data/queries"
import { generateMonogram } from "@/lib/single-posts/palette"
import { EditorClient } from "./editor-client"
import type { PostBrand } from "@/lib/single-posts/types"

/**
 * Editor de post único — rota real do produto.
 *
 * Substitui o sandbox /teste no fluxo do post único: o wizard grava o
 * briefing no sessionStorage e redireciona pra cá, onde o post é gerado,
 * editado (camadas livres) e salvo na biblioteca. O /teste segue existindo
 * para o carrossel até ele também ser promovido.
 */
export default async function EditorPostUnicoPage() {
  const [brands, { profile }] = await Promise.all([listBrands(), getProfile()])

  if (brands.length === 0) {
    return (
      <div className="relative p-6 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-xl border border-dashed border-border-medium bg-gradient-card backdrop-blur-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-600/15 border border-border-subtle flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-h2 font-display font-bold text-text-primary">
              Você precisa de uma marca primeiro
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
              O editor usa a identidade da marca (cores, tom, nicho) pra montar o
              post. Cadastre uma marca antes.
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

  const editorBrands: PostBrand[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    monogram: generateMonogram(b.name),
    profession: b.description ?? "",
    brand_colors: b.brand_colors,
    logo_url: b.logo_url,
    phone: null,
    website: null,
    instagram_handle: b.instagram_handle,
    tagline: null,
  }))

  return (
    <div className="relative p-6 md:p-8 max-w-7xl mx-auto">
      <EditorClient brands={editorBrands} balance={profile?.credits ?? 0} />
    </div>
  )
}
