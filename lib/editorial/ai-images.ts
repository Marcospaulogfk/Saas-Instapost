import { fal } from '@fal-ai/client'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'
import { generateNanoBanana } from '@/lib/generation/nano-banana'
import { canUseNanoBananaPro } from '@/lib/tokens'

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
          image_size: ASPECT_TO_SIZE[params.aspectRatio || '4:5'] as
            | 'portrait_4_3'
            | 'square_hd'
            | 'landscape_16_9'
            | 'portrait_16_9',
          num_inference_steps: 32,
          // guidance mais alto = imagem mais fiel ao prompt (menos "viagem").
          guidance_scale: 4.5,
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

/** Qualidade EFETIVA gerada — usada pra debitar tokens (pro=20, normal=5). */
export type EditorialImageQuality = 'normal' | 'pro'

export interface EditorialImageForPlanResult {
  url: string
  quality: EditorialImageQuality
}

/**
 * Gera a imagem editorial respeitando o PLANO do usuário (mesma regra do
 * post único, ESTRATEGIA-MONETIZACAO.md §5):
 *   - Pro / Studio  → Nano Banana Pro (fallback Flux Pro se falhar) → quality "pro"
 *   - trial/starter → Flux Pro v1.1 atual (inalterado)              → quality "normal"
 *
 * ADITIVO e NÃO-QUEBRANTE: se o Nano Banana Pro falhar, CAI pro Flux Pro —
 * a geração nunca quebra por causa do modelo premium. O caller usa `quality`
 * pra debitar os tokens certos.
 */
export async function generateEditorialImageForPlan(
  params: GenerateImageParams,
  plan: string | null | undefined,
): Promise<EditorialImageForPlanResult> {
  if (canUseNanoBananaPro(plan)) {
    try {
      // Mantém a mesma orientação de estilo do pipeline Flux, pro look ficar
      // coerente entre os modelos.
      const style = params.style || 'cinematic'
      const enhanced = `${params.prompt}, ${STYLE_PROMPTS[style]}, high quality, 4k`
      const r = await generateNanoBanana(enhanced, 'pro')
      return { url: r.url, quality: 'pro' }
    } catch (err) {
      console.warn(
        '[editorial] Nano Banana Pro falhou, fallback Flux Pro:',
        err instanceof Error ? err.message : err,
      )
      // segue pro Flux Pro abaixo
    }
  }
  const url = await generateEditorialImage(params)
  return { url, quality: 'normal' }
}

/**
 * Gera todas as imagens de um slide respeitando o PLANO (Pro/Studio → Nano
 * Banana Pro; demais → Flux Pro). Retorna as URLs e a qualidade EFETIVA de
 * cada uma (pra o caller debitar tokens). Se `plan` for omitido, cai no
 * comportamento normal (Flux Pro, quality "normal").
 */
export async function generateImagesForSlide(
  slide: EditorialSlide,
  plan?: string | null,
): Promise<EditorialImageForPlanResult[]> {
  if (!slide.imagePrompts?.length) return []

  // Style baseado no layoutType.
  // Slides de conteúdo (demo/novidade/prova) usam 'editorial' em vez de
  // 'minimal': minimal adiciona muito espaço vazio e dilui o sujeito, o que
  // fazia a imagem "fugir" do assunto. Editorial mantém o sujeito nítido.
  const style: GenerateImageParams['style'] =
    slide.layoutType === 'sepia'
      ? 'sepia'
      : slide.layoutType === 'capa'
        ? 'cinematic'
        : 'editorial'

  // Aspect ratio baseado em variant
  const aspectRatio: GenerateImageParams['aspectRatio'] =
    slide.layoutType === 'capa' || slide.layoutType === 'sepia'
      ? '4:5'
      : slide.variant === 'comparison' || slide.variant === 'pair'
        ? '1:1'
        : '4:5'

  // Geração paralela (todas as imagens do slide ao mesmo tempo)
  const imagePromises = slide.imagePrompts.map((prompt) =>
    generateEditorialImageForPlan({ prompt, style, aspectRatio }, plan),
  )

  return await Promise.all(imagePromises)
}
