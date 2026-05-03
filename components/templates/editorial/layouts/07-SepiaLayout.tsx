'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'
import { defaultPositionForLayout, getTitleY } from '../utils/title-position'

interface SepiaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

/**
 * "Sepia" virou "Photo Background com overlay preto" — paleta SyncPost
 * (apenas preto e branco). O nome do arquivo/layoutType é mantido pra
 * compatibilidade com slides salvos antes.
 */
export function SepiaLayout({ slide, scale = 1 }: SepiaLayoutProps) {
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null)
  const photoUrl = slide.images?.[0]

  useEffect(() => {
    if (!photoUrl) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = photoUrl
    img.onload = () => setPhotoImage(img)
  }, [photoUrl])

  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const padX = EDITORIAL_SIZES.footer.paddingX

  const fontSize = EDITORIAL_SIZES.titleMedium.fontSize
  const lineHeight = EDITORIAL_SIZES.titleMedium.lineHeight
  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  const titleY = getTitleY(position, slide.title.length, fontSize, lineHeight)

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        {/* Background preto base */}
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fill={EDITORIAL_COLORS.bg.dark}
        />

        {/* Foto fullbleed em preto-e-branco (overlay preto translúcido) */}
        {photoImage && (
          <>
            <KonvaImage
              image={photoImage}
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
            />
            <Rect
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
              fill="rgba(0, 0, 0, 0.55)"
            />
          </>
        )}

        {/* Gradient pra contraste do texto, mais forte do lado da posição */}
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: CANVAS_CONFIG.height }}
          fillLinearGradientColorStops={
            position === 'top'
              ? [0, 'rgba(0,0,0,0.85)', 0.4, 'rgba(0,0,0,0.4)', 1, 'rgba(0,0,0,0.2)']
              : position === 'middle'
                ? [
                    0,
                    'rgba(0,0,0,0.4)',
                    0.5,
                    'rgba(0,0,0,0.7)',
                    1,
                    'rgba(0,0,0,0.4)',
                  ]
                : [0, 'rgba(0,0,0,0.1)', 0.5, 'rgba(0,0,0,0.4)', 1, 'rgba(0,0,0,0.9)']
          }
        />

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          mode="standard"
          textColor={EDITORIAL_COLORS.text.white}
        />

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={EDITORIAL_COLORS.text.white}
          x={padX}
          y={titleY}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />

        <EditorialFooter
          pageNumber={slide.pageNumber}
          totalPages={slide.totalPages}
          textColor="rgba(255,255,255,0.7)"
          lineColor="rgba(255,255,255,0.3)"
        />
      </Layer>
    </Stage>
  )
}
