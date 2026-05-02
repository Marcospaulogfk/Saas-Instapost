'use client'

import { Group, Text, Line } from 'react-konva'
import { EDITORIAL_SIZES, EDITORIAL_FONTS, CANVAS_CONFIG } from '../editorial.config'

interface EditorialFooterProps {
  pageNumber: number
  totalPages: number
  textColor: string
  lineColor: string
}

export function EditorialFooter({
  pageNumber,
  totalPages,
  textColor,
  lineColor,
}: EditorialFooterProps) {
  const y = CANVAS_CONFIG.height - EDITORIAL_SIZES.footer.paddingBottom
  const padX = EDITORIAL_SIZES.footer.paddingX
  const lineEndX = padX + (CANVAS_CONFIG.width - padX * 2) * 0.6

  return (
    <Group>
      <Line
        points={[padX, y, lineEndX, y]}
        stroke={lineColor}
        strokeWidth={1}
      />
      <Text
        text={`${pageNumber}/${totalPages}`}
        x={CANVAS_CONFIG.width - padX}
        y={y - 6}
        fontSize={EDITORIAL_SIZES.footer.fontSize}
        fontFamily={EDITORIAL_FONTS.tag.family}
        fill={textColor}
        opacity={0.7}
        align="right"
        width={100}
        offsetX={100}
      />
    </Group>
  )
}
