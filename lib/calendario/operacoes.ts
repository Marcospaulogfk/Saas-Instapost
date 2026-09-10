import type { SupabaseClient } from "@supabase/supabase-js"
import { dataValida, horaValida, instanteAgendado, normalizarHora } from "./agenda"
import { avaliarArte, podeAgendar, type PecaBruta } from "./arte"
import { CAMPOS_PAUTA, montarItens, type ItemCalendario, type PautaRow } from "./itens"
import type { CodigoErro } from "./resposta"
import {
  agendarGeracao,
  lerBuscasCrm,
  lerImagensCrm,
  type ResultadoAgendamento,
} from "@/lib/websync/gerar-arte"

// =====================================================================
// lib/calendario/operacoes.ts
// O MIOLO do calendário compartilhado, sem HTTP no meio.
//
// Por que isto foi extraído das rotas (10/09/2026): agora existem DOIS
// consumidores de máquina — o webhook antigo do WebSync-OS (autenticado
// pelo segredo global de ambiente) e as rotas /api/v1/* (autenticadas pela
// chave da conta). As duas fazem exatamente a mesma coisa depois de
// descobrir de quem é a conta: as mesmas validações, as mesmas recusas, o
// mesmo formato de item.
//
// Duplicar isso seria garantir a divergência: a regra "não agenda sem
// hora" seria corrigida num lado e esquecida no outro, e ninguém veria,
// porque as duas rotas responderiam 200 o tempo todo.
//
// O que continua nas rotas: só autenticação e a tradução pra HTTP. Quem
// resolve o dono é a rota — e essa é a diferença inteira entre as duas
// portas de entrada.
// =====================================================================

/** Recusa de negócio, ainda sem virar resposta HTTP. */
export interface Falha {
  status: number
  erro: CodigoErro
  motivo: string
  extra?: Record<string, unknown>
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; falha: Falha }

const MAX_ITENS = 200
const MAX_DIAS = 120

const STATUS_EDITORIAIS = new Set(["ideia", "em_criacao", "pronto", "agendado"])
const STATUS_DO_WORKER = new Set(["publicado", "falhou"])

const FORMATOS = new Set(["post", "carrossel", "stories", "reels"])
const OBJETIVOS = new Set(["sell", "inform", "engage", "community"])

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** As marcas do dono, no formato que `montarItens` consome. */
async function marcasDoDono(
  admin: SupabaseClient,
  ownerId: string,
): Promise<Resultado<Map<string, string | null>>> {
  const { data, error } = await admin
    .from("brands")
    .select("id, name")
    .eq("user_id", ownerId)
  if (error) {
    console.error("[calendario] falha ao ler brands:", error.message)
    return {
      ok: false,
      falha: { status: 500, erro: "falha_interna", motivo: "falha ao ler as marcas" },
    }
  }
  const marcas = new Map<string, string | null>()
  for (const b of data ?? []) marcas.set(b.id, b.name ?? null)
  return { ok: true, valor: marcas }
}

// ---------------------------------------------------------------------
// MARCAS
// ---------------------------------------------------------------------

export interface MarcaListada {
  id: string
  nome: string
  instagram_handle: string | null
}

export async function listarMarcas(
  admin: SupabaseClient,
  ownerId: string,
): Promise<Resultado<MarcaListada[]>> {
  const { data, error } = await admin
    .from("brands")
    .select("id, name, instagram_handle")
    .eq("user_id", ownerId)
    .order("name")
  if (error) {
    console.error("[calendario] falha ao ler brands:", error.message)
    return {
      ok: false,
      falha: { status: 500, erro: "falha_interna", motivo: "falha ao ler as marcas" },
    }
  }
  return {
    ok: true,
    valor: (data ?? []).map((b) => ({
      id: b.id,
      nome: b.name,
      instagram_handle: b.instagram_handle ?? null,
    })),
  }
}

// ---------------------------------------------------------------------
// LEITURA DO CALENDÁRIO
// ---------------------------------------------------------------------

export interface PeriodoPedido {
  de: string
  ate: string
  brand?: string
}

export interface CalendarioResposta {
  ok: true
  periodo: { de: string; ate: string }
  total: number
  teto: number
  itens: ItemCalendario[]
}

export async function listarCalendario(
  admin: SupabaseClient,
  ownerId: string,
  pedido: PeriodoPedido,
): Promise<Resultado<CalendarioResposta>> {
  const de = pedido.de.trim()
  const ate = pedido.ate.trim()
  const brandFiltro = (pedido.brand ?? "").trim()

  if (!dataValida(de) || !dataValida(ate)) {
    return {
      ok: false,
      falha: {
        status: 400,
        erro: "periodo_invalido",
        motivo: "informe ?de=YYYY-MM-DD&ate=YYYY-MM-DD",
      },
    }
  }
  if (de > ate) {
    return {
      ok: false,
      falha: { status: 400, erro: "periodo_invalido", motivo: "'de' é depois de 'ate'" },
    }
  }
  const dias =
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000 + 1
  if (dias > MAX_DIAS) {
    return {
      ok: false,
      falha: {
        status: 400,
        erro: "periodo_longo",
        motivo: `período de no máximo ${MAX_DIAS} dias (vieram ${dias})`,
      },
    }
  }

  const marcasRes = await marcasDoDono(admin, ownerId)
  if (!marcasRes.ok) return marcasRes
  const marcas = marcasRes.valor

  // Filtro por marca só vale pra marca DO DONO: pedir a de outra conta
  // devolve vazio, não erro — quem chama não precisa saber que aquele id
  // existe em outro lugar.
  let brandIds = [...marcas.keys()]
  if (brandFiltro) brandIds = brandIds.filter((id) => id === brandFiltro)

  if (brandIds.length === 0) {
    return {
      ok: true,
      valor: { ok: true, periodo: { de, ate }, total: 0, teto: MAX_ITENS, itens: [] },
    }
  }

  const {
    data: pautas,
    error,
    count,
  } = await admin
    .from("scheduled_posts")
    .select(CAMPOS_PAUTA, { count: "exact" })
    .in("brand_id", brandIds)
    .gte("scheduled_date", de)
    .lte("scheduled_date", ate)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true, nullsFirst: true })
    .limit(MAX_ITENS)

  if (error) {
    console.error("[calendario] falha ao ler pautas:", error.message)
    return {
      ok: false,
      falha: { status: 500, erro: "falha_interna", motivo: "falha ao ler o calendário" },
    }
  }

  const itens = await montarItens(admin, (pautas ?? []) as PautaRow[], marcas)

  // `total` é do PERÍODO, não da página: é o que deixa quem chama saber que
  // bateu no teto em vez de paginar às cegas.
  return {
    ok: true,
    valor: {
      ok: true,
      periodo: { de, ate },
      total: count ?? itens.length,
      teto: MAX_ITENS,
      itens,
    },
  }
}

// ---------------------------------------------------------------------
// CRIAÇÃO DE PAUTAS
// ---------------------------------------------------------------------

export interface PautaRecebida {
  ref?: string
  brand_id?: string
  marca?: string
  titulo?: string
  descricao?: string | null
  formato?: string
  objetivo?: string
  data_sugerida?: string
  gerar?: boolean
  imagens?: unknown
  buscas?: unknown
}

export interface ResultadoItem {
  ref: string
  resultado: "criado" | "ja_existia" | "brand_nao_encontrada" | "invalido"
  id?: string
  motivo?: string
  /** Desfecho do agendamento de geração — só quando `gerar: true` veio no item. */
  arte?: ResultadoAgendamento
}

export const MAX_PAUTAS_POR_LOTE = 20

/**
 * Cria as pautas de um lote. Item ruim não derruba o lote: cada um tem o
 * seu desfecho, na ordem em que veio.
 *
 * Idempotência: mesmo título na mesma marca devolve o id existente como
 * `ja_existia`, pra quem chamou poder carimbar o próprio espelho.
 */
export async function criarPautas(
  admin: SupabaseClient,
  ownerId: string,
  posts: PautaRecebida[],
): Promise<Resultado<ResultadoItem[]>> {
  const { data: brands, error: brandsError } = await admin
    .from("brands")
    .select("id")
    .eq("user_id", ownerId)
  if (brandsError) {
    console.error("[calendario] falha ao ler brands:", brandsError.message)
    return {
      ok: false,
      falha: { status: 500, erro: "falha_interna", motivo: "falha ao ler as marcas" },
    }
  }
  const existem = new Set((brands ?? []).map((b) => b.id))

  const resultados: ResultadoItem[] = []
  for (const p of posts) {
    const ref = typeof p.ref === "string" ? p.ref : ""
    if (!ref || !p.titulo || !p.brand_id) {
      resultados.push({
        ref: ref || "sem_ref",
        resultado: "invalido",
        motivo: "ref, titulo e brand_id são obrigatórios",
      })
      continue
    }

    const brandId = p.brand_id
    if (!existem.has(brandId)) {
      resultados.push({
        ref,
        resultado: "brand_nao_encontrada",
        motivo: `a brand ${brandId}${p.marca ? ` (marca ${p.marca})` : ""} não existe aqui, ou não é sua. Revincule na tela de Marcas do CRM.`,
      })
      continue
    }

    const { data: existente } = await admin
      .from("scheduled_posts")
      .select("id")
      .eq("brand_id", brandId)
      .eq("title", p.titulo.slice(0, 200))
      .limit(1)
      .maybeSingle()
    if (existente) {
      const item: ResultadoItem = { ref, resultado: "ja_existia", id: existente.id }
      if (p.gerar) {
        item.arte = await agendarGeracao(admin, ownerId, existente.id, {
          imagens: lerImagensCrm(p.imagens),
          buscas: lerBuscasCrm(p.buscas),
        })
      }
      resultados.push(item)
      continue
    }

    const dataSugerida = /^\d{4}-\d{2}-\d{2}$/.test(p.data_sugerida ?? "")
      ? (p.data_sugerida as string)
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data: criado, error: insertError } = await admin
      .from("scheduled_posts")
      .insert({
        brand_id: brandId,
        title: p.titulo.slice(0, 200),
        // 4000: a copy pode vir com slides densos (titulo + corpo por
        // argumento). A coluna é text; o corte é defensivo.
        description: p.descricao ? String(p.descricao).slice(0, 4000) : null,
        format: FORMATOS.has(p.formato ?? "") ? p.formato : "post",
        objective: OBJETIVOS.has(p.objetivo ?? "") ? p.objetivo : "inform",
        scheduled_date: dataSugerida,
        status: "ideia",
        source: "ia",
      })
      .select("id")
      .single()

    if (insertError || !criado) {
      console.error("[calendario] insert falhou:", insertError?.message)
      resultados.push({
        ref,
        resultado: "invalido",
        motivo: insertError?.message?.slice(0, 200) ?? "insert falhou",
      })
      continue
    }
    const item: ResultadoItem = { ref, resultado: "criado", id: criado.id }
    if (p.gerar) {
      item.arte = await agendarGeracao(admin, ownerId, criado.id, {
        imagens: lerImagensCrm(p.imagens),
        buscas: lerBuscasCrm(p.buscas),
      })
    }
    resultados.push(item)
  }

  return { ok: true, valor: resultados }
}

// ---------------------------------------------------------------------
// ALTERAÇÃO DE UMA PAUTA
// ---------------------------------------------------------------------

export interface PatchPauta {
  data?: string
  hora?: string | null
  status?: string
  updated_at?: string
}

/**
 * Muda data, hora ou status de uma pauta. As recusas são recusas, não
 * avisos — cada uma existe por um desfecho concreto documentado no PATCH
 * original (app/api/webhooks/websync-os/calendario/[id]/route.ts).
 */
export async function atualizarPauta(
  admin: SupabaseClient,
  ownerId: string,
  id: string,
  corpo: PatchPauta,
): Promise<Resultado<ItemCalendario>> {
  const querData = corpo.data !== undefined
  const querHora = corpo.hora !== undefined
  const querStatus = corpo.status !== undefined

  if (!querData && !querHora && !querStatus) {
    return {
      ok: false,
      falha: {
        status: 400,
        erro: "nada_pra_mudar",
        motivo: "informe data, hora ou status",
      },
    }
  }
  if (querData && !dataValida(corpo.data ?? "")) {
    return {
      ok: false,
      falha: { status: 400, erro: "data_invalida", motivo: "data inválida (use YYYY-MM-DD)" },
    }
  }
  if (querHora && corpo.hora !== null && !horaValida(corpo.hora ?? "")) {
    return {
      ok: false,
      falha: { status: 400, erro: "hora_invalida", motivo: "hora inválida (use HH:MM)" },
    }
  }
  if (querStatus && STATUS_DO_WORKER.has(corpo.status ?? "")) {
    return {
      ok: false,
      falha: {
        status: 409,
        erro: "campo_nao_seu",
        motivo:
          "'publicado' e 'falhou' são escritos pelo Nexus quando a publicação acontece: o CRM lê, não escreve",
      },
    }
  }
  if (querStatus && !STATUS_EDITORIAIS.has(corpo.status ?? "")) {
    return {
      ok: false,
      falha: {
        status: 400,
        erro: "status_desconhecido",
        motivo: `status desconhecido: ${corpo.status}`,
      },
    }
  }

  const marcasRes = await marcasDoDono(admin, ownerId)
  if (!marcasRes.ok) return marcasRes
  const marcas = marcasRes.valor

  const { data: atual, error: erroLeitura } = await admin
    .from("scheduled_posts")
    .select(CAMPOS_PAUTA)
    .eq("id", id)
    .maybeSingle()
  if (erroLeitura) {
    console.error("[calendario] falha ao ler pauta:", erroLeitura.message)
    return {
      ok: false,
      falha: { status: 500, erro: "falha_interna", motivo: "falha ao ler a pauta" },
    }
  }
  // Pauta de outro dono responde igual a pauta inexistente.
  if (!atual || !marcas.has((atual as PautaRow).brand_id)) {
    return {
      ok: false,
      falha: {
        status: 404,
        erro: "nao_encontrado",
        motivo:
          "esta pauta não existe (ou não é desta conta): o card não deveria mais estar no calendário",
      },
    }
  }
  const pauta = atual as PautaRow

  if (corpo.updated_at && corpo.updated_at !== pauta.updated_at) {
    const [item] = await montarItens(admin, [pauta], marcas)
    return {
      ok: false,
      falha: {
        status: 409,
        erro: "desatualizado",
        motivo: "esta pauta mudou no Nexus depois que você carregou o calendário",
        extra: { item },
      },
    }
  }

  if (pauta.status === "publicado") {
    return {
      ok: false,
      falha: {
        status: 409,
        erro: "ja_publicado",
        motivo:
          "esta peça já foi publicada: a data dela agora é histórico, não agendamento",
      },
    }
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
      return {
        ok: false,
        falha: {
          status: 409,
          erro: "sem_hora",
          motivo: "agendamento sem horário não publica: defina a hora antes de agendar",
        },
      }
    }
    const quando = instanteAgendado(dataNova, horaNova)
    if (!quando) {
      return {
        ok: false,
        falha: {
          status: 409,
          erro: "data_no_passado",
          motivo: "a data e a hora do agendamento não formam um instante válido",
        },
      }
    }
    if (quando.getTime() <= Date.now()) {
      return {
        ok: false,
        falha: {
          status: 409,
          erro: "data_no_passado",
          motivo:
            "esse horário já passou: a peça nasceria vencida e o worker a marcaria como falhou",
        },
      }
    }

    const arte = avaliarArte(await pecaDaPauta(admin, id))
    if (!podeAgendar(arte)) {
      return {
        ok: false,
        falha: {
          status: 409,
          erro: "sem_arte_publicavel",
          motivo: arte.motivo ?? "esta peça ainda não tem arte pronta pra publicar",
          extra: { arte_estado: arte.estado },
        },
      }
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
    console.error("[calendario] falha ao salvar:", error.message)
    return {
      ok: false,
      falha: { status: 500, erro: "falha_interna", motivo: "falha ao salvar a pauta" },
    }
  }

  const [item] = await montarItens(admin, [salvo as PautaRow], marcas)
  return { ok: true, valor: item }
}

/** A arte mais recente de uma pauta (post único ou carrossel), se houver. */
async function pecaDaPauta(
  admin: SupabaseClient,
  pautaId: string,
): Promise<PecaBruta | null> {
  const [posts, carrosseis] = await Promise.all([
    admin
      .from("single_posts")
      .select(
        "id, publish_image_urls, publish_prepared_at, rendered_image_url, updated_at, created_at",
      )
      .eq("scheduled_post_id", pautaId)
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("editorial_carousels")
      .select(
        "id, publish_image_urls, publish_prepared_at, updated_at, created_at, cover:carousel_data->>coverImageUrl",
      )
      .eq("scheduled_post_id", pautaId)
      .order("created_at", { ascending: false })
      .limit(1),
  ])

  const post = posts.data?.[0]
  if (post) {
    return {
      tipo: "single_post",
      id: post.id,
      publishImageUrls: post.publish_image_urls ?? null,
      publishPreparedAt: post.publish_prepared_at ?? null,
      thumbUrl: post.rendered_image_url ?? null,
      updatedAt: post.updated_at ?? null,
    }
  }

  const carrossel = (carrosseis.data?.[0] ?? null) as {
    id: string
    publish_image_urls: string[] | null
    publish_prepared_at: string | null
    updated_at: string | null
    cover: string | null
  } | null
  if (carrossel) {
    return {
      tipo: "carousel",
      id: carrossel.id,
      publishImageUrls: carrossel.publish_image_urls ?? null,
      publishPreparedAt: carrossel.publish_prepared_at ?? null,
      thumbUrl: carrossel.cover ?? null,
      updatedAt: carrossel.updated_at ?? null,
    }
  }
  return null
}

// ---------------------------------------------------------------------
// PEDIDO DE GERAÇÃO DE ARTE (a Ponte)
// ---------------------------------------------------------------------

export interface ItemGeracao {
  id?: string
  imagens?: unknown
  buscas?: unknown
}

export interface ResultadoGeracao {
  id: string
  resultado: ResultadoAgendamento
}

export const MAX_GERACOES_POR_LOTE = 10

/**
 * Agenda a geração da arte de cada pauta pedida. A geração de fato roda em
 * after(), depois da resposta ir embora — aqui só se decide SE dá pra gerar.
 */
export async function pedirGeracao(
  admin: SupabaseClient,
  ownerId: string,
  itens: ItemGeracao[],
): Promise<ResultadoGeracao[]> {
  const resultados: ResultadoGeracao[] = []
  for (const item of itens) {
    const id = typeof item.id === "string" ? item.id : ""
    if (!id || !UUID_RE.test(id)) {
      resultados.push({ id: id || "sem_id", resultado: "nao_encontrado" })
      continue
    }
    const resultado = await agendarGeracao(admin, ownerId, id, {
      imagens: lerImagensCrm(item.imagens),
      buscas: lerBuscasCrm(item.buscas),
    })
    resultados.push({ id, resultado })
  }
  return resultados
}
