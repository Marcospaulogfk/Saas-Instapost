'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Group } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'
import { HighlightedBody } from '../shared/HighlightedBody'

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
  const bgColor =
    slide.background === 'white'
      ? EDITORIAL_COLORS.bg.white
      : slide.background === 'dark'
        ? EDITORIAL_COLORS.bg.dark
        : EDITORIAL_COLORS.bg.cream
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const padX = EDITORIAL_SIZES.footer.paddingX

  const rawVariant = slide.variant || 'auto'
  const variant: string =
    rawVariant === 'auto'
      ? images.length >= 3
        ? 'process'
        : images.length === 2
          ? 'comparison'
          : 'single'
      : rawVariant

  // Layout vertical: título grande topo, mockup card branco no centro, body grande embaixo.
  // Inspirado nas refs @brandsdecoded__ (slide "PASSO A PASSO").
  const titleY = 130
  const titleFontSize = EDITORIAL_SIZES.titleMedium.fontSize
  const titleLineHeight = EDITORIAL_SIZES.titleMedium.lineHeight
  const titleHeight = slide.title.length * titleFontSize * titleLineHeight
  const cardY = titleY + titleHeight + 60
  const cardHeight = 540
  const cardPadX = padX + 8
  const cardWidth = CANVAS_CONFIG.width - cardPadX * 2

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

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={padX}
          y={titleY}
          fontSize={titleFontSize}
          lineHeight={titleLineHeight}
        />

        {/* Card branco com mockup(s) — sombra leve */}
        <Group>
          <Rect
            x={cardPadX}
            y={cardY}
            width={cardWidth}
            height={cardHeight}
            fill={isLight ? '#FFFFFF' : '#161616'}
            cornerRadius={20}
            shadowColor="rgba(0,0,0,0.08)"
            shadowBlur={20}
            shadowOffsetY={4}
          />

          {variant === 'single' && images[0] && (
            <KonvaImage
              image={images[0]}
              x={cardPadX + 24}
              y={cardY + 24}
              width={cardWidth - 48}
              height={cardHeight - 48}
              cornerRadius={12}
            />
          )}

          {variant === 'comparison' && images.length >= 2 && (
            <>
              <KonvaImage
                image={images[0]}
                x={cardPadX + 24}
                y={cardY + 24}
                width={(cardWidth - 72) / 2}
                height={cardHeight - 48}
                cornerRadius={12}
              />
              <KonvaImage
                image={images[1]}
                x={cardPadX + 24 + (cardWidth - 72) / 2 + 24}
                y={cardY + 24}
                width={(cardWidth - 72) / 2}
                height={cardHeight - 48}
                cornerRadius={12}
              />
            </>
          )}

          {variant === 'process' && images.length >= 3 && (
            <>
              {images.slice(0, 3).map((img, i) => (
                <KonvaImage
                  key={i}
                  image={img}
                  x={cardPadX + 24 + i * ((cardWidth - 96) / 3 + 24)}
                  y={cardY + 24}
                  width={(cardWidth - 96) / 3}
                  height={cardHeight - 48}
                  cornerRadius={10}
                />
              ))}
            </>
          )}
        </Group>

        {/* Body grande (38px) embaixo do card — bold preto para destaques */}
        {slide.body && (
          <HighlightedBody
            text={slide.body}
            highlightWords={slide.highlightWords}
            highlightColor={textColor}
            defaultColor={textColor}
            x={padX}
            y={cardY + cardHeight + 50}
            width={CANVAS_CONFIG.width - padX * 2}
            fontSize={EDITORIAL_SIZES.bodyLarge.fontSize}
            lineHeight={EDITORIAL_SIZES.bodyLarge.lineHeight}
            fontWeight="500"
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
