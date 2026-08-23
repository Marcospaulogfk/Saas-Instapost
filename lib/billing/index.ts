// =====================================================================
// lib/billing/index.ts
// Ponto de entrada da camada de pagamento. Quem precisa cobrar, cancelar ou
// traduzir webhook pede `getBilling()`; nunca importa o provedor direto.
// =====================================================================

import type { BillingProvider } from "./types"
import { asaasProvider } from "./asaas"

export * from "./types"
export * from "./plans"

const PROVIDERS: Record<string, BillingProvider> = {
  asaas: asaasProvider,
}

/** Provedor ativo (env BILLING_PROVIDER; default asaas). */
export function getBilling(): BillingProvider {
  const name = process.env.BILLING_PROVIDER || "asaas"
  const p = PROVIDERS[name]
  if (!p) throw new Error(`BILLING_PROVIDER desconhecido: ${name}`)
  return p
}

/** Cobrança está configurada neste ambiente? (sem chave = botões viram "em breve"). */
export function billingConfigured(): boolean {
  const name = process.env.BILLING_PROVIDER || "asaas"
  if (name === "asaas") return Boolean(process.env.ASAAS_API_KEY)
  return false
}
