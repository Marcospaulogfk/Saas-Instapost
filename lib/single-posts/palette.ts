import type { PostBrand, PostPalette } from "./types"

function getLuminance(hex: string): number {
  const h = hex.replace("#", "")
  if (h.length !== 6) return 0.5
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isLight(hex: string): boolean {
  return getLuminance(hex) > 0.6
}

/** Pega a cor mais escura da paleta */
function pickDark(colors: string[]): string {
  if (!colors.length) return "#1F1F1F"
  return [...colors].sort((a, b) => getLuminance(a) - getLuminance(b))[0]
}

/** Pega a cor mais clara da paleta */
function pickLight(colors: string[]): string {
  if (!colors.length) return "#F0F0F0"
  return [...colors].sort((a, b) => getLuminance(b) - getLuminance(a))[0]
}

/** Pega uma cor accent (não a mais escura nem a mais clara — uma colorida) */
function pickAccent(colors: string[]): string {
  if (colors.length < 2) return colors[0] ?? "#C9A572"
  // Tenta achar uma cor que não é nem muito escura nem muito clara
  const sorted = [...colors].sort((a, b) => {
    const la = getLuminance(a)
    const lb = getLuminance(b)
    const da = Math.abs(la - 0.5)
    const db = Math.abs(lb - 0.5)
    return da - db
  })
  return sorted[0]
}

export function buildPalette(brand: PostBrand): PostPalette {
  const colors = brand.brand_colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c))
  const dark = pickDark(colors) || "#1F1F1F"
  const surface = pickLight(colors) || "#F0F0F0"
  const accent = pickAccent(colors) || "#C9A572"
  return {
    dark,
    accent,
    surface,
    textSecondary: "#6B7280",
    textOnDark: "#FFFFFF",
    textOnLight: dark,
  }
}

/** Gera monograma a partir do nome — pega 1ª letra do 1º e do último nome */
export function generateMonogram(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return "•"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
