import { getActiveBrand } from "@/lib/data/queries"
import {
  buildContextoMarca,
  getInspiracoesGenericas,
  getInspiracoesParaMarca,
} from "@/lib/inspiracoes"
import { InspiracoesClient } from "./inspiracoes-client"

export default async function InspiracoesPage() {
  const brand = await getActiveBrand()

  // Com marca ativa: sugestões adaptadas ao nicho/objetivo + briefing com contexto.
  // Sem marca: catálogo genérico + convite pra criar marca.
  const brandContext = brand
    ? {
        name: brand.name,
        description: brand.description,
        target_audience: brand.target_audience,
        tone_of_voice: brand.tone_of_voice,
        main_objective: brand.main_objective,
      }
    : null

  const inspiracoes = brandContext
    ? getInspiracoesParaMarca(brandContext)
    : getInspiracoesGenericas()

  return (
    <InspiracoesClient
      inspiracoes={inspiracoes}
      brandName={brand?.name ?? null}
      contextoMarca={brandContext ? buildContextoMarca(brandContext) : null}
    />
  )
}
