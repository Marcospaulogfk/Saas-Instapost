// ============================================================================
// Imagem de fundo do slide ("Fundo do Slide" → Imagem).
//
// A foto do usuário entra ATRÁS do layout, no mesmo ponto onde o degradê é
// pintado (nó raiz do layout, depois do render). Por cima dela vai uma camada
// de cor (escurecer ou clarear) pra o texto continuar legível. A foto da IA,
// quando o estilo tem uma, continua por cima: ela é conteúdo, o fundo é fundo.
//
// O texto decide claro/escuro pela cor do tom (dark = texto branco, light =
// texto escuro), igual ao fundo de cor sólida. Sem bgImage nada muda.
// ============================================================================
import { contrastRatio } from "@/lib/color-contrast"
import { proxiedImageUrl } from "@/lib/proxy-image"

export interface SlideBgImage {
  url: string
  /** Força da camada por cima da foto, 0–90 (%). Padrão 60. */
  shade?: number
  /** "dark" escurece a foto (texto branco); "light" clareia (texto escuro). */
  tone?: "dark" | "light"
  /** Enquadramento da foto, 0–100 (%). Padrão 50/50 (centro). */
  posX?: number
  posY?: number
}

export const BG_IMAGE_DEFAULT_SHADE = 60
export const BG_IMAGE_MAX_SHADE = 90

/** Cor base do tom: vira o bgOverride (decide a cor do texto e do destaque). */
export const BG_IMAGE_TONE_COLOR = {
  dark: "#0B0B10",
  light: "#F7F5F0",
} as const

export function bgImageToneColor(img: SlideBgImage): string {
  return BG_IMAGE_TONE_COLOR[img.tone === "light" ? "light" : "dark"]
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Estilos CSS do fundo com imagem: camada de cor + foto (cover). */
export function bgImageCss(img: SlideBgImage): {
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
  backgroundRepeat: string
} {
  const shade = clamp(img.shade ?? BG_IMAGE_DEFAULT_SHADE, 0, BG_IMAGE_MAX_SHADE) / 100
  const rgb = img.tone === "light" ? "247,245,240" : "11,11,16"
  const veil = `rgba(${rgb},${shade.toFixed(2)})`
  const x = clamp(img.posX ?? 50, 0, 100)
  const y = clamp(img.posY ?? 50, 0, 100)
  return {
    // Mesma URL proxiada das fotos: o export (html-to-image) baixa pela mesma
    // origem e o canvas não fica "sujo".
    backgroundImage: `linear-gradient(${veil}, ${veil}), url("${proxiedImageUrl(img.url)}")`,
    backgroundSize: "cover",
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: "no-repeat",
  }
}

/** Contraste mínimo do destaque sobre a foto (texto grande/bold, WCAG AA). */
export const BG_IMAGE_MIN_ACCENT_CONTRAST = 3

/** Área "difícil" típica de uma foto: um tom claro (camada escura) ou escuro
 *  (camada clara). A conta usa a mistura dela com a camada, não só a camada:
 *  a foto continua aparecendo por baixo. */
const PHOTO_HIGHLIGHT: [number, number, number] = [160, 160, 160]
const PHOTO_SHADOW: [number, number, number] = [64, 64, 64]

function mixHex(hex: string, target: [number, number, number], t: number): string {
  const h = hex.replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(h)) return hex
  const c = [0, 2, 4].map((i) => parseInt(h.substring(i, i + 2), 16))
  return (
    "#" +
    c
      .map((v, i) => Math.round(v + (target[i] - v) * t).toString(16).padStart(2, "0"))
      .join("")
  )
}

/** Fundo efetivo numa área difícil da foto: camada (shade) + foto (1 - shade). */
export function bgImageWorstBackground(img: SlideBgImage): string {
  const shade = clamp(img.shade ?? BG_IMAGE_DEFAULT_SHADE, 0, BG_IMAGE_MAX_SHADE) / 100
  const photo = img.tone === "light" ? PHOTO_SHADOW : PHOTO_HIGHLIGHT
  return mixHex(bgImageToneColor(img), photo, 1 - shade)
}

/**
 * Cor da marca legível sobre a foto de fundo: mantém o tom da marca e só clareia
 * (camada escura) ou escurece (camada clara) até bater o contraste mínimo. Com
 * a camada mais forte, a cor fica mais perto da original.
 */
export function accentOnBgImage(accent: string, img: SlideBgImage): string {
  const bg = bgImageWorstBackground(img)
  const target: [number, number, number] = img.tone === "light" ? [0, 0, 0] : [255, 255, 255]
  for (let i = 0; i <= 10; i++) {
    const c = mixHex(accent, target, i / 10)
    if (contrastRatio(c, bg) >= BG_IMAGE_MIN_ACCENT_CONTRAST) return c
  }
  return img.tone === "light" ? "#0A0A0F" : "#FFFFFF"
}
