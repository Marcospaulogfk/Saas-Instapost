// =====================================================================
// lib/extrato/queries.ts
// Leitura do extrato (token_transactions) pra página /dashboard/tokens.
// RLS garante que o usuário só vê as próprias linhas.
// =====================================================================

import { requireUser } from "@/lib/data/queries"

export interface LinhaExtrato {
  id: string
  delta: number
  kind: string
  ref_type: string | null
  ref_id: string | null
  title: string | null
  plan_after: number
  topup_after: number
  bonus_after: number
  from_plan: number
  from_topup: number
  from_bonus: number
  created_at: string
}

export interface ConsumoMes {
  carrossel: number
  postUnico: number
  imagens: number
  pautas: number
  outros: number
  total: number
}

export const KIND_LABEL: Record<string, string> = {
  grant_plan: "Recarga do plano",
  grant_trial: "Teste grátis",
  grant_topup: "Tokens avulsos",
  grant_referral: "Bônus de indicação",
  grant_courtesy: "Cortesia",
  debit_carousel: "Carrossel",
  debit_single_post: "Post único",
  debit_image: "Imagem",
  debit_edit_bitmap: "Edição da arte",
  debit_ideas: "Pautas",
  debit_other: "Ajuste",
  refund: "Estorno",
  expire_plan: "Sobra zerada na renovação",
}

/** Link pra "abrir" a peça a partir do extrato, quando dá. */
export function linkDaPeca(l: LinhaExtrato): string | null {
  if (!l.ref_id) return null
  switch (l.ref_type) {
    case "project":
      return `/dashboard/projetos/${l.ref_id}`
    case "single_post":
      return `/dashboard/editor/post-unico?post=${l.ref_id}`
    case "inspiration_source":
      return `/dashboard/inspiracoes`
    case "referral":
      return `/dashboard/indicacao`
    default:
      return null
  }
}

export async function getExtrato(opts: { mes?: string | null; limite?: number } = {}) {
  const { supabase, user } = await requireUser()
  const limite = opts.limite ?? 100

  let q = supabase
    .from("token_transactions")
    .select(
      "id, delta, kind, ref_type, ref_id, title, plan_after, topup_after, bonus_after, from_plan, from_topup, from_bonus, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limite)

  if (opts.mes && /^\d{4}-\d{2}$/.test(opts.mes)) {
    const [y, m] = opts.mes.split("-").map(Number)
    const ini = new Date(Date.UTC(y, m - 1, 1)).toISOString()
    const fim = new Date(Date.UTC(y, m, 1)).toISOString()
    q = q.gte("created_at", ini).lt("created_at", fim)
  }

  const { data, error } = await q
  if (error) {
    // Tabela ainda não existe (migration 0020 pendente): página mostra vazio.
    return { linhas: [] as LinhaExtrato[], indisponivel: true }
  }
  return { linhas: (data ?? []) as LinhaExtrato[], indisponivel: false }
}

/** Consumo do mês corrente agrupado por tipo de peça. */
export async function getConsumoDoMes(): Promise<ConsumoMes> {
  const { supabase, user } = await requireUser()
  const agora = new Date()
  const ini = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)).toISOString()
  const { data } = await supabase
    .from("token_transactions")
    .select("delta, kind")
    .eq("user_id", user.id)
    .lt("delta", 0)
    .neq("kind", "expire_plan")
    .gte("created_at", ini)
    .limit(2000)

  const out: ConsumoMes = { carrossel: 0, postUnico: 0, imagens: 0, pautas: 0, outros: 0, total: 0 }
  for (const r of (data ?? []) as { delta: number; kind: string }[]) {
    const v = Math.abs(r.delta)
    if (r.kind === "debit_carousel") out.carrossel += v
    else if (r.kind === "debit_single_post") out.postUnico += v
    else if (r.kind === "debit_image" || r.kind === "debit_edit_bitmap") out.imagens += v
    else if (r.kind === "debit_ideas") out.pautas += v
    else out.outros += v
    out.total += v
  }
  return out
}
