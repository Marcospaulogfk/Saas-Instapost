import type { FreeBlock, FreeFontKey, FreePostSpec } from "./free-spec"

export interface FontPreset {
  id: string
  name: string
  description: string
  /**
   * Mapeamento: chave original do skeleton → chave nova depois do preset.
   * Vazio = manter original (preset "Editorial default").
   */
  swaps: Partial<Record<FreeFontKey, FreeFontKey>>
}

/**
 * Helper pra criar um preset que substitui TODAS as fontes pela escolhida.
 * Mantém allura (script) e o italic do playfair.
 */
function fontGlobal(
  id: string,
  name: string,
  description: string,
  target: FreeFontKey,
): FontPreset {
  const swaps: FontPreset["swaps"] = {
    anton: target,
    playfair: target,
    inter: target,
    inter_bold: target,
    bebas: target,
    montserrat: target,
    archivo: target,
    grotesk: target,
  }
  // Italic mantém playfair_italic se a fonte target NÃO é serif (preserva contraste italic)
  if (target !== "playfair" && target !== "playfair_italic") {
    swaps.playfair_italic = target
  }
  return { id, name, description, swaps }
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: "editorial",
    name: "Editorial (default)",
    description: "Mistura original do skeleton — Playfair italic + Anton + Inter",
    swaps: {},
  },
  fontGlobal("inter", "Inter", "Sans neutra moderna", "inter"),
  fontGlobal("inter-bold", "Inter Bold", "Sans neutra em negrito", "inter_bold"),
  fontGlobal("playfair", "Playfair Display", "Serif clássica elegante", "playfair"),
  fontGlobal("anton", "Anton", "Sans condensed dramática", "anton"),
  fontGlobal("bebas", "Bebas Neue", "Sans condensed leve", "bebas"),
  fontGlobal("montserrat", "Montserrat", "Sans geométrica", "montserrat"),
  fontGlobal("archivo", "Archivo Black", "Sans extra-pesada", "archivo"),
  fontGlobal("grotesk", "Space Grotesk", "Grotesk moderna técnica", "grotesk"),
]

export function getFontPreset(id: string): FontPreset | null {
  return FONT_PRESETS.find((p) => p.id === id) ?? null
}

/**
 * Aplica um preset de fonte ao spec inteiro — walk recursivo nos blocos
 * trocando font keys conforme o mapping do preset.
 */
export function applyFontPreset(spec: FreePostSpec, presetId: string): FreePostSpec {
  const preset = getFontPreset(presetId)
  if (!preset || Object.keys(preset.swaps).length === 0) return spec

  function swap(key: FreeFontKey | undefined): FreeFontKey | undefined {
    if (!key) return key
    return preset!.swaps[key] ?? key
  }

  function transform(b: FreeBlock): FreeBlock {
    if (b.type === "text") {
      return { ...b, font: swap(b.font) ?? b.font }
    }
    if (b.type === "pill" && b.font) {
      return { ...b, font: swap(b.font) ?? b.font }
    }
    if (b.type === "card") {
      return { ...b, children: b.children.map(transform) }
    }
    if (b.type === "stack") {
      return { ...b, children: b.children.map(transform) }
    }
    return b
  }

  const newGhost = spec.ghost
    ? { ...spec.ghost, font: swap(spec.ghost.font) ?? spec.ghost.font }
    : undefined

  return {
    ...spec,
    ghost: newGhost,
    blocks: spec.blocks.map(transform),
  }
}
