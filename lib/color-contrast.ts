/**
 * REGRA GLOBAL DE CONTRASTE — a cor de destaque (highlight/accent) NUNCA pode
 * ficar ilegível sobre o fundo onde é renderizada. Marcas com paleta
 * monocromática (ex: #000000/#FFFFFF/#4A4A4A) quebravam os templates: o preto
 * era escolhido como accent e sumia em fundos escuros/fotos.
 *
 * Uso: `readableAccent(brandColors, background)` devolve a primeira cor da
 * marca com contraste WCAG >= 3:1 (texto grande/bold) contra o fundo —
 * preferindo uma que se diferencie da cor do texto-base — com fallback
 * branco/preto conforme a luminância do fundo.
 */

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim()
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

/** Luminância relativa WCAG (com correção gamma). 0 = preto, 1 = branco. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0.5
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG entre duas cores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.5
}

/** Contraste mínimo pra texto grande/bold (WCAG AA large text). */
const MIN_ACCENT_CONTRAST = 3

/**
 * Escolhe uma cor de destaque LEGÍVEL sobre `background`.
 * 1. Prefere a primeira candidata com contraste >= 3:1 que se diferencie da
 *    cor do texto-base (quando informada) — destaque igual ao texto não destaca.
 * 2. Senão, a primeira candidata com contraste >= 3:1.
 * 3. Senão, branco (fundo escuro) ou quase-preto (fundo claro).
 */
export function readableAccent(
  candidates: string[],
  background: string,
  baseTextColor?: string,
): string {
  const valid = candidates.filter((c) => hexToRgb(c) !== null)
  const passing = valid.filter(
    (c) => contrastRatio(c, background) >= MIN_ACCENT_CONTRAST,
  )
  if (passing.length > 0) {
    if (baseTextColor) {
      const distinct = passing.find(
        (c) => contrastRatio(c, baseTextColor) >= 1.3,
      )
      if (distinct) return distinct
    }
    return passing[0]
  }
  return isLightColor(background) ? "#0A0A0F" : "#FFFFFF"
}
