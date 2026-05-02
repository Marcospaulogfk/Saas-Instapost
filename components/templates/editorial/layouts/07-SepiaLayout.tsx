'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Group } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'

interface SepiaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

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

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        {/* Background sépia */}
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fill={EDITORIAL_COLORS.bg.sepia}
        />

        {/* Foto + tinta sépia por cima */}
        {photoImage && (
          <Group>
            <KonvaImage
              image={photoImage}
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
            />
            <Rect
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
              fill="rgba(58, 40, 24, 0.5)"
            />
          </Group>
        )}

        {/* Overlay escurecimento bottom */}
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: CANVAS_CONFIG.height }}
          fillLinearGradientColorStops={[
            0,
            'rgba(0,0,0,0.1)',
            0.5,
            'rgba(0,0,0,0.3)',
            1,
            'rgba(0,0,0,0.85)',
          ]}
        />

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          showDate={true}
          textColor={EDITORIAL_COLORS.text.white}
        />

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={EDITORIAL_COLORS.text.white}
          x={EDITORIAL_SIZES.footer.paddingX}
          y={CANVAS_CONFIG.height - 380}
          fontSize={EDITORIAL_SIZES.titleMedium.fontSize}
          lineHeight={EDITORIAL_SIZES.titleMedium.lineHeight}
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
