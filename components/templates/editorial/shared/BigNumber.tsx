'use client'

import { Text } from 'react-konva'
import { EDITORIAL_SIZES, EDITORIAL_FONTS, CANVAS_CONFIG } from '../editorial.config'

interface BigNumberProps {
  number: number
  textColor: string
}

export function BigNumber({ number, textColor }: BigNumberProps) {
  const numText = number.toString().padStart(2, '0')
  return (
    <Text
      text={numText}
      x={CANVAS_CONFIG.width - 80}
      y={CANVAS_CONFIG.height - 380}
      fontSize={EDITORIAL_SIZES.bigNumber.fontSize}
      fontFamily={EDITORIAL_FONTS.display.family}
      fontStyle="900"
      fill={textColor}
      opacity={EDITORIAL_SIZES.bigNumber.opacity}
      align="right"
      width={250}
      offsetX={250}
    />
  )
}
