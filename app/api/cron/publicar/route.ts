import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getValidConnection } from "@/lib/instagram/connection"
import { publishCarousel } from "@/lib/instagram/meta"
import {
  avaliarJanela,
  hojeNoFuso,
  instanteAgendado,
  motivoJanelaVencida,
  normalizarHora,
} from "@/lib/calendario/agenda"
import { avaliarArte, podeAgendar, type PecaBruta } from "@/lib/calendario/arte"
import type { SupabaseClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

// =====================================================================
// app/api/cron/publicar/route.ts
// O WORKER DO AUTO-PUBLISH. Varre o calendário e publica o que está agendado.
//
// Agendar na Coolify, do mesmo jeito que /api/cron/renovacao:
//   */15 * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
//     https://app.nexuscontentai.com.br/api/cron/publicar
//
// TRÊS FREIOS, decididos com o CEO antes de existir uma linha disto, porque
// publicar sozinho no Instagram de alguém é irreversível:
//
//   1. só publica o que está 'agendado' EXPLICITAMENTE. Peça 'pronto' não
//      basta: pronto é sobre a arte, agendado é sobre a intenção.
//   2. falha NÃO tem retentativa cega. Falhou, carimba 'falhou' com motivo
//      legível e para. Republicar é clique humano.
//   3. peça vencida NÃO publica atrasada. Se o worker ficou fora do ar e volta
//      com três posts de ontem na fila, publicar os três de uma vez é pior que
//      não publicar: vira enxurrada no perfil sem ninguém ter pedido.
//
// E um quarto, que só apareceu escrevendo: a tentativa é registrada ANTES do
// envio. Se o processo morrer entre o publish e o carimbo, a rodada seguinte
// vê a tentativa pendurada e NÃO tenta de novo — publicar duas vezes é o
// único desfecho pior que não publicar.
// =====================================================================

const TETO_POR_RODADA = 20
const PENDENTE = "em andamento"

interface Pauta {
  id: string
  brand_id: string
  title: string
  network: string
  scheduled_date: string
  scheduled_time: string | null
}

type Desfecho =
  | { id: string; resultado: "publicado"; ig_media_id: string }
  | { id: string; resultado: "falhou"; motivo: string }
  | { id: string; resultado: "adiado"; motivo: string }

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization") ?? ""
  if (auth === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get("secret") === secret
}

/** Marca a pauta. O motivo da falha mora em publish_attempts. */
async function carimbar(
  admin: SupabaseClient,
  pautaId: string,
  status: "publicado" | "falhou",
): Promise<void> {
  const { error } = await admin
    .from("scheduled_posts")
    .update({ status })
    .eq("id", pautaId)
  if (error) console.error("[cron/publicar] falha ao carimbar", pautaId, error.message)
}

/** A arte da pauta: a mais recente entre post único e carrossel. */
async function arteDaPauta(admin: SupabaseClient, pautaId: string) {
  const [posts, carrosseis] = await Promise.all([
    admin
      .from("single_posts")
      .select(
        "id, publish_image_urls, publish_prepared_at, rendered_image_url, updated_at, content",
      )
      .eq("scheduled_post_id", pautaId)
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("editorial_carousels")
      .select("id, publish_image_urls, publish_prepared_at, updated_at, carousel_data")
      .eq("scheduled_post_id", pautaId)
      .order("created_at", { ascending: false })
      .limit(1),
  ])

  const post = posts.data?.[0]
  const carrossel = carrosseis.data?.[0]

  // Mais recente vence: gerar duas artes pra mesma pauta não pode publicar as
  // duas nem escolher a antiga.
  const escolhePost =
    post &&
    (!carrossel ||
      new Date(post.updated_at ?? 0).getTime() >=
        new Date(carrossel.updated_at ?? 0).getTime())

  if (escolhePost && post) {
    const content = (post.content ?? {}) as Record<string, unknown>
    const peca: PecaBruta = {
      tipo: "single_post",
      id: post.id,
      publishImageUrls: post.publish_image_urls ?? null,
      publishPreparedAt: post.publish_prepared_at ?? null,
      thumbUrl: post.rendered_image_url ?? null,
      updatedAt: post.updated_at ?? null,
    }
    return { peca, caption: String(content._caption ?? "") }
  }

  if (carrossel) {
    const data = (carrossel.carousel_data ?? {}) as Record<string, unknown>
    const peca: PecaBruta = {
      tipo: "carousel",
      id: carrossel.id,
      publishImageUrls: carrossel.publish_image_urls ?? null,
      publishPreparedAt: carrossel.publish_prepared_at ?? null,
      thumbUrl: (data.coverImageUrl as string | null) ?? null,
      updatedAt: carrossel.updated_at ?? null,
    }
    return { peca, caption: String(data.caption ?? "") }
  }

  return { peca: null, caption: "" }
}

async function publicarUma(
  admin: SupabaseClient,
  pauta: Pauta,
  agora: Date,
): Promise<Desfecho> {
  const falhar = async (motivo: string): Promise<Desfecho> => {
    await admin.from("publish_attempts").insert({
      scheduled_post_id: pauta.id,
      ok: false,
      error: motivo,
    })
    await carimbar(admin, pauta.id, "falhou")
    return { id: pauta.id, resultado: "falhou", motivo }
  }

  // --- Relógio ---------------------------------------------------------
  const hora = normalizarHora(pauta.scheduled_time)
  if (!hora) {
    return falhar(
      "a peça está agendada sem horário: defina a hora no calendário pra ela poder publicar",
    )
  }
  const quando = instanteAgendado(pauta.scheduled_date, hora)
  if (!quando) return falhar("a data ou a hora do agendamento é inválida")

  const janela = avaliarJanela(quando, agora)
  if (janela.estado === "cedo") {
    return { id: pauta.id, resultado: "adiado", motivo: "ainda não chegou a hora" }
  }
  if (janela.estado === "vencida") return falhar(motivoJanelaVencida(janela.atrasoMin))

  // --- Rede ------------------------------------------------------------
  if (pauta.network !== "instagram") {
    return falhar(
      `publicação automática existe só pro Instagram hoje (esta pauta é de ${pauta.network})`,
    )
  }

  // --- Tentativa anterior pendurada -------------------------------------
  // Publicar duas vezes é pior que não publicar: se a rodada passada morreu
  // depois de mandar pra Meta, nós não sabemos se saiu. Paramos e avisamos.
  const { data: pendentes } = await admin
    .from("publish_attempts")
    .select("id")
    .eq("scheduled_post_id", pauta.id)
    .eq("ok", false)
    .eq("error", PENDENTE)
    .limit(1)
  if (pendentes && pendentes.length > 0) {
    return falhar(
      "uma tentativa anterior não terminou: confira no Instagram se o post saiu antes de reagendar",
    )
  }

  // --- Arte -------------------------------------------------------------
  const { peca, caption } = await arteDaPauta(admin, pauta.id)
  const arte = avaliarArte(peca)
  if (!podeAgendar(arte)) {
    return falhar(arte.motivo ?? "a peça não tem arte publicável")
  }

  // --- Conta do Instagram ------------------------------------------------
  const { data: brand } = await admin
    .from("brands")
    .select("user_id")
    .eq("id", pauta.brand_id)
    .maybeSingle()
  if (!brand?.user_id) return falhar("a marca desta pauta não existe mais")

  let conn
  try {
    conn = await getValidConnection(admin, brand.user_id)
  } catch (e) {
    return falhar(e instanceof Error ? e.message : "conexão do Instagram inválida")
  }
  if (!conn) {
    return falhar("não há conta do Instagram conectada pra publicar esta pauta")
  }

  // --- Envio -------------------------------------------------------------
  const { data: tentativa } = await admin
    .from("publish_attempts")
    .insert({
      scheduled_post_id: pauta.id,
      ok: false,
      error: PENDENTE,
      image_count: arte.imagens.length,
    })
    .select("id")
    .single()

  try {
    const res = await publishCarousel(
      conn.igUserId,
      conn.accessToken,
      arte.imagens,
      caption,
    )
    if (tentativa?.id) {
      await admin
        .from("publish_attempts")
        .update({ ok: true, ig_media_id: res.id, error: null })
        .eq("id", tentativa.id)
    }
    // Mesmo registro da publicação manual: é o que liga métrica a conteúdo
    // gerado aqui. Best-effort — falhar aqui não desfaz o que já foi publicado.
    await admin
      .from("instagram_publications")
      .insert({
        user_id: brand.user_id,
        ig_user_id: conn.igUserId,
        ig_media_id: res.id,
        caption,
        image_count: arte.imagens.length,
      })
      .then(({ error }) => {
        if (error) console.warn("[cron/publicar] registro falhou", error.message)
      })
    await carimbar(admin, pauta.id, "publicado")
    return { id: pauta.id, resultado: "publicado", ig_media_id: res.id }
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "erro ao publicar"
    if (tentativa?.id) {
      await admin.from("publish_attempts").update({ error: motivo }).eq("id", tentativa.id)
      await carimbar(admin, pauta.id, "falhou")
      return { id: pauta.id, resultado: "falhou", motivo }
    }
    return falhar(motivo)
  }
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: "nao_autorizado" }, { status: 401 })
  }

  const agora = new Date()
  const admin = createAdminClient()

  // `scheduled_date <= hoje` no fuso do Brasil, não no do container (UTC).
  const { data: pautas, error } = await admin
    .from("scheduled_posts")
    .select("id, brand_id, title, network, scheduled_date, scheduled_time")
    .eq("status", "agendado")
    .lte("scheduled_date", hojeNoFuso(agora))
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true })
    .limit(TETO_POR_RODADA)

  if (error) {
    console.error("[cron/publicar] falha ao ler o calendário:", error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // Sequencial de propósito: a Meta tem limite de chamadas e um carrossel são
  // N+2 requisições. Paralelizar aqui trocaria "demora" por "erro de cota".
  const desfechos: Desfecho[] = []
  for (const pauta of (pautas ?? []) as Pauta[]) {
    desfechos.push(await publicarUma(admin, pauta, agora))
  }

  const resumo = {
    publicados: desfechos.filter((d) => d.resultado === "publicado").length,
    falhas: desfechos.filter((d) => d.resultado === "falhou").length,
    adiados: desfechos.filter((d) => d.resultado === "adiado").length,
  }
  if (resumo.publicados || resumo.falhas) {
    console.log("[cron/publicar]", JSON.stringify(resumo))
  }
  return NextResponse.json({ ok: true, ...resumo, desfechos })
}

export const POST = GET
