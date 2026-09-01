"use client"

// Galeria pública do catálogo completo de templates de carrossel, usada na
// página de nicho (/modelos/carrossel/[nicho]) e no hub (/modelos/carrossel).
// Ilha client porque o CarouselStyleCard usa estado e ResizeObserver pro
// preview, e o filtro por profissão é client-side (sem navegação).
//
// Reusa o CARD do produto (CarouselStyleCard) pra que a galeria pública
// renderize EXATAMENTE o mesmo componente que a página de Templates do app,
// sem duplicar layout, só troca demoSlides/href/onCtaClick por template.
//
// Antes esta galeria mostrava os 9 estilos de carrossel com o mesmo
// demoSlides do nicho (um card por estilo). Agora mostra o CATÁLOGO de
// templates curados (2 por nicho, cada um com tema e estilo próprios,
// ver lib/seo/templates-nicho.ts): estilo de carrossel deixou de ser o que
// se navega, o tema do template é.
import { useMemo, useState } from "react"
import { CarouselStyleCard } from "@/components/carousel/carousel-style-gallery"
import { CAROUSEL_STYLES } from "@/components/carousel/carousel-styles"
import type { EditorialStyle } from "@/components/carousel/slide-preview"
import { NICHOS } from "@/lib/seo/nichos"
import { TEMPLATES_NICHO, NICHOS_COM_TEMPLATE } from "@/lib/seo/templates-nicho"

const NOME_ESTILO: Record<EditorialStyle, string> = Object.fromEntries(
  CAROUSEL_STYLES.map((s) => [s.style, s.name]),
) as Record<EditorialStyle, string>

const PROFISSOES_COM_TEMPLATE = NICHOS.filter((n) => NICHOS_COM_TEMPLATE.includes(n.slug))

/** Monta o link de CTA: /cadastro?next=<wizard já no passo certo>. O wizard
 *  lê tipo/step/brief da URL (app/dashboard/criar/page.tsx) e o /cadastro lê
 *  ?next= pra levar o usuário até lá depois do onboarding. */
function buildCtaHref(brief: string, estilo: EditorialStyle) {
  const params = new URLSearchParams({ tipo: "carrossel", step: "2", estilo, brief })
  const next = `/dashboard/criar?${params.toString()}`
  return `/cadastro?next=${encodeURIComponent(next)}`
}

function trackCtaClick(nicho: string, template: string, estilo: EditorialStyle) {
  try {
    ;(window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer?.push({
      event: "cta_modelo_nicho",
      nicho,
      template,
      estilo,
    })
  } catch {
    // Tracking nunca pode travar a navegação do CTA.
  }
}

export function NichoCarouselGallery({
  nichoAtualSlug,
}: {
  /** Nicho da página atual, se houver: seus templates aparecem primeiro.
   *  Omitido no hub, onde nenhum nicho tem prioridade. */
  nichoAtualSlug?: string
}) {
  const [filtro, setFiltro] = useState<string>("todos")

  const ordenados = useMemo(() => {
    if (!nichoAtualSlug) return TEMPLATES_NICHO
    const doNicho = TEMPLATES_NICHO.filter((t) => t.nichoSlug === nichoAtualSlug)
    const outros = TEMPLATES_NICHO.filter((t) => t.nichoSlug !== nichoAtualSlug)
    return [...doNicho, ...outros]
  }, [nichoAtualSlug])

  const visiveis = useMemo(() => {
    if (filtro === "todos") return ordenados
    return ordenados.filter((t) => t.nichoSlug === filtro)
  }, [ordenados, filtro])

  return (
    <div className="flex flex-col gap-5">
      {/* Chips de filtro por profissão: client-side, sem navegação */}
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setFiltro("todos")}
          className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
            filtro === "todos"
              ? "border-brand-500 bg-brand-600/15 text-brand-300"
              : "border-hairline bg-surface text-text-secondary hover:border-border-accent hover:text-text-primary"
          }`}
        >
          Todos
        </button>
        {PROFISSOES_COM_TEMPLATE.map((n) => (
          <button
            key={n.slug}
            type="button"
            onClick={() => setFiltro(n.slug)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              filtro === n.slug
                ? "border-brand-500 bg-brand-600/15 text-brand-300"
                : "border-hairline bg-surface text-text-secondary hover:border-border-accent hover:text-text-primary"
            }`}
          >
            {n.nome}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visiveis.map((t) => {
          const nichoDoTemplate = NICHOS.find((n) => n.slug === t.nichoSlug)
          const nomeEstilo = NOME_ESTILO[t.estilo] ?? t.estilo
          const umaLinhaDoTema = t.demoSlides[0]?.subtitle ?? ""
          return (
            <CarouselStyleCard
              key={t.id}
              style={t.estilo}
              name={t.nome}
              desc={`Estilo ${nomeEstilo} · ${umaLinhaDoTema}`}
              badge={{ label: nichoDoTemplate?.nome ?? t.nichoSlug, tone: "neutral" }}
              demoSlides={t.demoSlides}
              href={buildCtaHref(t.brief, t.estilo)}
              ctaLabel="Usar este modelo"
              onCtaClick={() => trackCtaClick(t.nichoSlug, t.id, t.estilo)}
            />
          )
        })}
      </div>
    </div>
  )
}
