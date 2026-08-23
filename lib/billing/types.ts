// =====================================================================
// lib/billing/types.ts
// Contrato NEUTRO de provedor de pagamento. O app (pricing, tokens,
// afiliados, webhook) só conhece isto; lib/billing/asaas.ts implementa.
// Trocar de checkout no futuro = escrever outro arquivo, não reabrir o
// produto (decisão do Marcos, 22/08/2026: "não podemos construir nosso
// produto focado em um checkout").
// =====================================================================

import type { BillingCycle, PaidPlan } from "./plans"

export interface CheckoutRequest {
  userId: string
  email: string
  name?: string | null
  plan: PaidPlan
  cycle: BillingCycle
  /** Código de afiliado (cookie), se houver. */
  affiliateCode?: string | null
  /** Split pro afiliado (já aprovado, com carteira). */
  split?: { walletId: string; percent: number } | null
  successUrl: string
  cancelUrl: string
}

export interface CheckoutResult {
  /** ID do checkout no provedor (pra reconciliar no webhook). */
  checkoutId: string
  /** URL pra onde mandar o usuário. */
  url: string
}

export interface ProviderSubscription {
  id: string
  customerId: string
  status: "active" | "inactive" | "expired" | "unknown"
  cycle: BillingCycle | null
  value: number | null
  nextDueDate: string | null
  externalReference: string | null
}

/**
 * Evento normalizado. O webhook do provedor é traduzido pra isto e o
 * resto (lib/billing/apply.ts) nunca vê payload cru.
 */
export type BillingEvent =
  | {
      type: "payment_confirmed"
      eventId: string
      paymentId: string
      subscriptionId: string | null
      customerId: string | null
      checkoutId: string | null
      externalReference: string | null
      value: number
      netValue: number | null
      billingType: string | null
      paidAt: string | null
    }
  | {
      type: "payment_overdue"
      eventId: string
      paymentId: string
      subscriptionId: string | null
      customerId: string | null
    }
  | {
      type: "payment_refunded"
      eventId: string
      paymentId: string
      subscriptionId: string | null
      customerId: string | null
      value: number
    }
  | {
      type: "checkout_paid"
      eventId: string
      checkoutId: string
      customerId: string | null
      externalReference: string | null
    }
  | {
      type: "subscription_canceled"
      eventId: string
      subscriptionId: string
      customerId: string | null
    }
  | {
      type: "split_done"
      eventId: string
      paymentId: string
      walletId: string | null
      value: number | null
    }
  | { type: "ignored"; eventId: string; raw: string }

export interface BillingProvider {
  readonly name: string
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>
  getSubscription(id: string): Promise<ProviderSubscription | null>
  /** Lista assinaturas de um cliente do provedor (reconciliação). */
  listSubscriptionsByCustomer(customerId: string): Promise<ProviderSubscription[]>
  /** Grava nossa referência na assinatura (cimenta o vínculo). */
  setSubscriptionReference(id: string, externalReference: string): Promise<void>
  cancelSubscription(id: string): Promise<void>
  getCustomerEmail(customerId: string): Promise<string | null>
  /**
   * Valida a autenticidade do webhook e traduz o payload.
   * Lança se o token não bater.
   */
  parseWebhook(headers: Headers, rawBody: string): BillingEvent
}

/** Referência que vai no checkout/assinatura: quem, qual plano, qual ciclo, afiliado. */
export function encodeReference(p: {
  userId: string
  plan: PaidPlan
  cycle: BillingCycle
  affiliateCode?: string | null
}): string {
  const parts = [`u:${p.userId}`, `p:${p.plan}`, `c:${p.cycle}`]
  if (p.affiliateCode) parts.push(`af:${p.affiliateCode}`)
  return parts.join("|")
}

export function decodeReference(ref: string | null | undefined): {
  userId: string | null
  plan: PaidPlan | null
  cycle: BillingCycle | null
  affiliateCode: string | null
} {
  const out = { userId: null as string | null, plan: null as PaidPlan | null, cycle: null as BillingCycle | null, affiliateCode: null as string | null }
  if (!ref) return out
  for (const part of ref.split("|")) {
    const i = part.indexOf(":")
    if (i < 0) continue
    const k = part.slice(0, i)
    const v = part.slice(i + 1)
    if (k === "u") out.userId = v
    else if (k === "p" && (v === "starter" || v === "pro" || v === "studio")) out.plan = v
    else if (k === "c" && (v === "monthly" || v === "annual")) out.cycle = v
    else if (k === "af") out.affiliateCode = v
  }
  return out
}
