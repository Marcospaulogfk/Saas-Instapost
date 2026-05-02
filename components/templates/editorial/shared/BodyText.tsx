'use client'

import { Group, Text } from 'react-konva'
import { EDITORIAL_FONTS, EDITORIAL_SIZES } from '../editorial.config'
import { measureTextWidth } from '../utils/measure-text'

interface BodyTextProps {
  text: string
  boldLead?: string
  x: number
  y: number
  width: number
  color: string
  size?: 'small' | 'medium' | 'large'
}

export function BodyText({
  text,
  boldLead,
  x,
  y,
  width,
  color,
  size = 'medium',
}: BodyTextProps) {
  const fontSize =
    size === 'large'
      ? EDITORIAL_SIZES.bodyLarge.fontSize
      : size === 'medium'
        ? EDITORIAL_SIZES.bodyMedium.fontSize
        : EDITORIAL_SIZES.bodySmall.fontSize
  const lineHeight =
    size === 'large'
      ? EDITORIAL_SIZES.bodyLarge.lineHeight
      : size === 'medium'
        ? EDITORIAL_SIZES.bodyMedium.lineHeight
        : EDITORIAL_SIZES.bodySmall.lineHeight

  const leadWidth = boldLead
    ? measureTextWidth(`${boldLead} `, fontSize, EDITORIAL_FONTS.bodyBold.family, '600')
    : 0

  return (
    <Group x={x} y={y}>
      {boldLead && (
        <Text
          text={`${boldLead} `}
          x={0}
          y={0}
          fontSize={fontSize}
          fontFamily={EDITORIAL_FONTS.bodyBold.family}
          fontStyle="600"
          fill={color}
          width={width}
          lineHeight={lineHeight}
        />
      )}
      <Text
        text={text}
        x={leadWidth}
        y={0}
        fontSize={fontSize}
        fontFamily={EDITORIAL_FONTS.body.family}
        fontStyle="400"
        fill={color}
        opacity={0.7}
        width={boldLead ? width - leadWidth : width}
        lineHeight={lineHeight}
      />
    </Group>
  )
}
