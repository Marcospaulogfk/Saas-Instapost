'use client'

import { Group, Rect, Text } from 'react-konva'
import { EDITORIAL_FONTS } from '../editorial.config'
import { measureTextWidth } from '../utils/measure-text'

interface HandleBadgeProps {
  handle: string
  /** Cor de destaque (ex: brandColor pra acento). */
  accentColor?: string
  textColor: string
  /** X esquerdo (mesmo padX do título — alinha com a coluna do título). */
  x: number
  /** Y vertical no canvas. */
  y: number
}

/**
 * Pill com @handle alinhado à esquerda. Sem círculo gigante — visual minimal
 * que combina com o título grande embaixo. Versão original era centralizada
 * com círculo grande (ficou desproporcional).
 */
export function HandleBadge({
  handle,
  accentColor = '#7C3AED',
  textColor,
  x,
  y,
}: HandleBadgeProps) {
  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`
  const fontSize = 22
  const fontFamily = EDITORIAL_FONTS.bodyBold.family
  const handleWidth = measureTextWidth(cleanHandle, fontSize, fontFamily, '600')

  // Bullet pequeno (8px) à esquerda do handle, em accentColor
  const bulletRadius = 4
  const bulletGap = 12
  const padY = 10
  const padXInner = 14
  const pillHeight = fontSize + padY * 2
  const pillWidth = bulletRadius * 2 + bulletGap + handleWidth + padXInner * 2

  return (
    <Group x={x} y={y}>
      {/* Pill background — semitransparente preto pra contrastar sobre foto */}
      <Rect
        x={0}
        y={0}
        width={pillWidth}
        height={pillHeight}
        fill="rgba(0,0,0,0.5)"
        cornerRadius={pillHeight / 2}
      />
      {/* Bullet colorido */}
      <Rect
        x={padXInner}
        y={pillHeight / 2 - bulletRadius}
        width={bulletRadius * 2}
        height={bulletRadius * 2}
        fill={accentColor}
        cornerRadius={bulletRadius}
      />
      {/* Handle */}
      <Text
        text={cleanHandle}
        x={padXInner + bulletRadius * 2 + bulletGap}
        y={padY + 2}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle="600"
        fill={textColor}
      />
    </Group>
  )
}
