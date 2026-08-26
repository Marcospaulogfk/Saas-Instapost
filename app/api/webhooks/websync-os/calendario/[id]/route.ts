import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"
import { dataValida, horaValida, instanteAgendado, normalizarHora } from "@/lib/calendario/agenda"
import { avaliarArte, podeAgendar, type PecaBruta } from "@/lib/calendario/arte"
import { CAMPOS_PAUTA, montarItens, type PautaRow } from "@/lib/calendario/itens"
import { erroJson, pedidoRuim, recusa } from "@/lib/calendario/resposta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// =====================================================================
// PATCH /api/webhooks/websync-os/calendario/<id>   { data?, hora?, status?, updated_at? }
//
// Mover um card no calendário do CRM muda a data AQUI, que é a única. Não há
// segunda verdade pra reconciliar depois.
//
// AS REGRAS SÃO RECUSA, NÃO AVISO. Cada uma existe por um desfecho concreto:
//
//  campo_nao_seu ......... 'publicado' e 'falhou' quem escreve é o worker. Se
//                          o CRM pudesse escrever, criaria a mentira que o
//                          desenho inteiro tenta evitar.
//  ja_publicado .......... data de coisa publicada não é agendamento, é
//                          histórico. Mover reescreveria o passado.
//  sem_hora .............. `scheduled_time` é nullable e quase nenhuma linha
//                          tem hora. Sem exigir aqui, o worker ou publica tudo
//                          à meia-noite ou não publica nada.
//  sem_arte_publicavel ... agendar peça sem arte final é marcar um encontro
//                          que não vai acontecer. O aviso tem que ser agora,
//                          não no dia.
//  data_no_passado ....... um arrastar de card pra trás criaria peça que já
//                          nasce vencida, e o worker carimbaria 'falhou' em
//                          cima do gesto do dono.
//  desatualizado ......... o Marcos vai ter o CRM numa aba e o editor na
//                          outra. Última escrita vence é perder edição sem
//                          ninguém ver. Devolve o item novo junto, pra tela
//                          conseguir se redesenhar sem uma segunda chamada.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const STATUS_EDITORIAIS = new Set(["ideia", "em_criacao", "pronto", "agendado"])
const STATUS_DO_WORKER = new Set(["publicado", "falhou"])

interface Corpo {
  data?: string
  hora?: string | null
  status?: string
  updated_at?: string
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/calendario] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return erroJson(503, "nao_configurado", "webhook não configurado neste ambiente")
  }
  if (req.headers.get(SECRET_HEADER) !== expected) {
    return erroJson(401, "nao_autorizado", "segredo ausente ou inválido")
  }

  const { id } = await params
  let corpo: Corpo
  try {
    corpo = (await req.json()) as Corpo
  } catch {
    return pedidoRuim("json_invalido", "corpo não é JSON válido")
  }

  const querData = corpo.data !== undefined
  const querHora = corpo.hora !== undefined
  const querStatus = corpo.status !== undefined
  if (!querData && !querHora && !querStatus) {
    return pedidoRuim("nada_pra_mudar", "informe data, hora ou status")
  }
  if (querData && !dataValida(corpo.data ?? "")) {
    return pedidoRuim("data_invalida", "data inválida (use YYYY-MM-DD)")
  }
  if (querHora && corpo.hora !== null && !horaValida(corpo.hora ?? "")) {
    return pedidoRuim("hora_invalida", "hora inválida (use HH:MM)")
  }
  if (querStatus && STATUS_DO_WORKER.has(corpo.status ?? "")) {
    return recusa(
      "campo_nao_seu",
      "'publicado' e 'falhou' são escritos pelo Nexus quando a publicação acontece: o CRM lê, não escreve",
    )
  }
  if (querStatus && !STATUS_EDITORIAIS.has(corpo.status ?? "")) {
    return pedidoRuim("status_desconhecido", `status desconhecido: ${corpo.status}`)
  }

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) return erroJson(409, "dono_indefinido", dono.motivo)

  const { data: brands } = await admin
    .from("brands")
    .select("id, name")
    .eq("user_id", dono.ownerId)
  const marcas = new Map<string, string | null>()
  for (const b of brands ?? []) marcas.set(b.id, b.name ?? null)

  const { data: atual, error: erroLeitura } = await admin
    .from("scheduled_posts")
    .select(CAMPOS_PAUTA)
    .eq("id", id)
    .maybeSingle()
  if (erroLeitura) {
    console.error("[websync-os/calendario] falha ao ler pauta:", erroLeitura.message)
    return erroJson(500, "falha_interna", "falha ao ler a pauta")
  }
  // Pauta de outro dono responde igual a pauta inexistente: o CRM não precisa
  // saber que aquele id existe em outra conta.
  if (!atual || !marcas.has((atual as PautaRow).brand_id)) {
    return erroJson(
      404,
      "nao_encontrado",
      "esta pauta não existe (ou não é desta conta): o card não deveria mais estar no calendário",
    )
  }
  const pauta = atual as PautaRow

  if (corpo.updated_at && corpo.updated_at !== pauta.updated_at) {
    const [item] = await montarItens(admin, [pauta], marcas)
    return recusa(
      "desatualizado",
      "esta pauta mudou no Nexus depois que você carregou o calendário",
      { item },
    )
  }

  if (pauta.status === "publicado") {
    return recusa(
      "ja_publicado",
      "esta peça já foi publicada: a data dela agora é histórico, não agendamento",
    )
  }

  const dataNova = querData ? (corpo.data as string) : pauta.scheduled_date
  const horaNova = querHora
    ? normalizarHora(corpo.hora)
    : normalizarHora(pauta.scheduled_time)
  const statusNovo = querStatus ? (corpo.status as string) : pauta.status

  // Só validamos relógio e arte pra quem VAI ficar agendado. Planejar no
  // passado é legítimo (registrar o que já foi feito); agendar, não.
  if (statusNovo === "agendado") {
    if (!horaNova) {
      return recusa(
        "sem_hora",
        "agendamento sem horário não publica: defina a hora antes de agendar",
      )
    }
    const quando = instanteAgendado(dataNova, horaNova)
    if (!quando) {
      return recusa("data_no_passado", "a data e a hora do agendamento não formam um instante válido")
    }
    if (quando.getTime() <= Date.now()) {
      return recusa(
        "data_no_passado",
        "esse horário já passou: a peça nasceria vencida e o worker a marcaria como falhou",
      )
    }

    const [posts, carrosseis] = await Promise.all([
      admin
        .from("single_posts")
        .select(
          "id, publish_image_urls, publish_prepared_at, rendered_image_url, updated_at, created_at",
        )
        .eq("scheduled_post_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      admin
        .from("editorial_carousels")
        .select(
          "id, publish_image_urls, publish_prepared_at, updated_at, created_at, cover:carousel_data->>coverImageUrl",
        )
        .eq("scheduled_post_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
    ])
    const post = posts.data?.[0]
    const carrossel = (carrosseis.data?.[0] ?? null) as {
      id: string
      publish_image_urls: string[] | null
      publish_prepared_at: string | null
      updated_at: string | null
      cover: string | null
    } | null

    let peca: PecaBruta | null = null
    if (post) {
      peca = {
        tipo: "single_post",
        id: post.id,
        publishImageUrls: post.publish_image_urls ?? null,
        publishPreparedAt: post.publish_prepared_at ?? null,
        thumbUrl: post.rendered_image_url ?? null,
        updatedAt: post.updated_at ?? null,
      }
    } else if (carrossel) {
      peca = {
        tipo: "carousel",
        id: carrossel.id,
        publishImageUrls: carrossel.publish_image_urls ?? null,
        publishPreparedAt: carrossel.publish_prepared_at ?? null,
        thumbUrl: carrossel.cover ?? null,
        updatedAt: carrossel.updated_at ?? null,
      }
    }

    const arte = avaliarArte(peca)
    if (!podeAgendar(arte)) {
      return recusa(
        "sem_arte_publicavel",
        arte.motivo ?? "esta peça ainda não tem arte pronta pra publicar",
        { arte_estado: arte.estado },
      )
    }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (querData) patch.scheduled_date = dataNova
  if (querHora) patch.scheduled_time = horaNova
  if (querStatus) patch.status = statusNovo

  const { data: salvo, error } = await admin
    .from("scheduled_posts")
    .update(patch)
    .eq("id", id)
    .select(CAMPOS_PAUTA)
    .single()
  if (error) {
    console.error("[websync-os/calendario] falha ao salvar:", error.message)
    return erroJson(500, "falha_interna", "falha ao salvar a pauta")
  }

  const [item] = await montarItens(admin, [salvo as PautaRow], marcas)
  return NextResponse.json({ ok: true, item })
}
