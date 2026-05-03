'use client'

import { Group, Text } from 'react-konva'
import { EDITORIAL_SIZES, EDITORIAL_FONTS, CANVAS_CONFIG } from '../editorial.config'

interface EditorialHeaderProps {
  brandName: string
  handle: string
  textColor: string
  /**
   * 'standard' (default): "Powered by [BRAND]" left + "@handle" center + "2026 //" right
   * 'capa': "[BRAND]" left + "2026 ®" right (handle aparece no badge central da capa)
   */
  mode?: 'standard' | 'capa'
}

const YEAR = new Date().getFullYear()

export function EditorialHeader({
  brandName,
  handle,
  textColor,
  mode = 'standard',
}: EditorialHeaderProps) {
  const y = EDITORIAL_SIZES.header.paddingTop
  const fontSize = EDITORIAL_SIZES.header.fontSize
  const padX = EDITORIAL_SIZES.header.paddingX

  const leftText =
    mode === 'capa' ? brandName.toUpperCase() : `Powered by ${brandName.toUpperCase()}`
  const rightText = mode === 'capa' ? `${YEAR} ®` : `${YEAR} //`
  const centerText = mode === 'standard' ? handle : null

  return (
    <Group>
      <Text
        text={leftText}
        x={padX}
        y={y}
        fontSize={fontSize}
        fontFamily={EDITORIAL_FONTS.tag.family}
        fontStyle="500"
        fill={textColor}
        opacity={0.85}
        letterSpacing={fontSize * 0.12}
      />

      {centerText && (
        <Text
          text={centerText}
          x={CANVAS_CONFIG.width / 2}
          y={y}
          fontSize={fontSize}
          fontFamily={EDITORIAL_FONTS.tag.family}
          fontStyle="500"
          fill={textColor}
          opacity={0.85}
          letterSpacing={fontSize * 0.1}
          align="center"
          width={300}
          offsetX={150}
        />
      )}

      <Text
        text={rightText}
        x={CANVAS_CONFIG.width - padX}
        y={y}
        fontSize={fontSize}
        fontFamily={EDITORIAL_FONTS.tag.family}
        fontStyle="500"
        fill={textColor}
        opacity={0.85}
        letterSpacing={fontSize * 0.1}
        align="right"
        width={300}
        offsetX={300}
      />
    </Group>
  )
}
