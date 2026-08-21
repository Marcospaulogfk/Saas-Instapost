import { fal } from "@fal-ai/client"

let configured = false

function ensureConfigured() {
  if (configured) return
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY ausente em .env.local")
  }
  fal.config({ credentials: process.env.FAL_KEY })
  configured = true
}

export interface NanoBananaResult {
  url: string
  width: number
  height: number
  costUsd: number
  ms: number
  model: string
}

/**
 * Modelos do Fal.ai pra Nano Banana / Gemini Image.
 *
 * Decisão de produto (21/08/2026, CUSTOS-IA-MARGEM): a CAPA usa o
 * `nano-banana` simples (~US$0,04), não o `nano-banana-2` (~US$0,08). A capa
 * era o item mais caro da geração (R$0,42) e a margem do plano depende dela.
 * Histórico: o -2 pontua melhor no arena (1264 vs 1246 do pro), mas o simples
 * é metade do preço e a decisão foi preço. Pra voltar ao -2 sem deploy:
 * FAL_NANO_BANANA_COVER_MODEL=fal-ai/nano-banana-2.
 *
 * Override via env: FAL_NANO_BANANA_MODEL (normal) /
 * FAL_NANO_BANANA_COVER_MODEL (capa; FAL_NANO_BANANA_PRO_MODEL ainda é lido
 * por compatibilidade com o deploy atual).
 */
const NANO_BANANA_MODEL =
  process.env.FAL_NANO_BANANA_MODEL || "fal-ai/nano-banana"
const NANO_BANANA_COVER_MODEL =
  process.env.FAL_NANO_BANANA_COVER_MODEL ||
  process.env.FAL_NANO_BANANA_PRO_MODEL ||
  "fal-ai/nano-banana"
/**
 * BITMAP do post único: a arte inteira, com a tipografia renderizada dentro
 * da imagem. Aqui o nano-banana-2 fica (decisão 21/08): texto chapado no
 * bitmap é onde o modelo simples mais perde. O /edit (edição cirúrgica e
 * clean plate) segue o mesmo modelo porque só existe nesse fluxo.
 */
const NANO_BANANA_BITMAP_MODEL =
  process.env.FAL_NANO_BANANA_BITMAP_MODEL || "fal-ai/nano-banana-2"

/**
 * Resolução da capa. É o parâmetro mais caro do produto inteiro: o Fal cobra
 * 1,5× em 2K e 2× em 4K, e a margem do plano Studio depende deste número.
 *
 * O export renderiza em 1080×1350 (`canvasWidth: 1080, pixelRatio: 1`), então
 * nada acima de 1080px de largura sobrevive — 2K só serviria pra evitar o
 * upscale de ~1,2× que o 1K exige em 4:5. Fica em 1K até medição em contrário.
 *
 * Pra testar 2K sem deploy: FAL_NANO_BANANA_RESOLUTION=2K. Vazio = não manda o
 * campo (útil se o schema do modelo mudar e passar a rejeitar o parâmetro).
 */
const COVER_RESOLUTION = process.env.FAL_NANO_BANANA_RESOLUTION ?? "1K"

/**
 * Qualidade solicitada. O gate de plano (canUseNanoBananaPro) deve ser
 * aplicado ANTES desta chamada — aqui só escolhemos o modelo.
 */
/**
 * - normal: miolo/cenas comuns (nano-banana simples)
 * - pro:    CAPA do carrossel (nano-banana simples desde 21/08)
 * - bitmap: arte completa do post único (nano-banana-2)
 */
export type NanoBananaQuality = "normal" | "pro" | "bitmap"

/**
 * Gera imagem usando Nano Banana (Gemini Image) via Fal.ai.
 * Usado nos posts únicos (modo dev / skeleton mode).
 *
 * Diferente do Flux Schnell, Nano Banana é melhor pra:
 * - Composições editoriais com texto sutil/integrado
 * - Fotos de produto / lifestyle realistas
 * - Cenas que precisam coerência semântica forte
 *
 * @param quality "normal" (default) usa o modelo normal; "pro" só deve
 *   chegar aqui se o plano permitir (gate em lib/tokens.ts). Nada quebra
 *   se vier "pro" indevidamente — apenas gera com o modelo pro.
 */
const MAX_RETRIES = 3

/**
 * EDIÇÃO de imagem com o Nano Banana 2 — é o que faz a "clean plate" da
 * Rota B2 do post único: o modelo gera o post COMPLETO como referência
 * (com tipografia) e esta chamada remove todo o texto mantendo o resto,
 * devolvendo o fundo limpo sobre o qual a tipografia HTML editável entra.
 *
 * Endpoint: <modelo>/edit (padrão do Fal pros modelos Gemini Image).
 * Custo: igual ao da geração (mesmo modelo, mesma resolução).
 */
export async function editNanoBanana(
  prompt: string,
  imageUrl: string,
): Promise<NanoBananaResult> {
  ensureConfigured()
  const start = performance.now()
  const model =
    process.env.FAL_NANO_BANANA_EDIT_MODEL || `${NANO_BANANA_BITMAP_MODEL}/edit`

  let result: Awaited<ReturnType<typeof fal.subscribe>> | null = null
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      result = await fal.subscribe(model, {
        input: {
          prompt,
          image_urls: [imageUrl],
          num_images: 1,
          output_format: "jpeg",
          ...(COVER_RESOLUTION ? { resolution: COVER_RESOLUTION } : {}),
        },
        logs: false,
      })
      break
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }
  }
  if (!result) {
    throw lastError instanceof Error
      ? lastError
      : new Error(`Nano Banana edit falhou após ${MAX_RETRIES} tentativas (${model})`)
  }
  const ms = performance.now() - start
  const data = result.data as {
    images?: Array<{ url: string; width?: number; height?: number }>
  }
  const image = data?.images?.[0]
  if (!image?.url) {
    throw new Error(`Nano Banana edit não retornou imagem (${model})`)
  }
  console.log(
    `[nano-banana] edit ${model} saiu ${image.width ?? "?"}×${image.height ?? "?"} em ${Math.round(ms)}ms`,
  )
  return {
    url: image.url,
    width: image.width ?? 1080,
    height: image.height ?? 1350,
    // Segue o modelo resolvido (o /edit do nano-banana simples custa o mesmo
    // que a geração dele).
    costUsd: model.startsWith("fal-ai/nano-banana/")
      ? 0.039
      : COVER_RESOLUTION === "2K"
        ? 0.12
        : 0.08,
    ms,
    model,
  }
}

export async function generateNanoBanana(
  prompt: string,
  quality: NanoBananaQuality = "normal",
): Promise<NanoBananaResult> {
  ensureConfigured()
  const start = performance.now()

  const isCover = quality === "pro" || quality === "bitmap"
  const model =
    quality === "bitmap"
      ? NANO_BANANA_BITMAP_MODEL
      : quality === "pro"
        ? NANO_BANANA_COVER_MODEL
        : NANO_BANANA_MODEL

  // Retry com backoff, espelhando o pipeline do carrossel
  // (lib/editorial/ai-images.ts): um 429/timeout transitório do Fal não pode
  // derrubar a capa pro Flux Schnell — o downgrade silencioso era uma das
  // causas de foto ruim no post único.
  let result: Awaited<ReturnType<typeof fal.subscribe>> | null = null
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      result = await fal.subscribe(model, {
        input: {
          prompt,
          num_images: 1,
          output_format: "jpeg",
          aspect_ratio: "4:5",
          // Só na capa: é o único caminho em que a resolução muda o preço.
          ...(isCover && COVER_RESOLUTION
            ? { resolution: COVER_RESOLUTION }
            : {}),
        },
        logs: false,
      })
      break
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }
  }
  if (!result) {
    throw lastError instanceof Error
      ? lastError
      : new Error(`Nano Banana falhou após ${MAX_RETRIES} tentativas (${model})`)
  }
  const ms = performance.now() - start

  const data = result.data as {
    images?: Array<{ url: string; width?: number; height?: number }>
  }
  const image = data?.images?.[0]
  if (!image?.url) {
    throw new Error(`Nano Banana não retornou imagem (${model})`)
  }

  // Dimensão CRUA da API, antes do fallback abaixo. O fallback 1080×1350 é o
  // que o export precisa, então ele mascararia justamente o caso que interessa
  // medir: a capa saindo menor que 1080 e sendo upscalada no export.
  console.log(
    `[nano-banana] ${model} res=${COVER_RESOLUTION || "default"} ` +
      `saiu ${image.width ?? "?"}×${image.height ?? "?"} em ${Math.round(ms)}ms` +
      (isCover && image.width && image.width < 1080
        ? ` ⚠️  ABAIXO de 1080 — o export vai upscalar ${(1080 / image.width).toFixed(2)}×`
        : ""),
  )

  return {
    url: image.url,
    width: image.width ?? 1080,
    height: image.height ?? 1350,
    // Fal.ai: nano-banana normal ~$0.039 · nano-banana-2 ~$0.08 em 1K
    // (2K = 1,5× = $0.12 — ver COVER_RESOLUTION acima). O custo segue o
    // MODELO resolvido, não o slot: capa no nano-banana simples custa 0.039.
    costUsd:
      model === "fal-ai/nano-banana"
        ? 0.039
        : COVER_RESOLUTION === "2K"
          ? 0.12
          : 0.08,
    ms,
    model,
  }
}
