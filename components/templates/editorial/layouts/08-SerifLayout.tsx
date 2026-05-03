'use client'

import { Stage, Layer, Rect, Text } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import {
  CANVAS_CONFIG,
  EDITORIAL_SIZES,
  EDITORIAL_FONTS,
  EDITORIAL_COLORS,
} from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { defaultPositionForLayout, getTitleY } from '../utils/title-position'

interface SerifLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function SerifLayout({ slide, scale = 1 }: SerifLayoutProps) {
  // Bg dark (default) ou cream/white. Sem navy.
  const isLight = slide.background === 'cream' || slide.background === 'white'
  const bgColor =
    slide.background === 'white'
      ? EDITORIAL_COLORS.bg.white
      : slide.background === 'cream'
        ? EDITORIAL_COLORS.bg.cream
        : EDITORIAL_COLORS.bg.dark
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const accentColor = isLight ? EDITORIAL_COLORS.brand.primary : EDITORIAL_COLORS.brand.pale
  const padX = EDITORIAL_SIZES.footer.paddingX

  // Texto serif unificado pra cálculo da altura aproximada
  const fontSize = EDITORIAL_SIZES.titleSerif.fontSize
  const lineHeight = EDITORIAL_SIZES.titleSerif.lineHeight
  const linesCount = Math.max(slide.title.length, 3)
  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  const titleY = getTitleY(position, linesCount, fontSize, lineHeight)

  // Body abaixo do título com folga, ou no rodapé se título for top
  const titleHeight = linesCount * fontSize * lineHeight
  const bodyY =
    position === 'bottom'
      ? 200
      : Math.min(CANVAS_CONFIG.height - 280, titleY + titleHeight + 80)

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
          poweredBy={true}
        />

        <Text
          text={slide.title.join(' ')}
          x={padX}
          y={titleY}
          fontSize={fontSize}
          fontFamily={EDITORIAL_FONTS.serif.family}
          fontStyle="700"
          fill={textColor}
          width={CANVAS_CONFIG.width - padX * 2}
          lineHeight={lineHeight}
          letterSpacing={-fontSize * 0.01}
        />

        {slide.body && (
          <Text
            text={slide.body}
            x={padX}
            y={bodyY}
            fontSize={EDITORIAL_SIZES.bodyMedium.fontSize}
            fontFamily={EDITORIAL_FONTS.bodyBold.family}
            fontStyle="500"
            fill={accentColor}
            width={CANVAS_CONFIG.width - padX * 2}
            lineHeight={EDITORIAL_SIZES.bodyMedium.lineHeight}
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
