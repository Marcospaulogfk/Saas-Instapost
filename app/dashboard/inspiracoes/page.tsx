import { getActiveBrand } from "@/lib/data/queries"
import {
  INSPIRACOES,
  getInspiracoesParaMarca,
  type Inspiracao,
} from "@/lib/inspiracoes"
import { InspiracoesClient } from "./inspiracoes-client"

export default async function InspiracoesPage() {
  const brand = await getActiveBrand()

  // Com marca ativa: inspirações adaptadas ao nicho/objetivo + briefing com contexto.
  // Sem marca: catálogo genérico.
  const inspiracoes = brand
    ? getInspiracoesParaMarca({
        name: brand.name,
        description: brand.description,
        target_audience: brand.target_audience,
        tone_of_voice: brand.tone_of_voice,
        main_objective: brand.main_objective,
      })
    : (INSPIRACOES as Array<Inspiracao & { personalizada?: boolean }>)

  return (
    <InspiracoesClient
      inspiracoes={inspiracoes}
      brandName={brand?.name ?? null}
    />
  )
}
