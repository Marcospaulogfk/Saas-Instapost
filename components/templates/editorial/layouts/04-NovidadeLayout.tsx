'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Group } from 'react-konva'
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

  const isLight = slide.background !== 'dark'
  const bgColor =
    slide.background === 'dark'
      ? EDITORIAL_COLORS.bg.dark
      : slide.background === 'white'
        ? EDITORIAL_COLORS.bg.white
        : EDITORIAL_COLORS.bg.cream
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const padX = EDITORIAL_SIZES.footer.paddingX

  const rawVariant = slide.variant || 'auto'
  const variant: string =
    rawVariant === 'auto'
      ? images.length === 0
        ? 'text-only'
        : images.length === 1
          ? 'single-large'
          : images.length === 2
            ? 'pair'
            : 'grid-three'
      : rawVariant

  const titleFontSize =
    variant === 'text-only'
      ? EDITORIAL_SIZES.titleLarge.fontSize
      : EDITORIAL_SIZES.titleMedium.fontSize
  const titleLineHeight = EDITORIAL_SIZES.titleLarge.lineHeight
  const tagY = 150
  const titleY = 200
  const titleHeight = slide.title.length * titleFontSize * titleLineHeight

  // Card container externo (bg branco arredondado) — visual da ref
  const cardOuterY = titleY + titleHeight + 50
  const cardOuterHeight = 460
  const cardOuterPadX = padX
  const cardOuterWidth = CANVAS_CONFIG.width - cardOuterPadX * 2
  const innerPad = 24

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
          fontSize={titleFontSize}
          lineHeight={titleLineHeight}
        />

        {/* Container card branco com mockups — visual ref @brandsdecoded__ */}
        {variant !== 'text-only' && images.length > 0 && (
          <Group>
            <Rect
              x={cardOuterPadX}
              y={cardOuterY}
              width={cardOuterWidth}
              height={cardOuterHeight}
              fill={isLight ? '#FFFFFF' : '#161616'}
              cornerRadius={20}
              shadowColor="rgba(0,0,0,0.08)"
              shadowBlur={16}
              shadowOffsetY={4}
            />

            {variant === 'single-large' && images[0] && (
              <KonvaImage
                image={images[0]}
                x={cardOuterPadX + innerPad}
                y={cardOuterY + innerPad}
                width={cardOuterWidth - innerPad * 2}
                height={cardOuterHeight - innerPad * 2}
                cornerRadius={14}
              />
            )}

            {variant === 'pair' && images.length >= 2 && (
              <>
                {images.slice(0, 2).map((img, i) => {
                  const w = (cardOuterWidth - innerPad * 3) / 2
                  const h = Math.min(w / mockupAspect, cardOuterHeight - innerPad * 2)
                  return (
                    <KonvaImage
                      key={i}
                      image={img}
                      x={cardOuterPadX + innerPad + i * (w + innerPad)}
                      y={cardOuterY + innerPad}
                      width={w}
                      height={h}
                      cornerRadius={12}
                    />
                  )
                })}
              </>
            )}

            {variant === 'grid-three' && images.length >= 3 && (
              <>
                {images.slice(0, 3).map((img, i) => {
                  const w = (cardOuterWidth - innerPad * 4) / 3
                  const h = Math.min(w / mockupAspect, cardOuterHeight - innerPad * 2)
                  return (
                    <KonvaImage
                      key={i}
                      image={img}
                      x={cardOuterPadX + innerPad + i * (w + innerPad)}
                      y={cardOuterY + innerPad}
                      width={w}
                      height={h}
                      cornerRadius={10}
                    />
                  )
                })}
              </>
            )}
          </Group>
        )}

        {/* Callout preto retangular — estilo ref */}
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
