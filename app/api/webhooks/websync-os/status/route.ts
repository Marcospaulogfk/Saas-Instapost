import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"

export const runtime = "nodejs"

// =====================================================================
// GET /api/webhooks/websync-os/status?ids=a,b,c   (a Ponte, volta — 26/08/2026)
//
// O CRM manda a pauta (POST ../websync-os) e depois precisa saber se ela virou
// ARTE aqui, pra mover o card e mostrar miniatura. Isso não existia: a coluna
// `scheduled_posts.project_id` (0009) sugeria o vínculo, mas nunca foi escrita
// por código nenhum — coluna que existe não é coluna preenchida. O vínculo real
// veio na migration 0023, nas tabelas onde a arte mora.
//
// Contrato (fechado com a sessão do CRM):
//   { ok: true, itens: [{
//       id, resultado: "ok" | "nao_encontrado", status,
//       artifact_type: "single_post" | "carousel" | null,
//       artifact_id, thumb_url, editor_url }] }
//
// - `nao_encontrado` é ESTADO, não erro: é a peça que atravessou antes do
//   vínculo existir. O consumidor registra e deixa o card onde está.
// - `artifact_id` preenchido com `thumb_url` null = a arte existe, a miniatura
//   ainda não (carrossel salvo antes da capa ser composta). O card vai sem foto.
// - `editor_url` vem PRONTO e absoluto: se a rota do editor mudar, quem
//   atualiza é este endpoint — o CRM nunca monta URL.
//
// Mesma autenticação e mesmo guard de dono do POST: a service_role enxerga
// brands de clientes, e responder o estado de peça alheia é vazamento.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const MAX_IDS = 50
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Base absoluta do app. Env manda; o host de produção é o último recurso. */
function editorBase(): string {
  const raw =
    process.env.WEBSYNC_EDITOR_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.nexuscontentai.com.br"
  return raw.replace(/\/+$/, "")
}

type ArtifactType = "single_post" | "carousel"

interface Artefato {
  type: ArtifactType
  id: string
  thumb: string | null
  createdAt: string
}

interface ItemStatus {
  id: string
  resultado: "ok" | "nao_encontrado"
  status: string | null
  artifact_type: ArtifactType | null
  artifact_id: string | null
  thumb_url: string | null
  editor_url: string | null
}

function editorUrlFor(a: Artefato): string {
  const base = editorBase()
  return a.type === "single_post"
    ? `${base}/dashboard/editor/post-unico?post=${a.id}`
    : `${base}/dashboard/carrossel?id=${a.id}`
}

/** Mais recente vence: gerar duas vezes a mesma pauta não confunde o CRM. */
function registrar(
  mapa: Map<string, Artefato>,
  pautaId: string,
  candidato: Artefato,
): void {
  const atual = mapa.get(pautaId)
  if (!atual || candidato.createdAt > atual.createdAt) {
    mapa.set(pautaId, candidato)
  }
}

export async function GET(req: Request) {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/status] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return NextResponse.json({ error: "webhook não configurado" }, { status: 503 })
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[websync-os/status] secret inválido")
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  const url = new URL(req.url)
  const brutos = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (brutos.length === 0) {
    return NextResponse.json(
      { error: "informe ?ids=<uuid>[,<uuid>...]" },
      { status: 400 },
    )
  }
  if (brutos.length > MAX_IDS) {
    return NextResponse.json(
      { error: `máximo de ${MAX_IDS} ids por chamada (vieram ${brutos.length})` },
      { status: 400 },
    )
  }
  // Id fora do formato uuid não vai pro banco: `.in()` com lixo derruba a
  // consulta inteira em erro de sintaxe, e um id ruim mataria o lote todo.
  const pedidos = [...new Set(brutos)]
  const ids = pedidos.filter((id) => UUID_RE.test(id))

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) {
    return NextResponse.json({ error: dono.motivo }, { status: 409 })
  }

  const { data: brands, error: brandsError } = await admin
    .from("brands")
    .select("id")
    .eq("user_id", dono.ownerId)
  if (brandsError) {
    console.error("[websync-os/status] falha ao ler brands:", brandsError.message)
    return NextResponse.json({ error: "falha ao ler brands" }, { status: 500 })
  }
  const brandIds = (brands ?? []).map((b) => b.id)

  const encontrados = new Map<string, string>()
  const artefatos = new Map<string, Artefato>()

  if (ids.length > 0 && brandIds.length > 0) {
    const { data: pautas, error: pautasError } = await admin
      .from("scheduled_posts")
      .select("id, status")
      .in("id", ids)
      .in("brand_id", brandIds)
    if (pautasError) {
      console.error("[websync-os/status] falha ao ler pautas:", pautasError.message)
      return NextResponse.json({ error: "falha ao ler pautas" }, { status: 500 })
    }
    for (const p of pautas ?? []) encontrados.set(p.id, p.status)

    const { data: posts, error: postsError } = await admin
      .from("single_posts")
      .select("id, scheduled_post_id, rendered_image_url, created_at")
      .in("scheduled_post_id", ids)
      .in("brand_id", brandIds)
    if (postsError) {
      console.error(
        "[websync-os/status] falha ao ler single_posts:",
        postsError.message,
      )
      return NextResponse.json({ error: "falha ao ler artes" }, { status: 500 })
    }
    for (const p of posts ?? []) {
      if (!p.scheduled_post_id) continue
      registrar(artefatos, p.scheduled_post_id, {
        type: "single_post",
        id: p.id,
        thumb: p.rendered_image_url ?? null,
        createdAt: p.created_at,
      })
    }

    // `editorial_carousels` não tem coluna de thumb: a capa composta mora
    // dentro do JSONB. O `->>` evita trazer o carousel_data inteiro (slides,
    // textos e urls) só pra ler um campo.
    const { data: carrosseis, error: carrosseisError } = await admin
      .from("editorial_carousels")
      .select("id, scheduled_post_id, created_at, cover:carousel_data->>coverImageUrl")
      .in("scheduled_post_id", ids)
      .eq("user_id", dono.ownerId)
    if (carrosseisError) {
      console.error(
        "[websync-os/status] falha ao ler editorial_carousels:",
        carrosseisError.message,
      )
      return NextResponse.json({ error: "falha ao ler artes" }, { status: 500 })
    }
    for (const c of (carrosseis ?? []) as unknown as Array<{
      id: string
      scheduled_post_id: string | null
      created_at: string
      cover: string | null
    }>) {
      if (!c.scheduled_post_id) continue
      registrar(artefatos, c.scheduled_post_id, {
        type: "carousel",
        id: c.id,
        thumb: c.cover ?? null,
        createdAt: c.created_at,
      })
    }
  }

  // Um item por id PEDIDO, na ordem em que veio — inclusive os inválidos e os
  // que não são deste dono, como `nao_encontrado`.
  const itens: ItemStatus[] = pedidos.map((id) => {
    const status = encontrados.get(id)
    if (status === undefined) {
      return {
        id,
        resultado: "nao_encontrado",
        status: null,
        artifact_type: null,
        artifact_id: null,
        thumb_url: null,
        editor_url: null,
      }
    }
    const arte = artefatos.get(id)
    return {
      id,
      resultado: "ok",
      status,
      artifact_type: arte?.type ?? null,
      artifact_id: arte?.id ?? null,
      thumb_url: arte?.thumb ?? null,
      editor_url: arte ? editorUrlFor(arte) : null,
    }
  })

  const comArte = itens.filter((i) => i.artifact_id).length
  const naoEncontrados = itens.filter((i) => i.resultado === "nao_encontrado").length
  console.log(
    `[websync-os/status] ${pedidos.length} pedido(s): ` +
      `${comArte} com arte, ${naoEncontrados} não encontrado(s)`,
  )
  return NextResponse.json({ ok: true, itens })
}
