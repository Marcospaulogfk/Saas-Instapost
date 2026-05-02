import { generateEditorialCarousel } from './ai-content'
import { generateImagesForSlide } from './ai-images'
import type {
  BrandInfo,
  EditorialCarousel,
} from '@/components/templates/editorial/editorial.types'

interface GenerateParams {
  topic: string
  brandInfo: BrandInfo
  tone: 'profissional' | 'casual' | 'direto'
  targetAudience: string
  desiredSlides?: number
  onProgress?: (step: string, current: number, total: number) => void
}

export async function generateCompleteCarousel(
  params: GenerateParams,
): Promise<EditorialCarousel> {
  // Step 1: Roteiro com Claude
  params.onProgress?.('Criando roteiro com IA...', 0, 100)
  const carousel = await generateEditorialCarousel({
    topic: params.topic,
    brandInfo: params.brandInfo,
    tone: params.tone,
    targetAudience: params.targetAudience,
    desiredSlides: params.desiredSlides,
  })

  params.onProgress?.('Roteiro pronto. Gerando imagens...', 30, 100)

  // Step 2: Imagens (slide por slide; dentro do slide é paralelo)
  const totalImages = carousel.slides.reduce(
    (acc, s) => acc + (s.imagePrompts?.length || 0),
    0,
  )
  let generatedImages = 0

  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i]
    if (slide.imagePrompts?.length) {
      const images = await generateImagesForSlide(slide)
      slide.images = images
      generatedImages += images.length

      const progress =
        totalImages > 0 ? 30 + Math.floor((generatedImages / totalImages) * 60) : 90
      params.onProgress?.(
        `Gerando imagem ${generatedImages} de ${totalImages}...`,
        progress,
        100,
      )
    }
  }

  params.onProgress?.('Carrossel pronto!', 100, 100)
  return carousel
}
