import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"
import {
  MAX_GERACOES_POR_LOTE,
  pedirGeracao,
  type ItemGeracao,
} from "@/lib/calendario/operacoes"

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
// O miolo mora em lib/calendario/operacoes.ts, dividido com POST /api/v1/gerar.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"

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

  let corpo: { itens?: ItemGeracao[] }
  try {
    corpo = (await req.json()) as { itens?: ItemGeracao[] }
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  const itens = Array.isArray(corpo.itens)
    ? corpo.itens.slice(0, MAX_GERACOES_POR_LOTE)
    : []
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
  const resultados = await pedirGeracao(admin, dono.ownerId, itens)

  const iniciados = resultados.filter((r) => r.resultado === "iniciado").length
  console.log(
    `[websync-os/gerar] lote de ${itens.length}: ${iniciados} iniciado(s), ` +
      `${resultados.length - iniciados} outro(s) desfecho(s)`,
  )
  return NextResponse.json({ ok: true, itens: resultados })
}
