"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CarouselCover } from "./carousel-cover"
import type { CarouselCoverData, PreviewSlide } from "./slide-preview"

/**
 * Preview navegável do carrossel: renderiza a capa ao vivo e permite folhear
 * TODOS os slides (setas no hover + pontinhos sobrepostos). As setas/pontinhos
 * usam preventDefault+stopPropagation, então funcionam mesmo dentro de um <a>.
 * Preenche o container pai (que deve ser position:relative + overflow-hidden).
 */
export function CarouselNavPreview({
  cover,
  slides,
}: {
  cover: CarouselCoverData
  slides: PreviewSlide[]
}) {
  const total = slides.length
  const canNav = total > 1
  const [active, setActive] = useState(0)
  const go = (i: number) => setActive((i + total) % total)
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fn()
  }

  return (
    <>
      <CarouselCover cover={cover} slide={canNav ? slides[active] : undefined} />

      {canNav && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={stop(() => go(active - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-7 h-7 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={stop(() => go(active + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-7 h-7 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver slide ${i + 1}`}
                onClick={stop(() => setActive(i))}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === active ? 16 : 6,
                  background: i === active ? "#8b5cf6" : "rgba(255,255,255,0.55)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
