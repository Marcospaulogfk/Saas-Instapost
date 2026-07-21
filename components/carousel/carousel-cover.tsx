"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Inter } from "next/font/google"
import { SlidePreview, type CarouselCoverData, type PreviewSlide } from "./slide-preview"

// Mesma fonte usada no editor (pesos display do template editorial).
const inter = Inter({ subsets: ["latin"], weight: ["900"] })

// Largura de REFERÊNCIA = a mesma do editor (max-w-[420px] no feed). As fontes
// do template são rem FIXO (ex.: title text-[2.2rem]) tunadas pra ESSA largura —
// é aqui que o título vira 3 linhas grandes, como no editor. Renderizamos o
// SlidePreview em 420px e escalamos o conjunto pra caber no card (proporção
// idêntica à do editor, só menor). Render em 1080 deixaria o título minúsculo.
const REF_W = 420

/**
 * Thumbnail COMPOSTO do carrossel: renderiza o slide 1 real (texto + marca +
 * imagem) em tamanho de design e escala pra caber no card. Funciona pra todo
 * carrossel, sem precisar de render salvo nem re-salvar.
 */
export function CarouselCover({
  cover,
  slide,
}: {
  cover: CarouselCoverData
  /** Slide a exibir (pra preview navegável). Default = capa (slide 1). */
  slide?: PreviewSlide
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(el.clientWidth / REF_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden pointer-events-none bg-black"
    >
      <div
        style={{
          width: REF_W,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <SlidePreview
          slide={slide ?? cover.slide}
          totalSlides={cover.totalSlides}
          template={cover.template}
          brandColors={cover.colors}
          fontClass={inter.className}
          editorialStyle={cover.editorialStyle}
          handle={cover.handle}
          brandLabel={cover.brandName}
          showDevBadges={false}
          format={cover.format}
        />
      </div>
    </div>
  )
}
