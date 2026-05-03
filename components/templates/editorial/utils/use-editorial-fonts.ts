'use client'

import { useEffect, useState } from 'react'
import { EDITORIAL_FONT_LOAD_SPECS } from '../editorial.config'

/**
 * Aguarda as fontes editoriais carregarem ANTES do Konva renderizar.
 * Konva mede texto com canvas 2D ctx.font — se a fonte não está pronta,
 * cai no fallback e o resultado fica com tipografia errada.
 */
export function useEditorialFontsReady(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const fontApi = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fontApi) {
      // Browser sem FontFaceSet (raro). Considera pronto.
      setReady(true)
      return
    }

    let cancelled = false

    Promise.all(EDITORIAL_FONT_LOAD_SPECS.map((spec) => fontApi.load(spec)))
      .then(() => fontApi.ready)
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        // Se falhou, segue com fallback (melhor algo que nada).
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
