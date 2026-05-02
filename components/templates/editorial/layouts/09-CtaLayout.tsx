'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Group, Text } from 'react-konva'
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
import { Tag } from '../shared/Tag'
import { Callout } from '../shared/Callout'

interface CtaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function CtaLayout({ slide, scale = 1 }: CtaLayoutProps) {
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

  const bgColor = EDITORIAL_COLORS.bg.cream
  const textColor = EDITORIAL_COLORS.text.dark
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const variant = slide.variant || 'text-only'
  const padX = EDITORIAL_SIZES.footer.paddingX

  // Texto do botão: callout se existir, senão fallback
  const buttonText = slide.callout || 'COMECE AGORA →'

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
          fontSize={EDITORIAL_SIZES.titleLarge.fontSize}
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />

        {/* Variant: product-mockup — 1 mockup do app */}
        {variant === 'product-mockup' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={padX}
            y={650}
            width={CANVAS_CONFIG.width - 200}
            height={350}
            cornerRadius={16}
          />
        )}

        {/* Variant: human-photo — foto inspiracional */}
        {variant === 'human-photo' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={padX}
            y={620}
            width={CANVAS_CONFIG.width - 200}
            height={400}
            cornerRadius={12}
          />
        )}

        {/* Variant: composition — 2 imagens compostas */}
        {variant === 'composition' && images.length >= 2 && (
          <>
            <KonvaImage
              image={images[0]}
              x={padX}
              y={650}
              width={(CANVAS_CONFIG.width - 220) / 2}
              height={350}
              cornerRadius={12}
            />
            <KonvaImage
              image={images[1]}
              x={padX + (CANVAS_CONFIG.width - 220) / 2 + 20}
              y={650}
              width={(CANVAS_CONFIG.width - 220) / 2}
              height={350}
              cornerRadius={12}
            />
          </>
        )}

        {/* Botão CTA — sempre presente */}
        <CtaButton
          text={buttonText}
          x={padX}
          y={CANVAS_CONFIG.height - 220}
          brandColor={brandColor}
        />

        {/* Subtitle/legenda abaixo do botão */}
        {slide.subtitle && (
          <Text
            text={slide.subtitle}
            x={padX}
            y={CANVAS_CONFIG.height - 130}
            fontSize={EDITORIAL_SIZES.bodySmall.fontSize}
            fontFamily={EDITORIAL_FONTS.body.family}
            fill={textColor}
            opacity={0.6}
          />
        )}

        {/* Callout extra abaixo (se houver) — não usar se já é o texto do botão */}
        {variant === 'text-only' && slide.body && (
          <Callout
            text={slide.body}
            x={padX}
            y={CANVAS_CONFIG.height - 130}
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

interface CtaButtonProps {
  text: string
  x: number
  y: number
  brandColor: string
}

function CtaButton({ text, x, y, brandColor }: CtaButtonProps) {
  const width = 400
  const height = 64
  return (
    <Group x={x} y={y}>
      <Rect width={width} height={height} fill={brandColor} cornerRadius={8} />
      <Text
        text={text}
        x={0}
        y={20}
        width={width}
        fontSize={20}
        fontFamily={EDITORIAL_FONTS.bodyBold.family}
        fontStyle="600"
        fill="white"
        align="center"
        letterSpacing={1}
      />
    </Group>
  )
}
