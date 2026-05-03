'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import {
  CANVAS_CONFIG,
  EDITORIAL_SIZES,
  EDITORIAL_FONTS,
  EDITORIAL_COLORS,
} from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'

interface CapaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function CapaLayout({ slide, scale = 1 }: CapaLayoutProps) {
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

  // Título sempre na parte de baixo, com folga maior pro footer (não encostar)
  // e margem maior nas laterais (paddingX 64 em vez de 48).
  const padX = 64
  const titleFontSize = EDITORIAL_SIZES.titleHero.fontSize
  const titleLineHeight = EDITORIAL_SIZES.titleHero.lineHeight
  const numLines = slide.title.length || 1
  const titleHeight = numLines * titleFontSize * titleLineHeight
  const FOOTER_TOP = CANVAS_CONFIG.height - 110
  const SUBTITLE_GAP = 80
  const titleY = FOOTER_TOP - titleHeight - SUBTITLE_GAP - 60

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        {/* Background photo */}
        {photoImage && (
          <KonvaImage
            image={photoImage}
            width={CANVAS_CONFIG.width}
            height={CANVAS_CONFIG.height}
          />
        )}
        {/* Fallback: preto sólido (sem gradient roxo, fora da paleta) */}
        {!photoImage && (
          <Rect
            width={CANVAS_CONFIG.width}
            height={CANVAS_CONFIG.height}
            fill={EDITORIAL_COLORS.bg.dark}
          />
        )}
        {/* Overlay gradient bottom-up pra contraste do título */}
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: CANVAS_CONFIG.height }}
          fillLinearGradientColorStops={[
            0,
            'rgba(0,0,0,0.25)',
            0.45,
            'rgba(0,0,0,0.35)',
            0.7,
            'rgba(0,0,0,0.7)',
            1,
            'rgba(0,0,0,0.92)',
          ]}
        />

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          textColor={EDITORIAL_COLORS.text.white}
        />

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={EDITORIAL_COLORS.text.white}
          x={padX}
          y={titleY}
          fontSize={titleFontSize}
          lineHeight={titleLineHeight}
        />

        {slide.subtitle && (
          <Text
            text={slide.subtitle}
            x={padX}
            y={FOOTER_TOP - 60}
            width={CANVAS_CONFIG.width - padX * 2}
            fontSize={EDITORIAL_SIZES.subtitle.fontSize}
            fontFamily={EDITORIAL_FONTS.body.family}
            fill="rgba(255,255,255,0.78)"
          />
        )}

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
