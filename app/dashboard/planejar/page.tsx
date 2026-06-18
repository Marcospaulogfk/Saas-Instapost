import Link from "next/link"
import { Sparkles, Plus } from "lucide-react"
import { getActiveBrand } from "@/lib/data/queries"
import { PlanejarChat } from "./planejar-chat"

export const metadata = {
  title: "Planejar conteúdo — SyncPost",
}

export default async function PlanejarPage() {
  const brand = await getActiveBrand()

  if (!brand) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="rounded-xl border-2 border-dashed border-border-subtle p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-brand-600/15 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            Cadastre uma marca primeiro
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            O planejador monta o cronograma a partir do seu negócio. Crie uma
            marca pra eu entender o que você faz.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-600 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Criar marca
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PlanejarChat
      brand={{
        id: brand.id,
        name: brand.name,
        description: brand.description,
        target_audience: brand.target_audience,
        tone_of_voice: brand.tone_of_voice,
        main_objective: brand.main_objective,
      }}
    />
  )
}
