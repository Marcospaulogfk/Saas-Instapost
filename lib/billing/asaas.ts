// =====================================================================
// lib/billing/asaas.ts
// Implementação do BillingProvider pro Asaas (API v3).
//
// Env:
//   ASAAS_API_KEY        chave da conta (sandbox ou produção)
//   ASAAS_ENV            "sandbox" (default) | "production"
//   ASAAS_WEBHOOK_TOKEN  token configurado no webhook do painel; o Asaas o
//                        manda no header `asaas-access-token`
//
// Checkout hospedado (POST /v3/checkouts, chargeTypes RECURRENT): o Asaas
// cria cliente + assinatura quando o pagador conclui. A reconciliação com o
// nosso usuário usa, nesta ordem: checkout.id gravado em subscriptions,
// externalReference (encodeReference), customer.id já conhecido, e-mail do
// cliente. Ver lib/billing/apply.ts.
// =====================================================================

import { readFileSync } from "node:fs"
import path from "node:path"
import type {
  BillingEvent,
  BillingProvider,
  CheckoutRequest,
  CheckoutResult,
  ProviderSubscription,
} from "./types"
import { encodeReference } from "./types"
import { CYCLE_INFO, PLAN_LABEL, priceFor, tokensFor } from "./plans"
import type { BillingCycle } from "./plans"

const BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3"

function apiKey(): string {
  const k = process.env.ASAAS_API_KEY
  if (!k) throw new Error("ASAAS_API_KEY ausente no ambiente")
  return k
}

async function asaas<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  route: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${route}`, {
    method,
    headers: {
      access_token: apiKey(),
      "Content-Type": "application/json",
      "User-Agent": "NexusContent/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  if (!res.ok) {
    const errs = (json as { errors?: { description?: string }[] } | null)?.errors
    const msg = errs?.map((e) => e.description).filter(Boolean).join("; ") || text || res.statusText
    throw new Error(`Asaas ${method} ${route} → ${res.status}: ${msg}`)
  }
  return json as T
}

const CYCLE_TO_ASAAS: Record<BillingCycle, "MONTHLY" | "YEARLY"> = {
  monthly: "MONTHLY",
  annual: "YEARLY",
}
const ASAAS_TO_CYCLE: Record<string, BillingCycle> = {
  MONTHLY: "monthly",
  YEARLY: "annual",
}

/** O checkout exige imagem do item. Usa o ícone do produto (12 KB). */
let productImageB64: string | null = null
function productImage(): string {
  if (productImageB64) return productImageB64
  const file = path.join(process.cwd(), "public", "nexus-icon.png")
  productImageB64 = readFileSync(file).toString("base64")
  return productImageB64
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface AsaasSubscription {
  id: string
  customer: string
  status: string
  cycle: string
  value: number
  nextDueDate: string | null
  externalReference: string | null
  deleted?: boolean
}

function mapSubscription(s: AsaasSubscription): ProviderSubscription {
  const status =
    s.deleted ? "expired"
    : s.status === "ACTIVE" ? "active"
    : s.status === "INACTIVE" ? "inactive"
    : s.status === "EXPIRED" ? "expired"
    : "unknown"
  return {
    id: s.id,
    customerId: s.customer,
    status,
    cycle: ASAAS_TO_CYCLE[s.cycle] ?? null,
    value: typeof s.value === "number" ? s.value : null,
    nextDueDate: s.nextDueDate ?? null,
    externalReference: s.externalReference ?? null,
  }
}

export const asaasProvider: BillingProvider = {
  name: "asaas",

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const price = priceFor(req.plan, req.cycle)
    const reference = encodeReference({
      userId: req.userId,
      plan: req.plan,
      cycle: req.cycle,
      affiliateCode: req.affiliateCode,
    })
    const tokens = tokensFor(req.plan)
    const cycleLabel = req.cycle === "annual" ? "anual" : "mensal"

    const body: Record<string, unknown> = {
      billingTypes: ["PIX", "CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],
      minutesToExpire: 60,
      externalReference: reference,
      callback: {
        successUrl: req.successUrl,
        cancelUrl: req.cancelUrl,
        expiredUrl: req.cancelUrl,
      },
      items: [
        {
          // máx. 30 caracteres
          name: `Nexus ${PLAN_LABEL[req.plan]} ${cycleLabel}`.slice(0, 30),
          description: `${tokens.toLocaleString("pt-BR")} tokens/mês · ${CYCLE_INFO[req.cycle].suffix}`.slice(0, 150),
          quantity: 1,
          value: price.total,
          imageBase64: productImage(),
          externalReference: reference,
        },
      ],
      subscription: {
        cycle: CYCLE_TO_ASAAS[req.cycle],
        nextDueDate: isoDate(new Date()),
      },
      customerData: {
        email: req.email,
        ...(req.name ? { name: req.name } : {}),
      },
    }
    if (req.split) {
      body.splits = [{ walletId: req.split.walletId, percentageValue: req.split.percent }]
    }

    const out = await asaas<{ id: string; link: string; status: string }>(
      "POST",
      "/checkouts",
      body,
    )
    if (!out?.id || !out?.link) throw new Error("Asaas: checkout sem id/link")
    return { checkoutId: out.id, url: out.link }
  },

  async getSubscription(id) {
    try {
      const s = await asaas<AsaasSubscription>("GET", `/subscriptions/${id}`)
      return s ? mapSubscription(s) : null
    } catch {
      return null
    }
  },

  async listSubscriptionsByCustomer(customerId) {
    const out = await asaas<{ data: AsaasSubscription[] }>(
      "GET",
      `/subscriptions?customer=${encodeURIComponent(customerId)}&limit=20`,
    )
    return (out?.data ?? []).map(mapSubscription)
  },

  async setSubscriptionReference(id, externalReference) {
    await asaas("PUT", `/subscriptions/${id}`, { externalReference })
  },

  async cancelSubscription(id) {
    await asaas("DELETE", `/subscriptions/${id}`)
  },

  async getCustomerEmail(customerId) {
    try {
      const c = await asaas<{ email?: string | null }>("GET", `/customers/${customerId}`)
      return c?.email ?? null
    } catch {
      return null
    }
  },

  parseWebhook(headers, rawBody): BillingEvent {
    const expected = process.env.ASAAS_WEBHOOK_TOKEN
    if (!expected) throw new Error("ASAAS_WEBHOOK_TOKEN ausente no ambiente")
    const got = headers.get("asaas-access-token")
    if (!got || got !== expected) throw new Error("webhook: token inválido")

    const payload = JSON.parse(rawBody) as {
      id?: string
      event?: string
      payment?: {
        id: string
        customer?: string
        subscription?: string | null
        checkoutSession?: string | null
        value?: number
        netValue?: number
        billingType?: string
        externalReference?: string | null
        confirmedDate?: string | null
        paymentDate?: string | null
        clientPaymentDate?: string | null
        split?: { walletId?: string; totalValue?: number }[]
      }
      checkout?: { id: string; customer?: string | null; externalReference?: string | null }
      subscription?: { id: string; customer?: string | null }
    }
    const eventId = payload.id ?? `${payload.event}:${payload.payment?.id ?? payload.checkout?.id ?? "?"}`
    const ev = payload.event ?? ""
    const p = payload.payment

    if ((ev === "PAYMENT_CONFIRMED" || ev === "PAYMENT_RECEIVED") && p) {
      return {
        type: "payment_confirmed",
        eventId,
        paymentId: p.id,
        subscriptionId: p.subscription ?? null,
        customerId: p.customer ?? null,
        checkoutId: p.checkoutSession ?? null,
        externalReference: p.externalReference ?? null,
        value: p.value ?? 0,
        netValue: p.netValue ?? null,
        billingType: p.billingType ?? null,
        paidAt: p.confirmedDate ?? p.clientPaymentDate ?? p.paymentDate ?? null,
      }
    }
    if (ev === "PAYMENT_OVERDUE" && p) {
      return {
        type: "payment_overdue",
        eventId,
        paymentId: p.id,
        subscriptionId: p.subscription ?? null,
        customerId: p.customer ?? null,
      }
    }
    // Só estorno CONSUMADO derruba a assinatura. PAYMENT_CHARGEBACK_REQUESTED
    // é a ABERTURA de uma disputa, que pode ser ganha: tratar como estorno
    // recolheria os tokens e cancelaria o cliente antes da decisão, e não há
    // caminho de volta automático. Fica em 'ignored' de propósito, pra ser
    // resolvido pelo evento final (REFUNDED) ou na mão.
    if (ev === "PAYMENT_REFUNDED" && p) {
      return {
        type: "payment_refunded",
        eventId,
        paymentId: p.id,
        subscriptionId: p.subscription ?? null,
        customerId: p.customer ?? null,
        value: p.value ?? 0,
      }
    }
    if (ev === "PAYMENT_SPLIT_DONE" && p) {
      const s = p.split?.[0]
      return {
        type: "split_done",
        eventId,
        paymentId: p.id,
        walletId: s?.walletId ?? null,
        value: s?.totalValue ?? null,
      }
    }
    if (ev === "CHECKOUT_PAID" && payload.checkout) {
      return {
        type: "checkout_paid",
        eventId,
        checkoutId: payload.checkout.id,
        customerId: payload.checkout.customer ?? null,
        externalReference: payload.checkout.externalReference ?? null,
      }
    }
    if (
      (ev === "SUBSCRIPTION_DELETED" || ev === "SUBSCRIPTION_INACTIVATED") &&
      payload.subscription
    ) {
      return {
        type: "subscription_canceled",
        eventId,
        subscriptionId: payload.subscription.id,
        customerId: payload.subscription.customer ?? null,
      }
    }
    return { type: "ignored", eventId, raw: ev }
  },
}
