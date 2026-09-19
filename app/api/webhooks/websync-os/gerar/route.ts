import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { conferirSegredo, resolverDono } from "@/lib/websync/dono"
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

export async function POST(req: Request) {
  // Esta rota nasceu depois da ponte multi-cliente (01/09) e ficou com a
  // checagem antiga: com o segredo de um CRM cliente ela respondia 401
  // enquanto o POST das pautas, ao lado, aceitava. Mesmo helper das outras.
  const auth = conferirSegredo(req)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 503 ? "webhook não configurado" : "não autorizado" },
      { status: auth.status },
    )
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
  const dono = await resolverDono(admin, auth.cliente)
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
