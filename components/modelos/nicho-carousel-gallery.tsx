"use client"

// Galeria pública de estilos de carrossel pra uma página de nicho
// (/modelos/carrossel/[nicho]). Ilha client porque o SlidePreview e a
// navegação por pontinhos/setas exigem estado e ResizeObserver.
//
// Reusa o motor de preview do produto (CAROUSEL_STYLES, ScaledPreview,
// SlidePreview) pra que o card público renderize EXATAMENTE o mesmo visual
// que o wizard interno, sem duplicar layout.
//
// Estilo "auto" excluído de propósito: ele não é um estilo visual próprio,
// é o fallback "deixa a IA escolher" (LegacyEditorialSlide). Numa galeria
// pública que existe pra vender os 9 estilos nomeados, mostrar um 10º card
// com visual genérico/legado ao lado deles é ruído, não diferencial.
import { useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import {
  CAROUSEL_STYLES,
  ScaledPreview,
} from "@/components/carousel/carousel-style-gallery"
import {
  SlidePreview,
  type EditorialStyle,
  type PreviewSlide,
} from "@/components/carousel/slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

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

function EstiloCard({
  style,
  name,
  desc,
  demoSlides,
  nichoSlug,
  briefExemplo,
}: {
  style: EditorialStyle
  name: string
  desc: string
  demoSlides: PreviewSlide[]
  nichoSlug: string
  briefExemplo: string
}) {
  const [active, setActive] = useState(0)
  const total = demoSlides.length
  const go = (i: number) => setActive((i + total) % total)
  const href = buildCtaHref(briefExemplo, style)

  return (
    <div className="group flex flex-col rounded-xl border border-hairline bg-card overflow-hidden transition-colors hover:border-border-accent [content-visibility:auto] [contain-intrinsic-size:auto_520px]">
      <div className="relative">
        <ScaledPreview>
          <SlidePreview
            slide={demoSlides[active]}
            totalSlides={total}
            template="editorial"
            brandColors={["#1668E3", "#1A1A1A", "#FAF8F5"]}
            fontClass={inter.className}
            showDevBadges={false}
            editorialStyle={style}
            handle="@suamarca"
            brandLabel="Sua Marca"
          />
        </ScaledPreview>

        <button
          type="button"
          aria-label="Slide anterior"
          onClick={() => go(active - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full bg-background/85 border border-hairline text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-background hover:text-text-primary transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Próximo slide"
          onClick={() => go(active + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full bg-background/85 border border-hairline text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-background hover:text-text-primary transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text-primary truncate">{name}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {demoSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-4 bg-brand-500" : "w-1.5 bg-text-subtle hover:bg-text-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-[11.5px] text-text-muted leading-relaxed line-clamp-2">{desc}</p>

        <Link
          href={href}
          onClick={() => trackCtaClick(nichoSlug, style)}
          className="mt-auto inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-medium transition-colors"
        >
          Usar este modelo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
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
        <EstiloCard
          key={s.style}
          style={s.style}
          name={s.name}
          desc={s.desc}
          demoSlides={demoSlides}
          nichoSlug={nichoSlug}
          briefExemplo={briefExemplo}
        />
      ))}
    </div>
  )
}
