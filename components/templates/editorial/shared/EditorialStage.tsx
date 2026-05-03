'use client'

import { Stage } from 'react-konva'
import type { ReactNode } from 'react'
import { useEditorialFontsReady } from '../utils/use-editorial-fonts'
import { CANVAS_CONFIG } from '../editorial.config'

interface EditorialStageProps {
  scale: number
  children: ReactNode
}

/**
 * Wrapper do Stage que só monta quando as fontes editoriais carregaram.
 * Evita o "flash" com Anton sendo renderizado em fallback (Bebas/sans-serif).
 */
export function EditorialStage({ scale, children }: EditorialStageProps) {
  const fontsReady = useEditorialFontsReady()

  if (!fontsReady) {
    // Placeholder do mesmo tamanho — evita layout shift.
    return (
      <div
        style={{
          width: CANVAS_CONFIG.width * scale,
          height: CANVAS_CONFIG.height * scale,
          background: '#0A0A0F',
        }}
      />
    )
  }

  return (
    <Stage
      width={CANVAS_CONFIG.width * scale}
      height={CANVAS_CONFIG.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      {children}
    </Stage>
  )
}
