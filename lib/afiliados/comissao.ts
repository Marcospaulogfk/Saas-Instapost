// Server-only: importado apenas por lib/billing/apply.ts e server actions.
// =====================================================================
// lib/afiliados/comissao.ts
// Lado do WEBHOOK do programa de afiliados. Chamado por
// lib/billing/apply.ts com o admin client (service_role).
//
// Contrato: NUNCA lança. Afiliado inexistente, tabela inexistente
// (migration 0021 não aplicada), qualquer erro: console.warn e segue.
// Comissão é efeito colateral do pagamento e não pode derrubar o
// processamento do evento que credita tokens pro cliente.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizarCodigoAfiliado } from "./config"

type AfiliadoRow = {
  id: string
  status: string
  commission_pct: number | string | null
  asaas_wallet_id: string | null
}

async function buscarAfiliadoAprovado(
  admin: SupabaseClient,
  code: string,
): Promise<AfiliadoRow | null> {
  const c = normalizarCodigoAfiliado(code)
  if (!c) return null
  const { data, error } = await admin
    .from("affiliates")
    .select("id, status, commission_pct, asaas_wallet_id")
    .eq("code", c)
    .eq("status", "approved")
    .maybeSingle()
  if (error) {
    console.warn("[afiliados] busca de afiliado falhou:", error.message)
    return null
  }
  return (data as AfiliadoRow | null) ?? null
}

function pct(v: number | string | null | undefined): number {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : 25
}

/**
 * Registra a comissão de uma cobrança confirmada.
 * - `first`: primeira cobrança do cliente; cria o vínculo em affiliate_referrals.
 * - idempotente em (provider, payment_id).
 */
export async function registrarComissaoAfiliado(
  admin: SupabaseClient,
  p: {
    affiliateCode: string
    userId: string
    paymentId: string
    provider: string
    grossValue: number
    netValue: number | null
    first: boolean
  },
): Promise<void> {
  try {
    const af = await buscarAfiliadoAprovado(admin, p.affiliateCode)
    if (!af) return

    if (p.first) {
      const { error } = await admin
        .from("affiliate_referrals")
        .upsert(
          { affiliate_id: af.id, user_id: p.userId, status: "active" },
          { onConflict: "user_id", ignoreDuplicates: true },
        )
      if (error) console.warn("[afiliados] vínculo não gravado:", error.message)
    }

    const gross = Number.isFinite(p.grossValue) ? p.grossValue : 0
    const commission = Math.round(gross * pct(af.commission_pct)) / 100

    const { error } = await admin
      .from("affiliate_commissions")
      .upsert(
        {
          affiliate_id: af.id,
          user_id: p.userId,
          payment_id: p.paymentId,
          provider: p.provider,
          gross_value: gross,
          net_value: p.netValue,
          commission_value: commission,
          status: "pending",
        },
        { onConflict: "provider,payment_id", ignoreDuplicates: true },
      )
    if (error) console.warn("[afiliados] comissão não gravada:", error.message)
  } catch (e) {
    console.warn("[afiliados] registrarComissaoAfiliado:", e)
  }
}

/** Estorno/cancelamento: a comissão vira 'reversed'. */
export async function estornarComissaoAfiliado(
  admin: SupabaseClient,
  paymentId: string,
  provider = "asaas",
): Promise<void> {
  try {
    // Filtra por (provider, payment_id): é a chave única da tabela. Só por
    // payment_id, um id repetido entre provedores derrubaria a comissão errada.
    const { error } = await admin
      .from("affiliate_commissions")
      .update({ status: "reversed" })
      .eq("provider", provider)
      .eq("payment_id", paymentId)
      .neq("status", "reversed")
    if (error) console.warn("[afiliados] estorno não gravado:", error.message)
  } catch (e) {
    console.warn("[afiliados] estornarComissaoAfiliado:", e)
  }
}

/** Split executado pelo Asaas: a comissão vira 'paid'. */
export async function marcarComissaoPaga(
  admin: SupabaseClient,
  paymentId: string,
  provider = "asaas",
): Promise<void> {
  try {
    const { error } = await admin
      .from("affiliate_commissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("provider", provider)
      .eq("payment_id", paymentId)
      .eq("status", "pending")
    if (error) console.warn("[afiliados] baixa não gravada:", error.message)
  } catch (e) {
    console.warn("[afiliados] marcarComissaoPaga:", e)
  }
}

/**
 * Dados do split pra montar a cobrança no Asaas.
 * Só quando o afiliado está aprovado E tem walletId; senão null (a comissão
 * acumula como 'pending' e o acerto é Pix manual).
 */
export async function splitParaAfiliado(
  admin: SupabaseClient,
  affiliateCode: string | null | undefined,
): Promise<{ walletId: string; percent: number } | null> {
  try {
    if (!affiliateCode) return null
    const af = await buscarAfiliadoAprovado(admin, affiliateCode)
    if (!af || !af.asaas_wallet_id) return null
    return { walletId: af.asaas_wallet_id, percent: pct(af.commission_pct) }
  } catch (e) {
    console.warn("[afiliados] splitParaAfiliado:", e)
    return null
  }
}
