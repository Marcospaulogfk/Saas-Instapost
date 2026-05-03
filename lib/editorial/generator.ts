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
  console.log('🚀 [Editorial] Iniciando geração:', params.topic)
  const startTime = Date.now()

  // Step 1: Roteiro
  console.log('📝 [Editorial] Gerando roteiro com Claude…')
  params.onProgress?.('Criando roteiro com IA...', 0, 100)

  const carousel = await generateEditorialCarousel({
    topic: params.topic,
    brandInfo: params.brandInfo,
    tone: params.tone,
    targetAudience: params.targetAudience,
    desiredSlides: params.desiredSlides,
  })

  console.log('✅ [Editorial] Roteiro gerado:', {
    slides: carousel.slides.length,
    layouts: carousel.slides.map((s) => s.layoutType),
    backgrounds: carousel.slides.map((s) => s.background),
  })
  params.onProgress?.('Roteiro pronto. Gerando imagens...', 30, 100)

  // Step 2: Imagens
  const totalImages = carousel.slides.reduce(
    (acc, s) => acc + (s.imagePrompts?.length || 0),
    0,
  )
  console.log(`🖼️  [Editorial] Total de imagens a gerar: ${totalImages}`)

  let generatedImages = 0
  let failedImages = 0

  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i]
    if (slide.imagePrompts?.length) {
      console.log(
        `🎨 [Editorial] Slide ${i + 1} (${slide.layoutType}): gerando ${slide.imagePrompts.length} imagem(ns)`,
      )
      try {
        const images = await generateImagesForSlide(slide)
        slide.images = images
        generatedImages += images.length
        console.log(`✅ [Editorial] Slide ${i + 1}: ${images.length} imagem(ns) OK`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'erro desconhecido'
        console.error(`❌ [Editorial] Slide ${i + 1}: ERRO gerando imagens —`, message)
        failedImages += slide.imagePrompts.length
        slide.images = []
      }

      const progress =
        totalImages > 0
          ? 30 + Math.floor(((generatedImages + failedImages) / totalImages) * 60)
          : 90
      params.onProgress?.(
        `Gerando imagem ${generatedImages + failedImages} de ${totalImages}...`,
        progress,
        100,
      )
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(
    `🎉 [Editorial] Geração completa em ${totalTime}s. Imagens: ${generatedImages} OK / ${failedImages} falharam`,
  )
  if (failedImages > 0) {
    console.warn(
      `⚠️  ATENÇÃO: ${failedImages} imagens falharam. Slides podem aparecer sem imagem.`,
    )
  }

  params.onProgress?.('Carrossel pronto!', 100, 100)
  return carousel
}
