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
 * O modelo de CAPA é o `nano-banana-2` (Gemini 3.1 Flash Image), NÃO o
 * `nano-banana-pro`. Não é economia com perda: no leaderboard do arena o
 * nano-banana-2 pontua 1264 (rank 7) contra 1246 do pro (rank 12) — ele é ao
 * mesmo tempo metade do preço (US$0,08 vs 0,15) e melhor avaliado. O pro é
 * dominado nos dois eixos.
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
  "fal-ai/nano-banana-2"

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
export type NanoBananaQuality = "normal" | "pro"

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
export async function generateNanoBanana(
  prompt: string,
  quality: NanoBananaQuality = "normal",
): Promise<NanoBananaResult> {
  ensureConfigured()
  const start = performance.now()

  const isCover = quality === "pro"
  const model = isCover ? NANO_BANANA_COVER_MODEL : NANO_BANANA_MODEL

  const result = await fal.subscribe(model, {
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
    // (2K = 1,5× = $0.12 — ver COVER_RESOLUTION acima).
    costUsd: isCover ? (COVER_RESOLUTION === "2K" ? 0.12 : 0.08) : 0.039,
    ms,
    model,
  }
}
