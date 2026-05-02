'use client'

import { Group, Rect, Text } from 'react-konva'
import { EDITORIAL_FONTS } from '../editorial.config'

interface CalloutProps {
  text: string
  x: number
  y: number
  width: number
  bgColor?: string
  textColor?: string
}

export function Callout({
  text,
  x,
  y,
  width,
  bgColor = '#0A0A0F',
  textColor = '#FFFFFF',
}: CalloutProps) {
  return (
    <Group x={x} y={y}>
      <Rect width={width} height={56} fill={bgColor} cornerRadius={6} />
      <Text
        text={text}
        x={20}
        y={18}
        fontSize={20}
        fontFamily={EDITORIAL_FONTS.bodyBold.family}
        fontStyle="600"
        fill={textColor}
      />
    </Group>
  )
}
