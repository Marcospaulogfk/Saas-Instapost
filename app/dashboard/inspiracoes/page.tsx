import { getActiveBrand } from "@/lib/data/queries"
import {
  buildContextoMarca,
  getInspiracoesGenericas,
  getInspiracoesParaMarca,
} from "@/lib/inspiracoes"
import {
  getCotaInspiracao,
  listFontes,
  listIdeias,
} from "@/lib/inspiracoes/queries"
import { InspiracoesClient } from "./inspiracoes-client"
import { FontesClient } from "./fontes-client"
import { FONTES_INSPIRACAO_HABILITADAS } from "@/lib/features"

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

  // Fontes próprias: só existem atreladas a uma marca. Sem marca ativa a
  // seção aparece desabilitada (o convite de criar marca já está abaixo).
  // Desligado = nem consulta. As queries batem em tabelas que a migration
  // 0016 ainda não criou; chamar aqui derrubaria a página inteira, não só a
  // seção.
  const [fontes, ideias, cota] = FONTES_INSPIRACAO_HABILITADAS
    ? await Promise.all([
        brand ? listFontes(brand.id) : Promise.resolve([]),
        brand ? listIdeias(brand.id) : Promise.resolve([]),
        getCotaInspiracao(),
      ])
    : [[], [], null]

  return (
    <InspiracoesClient
      inspiracoes={inspiracoes}
      brandName={brand?.name ?? null}
      contextoMarca={brandContext ? buildContextoMarca(brandContext) : null}
      slotFontes={
        FONTES_INSPIRACAO_HABILITADAS && cota ? (
          <FontesClient
            brandId={brand?.id ?? null}
            brandName={brand?.name ?? null}
            fontes={fontes}
            ideias={ideias}
            cota={cota}
          />
        ) : null
      }
    />
  )
}
