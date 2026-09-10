import { NextResponse } from "next/server"
import { autenticar } from "@/lib/chaves-api/autenticar"
import {
  MAX_GERACOES_POR_LOTE,
  pedirGeracao,
  type ItemGeracao,
} from "@/lib/calendario/operacoes"
import { pedidoRuim } from "@/lib/calendario/resposta"

export const runtime = "nodejs"
// A geração roda em after() (imagens da Fal.ai + re-host no Storage por
// pauta) e o worker do Next segue vivo até ela terminar.
export const maxDuration = 300

// =====================================================================
// POST /api/v1/gerar   { itens: [{ id, imagens?, buscas? }] }
//
// A ponte: pede pro Nexus diagramar a arte de pautas que já existem no
// calendário. A copy tem que estar pronta na pauta — este endpoint só
// decide SE dá pra gerar e agenda; quem gera é lib/websync/gerar-arte.ts,
// depois desta resposta ir embora.
//
// Por isso a resposta é rápida e o desfecho de cada item é um
// AGENDAMENTO ("iniciado", "sem_copy", "ja_tem_arte"...), não a arte
// pronta. Pra saber como ficou, leia o calendário de novo: o campo
// `arte.estado` de cada item conta o resto da história.
// =====================================================================

export async function POST(req: Request) {
  const auth = await autenticar(req)
  if (!auth.ok) return auth.resposta

  let corpo: { itens?: ItemGeracao[] }
  try {
    corpo = (await req.json()) as { itens?: ItemGeracao[] }
  } catch {
    return pedidoRuim("json_invalido", "corpo não é JSON válido")
  }
  if (!Array.isArray(corpo.itens)) {
    return pedidoRuim("json_invalido", 'envie {"itens":[{"id":"<id da pauta>"}]}')
  }
  const itens = corpo.itens.slice(0, MAX_GERACOES_POR_LOTE)
  if (itens.length === 0) {
    return NextResponse.json({ ok: true, itens: [] })
  }

  const resultados = await pedirGeracao(auth.conta.admin, auth.conta.userId, itens)
  const iniciados = resultados.filter((r) => r.resultado === "iniciado").length
  console.log(
    `[api/v1/gerar] lote de ${itens.length}: ${iniciados} iniciado(s), ` +
      `${resultados.length - iniciados} outro(s) desfecho(s)`,
  )
  return NextResponse.json({ ok: true, itens: resultados })
}
