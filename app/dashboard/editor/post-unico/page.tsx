import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listBrands, getProfile } from "@/lib/data/queries"
import { getSinglePost } from "@/lib/single-posts/queries"
import { generateMonogram } from "@/lib/single-posts/palette"
import { EditorClient, type InitialPost } from "./editor-client"
import type { PostBrand } from "@/lib/single-posts/types"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

/**
 * Editor de post único — rota real do produto.
 *
 * Dois modos de entrada:
 *  - sem query: pega o briefing que o wizard deixou no sessionStorage e gera;
 *  - `?post=<id>`: carrega um post salvo da biblioteca pra reedição.
 *
 * Substitui o sandbox /teste no fluxo do post único.
 */
export default async function EditorPostUnicoPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>
}) {
  const [{ post: postId }, brands, { profile }] = await Promise.all([
    searchParams,
    listBrands(),
    getProfile(),
  ])

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

  // Reedição: carrega o spec salvo. Só posts do editor livre abrem aqui.
  let initialPost: InitialPost | null = null
  if (postId) {
    const saved = await getSinglePost(postId)
    const content = saved?.content as unknown as {
      _free_spec?: FreePostSpec
      _font_preset?: string
      _caption?: string
    } | null
    if (saved && content?._free_spec) {
      initialPost = {
        id: saved.id,
        brandId: saved.brand_id,
        spec: content._free_spec,
        fontPreset: content._font_preset ?? "editorial",
        caption: content._caption ?? "",
        briefing: saved.raw_brief ?? "",
        skeletonId: saved.template_id.startsWith("free:")
          ? saved.template_id.slice(5)
          : null,
      }
    }
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
      <EditorClient
        brands={editorBrands}
        balance={profile?.credits ?? 0}
        initialPost={initialPost}
      />
    </div>
  )
}
