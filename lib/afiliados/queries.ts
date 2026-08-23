// =====================================================================
// lib/afiliados/queries.ts
// Leitura do programa de AFILIADOS.
//
// Painel do afiliado: client normal + RLS da 0021 (o afiliado só lê o que
// é dele). Admin: service_role direto, gated por isAdminUser() na página.
// =====================================================================

import { cache } from "react"
import { requireUser } from "@/lib/data/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import type { StatusAfiliado, StatusComissao } from "./config"

export type AfiliadoRow = {
  id: string
  userId: string | null
  code: string
  status: StatusAfiliado
  name: string
  email: string
  whatsapp: string | null
  instagram: string | null
  reason: string | null
  adsPlan: string | null
  channels: string | null
  commissionPct: number
  asaasWalletId: string | null
  notes: string | null
  reviewedAt: string | null
  createdAt: string
}

export type ComissaoRow = {
  id: string
  paymentId: string
  provider: string
  grossValue: number
  commissionValue: number
  status: StatusComissao
  paidAt: string | null
  createdAt: string
}

export type PainelAfiliado = {
  afiliado: AfiliadoRow | null
  totalIndicados: number
  comissaoPendente: number
  comissaoPaga: number
  comissoes: ComissaoRow[]
}

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

function mapAfiliado(r: any): AfiliadoRow {
  return {
    id: r.id,
    userId: r.user_id ?? null,
    code: r.code,
    status: (r.status ?? "pending") as StatusAfiliado,
    name: r.name ?? "",
    email: r.email ?? "",
    whatsapp: r.whatsapp ?? null,
    instagram: r.instagram ?? null,
    reason: r.reason ?? null,
    adsPlan: r.ads_plan ?? null,
    channels: r.channels ?? null,
    commissionPct: num(r.commission_pct ?? 25),
    asaasWalletId: r.asaas_wallet_id ?? null,
    notes: r.notes ?? null,
    reviewedAt: r.reviewed_at ?? null,
    createdAt: r.created_at,
  }
}

const AFILIADO_COLS =
  "id, user_id, code, status, name, email, whatsapp, instagram, reason, ads_plan, channels, commission_pct, asaas_wallet_id, notes, reviewed_at, created_at"

/**
 * Painel do usuário logado. A linha do afiliado é achada por `user_id`
 * (RLS). Candidatura feita deslogada fica com user_id nulo: aqui a gente
 * tenta vincular pelo e-mail da sessão, via service_role, uma vez.
 */
export const getPainelAfiliado = cache(async (): Promise<PainelAfiliado> => {
  const { supabase, user } = await requireUser()
  const vazio: PainelAfiliado = {
    afiliado: null,
    totalIndicados: 0,
    comissaoPendente: 0,
    comissaoPaga: 0,
    comissoes: [],
  }

  let afRes = await supabase
    .from("affiliates")
    .select(AFILIADO_COLS)
    .eq("user_id", user.id)
    .in("status", ["pending", "approved", "suspended"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (afRes.error) {
    console.warn("[afiliados] painel:", afRes.error.message)
    return vazio
  }

  if (!afRes.data && user.email) {
    // Vincula candidatura anônima (mesmo e-mail, sem dono ainda).
    try {
      const admin = createAdminClient()
      const { data: orfao } = await admin
        .from("affiliates")
        .select("id")
        .is("user_id", null)
        .ilike("email", user.email)
        .in("status", ["pending", "approved"])
        .limit(1)
        .maybeSingle()
      if (orfao?.id) {
        await admin.from("affiliates").update({ user_id: user.id }).eq("id", orfao.id)
        afRes = await supabase
          .from("affiliates")
          .select(AFILIADO_COLS)
          .eq("id", orfao.id)
          .maybeSingle()
      }
    } catch (e) {
      console.warn("[afiliados] vínculo por e-mail falhou:", e)
    }
  }

  if (!afRes.data) return vazio
  const afiliado = mapAfiliado(afRes.data)

  const [refRes, comRes] = await Promise.all([
    supabase
      .from("affiliate_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", afiliado.id),
    supabase
      .from("affiliate_commissions")
      .select("id, payment_id, provider, gross_value, commission_value, status, paid_at, created_at")
      .eq("affiliate_id", afiliado.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ])

  const todas: ComissaoRow[] = (comRes.data ?? []).map((c: any) => ({
    id: c.id,
    paymentId: c.payment_id,
    provider: c.provider,
    grossValue: num(c.gross_value),
    commissionValue: num(c.commission_value),
    status: (c.status ?? "pending") as StatusComissao,
    paidAt: c.paid_at ?? null,
    createdAt: c.created_at,
  }))

  const soma = (s: StatusComissao) =>
    Math.round(
      todas.filter((c) => c.status === s).reduce((acc, c) => acc + c.commissionValue, 0) * 100,
    ) / 100

  return {
    afiliado,
    totalIndicados: refRes.count ?? 0,
    comissaoPendente: soma("pending"),
    comissaoPaga: soma("paid"),
    comissoes: todas.slice(0, 20),
  }
})

/** Admin: lista candidaturas/afiliados (service_role). */
export async function listCandidaturas(status?: StatusAfiliado): Promise<AfiliadoRow[]> {
  const admin = createAdminClient()
  let q = admin.from("affiliates").select(AFILIADO_COLS).order("created_at", { ascending: false })
  if (status) q = q.eq("status", status)
  const { data, error } = await q
  if (error) {
    console.warn("[afiliados] listCandidaturas:", error.message)
    return []
  }
  return (data ?? []).map(mapAfiliado)
}
