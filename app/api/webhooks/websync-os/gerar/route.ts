import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"
import {
  agendarGeracao,
  lerImagensCrm,
  lerBuscasCrm,
  type ResultadoAgendamento,
} from "@/lib/websync/gerar-arte"

export const runtime = "nodejs"
// A geração roda em after() (imagens da Fal.ai + re-host no Storage por
// pauta), mas o worker do Next segue vivo até o after() terminar — 300s dá
// folga pro pior caso de um lote de 10 pautas com capa gerada em todas.
export const maxDuration = 300

// =====================================================================
// POST /api/webhooks/websync-os/gerar   (a Ponte, geração automática — 01/09/2026)
//
// O CRM chama esta rota (ou manda `gerar: true` já no POST principal, que
// delega pro mesmo motor) quando quer que o Nexus diagrame a arte sozinho.
// Regra D11: a copy chega PRONTA — este endpoint só decide SE dá pra gerar
// e agenda; quem gera de fato é lib/websync/gerar-arte.ts, em after().
//
// Mesma autenticação e mesmo guard de dono das outras rotas da integração.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const MAX_ITENS = 10
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface ItemPedido {
  id?: string
  imagens?: unknown
  buscas?: unknown
}

interface ItemResultado {
  id: string
  resultado: ResultadoAgendamento
}

export async function POST(req: Request) {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/gerar] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return NextResponse.json({ error: "webhook não configurado" }, { status: 503 })
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[websync-os/gerar] secret inválido")
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  let corpo: { itens?: ItemPedido[] }
  try {
    corpo = (await req.json()) as { itens?: ItemPedido[] }
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  const itens = Array.isArray(corpo.itens) ? corpo.itens.slice(0, MAX_ITENS) : []
  if (itens.length === 0) {
    return NextResponse.json({ ok: true, itens: [] })
  }

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) {
    return NextResponse.json({ error: dono.motivo }, { status: 409 })
  }

  // Um resultado por item PEDIDO, na ordem em que veio — inclusive os ids
  // inválidos, que nem chegam a consultar o banco.
  const resultados: ItemResultado[] = []
  for (const item of itens) {
    const id = typeof item.id === "string" ? item.id : ""
    if (!id || !UUID_RE.test(id)) {
      resultados.push({ id: id || "sem_id", resultado: "nao_encontrado" })
      continue
    }
    const resultado = await agendarGeracao(admin, dono.ownerId, id, {
      imagens: lerImagensCrm(item.imagens),
      buscas: lerBuscasCrm(item.buscas),
    })
    resultados.push({ id, resultado })
  }

  const iniciados = resultados.filter((r) => r.resultado === "iniciado").length
  console.log(
    `[websync-os/gerar] lote de ${itens.length}: ${iniciados} iniciado(s), ` +
      `${resultados.length - iniciados} outro(s) desfecho(s)`,
  )
  return NextResponse.json({ ok: true, itens: resultados })
}
