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
 * IDs comuns:
 *  - "fal-ai/nano-banana"      → Nano Banana 1 (Gemini 2.5 Flash Image) — NORMAL
 *  - "fal-ai/nano-banana-pro"  → Nano Banana 2 (Gemini 3 Pro Image)     — PRO
 * Override via env: FAL_NANO_BANANA_MODEL (normal) / FAL_NANO_BANANA_PRO_MODEL (pro)
 */
const NANO_BANANA_MODEL =
  process.env.FAL_NANO_BANANA_MODEL || "fal-ai/nano-banana"
const NANO_BANANA_PRO_MODEL =
  process.env.FAL_NANO_BANANA_PRO_MODEL || "fal-ai/nano-banana-pro"

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

  const model = quality === "pro" ? NANO_BANANA_PRO_MODEL : NANO_BANANA_MODEL

  const result = await fal.subscribe(model, {
    input: {
      prompt,
      num_images: 1,
      output_format: "jpeg",
      aspect_ratio: "4:5",
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

  return {
    url: image.url,
    width: image.width ?? 1080,
    height: image.height ?? 1350,
    // Pricing aprox Fal.ai: normal ~$0.039/img · pro ~$0.15/img (ver doc §2)
    costUsd: quality === "pro" ? 0.15 : 0.039,
    ms,
    model,
  }
}
