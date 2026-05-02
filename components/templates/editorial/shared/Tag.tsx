'use client'

import { Text } from 'react-konva'
import { EDITORIAL_FONTS, EDITORIAL_SIZES } from '../editorial.config'

interface TagProps {
  text: string
  x: number
  y: number
  color: string
  opacity?: number
}

export function Tag({ text, x, y, color, opacity = 0.5 }: TagProps) {
  return (
    <Text
      text={text.toUpperCase()}
      x={x}
      y={y}
      fontSize={EDITORIAL_SIZES.tag.fontSize}
      fontFamily={EDITORIAL_FONTS.tag.family}
      fontStyle="500"
      fill={color}
      opacity={opacity}
      letterSpacing={EDITORIAL_SIZES.tag.fontSize * 0.15}
    />
  )
}
