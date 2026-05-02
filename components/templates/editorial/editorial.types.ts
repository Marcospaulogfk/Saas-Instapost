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

export type BackgroundType = 'dark' | 'cream' | 'white' | 'navy' | 'sepia' | 'photo'

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
