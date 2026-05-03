import { fal } from '@fal-ai/client'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'

let configured = false

function ensureConfigured() {
  if (configured) return
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY ausente em .env.local')
  }
  fal.config({ credentials: process.env.FAL_KEY })
  configured = true
}

interface GenerateImageParams {
  prompt: string
  style?: 'cinematic' | 'editorial' | 'minimal' | 'sepia'
  aspectRatio?: '4:5' | '1:1' | '16:9' | '9:16'
}

const STYLE_PROMPTS: Record<NonNullable<GenerateImageParams['style']>, string> = {
  cinematic:
    'cinematic photography, dramatic lighting, deep shadows, moody atmosphere, professional editorial photo, high contrast',
  editorial:
    'magazine editorial photography, clean composition, premium feel, sharp details, professional studio lighting',
  minimal:
    'minimalist composition, lots of negative space, simple and clean, soft natural light',
  sepia:
    'sepia tone, warm brown colors, vintage aesthetic, film photography look, slight grain',
}

const ASPECT_TO_SIZE: Record<NonNullable<GenerateImageParams['aspectRatio']>, string> = {
  '4:5': 'portrait_4_3',
  '1:1': 'square_hd',
  '16:9': 'landscape_16_9',
  '9:16': 'portrait_16_9',
}

const MAX_RETRIES = 3

export async function generateEditorialImage(params: GenerateImageParams): Promise<string> {
  ensureConfigured()

  const style = params.style || 'cinematic'
  const enhancedPrompt = `${params.prompt}, ${STYLE_PROMPTS[style]}, high quality, 4k`

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `  🎨 Fal tentativa ${attempt}/${MAX_RETRIES}: ${params.prompt.slice(0, 60)}…`,
      )
      const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
        input: {
          prompt: enhancedPrompt,
          image_size: ASPECT_TO_SIZE[params.aspectRatio || '4:5'],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        },
        logs: false,
      })
      const data = result.data as { images?: Array<{ url: string }> } | undefined
      if (!data?.images?.[0]?.url) {
        throw new Error('Fal.ai não retornou imagem válida')
      }
      console.log(`  ✅ Imagem OK (tentativa ${attempt})`)
      return data.images[0].url
    } catch (err) {
      lastError = err
      const message = err instanceof Error ? err.message : 'erro'
      console.warn(`  ⚠️  Falha tentativa ${attempt}: ${message}`)
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * attempt // 1s, 2s
        console.log(`  ⏳ Aguardando ${delay}ms antes de retry…`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  const final = lastError instanceof Error ? lastError.message : 'erro desconhecido'
  throw new Error(`Fal.ai falhou após ${MAX_RETRIES} tentativas: ${final}`)
}

export async function generateImagesForSlide(slide: EditorialSlide): Promise<string[]> {
  if (!slide.imagePrompts?.length) return []

  // Style baseado no layoutType
  const style: GenerateImageParams['style'] =
    slide.layoutType === 'sepia'
      ? 'sepia'
      : slide.layoutType === 'capa'
        ? 'cinematic'
        : slide.layoutType === 'texto-foto'
          ? 'editorial'
          : 'minimal'

  // Aspect ratio baseado em variant
  const aspectRatio: GenerateImageParams['aspectRatio'] =
    slide.layoutType === 'capa' || slide.layoutType === 'sepia'
      ? '4:5'
      : slide.variant === 'comparison' || slide.variant === 'pair'
        ? '1:1'
        : '4:5'

  // Geração paralela (todas as imagens do slide ao mesmo tempo)
  const imagePromises = slide.imagePrompts.map((prompt) =>
    generateEditorialImage({ prompt, style, aspectRatio }),
  )

  return await Promise.all(imagePromises)
}
