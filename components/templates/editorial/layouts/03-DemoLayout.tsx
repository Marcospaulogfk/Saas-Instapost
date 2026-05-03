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
import { defaultPositionForLayout } from '../utils/title-position'

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

  // Sem azul/sépia — só preto/cream/white
  const isLight = slide.background === 'cream' || slide.background === 'white'
  const bgColor =
    slide.background === 'white'
      ? EDITORIAL_COLORS.bg.white
      : slide.background === 'cream'
        ? EDITORIAL_COLORS.bg.cream
        : EDITORIAL_COLORS.bg.dark
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary
  const variant = slide.variant || 'single'
  const padX = EDITORIAL_SIZES.footer.paddingX

  // titlePosition: top -> título cima + imagens base; bottom -> imagens cima + título base
  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  const titleAtTop = position === 'top' || position === 'middle'

  const titleY = titleAtTop ? 200 : 880
  const tagY = titleAtTop ? 150 : 830
  const imagesY = titleAtTop ? 670 : 200

  const imageHeight = 380

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
          <Tag text={slide.tag} x={padX} y={tagY} color={textColor} opacity={0.5} />
        )}

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={padX}
          y={titleY}
          fontSize={EDITORIAL_SIZES.titleLarge.fontSize}
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />

        {variant === 'single' && images[0] && (
          <KonvaImage
            image={images[0]}
            x={padX}
            y={imagesY}
            width={CANVAS_CONFIG.width - padX * 2}
            height={imageHeight}
            cornerRadius={12}
          />
        )}

        {variant === 'comparison' && images.length >= 2 && (
          <>
            <KonvaImage
              image={images[0]}
              x={padX}
              y={imagesY}
              width={(CANVAS_CONFIG.width - padX * 2 - 20) / 2}
              height={imageHeight}
              cornerRadius={12}
            />
            <KonvaImage
              image={images[1]}
              x={padX + (CANVAS_CONFIG.width - padX * 2 - 20) / 2 + 20}
              y={imagesY}
              width={(CANVAS_CONFIG.width - padX * 2 - 20) / 2}
              height={imageHeight}
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
                x={padX + i * ((CANVAS_CONFIG.width - padX * 2 - 40) / 3 + 20)}
                y={imagesY}
                width={(CANVAS_CONFIG.width - padX * 2 - 40) / 3}
                height={imageHeight}
                cornerRadius={12}
              />
            ))}
          </>
        )}

        {slide.body && titleAtTop && (
          <BodyText
            text={slide.body}
            x={padX}
            y={CANVAS_CONFIG.height - 220}
            width={CANVAS_CONFIG.width - padX * 2}
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
