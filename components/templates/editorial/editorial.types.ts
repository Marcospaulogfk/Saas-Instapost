export type LayoutType =
  | 'capa'
  | 'problema'
  | 'demo'
  | 'novidade'
  | 'prova'
  | 'texto-foto'
  | 'sepia'
  | 'serif'
  | 'cta'

/**
 * Backgrounds permitidos na marca SyncPost (apenas preto, branco e foto).
 * Não usar navy/sepia/colored — fora da paleta.
 */
export type BackgroundType = 'dark' | 'cream' | 'white' | 'photo'

/**
 * Posicionamento vertical do título no canvas.
 * Garante variedade visual entre slides.
 */
export type TitlePosition = 'top' | 'middle' | 'bottom'

export interface BrandInfo {
  name: string
  handle: string
  brandColor?: string
}

export interface EditorialSlide {
  pageNumber: number
  totalPages: number
  layoutType: LayoutType
  variant?: string
  tag?: string
  title: string[]
  highlightWords: string[]
  body?: string
  bodyBoldLead?: string
  callout?: string
  subtitle?: string
  images?: string[]
  imagePrompts?: string[]
  background?: BackgroundType
  /** Posição vertical do título dentro do canvas. Default varia por layout. */
  titlePosition?: TitlePosition
  showBigNumber?: boolean
  brandInfo: BrandInfo
}

export interface EditorialCarousel {
  totalSlides: number
  brandName: string
  handle: string
  topic: string
  slides: EditorialSlide[]
  createdAt: string
}
