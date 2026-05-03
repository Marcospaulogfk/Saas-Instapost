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
import { defaultPositionForLayout, getTitleY } from '../utils/title-position'

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

  // Default cream, mas dark/white permitidos. Sem navy/sepia.
  const isLight = slide.background !== 'dark'
  const bgColor =
    slide.background === 'dark'
      ? EDITORIAL_COLORS.bg.dark
      : slide.background === 'white'
        ? EDITORIAL_COLORS.bg.white
        : EDITORIAL_COLORS.bg.cream
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const variant = slide.variant || 'numeric'
  const padX = EDITORIAL_SIZES.footer.paddingX

  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  // Pra numeric (sem imagem): respeita position completa (top/middle/bottom).
  // Pras outras (com imagem): top vs bottom inverte ordem visual.
  const numericTitleY = getTitleY(
    position,
    slide.title.length,
    EDITORIAL_SIZES.titleHero.fontSize,
    EDITORIAL_SIZES.titleHero.lineHeight,
  )

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

        {/* Variant: numeric — número GIGANTE, posição variável */}
        {variant === 'numeric' && (
          <>
            <HighlightedTitle
              lines={slide.title}
              highlightWords={slide.highlightWords}
              highlightColor={brandColor}
              defaultColor={textColor}
              x={padX}
              y={numericTitleY}
              fontSize={EDITORIAL_SIZES.titleHero.fontSize}
              lineHeight={EDITORIAL_SIZES.titleHero.lineHeight}
            />
            {slide.body && (
              <Text
                text={slide.body}
                x={padX}
                y={position === 'top' ? numericTitleY + 480 : CANVAS_CONFIG.height - 280}
                width={CANVAS_CONFIG.width - padX * 2}
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
          textColor={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
          lineColor={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}
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

/**
 * Card branco simulando PERFIL do Instagram (avatar circular + handle + bio + botões).
 * Inspirado nas refs @brandsdecoded__ slide "POR QUE FUNCIONA".
 */
function InstagramPrintCard({
  x,
  y,
  width,
  image,
  handle = '@user',
  text,
}: InstagramPrintCardProps) {
  const padding = 28
  const avatarRadius = 60
  const cardHeight = 380

  return (
    <Group x={x} y={y}>
      <Rect
        width={width}
        height={cardHeight}
        fill="white"
        cornerRadius={20}
        shadowColor="rgba(0,0,0,0.08)"
        shadowBlur={16}
        shadowOffsetY={4}
      />

      {/* Avatar circular grande (foto ou cor sólida) */}
      <Group x={padding} y={padding}>
        <Circle
          x={avatarRadius}
          y={avatarRadius}
          radius={avatarRadius}
          fill={EDITORIAL_COLORS.brand.primary}
        />
        {image && (
          <KonvaImage
            image={image}
            x={0}
            y={0}
            width={avatarRadius * 2}
            height={avatarRadius * 2}
            cornerRadius={avatarRadius}
          />
        )}
      </Group>

      {/* Handle + verificado + dados */}
      <Group x={padding + avatarRadius * 2 + 24} y={padding + 8}>
        <Text
          text={handle.replace(/^@/, '')}
          x={0}
          y={0}
          fontSize={22}
          fontFamily={EDITORIAL_FONTS.bodyBold.family}
          fontStyle="700"
          fill={EDITORIAL_COLORS.text.dark}
        />
        <Circle x={handle.length * 9 + 12} y={11} radius={8} fill="#3B82F6" />
        <Text
          text="✓"
          x={handle.length * 9 + 5}
          y={3}
          fontSize={12}
          fontFamily={EDITORIAL_FONTS.bodyBold.family}
          fill="#FFFFFF"
        />

        {/* Stats */}
        <Group y={36}>
          <Text
            text="1.327"
            x={0}
            y={0}
            fontSize={14}
            fontFamily={EDITORIAL_FONTS.bodyBold.family}
            fontStyle="600"
            fill={EDITORIAL_COLORS.text.dark}
          />
          <Text
            text="posts"
            x={42}
            y={0}
            fontSize={13}
            fontFamily={EDITORIAL_FONTS.body.family}
            fill="#6B7280"
          />
          <Text
            text="280 mil"
            x={92}
            y={0}
            fontSize={14}
            fontFamily={EDITORIAL_FONTS.bodyBold.family}
            fontStyle="600"
            fill={EDITORIAL_COLORS.text.dark}
          />
          <Text
            text="seguidores"
            x={156}
            y={0}
            fontSize={13}
            fontFamily={EDITORIAL_FONTS.body.family}
            fill="#6B7280"
          />
        </Group>
      </Group>

      {/* Bio */}
      <Text
        text={text || 'Decodificando o futuro do marketing com AI'}
        x={padding}
        y={padding + avatarRadius * 2 + 24}
        width={width - padding * 2}
        fontSize={15}
        fontFamily={EDITORIAL_FONTS.body.family}
        fill={EDITORIAL_COLORS.text.dark}
        lineHeight={1.4}
      />

      {/* Botões "Editar perfil" / "Ver Itens Arquivados" */}
      <Group x={padding} y={cardHeight - 70}>
        <Rect width={(width - padding * 2 - 12) / 2} height={42} fill="#F3F4F6" cornerRadius={8} />
        <Text
          text="Editar perfil"
          x={0}
          y={13}
          width={(width - padding * 2 - 12) / 2}
          fontSize={14}
          fontFamily={EDITORIAL_FONTS.bodyBold.family}
          fontStyle="600"
          fill={EDITORIAL_COLORS.text.dark}
          align="center"
        />
        <Rect
          x={(width - padding * 2 - 12) / 2 + 12}
          y={0}
          width={(width - padding * 2 - 12) / 2}
          height={42}
          fill="#F3F4F6"
          cornerRadius={8}
        />
        <Text
          text="Ver Itens Arquivados"
          x={(width - padding * 2 - 12) / 2 + 12}
          y={13}
          width={(width - padding * 2 - 12) / 2}
          fontSize={14}
          fontFamily={EDITORIAL_FONTS.bodyBold.family}
          fontStyle="600"
          fill={EDITORIAL_COLORS.text.dark}
          align="center"
        />
      </Group>
    </Group>
  )
}
