'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'
import { Tag } from '../shared/Tag'
import { Callout } from '../shared/Callout'

interface NovidadeLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function NovidadeLayout({ slide, scale = 1 }: NovidadeLayoutProps) {
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

  const bgColor =
    slide.background === 'white' ? EDITORIAL_COLORS.bg.white : EDITORIAL_COLORS.bg.cream
  const textColor = EDITORIAL_COLORS.text.dark
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const variant = slide.variant || 'text-only'
  const padX = EDITORIAL_SIZES.footer.paddingX

  // Aspect ratio dos mockups: 4:5
  const mockupAspect = 4 / 5

  // Posicionamento das imagens muda conforme variant
  const imagesY = 700
  const imagesAreaHeight = 380

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
          <Tag text={slide.tag} x={padX} y={150} color={textColor} opacity={0.6} />
        )}

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={padX}
          y={200}
          fontSize={
            variant === 'text-only'
              ? EDITORIAL_SIZES.titleLarge.fontSize
              : EDITORIAL_SIZES.titleMedium.fontSize
          }
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />

        {/* Variant: single-large — 1 mockup centralizado, ocupa quase toda largura */}
        {variant === 'single-large' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={padX}
            y={imagesY}
            width={CANVAS_CONFIG.width - 200}
            height={imagesAreaHeight}
            cornerRadius={16}
          />
        )}

        {/* Variant: pair — 2 mockups lado a lado, proporção 4:5 */}
        {variant === 'pair' && images.length >= 2 && (
          <>
            {images.slice(0, 2).map((img, i) => {
              const w = (CANVAS_CONFIG.width - 220) / 2
              const h = w / mockupAspect
              const cappedH = Math.min(h, imagesAreaHeight)
              return (
                <KonvaImage
                  key={i}
                  image={img}
                  x={padX + i * (w + 20)}
                  y={imagesY}
                  width={w}
                  height={cappedH}
                  cornerRadius={16}
                />
              )
            })}
          </>
        )}

        {/* Variant: grid-three — 3 mockups */}
        {variant === 'grid-three' && images.length >= 3 && (
          <>
            {images.slice(0, 3).map((img, i) => {
              const w = (CANVAS_CONFIG.width - 240) / 3
              const h = w / mockupAspect
              const cappedH = Math.min(h, imagesAreaHeight)
              return (
                <KonvaImage
                  key={i}
                  image={img}
                  x={padX + i * (w + 20)}
                  y={imagesY}
                  width={w}
                  height={cappedH}
                  cornerRadius={12}
                />
              )
            })}
          </>
        )}

        {/* Callout opcional no rodapé */}
        {slide.callout && (
          <Callout
            text={slide.callout}
            x={padX}
            y={CANVAS_CONFIG.height - 180}
            width={CANVAS_CONFIG.width - 200}
            bgColor={EDITORIAL_COLORS.bg.dark}
            textColor={EDITORIAL_COLORS.text.white}
          />
        )}

        <EditorialFooter
          pageNumber={slide.pageNumber}
          totalPages={slide.totalPages}
          textColor="rgba(0,0,0,0.5)"
          lineColor="rgba(0,0,0,0.2)"
        />
      </Layer>
    </Stage>
  )
}
