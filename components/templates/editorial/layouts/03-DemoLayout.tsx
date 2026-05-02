'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'
import { Tag } from '../shared/Tag'
import { BodyText } from '../shared/BodyText'

interface DemoLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function DemoLayout({ slide, scale = 1 }: DemoLayoutProps) {
  const [images, setImages] = useState<HTMLImageElement[]>([])

  useEffect(() => {
    if (!slide.images?.length) return
    Promise.all(
      slide.images.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.src = url
          }),
      ),
    ).then(setImages)
  }, [slide.images])

  const isLight = slide.background === 'cream' || slide.background === 'white'
  const bgColor = isLight ? EDITORIAL_COLORS.bg.cream : EDITORIAL_COLORS.bg.dark
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const variant = slide.variant || 'single'
  const padX = EDITORIAL_SIZES.footer.paddingX

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        <Rect width={CANVAS_CONFIG.width} height={CANVAS_CONFIG.height} fill={bgColor} />

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          textColor={textColor}
        />

        {slide.tag && (
          <Tag text={slide.tag} x={padX} y={150} color={textColor} opacity={0.5} />
        )}

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={padX}
          y={200}
          fontSize={EDITORIAL_SIZES.titleLarge.fontSize}
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />

        {/* Variant: single */}
        {variant === 'single' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={padX}
            y={650}
            width={CANVAS_CONFIG.width - 200}
            height={400}
            cornerRadius={12}
          />
        )}

        {/* Variant: comparison */}
        {variant === 'comparison' && images.length >= 2 && (
          <>
            <KonvaImage
              image={images[0]}
              x={padX}
              y={650}
              width={(CANVAS_CONFIG.width - 220) / 2}
              height={400}
              cornerRadius={12}
            />
            <KonvaImage
              image={images[1]}
              x={padX + (CANVAS_CONFIG.width - 220) / 2 + 20}
              y={650}
              width={(CANVAS_CONFIG.width - 220) / 2}
              height={400}
              cornerRadius={12}
            />
          </>
        )}

        {/* Variant: process */}
        {variant === 'process' && images.length >= 3 && (
          <>
            {images.slice(0, 3).map((img, i) => (
              <KonvaImage
                key={i}
                image={img}
                x={padX + i * ((CANVAS_CONFIG.width - 240) / 3 + 20)}
                y={650}
                width={(CANVAS_CONFIG.width - 240) / 3}
                height={400}
                cornerRadius={12}
              />
            ))}
          </>
        )}

        {slide.body && (
          <BodyText
            text={slide.body}
            x={padX}
            y={CANVAS_CONFIG.height - 220}
            width={CANVAS_CONFIG.width - 200}
            color={textColor}
            size="medium"
          />
        )}

        <EditorialFooter
          pageNumber={slide.pageNumber}
          totalPages={slide.totalPages}
          textColor={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
          lineColor={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}
        />
      </Layer>
    </Stage>
  )
}
