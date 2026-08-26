import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizarHora } from "./agenda"
import { avaliarArte, type Arte, type PecaBruta } from "./arte"

// =====================================================================
// lib/calendario/itens.ts
// Monta o ITEM do calendário — o formato que o CRM (WebSync-OS) consome.
//
// Vive fora das rotas porque o GET e o PATCH devolvem exatamente a mesma
// coisa: depois de mover um card, o CRM redesenha com a resposta do PATCH em
// vez de pedir a lista de novo. Dois montadores viveriam divergindo em
// silêncio até um campo aparecer só num dos lados.
// =====================================================================

export interface MarcaResumo {
  brand_id: string
  nome: string | null
}

export interface PublicacaoResumo {
  tentado_em: string | null
  ig_media_id: string | null
  erro: string | null
}

export interface ItemCalendario {
  id: string
  titulo: string
  descricao: string | null
  data: string
  hora: string | null
  status: string
  format: string
  network: string
  marca: MarcaResumo
  arte: {
    estado: Arte["estado"]
    motivo: string | null
    artifact_type: Arte["artifactType"]
    artifact_id: string | null
    thumb_url: string | null
    editor_url: string | null
    imagens: number
  }
  publicacao: PublicacaoResumo
  updated_at: string
}

export interface PautaRow {
  id: string
  brand_id: string
  title: string
  description: string | null
  scheduled_date: string
  scheduled_time: string | null
  status: string
  format: string
  network: string
  updated_at: string
}

/** Base absoluta do app. Env manda; o host de produção é o último recurso. */
export function editorBase(): string {
  const raw =
    process.env.WEBSYNC_EDITOR_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.nexuscontentai.com.br"
  return raw.replace(/\/+$/, "")
}

/**
 * URL do editor, pronta e absoluta. O CRM nunca monta URL nossa: se a rota do
 * editor mudar, quem atualiza é este arquivo. Mesma decisão do /status.
 */
export function editorUrlFor(
  tipo: "single_post" | "carousel" | null,
  id: string | null,
): string | null {
  if (!tipo || !id) return null
  const base = editorBase()
  return tipo === "single_post"
    ? `${base}/dashboard/editor/post-unico?post=${id}`
    : `${base}/dashboard/carrossel?id=${id}`
}

interface PecaComData {
  peca: PecaBruta
  createdAt: string
}

/** Mais recente vence: gerar duas vezes a mesma pauta não confunde o CRM. */
function registrar(mapa: Map<string, PecaComData>, pautaId: string, cand: PecaComData) {
  const atual = mapa.get(pautaId)
  if (!atual || cand.createdAt > atual.createdAt) mapa.set(pautaId, cand)
}

/**
 * Busca, pra um conjunto de pautas: a arte de cada uma e a última tentativa de
 * publicação. Uma consulta por tabela — não uma por item.
 */
export async function montarItens(
  admin: SupabaseClient,
  pautas: PautaRow[],
  marcas: Map<string, string | null>,
): Promise<ItemCalendario[]> {
  const ids = pautas.map((p) => p.id)
  const artes = new Map<string, PecaComData>()
  const publicacoes = new Map<string, PublicacaoResumo>()

  if (ids.length > 0) {
    const [posts, carrosseis, tentativas] = await Promise.all([
      admin
        .from("single_posts")
        .select(
          "id, scheduled_post_id, publish_image_urls, publish_prepared_at, rendered_image_url, updated_at, created_at",
        )
        .in("scheduled_post_id", ids),
      admin
        .from("editorial_carousels")
        .select(
          "id, scheduled_post_id, publish_image_urls, publish_prepared_at, updated_at, created_at, cover:carousel_data->>coverImageUrl",
        )
        .in("scheduled_post_id", ids),
      admin
        .from("publish_attempts")
        .select("scheduled_post_id, attempted_at, ok, ig_media_id, error")
        .in("scheduled_post_id", ids)
        .order("attempted_at", { ascending: false }),
    ])

    for (const p of posts.data ?? []) {
      if (!p.scheduled_post_id) continue
      registrar(artes, p.scheduled_post_id, {
        createdAt: p.created_at,
        peca: {
          tipo: "single_post",
          id: p.id,
          publishImageUrls: p.publish_image_urls ?? null,
          publishPreparedAt: p.publish_prepared_at ?? null,
          thumbUrl: p.rendered_image_url ?? null,
          updatedAt: p.updated_at ?? null,
        },
      })
    }

    for (const c of (carrosseis.data ?? []) as unknown as Array<{
      id: string
      scheduled_post_id: string | null
      publish_image_urls: string[] | null
      publish_prepared_at: string | null
      updated_at: string | null
      created_at: string
      cover: string | null
    }>) {
      if (!c.scheduled_post_id) continue
      registrar(artes, c.scheduled_post_id, {
        createdAt: c.created_at,
        peca: {
          tipo: "carousel",
          id: c.id,
          publishImageUrls: c.publish_image_urls ?? null,
          publishPreparedAt: c.publish_prepared_at ?? null,
          thumbUrl: c.cover ?? null,
          updatedAt: c.updated_at ?? null,
        },
      })
    }

    // Já vem ordenada por data decrescente: a primeira de cada pauta é a mais
    // recente, e é a única que interessa ao card.
    for (const t of tentativas.data ?? []) {
      if (!t.scheduled_post_id || publicacoes.has(t.scheduled_post_id)) continue
      publicacoes.set(t.scheduled_post_id, {
        tentado_em: t.attempted_at,
        ig_media_id: t.ok ? (t.ig_media_id ?? null) : null,
        erro: t.ok ? null : (t.error ?? null),
      })
    }
  }

  return pautas.map((p) => {
    const arte = avaliarArte(artes.get(p.id)?.peca ?? null)
    return {
      id: p.id,
      titulo: p.title,
      descricao: p.description ?? null,
      data: p.scheduled_date,
      hora: normalizarHora(p.scheduled_time),
      status: p.status,
      format: p.format,
      network: p.network,
      marca: { brand_id: p.brand_id, nome: marcas.get(p.brand_id) ?? null },
      arte: {
        estado: arte.estado,
        motivo: arte.motivo,
        artifact_type: arte.artifactType,
        artifact_id: arte.artifactId,
        thumb_url: arte.thumbUrl,
        editor_url: editorUrlFor(arte.artifactType, arte.artifactId),
        imagens: arte.imagens.length,
      },
      publicacao: publicacoes.get(p.id) ?? {
        tentado_em: null,
        ig_media_id: null,
        erro: null,
      },
      updated_at: p.updated_at,
    }
  })
}

export const CAMPOS_PAUTA =
  "id, brand_id, title, description, scheduled_date, scheduled_time, status, format, network, updated_at"
