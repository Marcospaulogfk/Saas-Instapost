import { fal } from '@fal-ai/client'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'
import { generateNanoBanana } from '@/lib/generation/nano-banana'

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
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: enhancedPrompt,
          image_size: ASPECT_TO_SIZE[params.aspectRatio || '4:5'] as
            | 'portrait_4_3'
            | 'square_hd'
            | 'landscape_16_9'
            | 'portrait_16_9',
          num_inference_steps: 4,
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

/**
 * Qualidade EFETIVA gerada — é o que o caller usa pra debitar tokens.
 * O mapa em `tokenCostForImage` liga 'pro' → imageCover (25) e
 * 'normal' → imageSlide (2). Os nomes ficaram por compatibilidade com os
 * endpoints; a semântica hoje é CAPA x MIOLO, não plano caro x barato.
 */
export type EditorialImageQuality = 'normal' | 'pro'

export interface EditorialImageForPlanResult {
  url: string
  quality: EditorialImageQuality
  /** Custo em USD devolvido pelo gerador (pra generation_usage). */
  costUsd: number
  /** Id do modelo na Fal.ai. */
  model: string
}

/** Papel do slide na peça — é ele que decide o modelo, não o plano. */
export type EditorialImageRole = 'cover' | 'slide'

/**
 * Gera a imagem editorial escolhendo o modelo pelo PAPEL do slide:
 *   - capa  → Nano Banana 2 (arena rank 7)   → quality "pro"    → 25 tokens
 *   - miolo → Flux Schnell                   → quality "normal" →  2 tokens
 *
 * Por que não um modelo bom no miolo: o miolo tem 6 imagens, então qualquer
 * preço unitário é multiplicado por 6. Segurando a margem de 80% no Studio, o
 * miolo tem teto de ~US$0,006/imagem — só o Schnell cabe. E ali a imagem é
 * fundo escurecido atrás de texto, onde a diferença não aparece. Na capa, que
 * é o que para o scroll, aparece — e a capa roda no modelo bom.
 *
 * NÃO-QUEBRANTE: se o Nano Banana 2 falhar, a capa CAI pro Schnell e volta
 * como quality 'normal' — o usuário é cobrado 2 tokens em vez de 25, que é o
 * que ele de fato recebeu.
 */
export async function generateEditorialImageForRole(
  params: GenerateImageParams,
  role: EditorialImageRole,
): Promise<EditorialImageForPlanResult> {
  if (role === 'cover') {
    try {
      // Mantém a mesma orientação de estilo do pipeline Flux, pro look ficar
      // coerente entre os modelos.
      const style = params.style || 'cinematic'
      const enhanced = `${params.prompt}, ${STYLE_PROMPTS[style]}, high quality, 4k`
      const r = await generateNanoBanana(enhanced, 'pro')
      return { url: r.url, quality: 'pro', costUsd: r.costUsd, model: r.model }
    } catch (err) {
      console.warn(
        '[editorial] Nano Banana 2 falhou na capa, fallback Schnell:',
        err instanceof Error ? err.message : err,
      )
      // segue pro Schnell abaixo — e cobra como miolo.
    }
  }
  const url = await generateEditorialImage(params)
  // Flux Schnell: ~US$0,003 por imagem (mesmo número de lib/generation/fal.ts).
  return { url, quality: 'normal', costUsd: 0.003, model: 'fal-ai/flux/schnell' }
}

/**
 * @deprecated O modelo deixou de ser função do plano. Use
 * `generateEditorialImageForRole`. Mantida porque `/api/editorial/*` ainda
 * chama por esta assinatura; trata tudo como miolo.
 */
export async function generateEditorialImageForPlan(
  params: GenerateImageParams,
  _plan?: string | null,
): Promise<EditorialImageForPlanResult> {
  return generateEditorialImageForRole(params, 'slide')
}

/**
 * Gera todas as imagens de um slide. A capa (`layoutType === 'capa'`) vai pro
 * Nano Banana 2; todo o resto vai pro Schnell. Retorna a qualidade EFETIVA de
 * cada imagem pro caller debitar os tokens certos.
 *
 * `_plan` não é mais usado na escolha do modelo — todo mundo recebe a mesma
 * capa. Ficou na assinatura pros callers atuais não quebrarem.
 */
export async function generateImagesForSlide(
  slide: EditorialSlide,
  _plan?: string | null,
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

  // Só a capa justifica o modelo caro — ver generateEditorialImageForRole.
  const role: EditorialImageRole =
    slide.layoutType === 'capa' ? 'cover' : 'slide'

  // Geração paralela (todas as imagens do slide ao mesmo tempo)
  const imagePromises = slide.imagePrompts.map((prompt) =>
    generateEditorialImageForRole({ prompt, style, aspectRatio }, role),
  )

  return await Promise.all(imagePromises)
}
