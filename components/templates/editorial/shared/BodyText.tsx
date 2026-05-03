'use client'

import { Group, Text } from 'react-konva'
import { EDITORIAL_FONTS, EDITORIAL_SIZES } from '../editorial.config'
import { measureTextWidth } from '../utils/measure-text'

interface BodyTextProps {
  /** Body text. Pode conter `\n\n` pra separar parágrafos e `**texto**` pra bold inline no início. */
  text: string
  /** Bold lead aplicado APENAS no primeiro parágrafo (ex: "A boa notícia:"). */
  boldLead?: string
  x: number
  y: number
  width: number
  color: string
  size?: 'small' | 'medium' | 'large'
}

/**
 * Renderiza body em parágrafos. Cada parágrafo começa do x=0 (do Group),
 * sem offset herdado do bold lead anterior. Suporta:
 * - `\n\n` → quebra de parágrafo
 * - `**texto bold**` no início de cada parágrafo (renderiza inline)
 * - boldLead prop → aplicado apenas no PRIMEIRO parágrafo
 */
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

  // Divide em parágrafos. Aceita `\n\n` ou `\n` simples.
  const rawParagraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  // Pega bold inline `**texto**` no início de cada parágrafo
  const paragraphs = rawParagraphs.map((para, idx) => {
    // Se for o primeiro e tem boldLead prop, usa o prop
    if (idx === 0 && boldLead) {
      return { lead: boldLead.trim(), rest: para.trim() }
    }
    const m = para.match(/^\*\*(.+?)\*\*\s*(.*)$/s)
    if (m) {
      return { lead: m[1].trim(), rest: m[2].trim() }
    }
    return { lead: undefined, rest: para }
  })

  // Estima altura aproximada de cada parágrafo (pra empilhar)
  // Usa quebra automática do Konva pelo width (Konva calcula sozinho)
  const lineHeightPx = fontSize * lineHeight
  const paragraphGap = lineHeightPx * 0.5 // gap entre parágrafos

  let runningY = 0
  const elements: React.ReactNode[] = []

  paragraphs.forEach((p, idx) => {
    const leadFamily = EDITORIAL_FONTS.bodyBold.family
    const bodyFamily = EDITORIAL_FONTS.body.family
    const leadWidth = p.lead
      ? measureTextWidth(`${p.lead} `, fontSize, leadFamily, '600')
      : 0

    if (p.lead) {
      elements.push(
        <Text
          key={`lead-${idx}`}
          text={`${p.lead} `}
          x={0}
          y={runningY}
          fontSize={fontSize}
          fontFamily={leadFamily}
          fontStyle="600"
          fill={color}
          lineHeight={lineHeight}
        />,
      )
    }

    elements.push(
      <Text
        key={`body-${idx}`}
        text={p.rest}
        x={p.lead ? leadWidth : 0}
        y={runningY}
        fontSize={fontSize}
        fontFamily={bodyFamily}
        fontStyle="400"
        fill={color}
        opacity={0.7}
        width={p.lead ? width - leadWidth : width}
        lineHeight={lineHeight}
      />,
    )

    // Estima altura do parágrafo: número de linhas baseado em char count
    const charsPerLine = Math.floor(width / (fontSize * 0.5))
    const totalChars = (p.lead ? p.lead.length + 1 : 0) + p.rest.length
    const estLines = Math.max(1, Math.ceil(totalChars / charsPerLine))
    runningY += estLines * lineHeightPx + paragraphGap
  })

  return (
    <Group x={x} y={y}>
      {elements}
    </Group>
  )
}
