import type { TitlePosition, EditorialSlide } from '../editorial.types'
import { CANVAS_CONFIG } from '../editorial.config'

/**
 * Default `titlePosition` por layoutType quando a IA não especifica.
 * Escolhas pensadas pra variedade visual entre slides do mesmo carrossel.
 */
export function defaultPositionForLayout(layoutType: EditorialSlide['layoutType']): TitlePosition {
  switch (layoutType) {
    case 'capa':
      return 'bottom'
    case 'serif':
    case 'texto-foto':
    case 'problema':
      return 'middle'
    case 'sepia':
      return 'bottom'
    case 'demo':
    case 'novidade':
    case 'prova':
    case 'cta':
      return 'top'
    default:
      return 'middle'
  }
}

/**
 * Y do início do título dentro do canvas (1080×1350).
 * Calculado considerando altura aproximada do título pra evitar choque com header/footer.
 *
 * @param position posição desejada
 * @param titleLines número de linhas do título (para centrar bem em "middle")
 * @param fontSize tamanho da fonte (px)
 * @param lineHeight multiplicador
 */
export function getTitleY(
  position: TitlePosition,
  titleLines: number,
  fontSize: number,
  lineHeight: number,
): number {
  const titleHeight = titleLines * fontSize * lineHeight
  const HEADER_BOTTOM = 110 // header termina ~y=80
  const FOOTER_TOP = CANVAS_CONFIG.height - 110 // 1240
  const SAFE_GAP = 40

  switch (position) {
    case 'top':
      return HEADER_BOTTOM + 30 // ~y=140
    case 'middle': {
      // centro vertical do canvas, descontando metade do título
      const center = (HEADER_BOTTOM + FOOTER_TOP) / 2
      return Math.max(HEADER_BOTTOM + SAFE_GAP, center - titleHeight / 2)
    }
    case 'bottom':
    default:
      return Math.max(HEADER_BOTTOM + SAFE_GAP, FOOTER_TOP - titleHeight - SAFE_GAP)
  }
}
