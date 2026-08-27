import { after } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"

// =====================================================================
// Fase 0 da fábrica: captura de TODA geração bitmap do post único.
//
// Chamada pelas rotas de geração no ponto de sucesso. Duas etapas:
//  1) síncrona e barata: INSERT em post_generations com a URL do Fal —
//     nunca lança (a captura jamais custa a peça que o usuário pagou);
//  2) `after()`: re-hospeda o bitmap no Storage depois da resposta ir
//     embora — a URL do Fal expira, a do Storage é o dataset.
//
// `niche` vem da profissão da brand: é o metadado que a biblioteca por
// segmento vai usar pra puxar template certo sem o usuário escolher.
// =====================================================================

export interface CapturaGeracao {
  brandId: string | null
  userId: string | null
  briefing: string | null
  niche: string | null
  content: SkeletonContent | null
  photoPrompt: string | null
  skeletonId: string | null
  /** Arte completa do nano-banana (modo bitmap). */
  artUrl: string
  imageCostUsd: number
}

/** Baixa uma URL e sobe pro bucket público; devolve a URL permanente. */
export async function rehostToStorage(
  admin: ReturnType<typeof createAdminClient>,
  url: string,
  folder: string,
  name: string,
): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download falhou (${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get("content-type") ?? "image/jpeg"
  const ext = contentType.includes("png") ? "png" : "jpg"
  const key = `${folder}/${name}-${Date.now()}.${ext}`
  const { error } = await admin.storage
    .from("editorial-uploads")
    .upload(key, buf, { contentType, upsert: false })
  if (error) throw new Error(`upload falhou: ${error.message}`)
  return admin.storage.from("editorial-uploads").getPublicUrl(key).data.publicUrl
}

/**
 * Captura best-effort: nunca lança, nunca atrasa a resposta além do INSERT.
 * O re-host roda em `after()` — se falhar, a linha fica com `art_url` null e
 * o painel da fábrica mostra a pendência (o bitmap ainda vive no Fal por um
 * tempo; o pipeline pode re-tentar o re-host enquanto a URL responder).
 */
export async function capturarGeracaoBitmap(g: CapturaGeracao): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("post_generations")
      .insert({
        brand_id: g.brandId,
        user_id: g.userId,
        briefing: g.briefing,
        niche: g.niche?.trim() || null,
        content: g.content ?? null,
        photo_prompt: g.photoPrompt,
        skeleton_id: g.skeletonId,
        fal_art_url: g.artUrl,
        image_cost_usd: g.imageCostUsd,
      })
      .select("id")
      .single()
    if (error || !data) {
      console.warn("[fabrica/capture] insert falhou:", error?.message)
      return
    }
    const genId = data.id as string

    after(async () => {
      try {
        // Pasta por dono quando há user (convenção do bucket); órfãs vão pra
        // pasta neutra da fábrica.
        const folder = g.userId ?? "fabrica"
        const hosted = await rehostToStorage(admin, g.artUrl, folder, "ger")
        await admin
          .from("post_generations")
          .update({ art_url: hosted })
          .eq("id", genId)
      } catch (err) {
        console.warn(
          `[fabrica/capture] re-host adiado falhou (gen=${genId.slice(0, 8)}):`,
          err instanceof Error ? err.message : err,
        )
      }
    })
  } catch (err) {
    console.warn("[fabrica/capture] captura falhou (ignorada):", err)
  }
}
