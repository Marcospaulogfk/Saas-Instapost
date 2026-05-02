'use client'

import { Group, Text } from 'react-konva'
import { EDITORIAL_FONTS } from '../editorial.config'
import { measureTextWidth } from '../utils/measure-text'

interface HighlightedTitleProps {
  lines: string[]
  highlightWords: string[]
  highlightColor: string
  defaultColor: string
  x: number
  y: number
  fontSize: number
  lineHeight: number
  fontFamily?: string
  fontStyle?: string
  letterSpacing?: number
}

export function HighlightedTitle({
  lines,
  highlightWords,
  highlightColor,
  defaultColor,
  x,
  y,
  fontSize,
  lineHeight,
  fontFamily = EDITORIAL_FONTS.display.family,
  fontStyle = '700',
  letterSpacing,
}: HighlightedTitleProps) {
  const lineHeightPx = fontSize * lineHeight
  const ls = letterSpacing ?? -fontSize * 0.02

  return (
    <Group x={x} y={y}>
      {lines.map((line, lineIdx) => {
        const words = line.split(' ')
        let currentX = 0
        const lineY = lineIdx * lineHeightPx

        return (
          <Group key={lineIdx} y={lineY}>
            {words.map((word, wordIdx) => {
              const isHighlighted = highlightWords.some(
                (hw) =>
                  word.toLowerCase().includes(hw.toLowerCase()) ||
                  hw.toLowerCase().includes(word.toLowerCase()),
              )
              const wordWithSpace = wordIdx < words.length - 1 ? `${word} ` : word
              const wordWidth = measureTextWidth(wordWithSpace, fontSize, fontFamily, fontStyle)

              const element = (
                <Text
                  key={wordIdx}
                  text={wordWithSpace}
                  x={currentX}
                  y={0}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  fontStyle={fontStyle}
                  fill={isHighlighted ? highlightColor : defaultColor}
                  letterSpacing={ls}
                />
              )
              currentX += wordWidth
              return element
            })}
          </Group>
        )
      })}
    </Group>
  )
}
