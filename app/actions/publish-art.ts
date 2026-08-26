"use server"

import { createClient } from "@/lib/supabase/server"
import { urlPublicavel } from "@/lib/calendario/arte"

// =====================================================================
// app/actions/publish-art.ts
// "Preparar pra agendar": persiste a ARTE FINAL da peça.
//
// Por que isso precisa existir (26/08/2026): a arte em 1080x1350 já era
// gerada e já era hospedada em URL pública nossa toda vez que alguém clicava
// "Publicar no Instagram" — e a URL era descartada logo depois. Nenhuma
// coluna recebia. Com publicação automática, o worker acorda no dia agendado
// e não tem o que mandar pra Meta: a arte final é função do DOM com o editor
// aberto, e cron não tem DOM.
//
// A solução não é render headless: é guardar o que já é produzido. O editor
// roda exatamente o mesmo render de sempre e chama isto aqui com as URLs.
// =====================================================================

export type TipoArte = "single_post" | "carousel"

export type PrepararResult =
  | { ok: true; imagens: number; preparadoEm: string }
  | { ok: false; error: string }

const MAX_IMAGENS = 10 // teto do carrossel da Meta

/**
 * Grava as URLs da arte final contra a peça salva.
 *
 * Exige peça JÁ SALVA (id): preparar arte de rascunho criaria um registro
 * órfão de imagens sem dono. E exige URL do nosso Storage público — arte
 * hospedada fora (o bitmap do Fal, por exemplo) responde 200 hoje e vence
 * sozinha, o que numa publicação agendada vira o post que não sai às 23h.
 */
export async function prepararArteParaAgendar(
  tipo: TipoArte,
  id: string,
  urls: string[],
): Promise<PrepararResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const limpas = (urls ?? []).map((u) => (u ?? "").trim()).filter(Boolean)
  if (limpas.length === 0) {
    return { ok: false, error: "Nenhuma imagem foi renderizada." }
  }
  if (limpas.length > MAX_IMAGENS) {
    return {
      ok: false,
      error: `O Instagram aceita no máximo ${MAX_IMAGENS} imagens por publicação.`,
    }
  }
  const forasteiras = limpas.filter((u) => !urlPublicavel(u))
  if (forasteiras.length > 0) {
    return {
      ok: false,
      error:
        "A arte precisa estar hospedada no nosso storage pra ser agendada: imagem de serviço externo expira antes do dia. Exporte a arte pelo editor e tente de novo.",
    }
  }

  const preparadoEm = new Date().toISOString()
  const patch = { publish_image_urls: limpas, publish_prepared_at: preparadoEm }

  // Ownership: single_posts é por brand, editorial_carousels é por user.
  // Cada um com o seu filtro — RLS já barraria, mas errar em silêncio aqui
  // seria gravar arte na peça de outra pessoa e só descobrir na publicação.
  if (tipo === "single_post") {
    const { data: post } = await supabase
      .from("single_posts")
      .select("id, brands!inner(user_id)")
      .eq("id", id)
      .maybeSingle()
    if (!post) return { ok: false, error: "Post não encontrado." }

    const { error } = await supabase.from("single_posts").update(patch).eq("id", id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from("editorial_carousels")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true, imagens: limpas.length, preparadoEm }
}
