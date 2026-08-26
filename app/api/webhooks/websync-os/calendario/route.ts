import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolverDono } from "@/lib/websync/dono"
import { dataValida } from "@/lib/calendario/agenda"
import { CAMPOS_PAUTA, montarItens, type PautaRow } from "@/lib/calendario/itens"
import { erroJson, pedidoRuim } from "@/lib/calendario/resposta"

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
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const MAX_ITENS = 200
const MAX_DIAS = 120

export async function GET(req: Request) {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/calendario] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return erroJson(503, "nao_configurado", "webhook não configurado neste ambiente")
  }
  if (req.headers.get(SECRET_HEADER) !== expected) {
    console.warn("[websync-os/calendario] secret inválido")
    return erroJson(401, "nao_autorizado", "segredo ausente ou inválido")
  }

  const url = new URL(req.url)
  const de = (url.searchParams.get("de") ?? "").trim()
  const ate = (url.searchParams.get("ate") ?? "").trim()
  const brandFiltro = (url.searchParams.get("brand") ?? "").trim()

  if (!dataValida(de) || !dataValida(ate)) {
    return pedidoRuim("periodo_invalido", "informe ?de=YYYY-MM-DD&ate=YYYY-MM-DD")
  }
  if (de > ate) {
    return pedidoRuim("periodo_invalido", "'de' é depois de 'ate'")
  }
  const dias =
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86400000 + 1
  if (dias > MAX_DIAS) {
    return pedidoRuim(
      "periodo_longo",
      `período de no máximo ${MAX_DIAS} dias (vieram ${dias})`,
    )
  }

  const admin = createAdminClient()
  const dono = await resolverDono(admin)
  if (!dono.ok) return erroJson(409, "dono_indefinido", dono.motivo)

  const { data: brands, error: brandsError } = await admin
    .from("brands")
    .select("id, name")
    .eq("user_id", dono.ownerId)
  if (brandsError) {
    console.error("[websync-os/calendario] falha ao ler brands:", brandsError.message)
    return erroJson(500, "falha_interna", "falha ao ler as marcas")
  }

  const marcas = new Map<string, string | null>()
  for (const b of brands ?? []) marcas.set(b.id, b.name ?? null)

  // Filtro por marca só vale pra marca DO DONO: pedir a de um cliente devolve
  // vazio, não erro — o CRM não precisa saber que aquele id existe.
  let brandIds = [...marcas.keys()]
  if (brandFiltro) brandIds = brandIds.filter((id) => id === brandFiltro)

  if (brandIds.length === 0) {
    return NextResponse.json({
      ok: true,
      periodo: { de, ate },
      total: 0,
      teto: MAX_ITENS,
      itens: [],
    })
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
    console.error("[websync-os/calendario] falha ao ler pautas:", error.message)
    return erroJson(500, "falha_interna", "falha ao ler o calendário")
  }

  const itens = await montarItens(admin, (pautas ?? []) as PautaRow[], marcas)

  // `total` é do PERÍODO, não da página: é o que deixa o CRM saber que bateu no
  // teto em vez de paginar às cegas.
  return NextResponse.json({
    ok: true,
    periodo: { de, ate },
    total: count ?? itens.length,
    teto: MAX_ITENS,
    itens,
  })
}
