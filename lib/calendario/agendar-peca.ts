import type { SupabaseClient } from "@supabase/supabase-js"
import { validarEdicaoPauta } from "@/lib/pautas/editar"
import type { PostStatus } from "@/lib/planejar"
import { toPostFormat } from "@/lib/single-posts/formats"
import { avaliarArte, podeAgendar, type PecaBruta } from "./arte"
import type { TipoPeca } from "./publicacao-manual"

// =====================================================================
// lib/calendario/agendar-peca.ts
// Agendar direto do editor: dia e hora escolhidos em cima da peça.
//
// Antes, o editor só tinha o "Preparar pra agendar": guardava a arte, o botão
// virava "Pronto pra agendar" e parava ali. Peça feita direto no editor não tem
// pauta, então não aparecia no calendário e não havia onde marcar o horário
// (relato do Reinaldo de 22/10). O worker (/api/cron/publicar) só enxerga
// pauta 'agendado'.
//
// Aqui a peça ganha a pauta que faltava, ou reaproveita a que já tem. Usa o
// cliente do USUÁRIO de propósito: quem garante o dono é o RLS.
// =====================================================================

export interface PedidoAgendar {
  tipo: TipoPeca
  pecaId: string
  data: string
  hora: string
}

export type ResultadoAgendar =
  | { ok: true; pautaId: string; stories: boolean }
  | { ok: false; error: string }

interface PecaLida {
  bruta: PecaBruta
  titulo: string
  brandId: string | null
  brandName: string | null
  pautaId: string | null
  stories: boolean
}

async function lerPeca(
  supabase: SupabaseClient,
  userId: string,
  tipo: TipoPeca,
  id: string,
): Promise<PecaLida | null> {
  if (tipo === "single_post") {
    const { data } = await supabase
      .from("single_posts")
      .select(
        "id, brand_id, title, content, publish_image_urls, publish_prepared_at, rendered_image_url, updated_at, scheduled_post_id",
      )
      .eq("id", id)
      .maybeSingle()
    if (!data) return null
    const content = (data.content ?? {}) as Record<string, unknown>
    return {
      bruta: {
        tipo,
        id: data.id,
        publishImageUrls: data.publish_image_urls ?? null,
        publishPreparedAt: data.publish_prepared_at ?? null,
        thumbUrl: data.rendered_image_url ?? null,
        updatedAt: data.updated_at ?? null,
      },
      titulo: data.title || "Post",
      brandId: data.brand_id ?? null,
      brandName: null,
      pautaId: data.scheduled_post_id ?? null,
      stories: toPostFormat(content._format) === "story",
    }
  }

  const { data } = await supabase
    .from("editorial_carousels")
    .select(
      "id, topic, brand_name, carousel_data, publish_image_urls, publish_prepared_at, updated_at, scheduled_post_id",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()
  if (!data) return null
  const dados = (data.carousel_data ?? {}) as Record<string, unknown>
  return {
    bruta: {
      tipo,
      id: data.id,
      publishImageUrls: data.publish_image_urls ?? null,
      publishPreparedAt: data.publish_prepared_at ?? null,
      thumbUrl: (dados.coverImageUrl as string | null) ?? null,
      updatedAt: data.updated_at ?? null,
    },
    titulo: data.topic || "Carrossel",
    brandId: null,
    brandName: data.brand_name ?? null,
    pautaId: data.scheduled_post_id ?? null,
    stories: dados.format === "stories",
  }
}

/** Carrossel não guarda a marca por id, só o nome: acha a marca do dono por ele. */
async function marcaDaPeca(
  supabase: SupabaseClient,
  userId: string,
  peca: PecaLida,
): Promise<string | null> {
  if (peca.brandId) return peca.brandId
  const { data } = await supabase
    .from("brands")
    .select("id, name")
    .eq("user_id", userId)
    .order("name")
    .limit(50)
  const marcas = (data ?? []) as Array<{ id: string; name: string | null }>
  return (marcas.find((m) => m.name === peca.brandName) ?? marcas[0])?.id ?? null
}

/**
 * Marca a peça pra sair no dia e hora pedidos. Espera a arte já preparada
 * (`prepararArteParaAgendar`): sem isso o worker não teria o que publicar.
 */
export async function agendarPeca(
  supabase: SupabaseClient,
  userId: string,
  pedido: PedidoAgendar,
  agora: Date = new Date(),
): Promise<ResultadoAgendar> {
  const { tipo, pecaId, data, hora } = pedido
  const peca = await lerPeca(supabase, userId, tipo, pecaId)
  if (!peca) return { ok: false, error: "Peça não encontrada. Salve e tente de novo." }

  // Vínculo com pauta apagada conta como sem pauta: agendar cria outra.
  let pautaAtual: { id: string; status: PostStatus } | null = null
  if (peca.pautaId) {
    const { data: pauta } = await supabase
      .from("scheduled_posts")
      .select("id, status")
      .eq("id", peca.pautaId)
      .maybeSingle()
    pautaAtual = (pauta as { id: string; status: PostStatus } | null) ?? null
  }

  const recusa = validarEdicaoPauta(
    { statusAtual: pautaAtual?.status ?? "ideia", status: "agendado", data, hora },
    agora,
  )
  if (recusa) return { ok: false, error: recusa }

  const arte = avaliarArte(peca.bruta)
  if (!podeAgendar(arte)) {
    return { ok: false, error: arte.motivo ?? "Esta peça ainda não tem arte pronta pra publicar." }
  }

  // Sem conta conectada o agendamento só falharia na hora marcada, sem ninguém olhando.
  const { data: conexao } = await supabase
    .from("instagram_connections")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (!conexao) {
    return { ok: false, error: "Conecte o Instagram antes de agendar: é pra lá que a peça vai sair." }
  }

  const marcacao = {
    scheduled_date: data,
    scheduled_time: hora,
    status: "agendado",
    format: peca.stories ? "stories" : tipo === "carousel" ? "carrossel" : "post",
    network: "instagram",
  }

  if (pautaAtual) {
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ ...marcacao, updated_at: agora.toISOString() })
      .eq("id", pautaAtual.id)
    if (error) return { ok: false, error: "Não consegui agendar. Tente de novo." }
    return { ok: true, pautaId: pautaAtual.id, stories: peca.stories }
  }

  const brandId = await marcaDaPeca(supabase, userId, peca)
  if (!brandId) return { ok: false, error: "Cadastre uma marca antes de agendar." }

  const { data: criada, error: erroCriar } = await supabase
    .from("scheduled_posts")
    .insert({
      ...marcacao,
      brand_id: brandId,
      title: peca.titulo.slice(0, 200),
      source: "manual",
    })
    .select("id")
    .single()
  if (erroCriar || !criada) return { ok: false, error: "Não consegui agendar. Tente de novo." }

  const { error: erroVinculo } = await supabase
    .from(tipo === "carousel" ? "editorial_carousels" : "single_posts")
    .update({ scheduled_post_id: criada.id })
    .eq("id", pecaId)
  if (erroVinculo) {
    // Pauta sem peça ligada viraria uma falha na hora marcada.
    await supabase.from("scheduled_posts").delete().eq("id", criada.id)
    return { ok: false, error: "Não consegui agendar. Tente de novo." }
  }

  return { ok: true, pautaId: criada.id, stories: peca.stories }
}
