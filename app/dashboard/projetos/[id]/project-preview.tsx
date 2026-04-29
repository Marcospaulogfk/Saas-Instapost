"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Inter,
  Bebas_Neue,
  Playfair_Display,
  Montserrat,
  Anton,
  Archivo_Black,
  Space_Grotesk,
} from "next/font/google"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SlidePreview,
  type PreviewSlide,
} from "@/components/carousel/slide-preview"
import { CarouselLightbox } from "@/components/carousel/carousel-lightbox"
import { formatRelativeDate } from "@/lib/format-date"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["900"] })
const montserrat = Montserrat({ subsets: ["latin"], weight: ["900"] })
const anton = Anton({ subsets: ["latin"], weight: "400" })
const archivo = Archivo_Black({ subsets: ["latin"], weight: "400" })
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"] })

const FONTS: Record<string, { className: string }> = {
  inter_black: { className: inter.className },
  inter: { className: inter.className },
  bebas_neue: { className: bebas.className },
  playfair: { className: playfair.className },
  montserrat_black: { className: montserrat.className },
  anton: { className: anton.className },
  archivo_black: { className: archivo.className },
  space_grotesk: { className: grotesk.className },
}

interface DbProject {
  id: string
  title: string
  template: "editorial" | "cinematic" | "hybrid" | string
  font_family: string
  created_at: string
}

interface DbBrand {
  id: string
  name: string
  brand_colors: string[]
}

interface DbSlide {
  id: string
  order_index: number
  text_content: string | null
  image_url: string | null
  image_source: string | null
  unsplash_id: string | null
  unsplash_attribution_url: string | null
  editable_elements: Record<string, unknown> | null
}

interface ProjectPreviewProps {
  project: DbProject
  brand: DbBrand
  slides: DbSlide[]
}

function parsePhotographer(url: string): string {
  const match = url.match(/unsplash\.com\/@([^/?]+)/)
  return match?.[1] ?? "Unsplash"
}

function dbToPreviewSlide(s: DbSlide): PreviewSlide {
  const e = (s.editable_elements ?? {}) as Record<string, unknown>
  const title = (e.title as string) ?? s.text_content ?? ""
  const highlight = Array.isArray(e.highlight_words)
    ? (e.highlight_words as string[])
    : []
  const source = (s.image_source === "ai" || s.image_source === "unsplash"
    ? s.image_source
    : null) as "ai" | "unsplash" | null

  const attribution =
    s.unsplash_attribution_url && source === "unsplash"
      ? {
          photographerName: parsePhotographer(s.unsplash_attribution_url),
          photographerUrl: s.unsplash_attribution_url,
        }
      : null

  return {
    order_index: s.order_index,
    title,
    highlight_words: highlight,
    subtitle: (e.subtitle as string) ?? "",
    body: (e.body as string) ?? "",
    cta_badge: (e.cta_badge as string) ?? "",
    image: {
      url: s.image_url,
      source,
      attribution,
      error: null,
    },
  }
}

const VALID_TEMPLATES = ["editorial", "cinematic", "hybrid"] as const
function safeTemplate(t: string): "editorial" | "cinematic" | "hybrid" {
  return (VALID_TEMPLATES as readonly string[]).includes(t)
    ? (t as "editorial" | "cinematic" | "hybrid")
    : "cinematic"
}

export function ProjectPreview({
  project,
  brand,
  slides,
}: ProjectPreviewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const previewSlides = slides
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map(dbToPreviewSlide)

  const fontEntry = FONTS[project.font_family] ?? FONTS.inter_black
  const colors = Array.isArray(brand.brand_colors) ? brand.brand_colors : []
  const template = safeTemplate(project.template)

  return (
    <div className="p-8 space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/dashboard/projetos">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para projetos
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {brand.name} • {project.template} • {previewSlides.length} slides •{" "}
            {formatRelativeDate(project.created_at)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/criar/ia">
            <Plus className="w-4 h-4 mr-2" />
            Criar outro
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Clique em qualquer slide para abrir em fullscreen. Use as setas (← →)
        pra navegar e o botao ↓ pra baixar como PNG.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {previewSlides.map((slide) => (
          <div
            key={slide.order_index}
            className="cursor-zoom-in transition-transform hover:scale-[1.02]"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a, button")) return
              setLightboxIndex(slide.order_index)
            }}
          >
            <SlidePreview
              slide={slide}
              totalSlides={previewSlides.length}
              template={template}
              brandColors={colors}
              fontClass={fontEntry.className}
              showDevBadges={false}
            />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <CarouselLightbox
          slides={previewSlides}
          startIndex={lightboxIndex}
          template={template}
          brandColors={colors}
          fontClass={fontEntry.className}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
