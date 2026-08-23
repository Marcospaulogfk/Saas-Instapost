// =====================================================================
// lib/billing/plans.ts
// Preço dos planos e ciclos de cobrança — a ÚNICA fonte (pricing, checkout,
// página de tokens e webhook leem daqui).
//
// Decisão do Marcos (22/08/2026, TOKENS-INDICACAO-AFILIADOS-rev3 §2.4 e §10):
//   - só MENSAL e ANUAL (trimestral/semestral saem, "pelo menos por agora");
//   - anual = 30% de desconto NO PREÇO; os tokens do plano NÃO encolhem
//     (PLAN_TOKENS vale em qualquer ciclo). Com o usuário queimando 100% dos
//     tokens isso deixa Pro anual em ~76% e Studio anual em ~67% de margem
//     bruta; aceito porque é caixa adiantado e churn menor.
// =====================================================================

import { PLAN_TOKENS, type Plan } from "@/lib/tokens"

export type PaidPlan = Exclude<Plan, "trial">
export type BillingCycle = "monthly" | "annual"

export const PAID_PLANS: PaidPlan[] = ["starter", "pro", "studio"]
export const BILLING_CYCLES: BillingCycle[] = ["monthly", "annual"]

/** Preço cheio por mês, em reais. */
export const PLAN_PRICE_MONTHLY: Record<PaidPlan, number> = {
  starter: 47,
  pro: 97,
  studio: 247,
}

export const CYCLE_INFO: Record<
  BillingCycle,
  { discount: number; months: number; label: string; suffix: string }
> = {
  monthly: { discount: 0, months: 1, label: "/mês", suffix: "Cobrado mensalmente" },
  annual: { discount: 0.3, months: 12, label: "/mês", suffix: "Cobrado anualmente" },
}

export const PLAN_LABEL: Record<Plan, string> = {
  trial: "Teste grátis",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
}

export function isPaidPlan(v: unknown): v is PaidPlan {
  return typeof v === "string" && (PAID_PLANS as string[]).includes(v)
}
export function isBillingCycle(v: unknown): v is BillingCycle {
  return typeof v === "string" && (BILLING_CYCLES as string[]).includes(v)
}

/**
 * Quanto o usuário paga. `total` é o valor da cobrança no ciclo (o que vai
 * pro checkout); `perMonth` é o equivalente mensal exibido no card.
 */
export function priceFor(plan: PaidPlan, cycle: BillingCycle) {
  const base = PLAN_PRICE_MONTHLY[plan]
  const { discount, months } = CYCLE_INFO[cycle]
  const perMonth = Math.round(base * (1 - discount))
  const total = perMonth * months
  return {
    base,
    perMonth,
    total,
    savings: base * months - total,
    discount,
    months,
  }
}

/** Tokens por mês — iguais em todo ciclo, por decisão. */
export function tokensFor(plan: PaidPlan): number {
  return PLAN_TOKENS[plan]
}

/** Próxima renovação a partir de `from`, pelo ciclo. */
export function nextRenewal(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + CYCLE_INFO[cycle].months)
  return d
}
