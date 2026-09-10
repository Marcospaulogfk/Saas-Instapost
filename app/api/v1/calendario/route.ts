import { NextResponse } from "next/server"
import { autenticar } from "@/lib/chaves-api/autenticar"
import {
  criarPautas,
  listarCalendario,
  MAX_PAUTAS_POR_LOTE,
  type PautaRecebida,
} from "@/lib/calendario/operacoes"
import { erroJson, pedidoRuim } from "@/lib/calendario/resposta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// `gerar: true` num item agenda a arte; a geração roda em after(), e o
// worker do Next segue vivo até ela terminar.
export const maxDuration = 300

// =====================================================================
// GET  /api/v1/calendario?de=YYYY-MM-DD&ate=YYYY-MM-DD[&marca=]
// POST /api/v1/calendario   { pautas: [...] }
//
// O mesmo calendário do webhook do WebSync-OS, com a diferença que
// importa: o dono sai DA CHAVE. É o que permite o cliente plugar o n8n
// dele sem ninguém mexer em variável de ambiente do servidor.
//
// O parâmetro de filtro chama `marca` aqui (e não `brand`) porque a API
// nova fala português inteiro; `brand` continua aceito pra quem já tinha
// a chamada montada da rota antiga.
// =====================================================================

export async function GET(req: Request) {
  const auth = await autenticar(req)
  if (!auth.ok) return auth.resposta

  const url = new URL(req.url)
  const res = await listarCalendario(auth.conta.admin, auth.conta.userId, {
    de: url.searchParams.get("de") ?? "",
    ate: url.searchParams.get("ate") ?? "",
    brand: url.searchParams.get("marca") ?? url.searchParams.get("brand") ?? "",
  })
  if (!res.ok) {
    return erroJson(res.falha.status, res.falha.erro, res.falha.motivo, res.falha.extra)
  }
  return NextResponse.json(res.valor)
}

export async function POST(req: Request) {
  const auth = await autenticar(req)
  if (!auth.ok) return auth.resposta

  let corpo: { pautas?: PautaRecebida[]; posts?: PautaRecebida[] }
  try {
    corpo = (await req.json()) as { pautas?: PautaRecebida[]; posts?: PautaRecebida[] }
  } catch {
    return pedidoRuim("json_invalido", "corpo não é JSON válido")
  }

  // `posts` também é aceito: é o nome do campo na rota antiga, e quem já
  // tem a chamada pronta não devia ter que reescrever pra trocar de porta.
  const bruto = Array.isArray(corpo.pautas)
    ? corpo.pautas
    : Array.isArray(corpo.posts)
      ? corpo.posts
      : null
  if (!bruto) {
    return pedidoRuim(
      "json_invalido",
      'envie {"pautas":[{"ref":"...","brand_id":"...","titulo":"..."}]}',
    )
  }
  const pautas = bruto.slice(0, MAX_PAUTAS_POR_LOTE)
  if (pautas.length === 0) {
    return NextResponse.json({ ok: true, resultados: [] })
  }

  const res = await criarPautas(auth.conta.admin, auth.conta.userId, pautas)
  if (!res.ok) {
    return erroJson(res.falha.status, res.falha.erro, res.falha.motivo, res.falha.extra)
  }
  return NextResponse.json({ ok: true, resultados: res.valor })
}
