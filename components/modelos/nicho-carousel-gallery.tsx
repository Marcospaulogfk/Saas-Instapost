"use client"

// Galeria pública de estilos de carrossel pra uma página de nicho
// (/modelos/carrossel/[nicho]). Ilha client porque o CarouselStyleCard usa
// estado e ResizeObserver pro preview.
//
// Reusa o CARD do produto (CarouselStyleCard) pra que a galeria pública
// renderize EXATAMENTE o mesmo componente que a página de Templates do app,
// sem duplicar layout — só troca demoSlides/href/onCtaClick por nicho.
//
// Estilo "auto" excluído de propósito: ele não é um estilo visual próprio,
// é o fallback "deixa a IA escolher" (LegacyEditorialSlide). Numa galeria
// pública que existe pra vender os 9 estilos nomeados, mostrar um 10º card
// com visual genérico/legado ao lado deles é ruído, não diferencial.
import {
  CAROUSEL_STYLES,
  CarouselStyleCard,
} from "@/components/carousel/carousel-style-gallery"
import type { EditorialStyle, PreviewSlide } from "@/components/carousel/slide-preview"

const ESTILOS_PUBLICOS = CAROUSEL_STYLES.filter((s) => s.style !== "auto")

/** Monta o link de CTA: /cadastro?next=<wizard já no passo certo>. O wizard
 *  lê tipo/step/brief da URL (app/dashboard/criar/page.tsx) e o /cadastro lê
 *  ?next= pra levar o usuário até lá depois do onboarding. */
function buildCtaHref(brief: string, estilo?: string) {
  const params = new URLSearchParams({ tipo: "carrossel", step: "2" })
  if (estilo) params.set("estilo", estilo)
  params.set("brief", brief)
  const next = `/dashboard/criar?${params.toString()}`
  return `/cadastro?next=${encodeURIComponent(next)}`
}

function trackCtaClick(nicho: string, estilo: EditorialStyle) {
  try {
    ;(window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer?.push({
      event: "cta_modelo_nicho",
      nicho,
      estilo,
    })
  } catch {
    // Tracking nunca pode travar a navegação do CTA.
  }
}

export function NichoCarouselGallery({
  nichoSlug,
  demoSlides,
  briefExemplo,
}: {
  nichoSlug: string
  demoSlides: PreviewSlide[]
  briefExemplo: string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {ESTILOS_PUBLICOS.map((s) => (
        <CarouselStyleCard
          key={s.style}
          style={s.style}
          name={s.name}
          desc={s.desc}
          badge={s.badge}
          demoSlides={demoSlides}
          href={buildCtaHref(briefExemplo, s.style)}
          ctaLabel="Usar este modelo"
          onCtaClick={() => trackCtaClick(nichoSlug, s.style)}
        />
      ))}
    </div>
  )
}
