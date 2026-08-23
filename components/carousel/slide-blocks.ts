// ============================================================================
// Blocos livres do carrossel (estilo Elementor) — MODELO.
//
// Um bloco é um elemento que o usuário ADICIONA por cima do layout gerado:
// título, texto, imagem, tag, forma, divisor. Vive em `slide.blocks[]` (JSONB
// dentro de carousel_data — sem migration) e é renderizado pelo BlockLayer,
// uma camada absoluta dentro do root do SlidePreview. Sem blocos o DOM do
// slide é idêntico ao de hoje: a camada é aditiva, nunca mexe nos layouts.
//
// Coordenadas: px na LARGURA DE DESIGN (420), igual aos overrides `el`. O
// slide inteiro é escalado por transform (filmstrip/canvas/export), então os
// blocos escalam junto sem conta extra.
// ============================================================================

export const BLOCK_DESIGN_W = 420
/** Limite por slide: evita JSON gigante e slide ilegível. */
export const BLOCK_LIMIT = 12
export const BLOCK_MIN_SIZE = 16

export type BlockType = "heading" | "text" | "image" | "pill" | "shape" | "divider" | "brand"

interface BlockBase {
  id: string
  type: BlockType
  x: number
  y: number
  w: number
  h: number
  /** Ordem de empilhamento (maior = na frente). */
  z: number
  /** Rotação em graus (opcional). */
  rot?: number
  opacity?: number
  /** Id da fonte (CAROUSEL_FONTS). Vazio = fonte do carrossel. */
  font?: string
  /** Sombra suave (text-shadow em texto, box-shadow nos demais). */
  shadow?: boolean
}

export interface TextBlock extends BlockBase {
  type: "heading" | "text"
  text: string
  color?: string
  /** Tamanho da fonte em px de design. */
  size?: number
  weight?: number
  align?: "left" | "center" | "right"
  lineHeight?: number
  /** Fundo da caixa de texto (ex.: tarja atrás do título). */
  fill?: string
  padding?: number
  radius?: number
}

export interface ImageBlock extends BlockBase {
  type: "image"
  url: string | null
  fit?: "cover" | "contain"
  radius?: number
  posX?: number
  posY?: number
}

export interface PillBlock extends BlockBase {
  type: "pill"
  text: string
  variant: "dark" | "light" | "accent"
  color?: string
}

export interface ShapeBlock extends BlockBase {
  type: "shape"
  shape: "rect" | "circle"
  fill?: string
  stroke?: string
  strokeWidth?: number
  radius?: number
}

export interface DividerBlock extends BlockBase {
  type: "divider"
  color?: string
  thickness?: number
}

export interface BrandBlock extends BlockBase {
  type: "brand"
  name: string
  handle: string
  avatar?: string
  initials?: string
  color?: string
  showAvatar?: boolean
  verified?: boolean
}

export type SlideBlock =
  | TextBlock
  | ImageBlock
  | PillBlock
  | ShapeBlock
  | DividerBlock
  | BrandBlock

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  heading: "Título",
  text: "Texto",
  image: "Imagem",
  pill: "Tag",
  shape: "Forma",
  divider: "Divisor",
  brand: "Marca",
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Cria um bloco novo centralizado no slide, com tamanho padrão do tipo.
 * `slideH` = altura de design (525 feed · 747 stories). `accent` = cor de
 * destaque da paleta (usada como padrão de tag/forma/divisor).
 */
export function createBlock(
  type: BlockType,
  opts: {
    slideH: number
    z: number
    accent: string
    onDark: boolean
    brand?: { name: string; handle: string; avatar?: string; initials?: string }
  },
): SlideBlock {
  const { slideH, z, accent, onDark, brand } = opts
  const id = newId()
  const ink = onDark ? "#FFFFFF" : "#0A0A0F"
  const center = (w: number, h: number) => ({
    x: Math.round((BLOCK_DESIGN_W - w) / 2),
    y: Math.round((slideH - h) / 2),
    w,
    h,
  })
  switch (type) {
    case "heading":
      return {
        id, type, z, ...center(320, 80),
        text: "Seu título aqui",
        color: ink, size: 30, weight: 800, align: "center", lineHeight: 1.1,
      }
    case "text":
      return {
        id, type, z, ...center(300, 60),
        text: "Escreva um texto curto de apoio.",
        color: ink, size: 14, weight: 500, align: "left", lineHeight: 1.4,
      }
    case "image":
      return { id, type, z, ...center(200, 200), url: null, fit: "cover", radius: 12 }
    case "pill":
      return {
        id, type, z, ...center(110, 30),
        text: "Nova tag", variant: onDark ? "dark" : "light",
      }
    case "shape":
      return {
        id, type, z, ...center(140, 140),
        shape: "rect", fill: accent, radius: 16, opacity: 0.9,
      }
    case "divider":
      return { id, type, z, ...center(240, 10), color: accent, thickness: 3 }
    case "brand":
      return {
        id, type, z, ...center(220, 44),
        name: brand?.name || "Sua marca",
        handle: brand?.handle || "@marca",
        avatar: brand?.avatar,
        initials: brand?.initials,
        color: ink, showAvatar: true, verified: true,
      }
  }
}

/** Clampa posição/tamanho dentro do slide (nunca some da área visível). */
export function clampBlock<T extends SlideBlock>(b: T, slideH: number): T {
  const w = Math.max(BLOCK_MIN_SIZE, Math.min(BLOCK_DESIGN_W, b.w))
  const h = Math.max(BLOCK_MIN_SIZE, Math.min(slideH, b.h))
  const x = Math.max(0, Math.min(BLOCK_DESIGN_W - w, b.x))
  const y = Math.max(0, Math.min(slideH - h, b.y))
  return { ...b, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
}

export function slideDesignHeight(format: "feed" | "stories"): number {
  return Math.round(BLOCK_DESIGN_W * (format === "stories" ? 16 / 9 : 5 / 4))
}
