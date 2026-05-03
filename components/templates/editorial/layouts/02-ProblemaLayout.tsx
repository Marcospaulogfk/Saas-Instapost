'use client'

import { Stage, Layer, Rect } from 'react-konva'
import type { EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG, EDITORIAL_SIZES, EDITORIAL_COLORS } from '../editorial.config'
import { EditorialHeader } from '../shared/EditorialHeader'
import { EditorialFooter } from '../shared/EditorialFooter'
import { HighlightedTitle } from '../shared/HighlightedTitle'
import { Tag } from '../shared/Tag'
import { BigNumber } from '../shared/BigNumber'
import { BodyText } from '../shared/BodyText'
import { defaultPositionForLayout, getTitleY } from '../utils/title-position'

interface ProblemaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function ProblemaLayout({ slide, scale = 1 }: ProblemaLayoutProps) {
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary

  // Permite fundo claro (cream/white) ou escuro (dark) — sem azul/sépia.
  const isLight = slide.background === 'cream' || slide.background === 'white'
  const bgColor =
    slide.background === 'white'
      ? EDITORIAL_COLORS.bg.white
      : slide.background === 'cream'
        ? EDITORIAL_COLORS.bg.cream
        : EDITORIAL_COLORS.bg.dark
  const textColor = isLight ? EDITORIAL_COLORS.text.dark : EDITORIAL_COLORS.text.white
  const padX = EDITORIAL_SIZES.footer.paddingX

  const fontSize = EDITORIAL_SIZES.titleLarge.fontSize
  const lineHeight = EDITORIAL_SIZES.titleLarge.lineHeight
  const position = slide.titlePosition || defaultPositionForLayout(slide.layoutType)
  const titleY = getTitleY(position, slide.title.length, fontSize, lineHeight)

  // Tag vai sempre 60px acima do título (clampada se ficar por cima do header)
  const tagY = Math.max(140, titleY - 50)

  // Body posicionado depois do título com folga, ou no rodapé se título for top/middle.
  const titleHeight = slide.title.length * fontSize * lineHeight
  const bodyY =
    position === 'bottom'
      ? CANVAS_CONFIG.height - 220 // body antes do título quando bottom
      : Math.min(CANVAS_CONFIG.height - 220, titleY + titleHeight + 60)

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

        {slide.showBigNumber && (
          <BigNumber number={slide.pageNumber} textColor={textColor} />
        )}

        {slide.tag && (
          <Tag
            text={slide.tag}
            x={padX}
            y={tagY}
            color={textColor}
            opacity={isLight ? 0.6 : 0.5}
          />
        )}

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={textColor}
          x={padX}
          y={titleY}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />

        {slide.body && position !== 'bottom' && (
          <BodyText
            text={slide.body}
            boldLead={slide.bodyBoldLead}
            x={padX}
            y={bodyY}
            width={CANVAS_CONFIG.width - padX * 2}
            color={textColor}
            size="medium"
          />
        )}

        {slide.body && position === 'bottom' && (
          <BodyText
            text={slide.body}
            boldLead={slide.bodyBoldLead}
            x={padX}
            y={170}
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
