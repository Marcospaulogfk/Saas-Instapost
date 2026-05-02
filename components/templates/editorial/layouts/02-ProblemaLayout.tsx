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

interface ProblemaLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function ProblemaLayout({ slide, scale = 1 }: ProblemaLayoutProps) {
  const brandColor = slide.brandInfo.brandColor || EDITORIAL_COLORS.brand.primary

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        <Rect
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          fill={EDITORIAL_COLORS.bg.dark}
        />

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          textColor={EDITORIAL_COLORS.text.white}
        />

        {slide.showBigNumber && (
          <BigNumber number={slide.pageNumber} textColor={EDITORIAL_COLORS.text.white} />
        )}

        {slide.tag && (
          <Tag
            text={slide.tag}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={400}
            color={EDITORIAL_COLORS.text.white}
            opacity={0.5}
          />
        )}

        <HighlightedTitle
          lines={slide.title}
          highlightWords={slide.highlightWords}
          highlightColor={brandColor}
          defaultColor={EDITORIAL_COLORS.text.white}
          x={EDITORIAL_SIZES.footer.paddingX}
          y={450}
          fontSize={EDITORIAL_SIZES.titleLarge.fontSize}
          lineHeight={EDITORIAL_SIZES.titleLarge.lineHeight}
        />

        {slide.body && (
          <BodyText
            text={slide.body}
            boldLead={slide.bodyBoldLead}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={CANVAS_CONFIG.height - 320}
            width={CANVAS_CONFIG.width - 200}
            color={EDITORIAL_COLORS.text.white}
            size="medium"
          />
        )}

        <EditorialFooter
          pageNumber={slide.pageNumber}
          totalPages={slide.totalPages}
          textColor="rgba(255,255,255,0.7)"
          lineColor="rgba(255,255,255,0.3)"
        />
      </Layer>
    </Stage>
  )
}
