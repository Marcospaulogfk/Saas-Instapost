import type {
  EditorialCarousel,
  EditorialSlide,
  BackgroundType,
} from '../editorial.types'

const VALID_BACKGROUNDS: ReadonlyArray<BackgroundType> = ['dark', 'cream', 'white', 'photo']

/**
 * Normaliza um carrossel pra paleta SyncPost (preto/branco) + capa sempre photo.
 * Aplicar tanto em carrosséis recém-gerados pela IA quanto em carregados do banco
 * (slides salvos antes da migração de paleta).
 */
export function normalizeEditorialCarousel(
  carousel: EditorialCarousel,
): EditorialCarousel {
  return {
    ...carousel,
    slides: carousel.slides.map(normalizeSlide),
  }
}

export function normalizeSlide(slide: EditorialSlide): EditorialSlide {
  // Background: navy/sepia/blue/qualquer-coisa-fora-da-paleta -> dark
  let bg: BackgroundType = 'dark'
  if (slide.background && VALID_BACKGROUNDS.includes(slide.background)) {
    bg = slide.background
  }

  // Capa e layout sepia sempre photo
  if (slide.layoutType === 'capa' || slide.layoutType === 'sepia') {
    bg = 'photo'
  }

  // Capa sem imagePrompts ganha um default genérico (evita tela preta sem foto)
  let imagePrompts = slide.imagePrompts
  if (slide.layoutType === 'capa' && (!imagePrompts || imagePrompts.length === 0)) {
    imagePrompts = [
      'cinematic editorial portrait, dramatic side lighting, deep shadows, professional photography, high contrast, premium magazine aesthetic',
    ]
  }

  return {
    ...slide,
    background: bg,
    imagePrompts,
  }
}
