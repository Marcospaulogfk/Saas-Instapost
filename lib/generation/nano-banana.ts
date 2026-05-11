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
 * Modelo do Fal.ai pra Nano Banana / Gemini Image.
 * IDs comuns:
 *  - "fal-ai/nano-banana"      → Nano Banana 1 (Gemini 2.5 Flash Image)
 *  - "fal-ai/nano-banana-pro"  → Nano Banana 2 (Gemini 3 Pro Image)
 * Override via env: FAL_NANO_BANANA_MODEL
 */
const NANO_BANANA_MODEL =
  process.env.FAL_NANO_BANANA_MODEL || "fal-ai/nano-banana-pro"

/**
 * Gera imagem usando Nano Banana 2 (Gemini 3 Pro Image) via Fal.ai.
 * Usado nos posts únicos (modo dev / skeleton mode).
 *
 * Diferente do Flux Schnell, Nano Banana é melhor pra:
 * - Composições editoriais com texto sutil/integrado
 * - Fotos de produto / lifestyle realistas
 * - Cenas que precisam coerência semântica forte
 */
export async function generateNanoBanana(
  prompt: string,
): Promise<NanoBananaResult> {
  ensureConfigured()
  const start = performance.now()

  const result = await fal.subscribe(NANO_BANANA_MODEL, {
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
    throw new Error(`Nano Banana não retornou imagem (${NANO_BANANA_MODEL})`)
  }

  return {
    url: image.url,
    width: image.width ?? 1080,
    height: image.height ?? 1350,
    // Pricing aprox Nano Banana: $0.039/image (dependendo do modelo)
    costUsd: 0.039,
    ms,
    model: NANO_BANANA_MODEL,
  }
}
