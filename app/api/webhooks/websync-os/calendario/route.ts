import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { conferirSegredo, resolverDono } from "@/lib/websync/dono"
import { listarCalendario } from "@/lib/calendario/operacoes"
import { erroJson } from "@/lib/calendario/resposta"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// =====================================================================
// GET /api/webhooks/websync-os/calendario?de=YYYY-MM-DD&ate=YYYY-MM-DD[&brand=]
//
// O CALENDÁRIO COMPARTILHADO, lado da leitura (26/08/2026).
//
// O desenho, fechado com a sessão do CRM antes de existir código: NÃO há duas
// tabelas espelhadas sincronizando nos dois sentidos. A data e o dono do
// agendamento moram AQUI, porque quem publica precisa da data no mesmo banco
// do token e da arte — se a data morasse no CRM, uma indisponibilidade dele
// viraria post não publicado. O calendário do CRM é uma VISTA disto: "aparece
// nos dois lados" acontece porque é o MESMO dado, não porque dois bancos
// concordaram.
//
// Vive em /api/webhooks/* de propósito: é a allowlist do middleware (máquina
// chamando máquina, sem cookie de sessão). Mesmo segredo e mesmo guard de dono
// do POST e do /status — a service_role enxerga brands de clientes, e devolver
// o calendário de peça alheia é vazamento.
//
// A regra do calendário em si mora em lib/calendario/operacoes.ts, dividida
// com /api/v1/calendario (a mesma coisa, autenticada por chave de conta).
// Aqui fica só o segredo do webhook e o guard de dono.
// =====================================================================

export async function GET(req: Request) {
  // Aceita o segredo do WebSync-OS E o de cada CRM cliente: quem chegou
  // decide de quem são as marcas (lib/websync/dono.ts).
  const auth = conferirSegredo(req)
  if (!auth.ok) {
    return auth.status === 503
      ? erroJson(503, "nao_configurado", "webhook não configurado neste ambiente")
      : erroJson(401, "nao_autorizado", "segredo ausente ou inválido")
  }

  const url = new URL(req.url)
  const admin = createAdminClient()
  const dono = await resolverDono(admin, auth.cliente)
  if (!dono.ok) return erroJson(409, "dono_indefinido", dono.motivo)

  const res = await listarCalendario(admin, dono.ownerId, {
    de: url.searchParams.get("de") ?? "",
    ate: url.searchParams.get("ate") ?? "",
    brand: url.searchParams.get("brand") ?? "",
  })
  if (!res.ok) {
    return erroJson(res.falha.status, res.falha.erro, res.falha.motivo, res.falha.extra)
  }
  return NextResponse.json(res.valor)
}
