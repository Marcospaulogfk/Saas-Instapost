'use client'

import { Group, Rect, Circle, Text } from 'react-konva'
import { EDITORIAL_FONTS, CANVAS_CONFIG } from '../editorial.config'

interface HandleBadgeProps {
  handle: string
  /** Letra dentro do badge circular (ex: "B" para BrandsDecoded). Default: primeira letra do handle. */
  badgeLetter?: string
  /** Cor do badge circular. Default: brandColor (#7C3AED). */
  badgeColor?: string
  textColor: string
  /** Y vertical no canvas. */
  y: number
  /** Bg do pill com handle. Default: rgba(0,0,0,0.45). */
  pillBg?: string
}

/**
 * Badge centralizado: círculo com letra + pill com @handle.
 * Usado na capa entre header e título (estilo @brandsdecoded__).
 */
export function HandleBadge({
  handle,
  badgeLetter,
  badgeColor = '#7C3AED',
  textColor,
  y,
  pillBg = 'rgba(0,0,0,0.45)',
}: HandleBadgeProps) {
  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`
  const letter = (badgeLetter || cleanHandle.replace(/^@/, '')[0] || 'B').toUpperCase()

  // Estimativa de largura do texto pra centralizar pill
  const fontSize = 26
  const handleWidth = cleanHandle.length * fontSize * 0.55
  const circleRadius = 18
  const gap = 12
  const pillPadX = 20
  const totalWidth = circleRadius * 2 + gap + handleWidth + pillPadX * 2
  const startX = (CANVAS_CONFIG.width - totalWidth) / 2

  const pillX = startX + circleRadius * 2 + gap
  const pillWidth = handleWidth + pillPadX * 2

  return (
    <Group y={y}>
      {/* Pill bg */}
      <Rect
        x={pillX}
        y={0}
        width={pillWidth}
        height={circleRadius * 2}
        fill={pillBg}
        cornerRadius={circleRadius}
      />
      {/* Texto handle */}
      <Text
        text={cleanHandle}
        x={pillX + pillPadX}
        y={circleRadius - fontSize / 2 - 1}
        fontSize={fontSize}
        fontFamily={EDITORIAL_FONTS.bodyBold.family}
        fontStyle="600"
        fill={textColor}
      />
      {/* Círculo do badge (sobreposto no pill) */}
      <Circle x={startX + circleRadius} y={circleRadius} radius={circleRadius} fill={badgeColor} />
      <Text
        text={letter}
        x={startX}
        y={circleRadius - 11}
        width={circleRadius * 2}
        fontSize={20}
        fontFamily={EDITORIAL_FONTS.bodyBold.family}
        fontStyle="700"
        fill="#FFFFFF"
        align="center"
      />
    </Group>
  )
}
