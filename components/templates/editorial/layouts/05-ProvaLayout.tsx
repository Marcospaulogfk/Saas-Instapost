'use client'

import { useEffect, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Group, Text, Circle } from 'react-konva'
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

interface ProvaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function ProvaLayout({ slide, scale = 1 }: ProvaLayoutProps) {
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
  const variant = slide.variant || 'numeric'
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
          <Tag text={slide.tag} x={padX} y={150} color={textColor} opacity={0.6} />
        )}

        {/* Variant: numeric — número GIGANTE em roxo */}
        {variant === 'numeric' && (
          <>
            <HighlightedTitle
              lines={slide.title}
              highlightWords={slide.highlightWords}
              highlightColor={brandColor}
              defaultColor={textColor}
              x={padX}
              y={200}
              fontSize={EDITORIAL_SIZES.titleHero.fontSize}
              lineHeight={EDITORIAL_SIZES.titleHero.lineHeight}
            />
            {slide.body && (
              <Text
                text={slide.body}
                x={padX}
                y={CANVAS_CONFIG.height - 280}
                width={CANVAS_CONFIG.width - 200}
                fontSize={EDITORIAL_SIZES.bodyMedium.fontSize}
                fontFamily={EDITORIAL_FONTS.body.family}
                fill={textColor}
                opacity={0.7}
                lineHeight={EDITORIAL_SIZES.bodyMedium.lineHeight}
              />
            )}
          </>
        )}

        {/* Variantes com prints/imagens — título menor no topo */}
        {variant !== 'numeric' && (
          <HighlightedTitle
            lines={slide.title}
            highlightWords={slide.highlightWords}
            highlightColor={brandColor}
            defaultColor={textColor}
            x={padX}
            y={200}
            fontSize={EDITORIAL_SIZES.titleMedium.fontSize}
            lineHeight={EDITORIAL_SIZES.titleMedium.lineHeight}
          />
        )}

        {/* Variant: single-print — 1 card branco simulando Instagram */}
        {variant === 'single-print' && (
          <InstagramPrintCard
            x={padX + 80}
            y={650}
            width={CANVAS_CONFIG.width - padX * 2 - 160}
            image={images[0]}
            handle={slide.brandInfo.handle}
            text={slide.body}
          />
        )}

        {/* Variant: multiple-prints — 2-3 cards menores */}
        {variant === 'multiple-prints' && (
          <>
            {[0, 1, 2].slice(0, Math.max(2, Math.min(3, images.length))).map((i) => {
              const cardWidth =
                (CANVAS_CONFIG.width - padX * 2 - 40) /
                Math.max(2, Math.min(3, images.length || 2))
              return (
                <InstagramPrintCard
                  key={i}
                  x={padX + i * (cardWidth + 20)}
                  y={680}
                  width={cardWidth}
                  image={images[i]}
                  handle={slide.brandInfo.handle}
                />
              )
            })}
          </>
        )}

        {/* Variant: logo-cloud — grid 3x2 ou 4x3 de logos */}
        {variant === 'logo-cloud' && images.length > 0 && (
          <>
            {images.slice(0, 12).map((img, i) => {
              const cols = 4
              const w = (CANVAS_CONFIG.width - padX * 2 - 60) / cols
              const h = 110
              const col = i % cols
              const row = Math.floor(i / cols)
              return (
                <Group
                  key={i}
                  x={padX + col * (w + 20)}
                  y={680 + row * (h + 20)}
                >
                  <Rect
                    width={w}
                    height={h}
                    fill="white"
                    cornerRadius={8}
                    shadowColor="rgba(0,0,0,0.05)"
                    shadowBlur={8}
                    shadowOffsetY={2}
                  />
                  <KonvaImage image={img} x={20} y={20} width={w - 40} height={h - 40} />
                </Group>
              )
            })}
          </>
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

interface InstagramPrintCardProps {
  x: number
  y: number
  width: number
  image?: HTMLImageElement
  handle?: string
  text?: string
}

/** Card branco simulando UI do Instagram (avatar + handle + barras de loading). */
function InstagramPrintCard({ x, y, width, image, handle = '@user', text }: InstagramPrintCardProps) {
  const padding = 20
  const avatarRadius = 24
  const cardHeight = 380

  return (
    <Group x={x} y={y}>
      <Rect
        width={width}
        height={cardHeight}
        fill="white"
        cornerRadius={16}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={12}
        shadowOffsetY={4}
      />

      {/* Header: avatar + handle */}
      <Group x={padding} y={padding + avatarRadius}>
        <Circle x={avatarRadius} y={0} radius={avatarRadius} fill={EDITORIAL_COLORS.brand.light} />
        <Text
          text={handle}
          x={avatarRadius * 2 + 12}
          y={-10}
          fontSize={20}
          fontFamily={EDITORIAL_FONTS.bodyBold.family}
          fontStyle="600"
          fill={EDITORIAL_COLORS.text.dark}
        />
      </Group>

      {/* Imagem ou placeholder */}
      {image && (
        <KonvaImage
          image={image}
          x={padding}
          y={padding + avatarRadius * 2 + 30}
          width={width - padding * 2}
          height={180}
          cornerRadius={8}
        />
      )}

      {/* Texto/barras de "loading" */}
      <Group x={padding} y={padding + avatarRadius * 2 + 230}>
        {text ? (
          <Text
            text={text}
            x={0}
            y={0}
            width={width - padding * 2}
            fontSize={16}
            fontFamily={EDITORIAL_FONTS.body.family}
            fill={EDITORIAL_COLORS.text.dark}
            lineHeight={1.4}
          />
        ) : (
          <>
            <Rect width={width - padding * 2} height={10} fill="rgba(0,0,0,0.1)" cornerRadius={5} />
            <Rect
              y={20}
              width={(width - padding * 2) * 0.8}
              height={10}
              fill="rgba(0,0,0,0.1)"
              cornerRadius={5}
            />
            <Rect
              y={40}
              width={(width - padding * 2) * 0.5}
              height={10}
              fill="rgba(0,0,0,0.08)"
              cornerRadius={5}
            />
          </>
        )}
      </Group>
    </Group>
  )
}
