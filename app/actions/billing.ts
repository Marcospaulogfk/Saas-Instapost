"use server"

// =====================================================================
// app/actions/billing.ts
// Assinar, cancelar e trocar de plano, tudo por dentro do app (decisão
// 22/08/2026: sem portal externo). Fala só com lib/billing (neutro).
//
// Fluxo de assinatura:
//   1. usuário escolhe plano × ciclo → iniciarCheckout()
//   2. gravamos uma linha em subscriptions (status 'checkout', checkout_id)
//   3. redirect pro checkout hospedado do provedor
//   4. o webhook (app/api/webhooks/asaas) confirma o pagamento e credita
//
// Troca de plano: abre um checkout novo; quando o pagamento novo confirma,
// lib/billing/apply.ts preserva a sobra do plano antigo como avulso e cancela
// a assinatura antiga no provedor. Nada de pró-rata.
// =====================================================================

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  billingConfigured,
  getBilling,
  isBillingCycle,
  isPaidPlan,
  type BillingCycle,
  type PaidPlan,
} from "@/lib/billing"

async function origem(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

export type CheckoutErro =
  | "plano_invalido"
  | "cobranca_indisponivel"
  | "falha_provedor"

/**
 * Abre o checkout. Logado → redireciona pro provedor. Deslogado → manda pro
 * cadastro com plano e ciclo na URL (a página de preços retoma depois).
 */
export async function iniciarCheckout(
  planoBruto: string,
  cicloBruto: string,
): Promise<{ erro: CheckoutErro; detalhe?: string } | never> {
  if (!isPaidPlan(planoBruto) || !isBillingCycle(cicloBruto)) {
    return { erro: "plano_invalido" }
  }
  const plan: PaidPlan = planoBruto
  const cycle: BillingCycle = cicloBruto

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/cadastro?plano=${plan}&ciclo=${cycle}&next=${encodeURIComponent(`/pricing?plano=${plan}&ciclo=${cycle}`)}`)
  }

  if (!billingConfigured()) return { erro: "cobranca_indisponivel" }

  const base = await origem()
  const billing = getBilling()
  const admin = createAdminClient()

  // Afiliado (cookie) e split: módulo atrás de flag; nunca derruba o checkout.
  let affiliateCode: string | null = null
  let split: { walletId: string; percent: number } | null = null
  try {
    const { AFILIADOS_HABILITADO } = await import("@/lib/features")
    if (AFILIADOS_HABILITADO) {
      const { lerCodigoAfiliadoDoCookie } = await import("@/app/actions/afiliados")
      const { splitParaAfiliado } = await import("@/lib/afiliados/comissao")
      affiliateCode = (await lerCodigoAfiliadoDoCookie()) ?? null
      if (affiliateCode) split = await splitParaAfiliado(admin, affiliateCode)
    }
  } catch {
    affiliateCode = null
    split = null
  }

  let checkout: { checkoutId: string; url: string }
  try {
    checkout = await billing.createCheckout({
      userId: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null,
      plan,
      cycle,
      affiliateCode,
      split,
      successUrl: `${base}/dashboard/tokens?checkout=ok`,
      cancelUrl: `${base}/pricing?checkout=cancelado`,
    })
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e)
    console.error("[billing] createCheckout:", detalhe)
    return { erro: "falha_provedor", detalhe }
  }

  const { error } = await admin.from("subscriptions").insert({
    user_id: user.id,
    provider: billing.name,
    checkout_id: checkout.checkoutId,
    plan_id: plan,
    billing_cycle: cycle,
    status: "checkout",
    affiliate_code: affiliateCode,
  })
  if (error) console.error("[billing] subscriptions.insert:", error.message)

  redirect(checkout.url)
}

/** Cancela a assinatura no provedor. O acesso segue até a data de renovação. */
export async function cancelarAssinatura(): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, erro: "nao_autenticado" }

  const admin = createAdminClient()
  const { data: u } = await admin
    .from("users")
    .select("billing_provider, billing_subscription_id")
    .eq("id", user.id)
    .single()
  if (!u?.billing_subscription_id) return { ok: false, erro: "sem_assinatura" }

  try {
    await getBilling().cancelSubscription(u.billing_subscription_id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[billing] cancelSubscription:", msg)
    return { ok: false, erro: "falha_provedor" }
  }
  await admin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("provider_subscription_id", u.billing_subscription_id)
  revalidatePath("/dashboard/tokens")
  revalidatePath("/dashboard/configuracoes")
  return { ok: true }
}
