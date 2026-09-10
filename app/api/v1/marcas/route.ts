import { NextResponse } from "next/server"
import { autenticar } from "@/lib/chaves-api/autenticar"
import { listarMarcas } from "@/lib/calendario/operacoes"
import { erroJson } from "@/lib/calendario/resposta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// =====================================================================
// GET /api/v1/marcas
//
// As marcas da conta da chave. É o passo obrigatório antes de criar
// pauta: toda pauta nasce vinculada a uma marca, e o id vem daqui.
//
// Diferente da rota antiga (/api/webhooks/websync-os/brands), esta NÃO
// cria marca. Criar marca envolve cores, tom de voz e handle — coisa de
// tela, não de integração; e uma marca criada por engano por um laço de
// automação é lixo que o dono descobre semanas depois.
// =====================================================================

export async function GET(req: Request) {
  const auth = await autenticar(req)
  if (!auth.ok) return auth.resposta

  const res = await listarMarcas(auth.conta.admin, auth.conta.userId)
  if (!res.ok) {
    return erroJson(res.falha.status, res.falha.erro, res.falha.motivo, res.falha.extra)
  }
  return NextResponse.json({ ok: true, total: res.valor.length, marcas: res.valor })
}
