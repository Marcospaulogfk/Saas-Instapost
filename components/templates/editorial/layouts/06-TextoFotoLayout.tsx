'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedBody } from '../shared/HighlightedBody'
import { defaultPositionForLayout, getTitleY } from '../utils/title-position'

interface TextoFotoLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function TextoFotoLayout({ slide, scale = 1 }: TextoFotoLayoutProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const photoUrl = slide.images?.[0]

  useEffect(() => {
    if (!photoUrl) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = photoUrl
    img.onload = () => setImage(img)
  }, [photoUrl])

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

  // Body text como string única (não array como title)
  const bodyText = slide.body || slide.title.join(' ')

  // Y do texto principal baseado em titlePosition (apenas pra variant text-only)
  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  const textOnlyY = getTitleY(
    position,
    Math.ceil(bodyText.length / 38),
    EDITORIAL_SIZES.bodyLarge.fontSize,
    EDITORIAL_SIZES.bodyLarge.lineHeight,
  )

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        {/* Variant image-bg: imagem cobre tudo + overlay branco translúcido */}
        {variant === 'image-bg' && image ? (
          <>
            <KonvaImage
              image={image}
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
            />
            <Rect
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
              fill={isLight ? 'rgba(245, 242, 236, 0.85)' : 'rgba(10, 10, 15, 0.78)'}
            />
          </>
        ) : (
          <Rect width={CANVAS_CONFIG.width} height={CANVAS_CONFIG.height} fill={bgColor} />
        )}

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          textColor={textColor}
        />

        {/* Variant: text-only — texto grande dominando, posição variável */}
        {variant === 'text-only' && (
          <HighlightedBody
            text={bodyText}
            highlightWords={slide.highlightWords}
            highlightColor={brandColor}
            defaultColor={textColor}
            x={padX}
            y={textOnlyY}
            width={CANVAS_CONFIG.width - padX * 2}
            fontSize={EDITORIAL_SIZES.bodyLarge.fontSize}
            lineHeight={EDITORIAL_SIZES.bodyLarge.lineHeight}
            fontWeight="600"
          />
        )}

        {/* Variant: image-bottom — texto em cima, foto vertical embaixo (40%) */}
        {variant === 'image-bottom' && (
          <>
            <HighlightedBody
              text={bodyText}
              highlightWords={slide.highlightWords}
              highlightColor={brandColor}
              defaultColor={textColor}
              x={padX}
              y={250}
              width={CANVAS_CONFIG.width - 200}
              fontSize={EDITORIAL_SIZES.bodyLarge.fontSize}
              lineHeight={EDITORIAL_SIZES.bodyLarge.lineHeight}
              fontWeight="600"
            />
            {image && (
              <KonvaImage
                image={image}
                x={padX}
                y={CANVAS_CONFIG.height - 540}
                width={CANVAS_CONFIG.width - 200}
                height={420}
                cornerRadius={12}
              />
            )}
          </>
        )}

        {/* Variant: image-middle — texto em cima + foto horizontal no meio + texto embaixo */}
        {variant === 'image-middle' && (
          <>
            <HighlightedBody
              text={bodyText}
              highlightWords={slide.highlightWords}
              highlightColor={brandColor}
              defaultColor={textColor}
              x={padX}
              y={220}
              width={CANVAS_CONFIG.width - 200}
              fontSize={EDITORIAL_SIZES.bodyLarge.fontSize}
              lineHeight={EDITORIAL_SIZES.bodyLarge.lineHeight}
              fontWeight="600"
            />
            {image && (
              <KonvaImage
                image={image}
                x={padX}
                y={620}
                width={CANVAS_CONFIG.width - 200}
                height={300}
                cornerRadius={12}
              />
            )}
            {slide.callout && (
              <HighlightedBody
                text={slide.callout}
                highlightWords={slide.highlightWords}
                highlightColor={brandColor}
                defaultColor={textColor}
                x={padX}
                y={960}
                width={CANVAS_CONFIG.width - 200}
                fontSize={EDITORIAL_SIZES.bodyMedium.fontSize}
                lineHeight={EDITORIAL_SIZES.bodyMedium.lineHeight}
                fontWeight="500"
              />
            )}
          </>
        )}

        {/* Variant: image-bg — texto centralizado sobre imagem com overlay */}
        {variant === 'image-bg' && (
          <HighlightedBody
            text={bodyText}
            highlightWords={slide.highlightWords}
            highlightColor={brandColor}
            defaultColor={textColor}
            x={padX}
            y={400}
            width={CANVAS_CONFIG.width - 200}
            fontSize={EDITORIAL_SIZES.bodyLarge.fontSize}
            lineHeight={EDITORIAL_SIZES.bodyLarge.lineHeight}
            fontWeight="600"
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
