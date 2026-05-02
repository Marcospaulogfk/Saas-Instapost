'use client'

import { Group, Text } from 'react-konva'
import { EDITORIAL_SIZES, EDITORIAL_FONTS, CANVAS_CONFIG } from '../editorial.config'

interface EditorialHeaderProps {
  brandName: string
  handle: string
  showDate?: boolean
  textColor: string
  poweredBy?: boolean
}

export function EditorialHeader({
  brandName,
  handle,
  showDate,
  textColor,
  poweredBy,
}: EditorialHeaderProps) {
  const leftText = poweredBy ? `POWERED BY ${brandName}` : brandName
  const rightText = showDate ? '2026 //' : handle
  const middleText = showDate ? handle : null

  const y = EDITORIAL_SIZES.header.paddingTop
  const fontSize = EDITORIAL_SIZES.header.fontSize
  const padX = EDITORIAL_SIZES.header.paddingX

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
        opacity={0.9}
        letterSpacing={fontSize * 0.1}
      />
      {middleText && (
        <Text
          text={middleText}
          x={CANVAS_CONFIG.width / 2}
          y={y}
          fontSize={fontSize}
          fontFamily={EDITORIAL_FONTS.tag.family}
          fontStyle="500"
          fill={textColor}
          opacity={0.9}
          letterSpacing={fontSize * 0.1}
          align="center"
          width={200}
          offsetX={100}
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
        opacity={0.9}
        letterSpacing={fontSize * 0.1}
        align="right"
        width={300}
        offsetX={300}
      />
    </Group>
  )
}
