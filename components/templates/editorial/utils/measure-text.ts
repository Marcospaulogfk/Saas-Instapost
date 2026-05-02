/**
 * Mede largura de texto usando canvas DOM. SSR-safe (cai em estimativa).
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontStyle: string = '400',
): number {
  if (typeof window === 'undefined') return text.length * fontSize * 0.55
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return text.length * fontSize * 0.55
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
  return ctx.measureText(text).width
}
