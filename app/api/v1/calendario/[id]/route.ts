import { NextResponse } from "next/server"
import { autenticar } from "@/lib/chaves-api/autenticar"
import { atualizarPauta, type PatchPauta } from "@/lib/calendario/operacoes"
import { erroJson, pedidoRuim } from "@/lib/calendario/resposta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// =====================================================================
// PATCH /api/v1/calendario/<id>   { data?, hora?, status?, updated_at? }
//
// Muda data, hora ou status de uma pauta da conta da chave. Mesmas regras
// (e mesmas recusas) do PATCH do WebSync-OS — as duas rotas chamam
// lib/calendario/operacoes.ts.
//
// `updated_at` é opcional e vale a pena mandar: se a pauta tiver mudado
// no Nexus desde que você leu o calendário, a resposta é 409
// `desatualizado` com o item novo junto, em vez de sobrescrever em
// silêncio a edição de outra pessoa.
// =====================================================================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await autenticar(req)
  if (!auth.ok) return auth.resposta

  const { id } = await params
  let corpo: PatchPauta
  try {
    corpo = (await req.json()) as PatchPauta
  } catch {
    return pedidoRuim("json_invalido", "corpo não é JSON válido")
  }

  const res = await atualizarPauta(auth.conta.admin, auth.conta.userId, id, corpo)
  if (!res.ok) {
    return erroJson(res.falha.status, res.falha.erro, res.falha.motivo, res.falha.extra)
  }
  return NextResponse.json({ ok: true, item: res.valor })
}
