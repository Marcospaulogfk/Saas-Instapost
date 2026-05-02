'use client'

import { Group, Text } from 'react-konva'
import { EDITORIAL_FONTS } from '../editorial.config'
import { measureTextWidth } from '../utils/measure-text'

interface HighlightedBodyProps {
  text: string
  highlightWords: string[]
  highlightColor: string
  defaultColor: string
  x: number
  y: number
  width: number
  fontSize?: number
  lineHeight?: number
  fontWeight?: '400' | '500' | '600' | '700'
}

/**
 * Body text com highlight de palavras-chave.
 * Diferente do HighlightedTitle: usa fonte body (Space Grotesk)
 * e faz word-wrap automático baseado em width disponível.
 */
export function HighlightedBody({
  text,
  highlightWords,
  highlightColor,
  defaultColor,
  x,
  y,
  width,
  fontSize = 38,
  lineHeight = 1.4,
  fontWeight = '500',
}: HighlightedBodyProps) {
  const fontFamily =
    fontWeight === '600' || fontWeight === '700'
      ? EDITORIAL_FONTS.bodyBold.family
      : EDITORIAL_FONTS.body.family
  const lineHeightPx = fontSize * lineHeight

  // Quebra o texto em linhas baseado em width
  const words = text.split(/\s+/)
  const spaceWidth = measureTextWidth(' ', fontSize, fontFamily, fontWeight)
  const lines: string[][] = []
  let currentLine: string[] = []
  let currentWidth = 0

  for (const word of words) {
    const wordWidth = measureTextWidth(word, fontSize, fontFamily, fontWeight)
    const tentative = currentLine.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth
    if (tentative > width && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = [word]
      currentWidth = wordWidth
    } else {
      currentLine.push(word)
      currentWidth = tentative
    }
  }
  if (currentLine.length > 0) lines.push(currentLine)

  return (
    <Group x={x} y={y}>
      {lines.map((lineWords, lineIdx) => {
        let cx = 0
        return (
          <Group key={lineIdx} y={lineIdx * lineHeightPx}>
            {lineWords.map((word, wordIdx) => {
              const isLast = wordIdx === lineWords.length - 1
              const wordWithSpace = isLast ? word : `${word} `
              const ww = measureTextWidth(wordWithSpace, fontSize, fontFamily, fontWeight)
              const isHighlighted = highlightWords.some((hw) => {
                const w = word.toLowerCase().replace(/[.,!?;:]/g, '')
                const h = hw.toLowerCase().replace(/[.,!?;:]/g, '')
                return w === h || w.includes(h) || h.includes(w)
              })
              const node = (
                <Text
                  key={wordIdx}
                  text={wordWithSpace}
                  x={cx}
                  y={0}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  fontStyle={fontWeight}
                  fill={isHighlighted ? highlightColor : defaultColor}
                />
              )
              cx += ww
              return node
            })}
          </Group>
        )
      })}
    </Group>
  )
}
