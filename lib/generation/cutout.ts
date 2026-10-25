// =====================================================================
// Recorte de fundo (Fal.ai): devolve a foto como PNG sem fundo, pra o
// assunto "sair" do quadro nos estilos que usam foto recortada (Geométrico,
// Colagem, Agência, Cartaz, Pôster) e em qualquer outro estilo.
//
// Modelo principal: BiRefNet v2 (bom em pessoas, produtos e objetos). Se
// falhar, tenta o rembg, mais simples. A URL devolvida é da fal.media, igual
// às imagens geradas por IA (o export passa pelo /api/proxy-image).
// =====================================================================
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

export interface CutoutResult {
  url: string
  model: string
  costUsd: number
  ms: number
}

const MODELS = [
  {
    id: "fal-ai/birefnet/v2",
    costUsd: 0.002,
    input: (image_url: string) => ({
      image_url,
      model: "General Use (Light)",
      operating_resolution: "1024x1024",
      refine_foreground: true,
      output_format: "png",
    }),
  },
  {
    id: "fal-ai/imageutils/rembg",
    costUsd: 0.001,
    input: (image_url: string) => ({ image_url }),
  },
] as const

/**
 * URL que a Fal consegue baixar: precisa ser pública e absoluta. A foto que o
 * editor mostra pode vir embrulhada no proxy da casa (/api/proxy-image?url=…):
 * aí devolve a URL original de dentro.
 */
export function publicImageUrl(raw: string): string | null {
  const s = (raw ?? "").trim()
  if (!s) return null
  try {
    const u = new URL(s, "http://local.invalid")
    if (u.pathname === "/api/proxy-image" && u.searchParams.get("url")) {
      return publicImageUrl(u.searchParams.get("url")!)
    }
    if (u.host === "local.invalid") return null // caminho relativo: só existe aqui
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    return u.toString()
  } catch {
    return null
  }
}

export async function removeBackground(imageUrl: string): Promise<CutoutResult> {
  ensureConfigured()
  let lastError: unknown
  for (const m of MODELS) {
    const start = performance.now()
    try {
      const result = await fal.subscribe(m.id, { input: m.input(imageUrl), logs: false })
      const url = (result.data as { image?: { url?: string } } | undefined)?.image?.url
      if (!url) throw new Error("Fal não devolveu a imagem recortada")
      return { url, model: m.id, costUsd: m.costUsd, ms: performance.now() - start }
    } catch (err) {
      lastError = err
      console.warn(
        `[cutout] ${m.id} falhou: ${err instanceof Error ? err.message : "erro"}`,
      )
    }
  }
  throw lastError instanceof Error ? lastError : new Error("falha ao recortar o fundo")
}
