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
import { defaultPositionForLayout } from '../utils/title-position'

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

  // Default cream, mas pode ser dark/white tb. Sem navy/sepia.
  const isLight = slide.background !== 'dark'
  const bgColor =
    slide.background === 'dark'
      ? EDITORIAL_COLORS.bg.dark
      : slide.background === 'white'
        ? EDITORIAL_COLORS.bg.white
        : EDITORIAL_COLORS.bg.cream
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const variant = slide.variant || 'text-only'
  const padX = EDITORIAL_SIZES.footer.paddingX

  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  const titleAtTop = position === 'top' || position === 'middle'

  const titleY = titleAtTop ? 200 : 920
  const tagY = titleAtTop ? 150 : 870
  const imagesY = titleAtTop ? 700 : 200
  const imagesAreaHeight = 380
  const mockupAspect = 4 / 5

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
          <Tag text={slide.tag} x={padX} y={tagY} color={textColor} opacity={0.6} />
        )}

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={padX}
          y={titleY}
          fontSize={
            variant === 'text-only'
              ? EDITORIAL_SIZES.titleLarge.fontSize
              : EDITORIAL_SIZES.titleMedium.fontSize
          }
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />

        {variant === 'single-large' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={padX}
            y={imagesY}
            width={CANVAS_CONFIG.width - padX * 2}
            height={imagesAreaHeight}
            cornerRadius={16}
          />
        )}

        {variant === 'pair' && images.length >= 2 && (
          <>
            {images.slice(0, 2).map((img, i) => {
              const w = (CANVAS_CONFIG.width - padX * 2 - 20) / 2
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

        {variant === 'grid-three' && images.length >= 3 && (
          <>
            {images.slice(0, 3).map((img, i) => {
              const w = (CANVAS_CONFIG.width - padX * 2 - 40) / 3
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

        {slide.callout && (
          <Callout
            text={slide.callout}
            x={padX}
            y={CANVAS_CONFIG.height - 180}
            width={CANVAS_CONFIG.width - padX * 2}
            bgColor={isLight ? EDITORIAL_COLORS.bg.dark : EDITORIAL_COLORS.bg.white}
            textColor={isLight ? EDITORIAL_COLORS.text.white : EDITORIAL_COLORS.text.dark}
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
