// ============================================================================
// Contrato dos ESTILOS EXTERNOS de carrossel (um arquivo por estilo em
// components/carousel/styles/). O SlidePreview monta o contexto abaixo e
// entrega pro `render` do estilo; o estilo decide qual capa/slide mostrar.
//
// Por que existe: os 10 estilos originais vivem dentro de slide-preview.tsx,
// editorial-covers.tsx e editorial-splits.tsx (arquivos enormes). Estilo novo
// entra num arquivo só, registrado em ./index.ts, sem tocar nos antigos.
// ============================================================================
import type { ReactNode } from "react"
import type { PreviewSlide } from "../slide-preview"
import type { CoverSlideData } from "../editorial-covers"
import type { SplitSlideData, SplitImageSlot } from "../editorial-splits"

/** Props que TODA capa/slide recebe (mesma forma das capas/splits originais). */
export interface StyleBaseProps {
  totalSlides: number
  orderIndex: number
  /** Cor de destaque já validada por contraste sobre o fundo (escuro ou claro). */
  accent: string
  fontClass: string
  /** Cor de fundo escolhida pelo usuário (slide.bg / from do degradê). */
  bgOverride?: string
  /** Cor do glow (só estilos que usam). */
  glow?: string
}

export interface StyleRouteContext {
  slide: PreviewSlide
  /** Dados prontos pra uma CAPA (título, subtítulo, foto, @, categoria...). */
  coverData: CoverSlideData
  /** Dados prontos pra um slide de CONTEÚDO (título, corpo, fotos...). */
  splitData: SplitSlideData
  totalSlides: number
  orderIndex: number
  isCover: boolean
  isLast: boolean
  /** Slide do meio em carrosséis com 5+ slides (quebra de ritmo). */
  isMidBreak: boolean
  /** Quantas fotos DISTINTAS o slide tem de verdade. */
  imgCount: number
  fontClass: string
  format: "feed" | "stories"
  accentOnDark: string
  accentOnLight: string
  /** Accent legível sobre o fundo escolhido pelo usuário; sem override = fallback. */
  accentForBg: (fallback: string) => string
  bgOverride?: string
  glow?: string
  /** Props base pra layouts de fundo ESCURO (accent validado sobre escuro). */
  basePropsDark: StyleBaseProps
  /** Props base pra layouts de fundo CLARO (accent validado sobre claro). */
  basePropsLight: StyleBaseProps
  /** Rebaixa slots multi-foto quando o slide só tem 1 foto (nunca duplica). */
  resolveImageSlot: (slot: SplitImageSlot, imgCount: number) => SplitImageSlot
}

export interface StyleRenderer {
  /** Devolve a capa ou o slide de conteúdo pro índice atual. */
  render: (ctx: StyleRouteContext) => ReactNode
}
