import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"
import { atualizarPauta, type PatchPauta } from "@/lib/calendario/operacoes"
import { erroJson, pedidoRuim } from "@/lib/calendario/resposta"

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
//
// As regras em si moram em lib/calendario/operacoes.ts, divididas com
// PATCH /api/v1/calendario/<id> (a mesma coisa, autenticada por chave).
// =====================================================================

const SECRET_HEADER = "x-websync-secret"

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
  let corpo: PatchPauta
  try {
    corpo = (await req.json()) as PatchPauta
  } catch {
    return pedidoRuim("json_invalido", "corpo não é JSON válido")
  }

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) return erroJson(409, "dono_indefinido", dono.motivo)

  const res = await atualizarPauta(admin, dono.ownerId, id, corpo)
  if (!res.ok) {
    return erroJson(res.falha.status, res.falha.erro, res.falha.motivo, res.falha.extra)
  }
  return NextResponse.json({ ok: true, item: res.valor })
}
