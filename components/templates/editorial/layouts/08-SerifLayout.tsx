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

interface SerifLayoutProps {
  slide: EditorialSlide
  scale?: number
}

export function SerifLayout({ slide, scale = 1 }: SerifLayoutProps) {
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
          fill={EDITORIAL_COLORS.bg.navy}
        />

        <EditorialHeader
          brandName={slide.brandInfo.name}
          handle={slide.brandInfo.handle}
          textColor={EDITORIAL_COLORS.text.white}
          poweredBy={true}
        />

        <Text
          text={slide.title.join(' ')}
          x={EDITORIAL_SIZES.footer.paddingX}
          y={150}
          fontSize={EDITORIAL_SIZES.titleSerif.fontSize}
          fontFamily={EDITORIAL_FONTS.serif.family}
          fontStyle="700"
          fill={EDITORIAL_COLORS.text.white}
          width={CANVAS_CONFIG.width - 200}
          lineHeight={EDITORIAL_SIZES.titleSerif.lineHeight}
          letterSpacing={-EDITORIAL_SIZES.titleSerif.fontSize * 0.01}
        />

        {slide.body && (
          <Text
            text={slide.body}
            x={EDITORIAL_SIZES.footer.paddingX}
            y={CANVAS_CONFIG.height - 380}
            fontSize={EDITORIAL_SIZES.bodyMedium.fontSize}
            fontFamily={EDITORIAL_FONTS.bodyBold.family}
            fontStyle="500"
            fill={EDITORIAL_COLORS.brand.pale}
            width={CANVAS_CONFIG.width - 200}
            lineHeight={EDITORIAL_SIZES.bodyMedium.lineHeight}
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
