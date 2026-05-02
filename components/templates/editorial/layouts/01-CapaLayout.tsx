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
  const titleY = CANVAS_CONFIG.height - 380

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
        {/* Fallback */}
        {!photoImage && (
          <Rect
            width={CANVAS_CONFIG.width}
            height={CANVAS_CONFIG.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: CANVAS_CONFIG.width, y: CANVAS_CONFIG.height }}
            fillLinearGradientColorStops={[0, '#2a1a4a', 0.5, '#1a1a2e', 1, '#0a0a0f']}
          />
        )}
        {/* Overlay gradient */}
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: CANVAS_CONFIG.height }}
          fillLinearGradientColorStops={[
            0,
            'rgba(0,0,0,0.2)',
            0.5,
            'rgba(0,0,0,0.3)',
            1,
            'rgba(0,0,0,0.85)',
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
          x={EDITORIAL_SIZES.footer.paddingX}
          y={titleY}
          fontSize={EDITORIAL_SIZES.titleHero.fontSize}
          lineHeight={EDITORIAL_SIZES.titleHero.lineHeight}
        />

        {slide.subtitle && (
          <Text
            text={slide.subtitle}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={CANVAS_CONFIG.height - 130}
            fontSize={EDITORIAL_SIZES.subtitle.fontSize}
            fontFamily={EDITORIAL_FONTS.body.family}
            fill="rgba(255,255,255,0.7)"
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
