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

export interface FalResult {
  url: string
  width: number
  height: number
  costUsd: number
  ms: number
}

export async function generateImage(prompt: string): Promise<FalResult> {
  ensureConfigured()

  const start = performance.now()
  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: "portrait_4_3",
      num_inference_steps: 4,
      enable_safety_checker: false,
      num_images: 1,
    },
    logs: false,
  })
  const ms = performance.now() - start

  const image = (result.data as { images?: Array<{ url: string; width?: number; height?: number }> })
    ?.images?.[0]
  if (!image?.url) {
    throw new Error("Fal nao retornou imagem")
  }

  return {
    url: image.url,
    width: image.width ?? 768,
    height: image.height ?? 1024,
    costUsd: 0.003,
    ms,
  }
}
