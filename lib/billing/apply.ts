// =====================================================================
// lib/billing/apply.ts
// O que acontece no NOSSO banco quando o provedor avisa alguma coisa.
// Nunca vê payload cru: recebe BillingEvent (lib/billing/types.ts).
//
// Regras (TOKENS-INDICACAO-AFILIADOS-rev3 §4):
//   - pagamento confirmado  → grant do plano (recarrega e zera a sobra),
//                             users vira active, renova em +1 mês / +12 meses;
//                             1º pagamento credita a indicação (se não veio
//                             por afiliado) e registra comissão de afiliado.
//   - atraso                → marca past_due_since; o job diário rebaixa
//                             pra trial depois de 5 dias de carência.
//   - estorno/chargeback    → tira os tokens do plano que sobraram, cancela.
//   - assinatura cancelada  → mantém acesso até plan_renews_at; o job fecha.
//
// Idempotência: billing_events (provider, event_id) único + grant por
// payment_id checado no extrato. Webhook do Asaas é at-least-once.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { REFERRAL_TOKENS } from "@/lib/indicacao/config"
import { getBilling } from "./index"
import { decodeReference, type BillingEvent } from "./types"
import {
  isBillingCycle,
  isPaidPlan,
  nextRenewal,
  priceFor,
  tokensFor,
  type BillingCycle,
  type PaidPlan,
} from "./plans"
import { registrarComissaoAfiliado } from "@/lib/afiliados/comissao"

export const PAST_DUE_GRACE_DAYS = 5

/**
 * Próxima RECARGA de fichas: sempre daqui a um mês.
 *
 * Reusa `nextRenewal(_, "monthly")` de propósito, em vez de somar mês na mão:
 * a virada de mês curto (31/01 → 03/03, comportamento do setMonth do JS) passa
 * a ser a MESMA em todo lugar que fala de ciclo. Um helper próprio aqui criaria
 * uma segunda semântica de "mês que vem" no mesmo arquivo.
 */
function proximaRecarga(from: Date): Date {
  return nextRenewal(from, "monthly")
}

/**
 * Onde cai a próxima recarga depois de `vencimento`, sem passar do fim do
 * período pago e sem creditar histórico.
 *
 * O `while` existe para uma conta que ficou MESES parada (foi exatamente o que
 * aconteceu com o primeiro cliente): o job credita UM ciclo e pula direto pro
 * próximo vencimento no futuro, em vez de ir creditando um mês por dia até
 * alcançar o presente. Recarga atrasada é decisão de dono, não de robô.
 */
function proximoVencimento(vencimento: Date, agora: Date, fimDoPago: Date): Date {
  let prox = proximaRecarga(vencimento)
  while (prox <= agora && prox < fimDoPago) prox = proximaRecarga(prox)
  return prox > fimDoPago ? fimDoPago : prox
}

/**
 * As DUAS datas que um pagamento confirmado gera, que deixaram de ser a mesma
 * em 19/09/2026:
 *
 *   `periodEnd` = até quando o dinheiro pagou (vai pra plan_prepaid_until e
 *                 pro current_period_end da assinatura);
 *   `renewsAt`  = quando cai a próxima RECARGA de fichas.
 *
 * No MENSAL as duas coincidem, e é por isso que quem já existe não sente
 * nada. No ANUAL o cliente paga 12 meses de uma vez, mas as fichas recarregam
 * todo mês — antes disso o anual recebia o grant uma vez só no ano inteiro.
 *
 * Pura e exportada de propósito: é a regra que o teste precisa conseguir
 * afirmar sem montar um webhook inteiro em volta.
 */
export function datasDoPagamento(
  paidAt: Date,
  cycle: BillingCycle,
): { periodEnd: Date; renewsAt: Date } {
  const periodEnd = nextRenewal(paidAt, cycle)
  return {
    periodEnd,
    renewsAt: cycle === "annual" ? proximaRecarga(paidAt) : periodEnd,
  }
}

type Admin = SupabaseClient

interface ResolvedUser {
  userId: string
  plan: PaidPlan | null
  cycle: BillingCycle | null
  affiliateCode: string | null
  subscriptionRowId: string | null
}

/** Registra o evento; devolve false se já foi processado (duplicado). */
async function claimEvent(
  admin: Admin,
  provider: string,
  ev: BillingEvent,
  raw: unknown,
): Promise<boolean> {
  const { error } = await admin.from("billing_events").insert({
    provider,
    event_id: ev.eventId,
    event_type: ev.type,
    payload: raw ?? {},
  })
  if (!error) return true
  if (error.code === "23505") return false // unique_violation
  throw new Error(`billing_events: ${error.message}`)
}

async function markEvent(admin: Admin, provider: string, eventId: string, error?: string) {
  await admin
    .from("billing_events")
    .update({ processed: !error, error: error ?? null })
    .eq("provider", provider)
    .eq("event_id", eventId)
}

/**
 * Descobre QUEM é o usuário do evento, tentando do mais certo pro mais
 * frouxo: assinatura conhecida → checkout conhecido → externalReference →
 * assinatura no provedor (referência lá) → cliente conhecido → e-mail.
 */
async function resolveUser(
  admin: Admin,
  provider: string,
  p: {
    subscriptionId?: string | null
    checkoutId?: string | null
    customerId?: string | null
    externalReference?: string | null
  },
): Promise<ResolvedUser | null> {
  const fromRef = (ref: string | null | undefined, base?: Partial<ResolvedUser>): ResolvedUser | null => {
    const d = decodeReference(ref)
    if (!d.userId) return null
    return {
      userId: d.userId,
      plan: d.plan,
      cycle: d.cycle,
      affiliateCode: d.affiliateCode,
      subscriptionRowId: base?.subscriptionRowId ?? null,
    }
  }

  // 1) assinatura já conhecida
  if (p.subscriptionId) {
    const { data } = await admin
      .from("subscriptions")
      .select("id, user_id, plan_id, billing_cycle, affiliate_code")
      .eq("provider", provider)
      .eq("provider_subscription_id", p.subscriptionId)
      .maybeSingle()
    if (data) {
      return {
        userId: data.user_id,
        plan: isPaidPlan(data.plan_id) ? data.plan_id : null,
        cycle: isBillingCycle(data.billing_cycle) ? data.billing_cycle : null,
        affiliateCode: data.affiliate_code ?? null,
        subscriptionRowId: data.id,
      }
    }
  }
  // 2) checkout que nós abrimos
  if (p.checkoutId) {
    const { data } = await admin
      .from("subscriptions")
      .select("id, user_id, plan_id, billing_cycle, affiliate_code")
      .eq("provider", provider)
      .eq("checkout_id", p.checkoutId)
      .maybeSingle()
    if (data) {
      return {
        userId: data.user_id,
        plan: isPaidPlan(data.plan_id) ? data.plan_id : null,
        cycle: isBillingCycle(data.billing_cycle) ? data.billing_cycle : null,
        affiliateCode: data.affiliate_code ?? null,
        subscriptionRowId: data.id,
      }
    }
  }
  // 3) referência no próprio evento
  const r3 = fromRef(p.externalReference)
  if (r3) return r3
  // 4) referência na assinatura do provedor
  if (p.subscriptionId) {
    const sub = await getBilling().getSubscription(p.subscriptionId)
    const r4 = fromRef(sub?.externalReference)
    if (r4) return r4
    // 4b) valor da assinatura → plano/ciclo, cliente → usuário
    if (sub) {
      const guess = guessPlanByValue(sub.value, sub.cycle)
      const byCustomer = await userByCustomer(admin, provider, sub.customerId)
      if (byCustomer) return { ...byCustomer, ...(guess ?? {}) }
    }
  }
  // 5) cliente conhecido
  if (p.customerId) {
    const byCustomer = await userByCustomer(admin, provider, p.customerId)
    if (byCustomer) return byCustomer
    // 6) e-mail do cliente no provedor.
    // eq, nunca ilike: no ilike o "_" é curinga de UM caractere e o e-mail vem
    // do cadastro que o PAGADOR preencheu, então "marcosodp_r@gmail.com"
    // casaria com a conta "marcosodpor@gmail.com". Dois resultados = não
    // resolvido, porque creditar o plano na conta errada é pior que não
    // creditar (o webhook reprocessa; o token creditado errado, não).
    const email = (await getBilling().getCustomerEmail(p.customerId))?.trim().toLowerCase()
    if (email) {
      const { data } = await admin
        .from("users")
        .select("id")
        .eq("email", email)
        .limit(2)
      if (data?.length === 1) {
        return { userId: data[0].id, plan: null, cycle: null, affiliateCode: null, subscriptionRowId: null }
      }
    }
  }
  return null
}

async function userByCustomer(admin: Admin, provider: string, customerId: string | null) {
  if (!customerId) return null
  const { data } = await admin
    .from("users")
    .select("id, plan_id, plan_cycle")
    .eq("billing_provider", provider)
    .eq("billing_customer_id", customerId)
    .maybeSingle()
  if (!data) return null
  return {
    userId: data.id,
    plan: isPaidPlan(data.plan_id) ? data.plan_id : null,
    cycle: isBillingCycle(data.plan_cycle) ? data.plan_cycle : null,
    affiliateCode: null,
    subscriptionRowId: null,
  } as ResolvedUser
}

/** Último recurso: bate o valor cobrado com a tabela de preços. */
function guessPlanByValue(value: number | null, cycle: BillingCycle | null) {
  if (!value) return null
  for (const plan of ["starter", "pro", "studio"] as PaidPlan[]) {
    for (const c of (cycle ? [cycle] : ["monthly", "annual"]) as BillingCycle[]) {
      if (Math.abs(priceFor(plan, c).total - value) < 0.01) return { plan, cycle: c }
    }
  }
  return null
}

// ---------------------------------------------------------------------

/**
 * O evento é de OUTRO produto na mesma conta do provedor?
 *
 * Descoberto em 22/08/2026 olhando o painel: a conta Asaas é compartilhada
 * (existe um webhook "EverReply - billing" nela), e webhook do Asaas é por
 * CONTA, não por produto. Ou seja, este endpoint recebe as cobranças do outro
 * SaaS também.
 *
 * Por isso "não identifiquei o usuário" NÃO pode ser erro: se fosse, cada
 * cobrança do EverReply viraria 500, o Asaas reenviaria pra sempre e acabaria
 * penalizando o webhook. Cobrança que não é nossa é ignorada com 200.
 */
function naoENosso(ev: { paymentId?: string; type: string }, contexto: string) {
  console.warn(`[billing] ${contexto} ignorado (não é do Nexus): ${ev.paymentId ?? ev.type}`)
}

async function onPaymentConfirmed(
  admin: Admin,
  provider: string,
  ev: Extract<BillingEvent, { type: "payment_confirmed" }>,
) {
  const who = await resolveUser(admin, provider, ev)
  if (!who) return naoENosso(ev, "pagamento confirmado")

  let { plan, cycle } = who
  if (!plan || !cycle) {
    const g = guessPlanByValue(ev.value, cycle)
    plan = plan ?? g?.plan ?? null
    cycle = cycle ?? g?.cycle ?? null
  }
  if (!plan || !cycle) {
    // Identificamos o usuário mas não o plano: acontece se alguém cobrar por
    // fora da tabela de preços. Não dá pra creditar sem saber quantos tokens,
    // e insistir num 500 eterno só entope a fila do provedor.
    console.error(
      `[billing] pagamento ${ev.paymentId} do usuário ${who.userId}: plano/ciclo não identificado (valor ${ev.value}). Creditar à mão.`,
    )
    return
  }

  // Já creditamos este pagamento? O Asaas manda PAYMENT_CONFIRMED e
  // PAYMENT_RECEIVED pro mesmo pagamento, com ids de evento diferentes, então
  // o dedupe por event_id não pega. Esta checagem é a primeira barreira; a
  // segunda (que também cobre a corrida entre os dois) mora no grant_tokens,
  // que devolve duplicate:true sob o mesmo FOR UPDATE.
  const { data: already } = await admin
    .from("token_transactions")
    .select("id")
    .eq("user_id", who.userId)
    .eq("kind", "grant_plan")
    .eq("ref_id", ev.paymentId)
    .maybeSingle()
  if (already) return

  // PRIMEIRO pagamento da conta = não existe nenhuma recarga de plano antes
  // desta. Derivar de users.billing_subscription_id seria errado: esse campo
  // é escrito ANTES do grant, então uma falha no meio (o webhook reprocessa)
  // faria a segunda tentativa achar que já era cliente e o bônus de indicação
  // do padrinho nunca seria creditado.
  const { count: grantsAnteriores } = await admin
    .from("token_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", who.userId)
    .eq("kind", "grant_plan")
  const firstPayment = (grantsAnteriores ?? 0) === 0

  const paidAt = ev.paidAt ? new Date(ev.paidAt) : new Date()
  // Fim do período pago x próxima recarga de fichas: iguais no mensal,
  // diferentes no anual. Ver datasDoPagamento().
  const { periodEnd, renewsAt } = datasDoPagamento(paidAt, cycle)

  // Primeiro pagamento deste usuário? (decide indicação/comissão de entrada)
  const { data: prev } = await admin
    .from("users")
    .select("subscription_status, billing_subscription_id, plan_id, credits")
    .eq("id", who.userId)
    .single()
  const previousSubscriptionId = prev?.billing_subscription_id ?? null
  const switchedSubscription =
    Boolean(ev.subscriptionId) && Boolean(previousSubscriptionId) && ev.subscriptionId !== previousSubscriptionId

  // Troca de plano: a sobra do plano antigo vira AVULSO (não vence) antes do
  // grant novo zerar o balde do plano. Sem pró-rata, sem perda.
  if (switchedSubscription && (prev?.credits ?? 0) > 0) {
    // ref_id próprio: se o evento vier repetido, o grant_tokens devolve
    // duplicate e a sobra não é creditada duas vezes como avulso.
    const { error: switchErr } = await admin.rpc("grant_tokens", {
      p_user_id: who.userId,
      p_amount: prev!.credits,
      p_bucket: "topup",
      p_kind: "grant_topup",
      p_ref_type: "payment",
      p_ref_id: `troca:${ev.paymentId}`,
      p_title: "Sobra do plano anterior preservada (troca de plano)",
    })
    if (switchErr) throw new Error(`grant_tokens (troca de plano): ${switchErr.message}`)
    // NÃO zeramos users.credits na mão aqui de propósito: o grant do plano
    // logo abaixo emite a linha 'expire_plan' com a sobra e só então faz o
    // SET. Zerar por fora tiraria token do balde sem linha no extrato, e o
    // somatório do extrato deixaria de bater com o saldo pra sempre.
  }

  // subscriptions: upsert da linha
  const subPatch = {
    user_id: who.userId,
    provider,
    provider_subscription_id: ev.subscriptionId,
    provider_customer_id: ev.customerId,
    plan_id: plan,
    billing_cycle: cycle,
    status: "active",
    current_period_start: paidAt.toISOString(),
    current_period_end: periodEnd.toISOString(),
    last_payment_id: ev.paymentId,
    value_cents: Math.round(ev.value * 100),
    affiliate_code: who.affiliateCode,
    canceled_at: null,
  }
  if (who.subscriptionRowId) {
    await admin.from("subscriptions").update(subPatch).eq("id", who.subscriptionRowId)
  } else {
    await admin.from("subscriptions").insert(subPatch)
  }

  // users: vira/continua ativo
  await admin
    .from("users")
    .update({
      subscription_status: "active",
      plan_id: plan,
      plan_cycle: cycle,
      plan_renews_at: renewsAt.toISOString(),
      // Até quando o dinheiro que entrou já pagou (migration 0031). No mensal
      // é igual a plan_renews_at, e o ramo pré-pago do job nunca dispara.
      plan_prepaid_until: periodEnd.toISOString(),
      past_due_since: null,
      billing_provider: provider,
      billing_customer_id: ev.customerId,
      billing_subscription_id: ev.subscriptionId,
    })
    .eq("id", who.userId)

  // tokens do plano (recarrega e zera a sobra) — uma linha no extrato
  const { data: grantOut, error: grantErr } = await admin.rpc("grant_tokens", {
    p_user_id: who.userId,
    p_amount: tokensFor(plan),
    p_bucket: "plan",
    p_kind: "grant_plan",
    p_ref_type: "payment",
    p_ref_id: ev.paymentId,
    p_title: `Plano ${plan === "starter" ? "Starter" : plan === "pro" ? "Pro" : "Studio"} ${cycle === "annual" ? "anual" : "mensal"}`,
    p_meta: { value: ev.value, net: ev.netValue, billing_type: ev.billingType },
  })
  if (grantErr) throw new Error(`grant_tokens: ${grantErr.message}`)
  // grant_tokens devolve {ok:false} SEM erro de transporte (usuário
  // inexistente, balde inválido). Sem esta checagem o evento era marcado como
  // processado, o usuário virava 'active' com zero token e nada reprocessava.
  if (!(grantOut as { ok?: boolean } | null)?.ok) {
    throw new Error(`grant_tokens recusou: ${JSON.stringify(grantOut)}`)
  }

  // troca de plano: encerra a assinatura antiga no provedor
  if (switchedSubscription && previousSubscriptionId) {
    try {
      await getBilling().cancelSubscription(previousSubscriptionId)
      await admin
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("provider", provider)
        .eq("provider_subscription_id", previousSubscriptionId)
    } catch (e) {
      console.warn("[billing] cancelar assinatura anterior falhou:", e)
    }
  }

  // cimenta o vínculo no provedor (próximos webhooks caem no caso 1)
  if (ev.subscriptionId && !who.subscriptionRowId) {
    try {
      const { encodeReference } = await import("./types")
      await getBilling().setSubscriptionReference(
        ev.subscriptionId,
        encodeReference({ userId: who.userId, plan, cycle, affiliateCode: who.affiliateCode }),
      )
    } catch (e) {
      console.warn("[billing] setSubscriptionReference falhou:", e)
    }
  }

  // indicação (tokens) — só no 1º pagamento e só se NÃO veio por afiliado
  if (firstPayment && !who.affiliateCode) {
    const { error } = await admin.rpc("creditar_indicacao_no_pagamento", {
      p_referred_id: who.userId,
      p_tokens_referrer: REFERRAL_TOKENS.indicador,
      p_tokens_referred: REFERRAL_TOKENS.indicado,
    })
    if (error) console.warn("[billing] creditar_indicacao_no_pagamento:", error.message)
  }

  // afiliado (dinheiro) — toda cobrança; feature atrás de flag, nunca lança
  if (who.affiliateCode) {
    try {
      await registrarComissaoAfiliado(admin, {
        affiliateCode: who.affiliateCode,
        userId: who.userId,
        paymentId: ev.paymentId,
        provider,
        grossValue: ev.value,
        netValue: ev.netValue,
        first: firstPayment,
      })
    } catch (e) {
      console.warn("[billing] comissão de afiliado falhou:", e)
    }
  }
}

async function onPaymentOverdue(
  admin: Admin,
  provider: string,
  ev: Extract<BillingEvent, { type: "payment_overdue" }>,
) {
  const who = await resolveUser(admin, provider, ev)
  if (!who) return
  await admin
    .from("users")
    .update({ subscription_status: "past_due", past_due_since: new Date().toISOString() })
    .eq("id", who.userId)
    .is("past_due_since", null)
  if (who.subscriptionRowId) {
    await admin.from("subscriptions").update({ status: "past_due" }).eq("id", who.subscriptionRowId)
  }
}

async function onPaymentRefunded(
  admin: Admin,
  provider: string,
  ev: Extract<BillingEvent, { type: "payment_refunded" }>,
) {
  const who = await resolveUser(admin, provider, ev)
  if (!who) return
  const { data: u } = await admin.from("users").select("credits").eq("id", who.userId).single()
  const rest = Math.max(0, u?.credits ?? 0)
  if (rest > 0) {
    await admin.rpc("apply_tokens", {
      p_user_id: who.userId,
      p_amount: rest,
      p_kind: "strip_plan",
      p_ref_type: "payment",
      p_ref_id: ev.paymentId,
      p_title: "Estorno do pagamento: tokens do plano removidos",
    })
  }
  await admin
    .from("users")
    .update({ subscription_status: "canceled", plan_renews_at: null })
    .eq("id", who.userId)
  if (who.subscriptionRowId) {
    await admin
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", who.subscriptionRowId)
  }
  try {
    const { estornarComissaoAfiliado } = await import("@/lib/afiliados/comissao")
    await estornarComissaoAfiliado(admin, ev.paymentId, provider)
  } catch (e) {
    console.warn("[billing] estorno de comissão falhou:", e)
  }
}

async function onSubscriptionCanceled(
  admin: Admin,
  provider: string,
  ev: Extract<BillingEvent, { type: "subscription_canceled" }>,
) {
  const who = await resolveUser(admin, provider, ev)
  if (!who?.subscriptionRowId) return
  // Acesso segue até plan_renews_at; o job diário fecha a conta.
  await admin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", who.subscriptionRowId)
}

async function onCheckoutPaid(
  admin: Admin,
  provider: string,
  ev: Extract<BillingEvent, { type: "checkout_paid" }>,
) {
  // Só guarda o cliente; o grant vem do PAYMENT_CONFIRMED/RECEIVED.
  const who = await resolveUser(admin, provider, { checkoutId: ev.checkoutId, externalReference: ev.externalReference })
  if (!who) return
  if (ev.customerId) {
    await admin
      .from("users")
      .update({ billing_provider: provider, billing_customer_id: ev.customerId })
      .eq("id", who.userId)
    if (who.subscriptionRowId) {
      await admin
        .from("subscriptions")
        .update({ provider_customer_id: ev.customerId })
        .eq("id", who.subscriptionRowId)
    }
  }
}

// ---------------------------------------------------------------------

/** Entrada única do webhook. Lança em erro de processamento (o provedor reenvia). */
export async function applyBillingEvent(ev: BillingEvent, raw: unknown): Promise<"ok" | "duplicate" | "ignored"> {
  const admin = createAdminClient()
  const provider = getBilling().name
  if (ev.type === "ignored") return "ignored"

  const fresh = await claimEvent(admin, provider, ev, raw)
  if (!fresh) return "duplicate"

  try {
    switch (ev.type) {
      case "payment_confirmed": await onPaymentConfirmed(admin, provider, ev); break
      case "payment_overdue": await onPaymentOverdue(admin, provider, ev); break
      case "payment_refunded": await onPaymentRefunded(admin, provider, ev); break
      case "subscription_canceled": await onSubscriptionCanceled(admin, provider, ev); break
      case "checkout_paid": await onCheckoutPaid(admin, provider, ev); break
      case "split_done": {
        const { marcarComissaoPaga } = await import("@/lib/afiliados/comissao")
        await marcarComissaoPaga(admin, ev.paymentId, provider)
        break
      }
    }
    await markEvent(admin, provider, ev.eventId)
    return "ok"
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await markEvent(admin, provider, ev.eventId, msg)
    // Libera pra reprocessar quando o provedor reenviar.
    await admin.from("billing_events").delete().eq("provider", provider).eq("event_id", ev.eventId)
    throw e
  }
}

// ---------------------------------------------------------------------
// Job diário (app/api/cron/renovacao): rede de segurança do webhook.
//   - passou da renovação e o provedor diz que a assinatura está ativa com
//     vencimento adiante → pagou e a gente perdeu o evento: credita;
//   - PERÍODO JÁ PAGO (plan_prepaid_until no futuro) → recarrega as fichas do
//     mês sem perguntar nada ao provedor: o dinheiro já entrou. Cobre o ciclo
//     anual e a assinatura montada à mão. Acabou o período pago e não há
//     provedor → a assinatura termina e a conta vira trial;
//   - cancelada e passou da data → fecha;
//   - em atraso há mais de 5 dias → rebaixa pra trial (sem tokens do plano).
//
// `opts.userId` roda a varredura para UMA conta só. Existe porque consertar
// uma conta não pode obrigar a rodar o job no banco inteiro e torcer.
// ---------------------------------------------------------------------
export interface RenewalSweepOptions {
  /** Roda só para esta conta (UUID). Sem isso, varre todo mundo. */
  userId?: string | null
  /** Relógio de referência. Só os testes passam; em produção é agora. */
  now?: Date
}

export async function runRenewalSweep(
  opts: RenewalSweepOptions = {},
): Promise<{ checked: number; granted: number; closed: number; downgraded: number }> {
  const admin = createAdminClient()
  const billing = getBilling()
  const provider = billing.name
  const now = opts.now ?? new Date()
  const out = { checked: 0, granted: 0, closed: 0, downgraded: 0 }

  let query = admin
    .from("users")
    .select(
      "id, plan_id, plan_cycle, plan_renews_at, plan_prepaid_until, past_due_since, subscription_status, billing_subscription_id",
    )
    .in("subscription_status", ["active", "past_due"])
    .not("plan_renews_at", "is", null)
    .lt("plan_renews_at", now.toISOString())
  if (opts.userId) query = query.eq("id", opts.userId)
  const { data: users } = await query.limit(500)

  for (const u of users ?? []) {
    out.checked++
    const plan = isPaidPlan(u.plan_id) ? u.plan_id : null
    const cycle = isBillingCycle(u.plan_cycle) ? u.plan_cycle : null
    if (!plan || !cycle) continue

    // -----------------------------------------------------------------
    // PERÍODO JÁ PAGO: recarrega sem perguntar ao provedor.
    //
    // Vem ANTES da consulta ao provedor de propósito. Uma assinatura montada
    // à mão não tem o que consultar, e antes deste ramo ela caía direto no
    // rebaixamento lá embaixo: preencher a data de renovação de um cliente
    // pré-pago APAGAVA o plano dele em vez de renovar.
    //
    // Idempotência: o ref_id é o vencimento que está sendo processado, então
    // rodar o job duas vezes no mesmo dia bate na trava do grant_tokens e a
    // segunda volta `duplicate` sem creditar. É proteção redundante — a
    // primeira passada já empurra plan_renews_at pro futuro e a conta sai da
    // consulta — mas redundante de propósito: o modo de falha que quebrou a
    // conta do primeiro cliente foi justamente um caminho que ninguém rodou
    // duas vezes.
    // -----------------------------------------------------------------
    const fimDoPago = u.plan_prepaid_until ? new Date(u.plan_prepaid_until) : null
    if (fimDoPago && fimDoPago > now) {
      const vencimento = new Date(u.plan_renews_at as string)
      const { data: grantOut, error: grantErr } = await admin.rpc("grant_tokens", {
        p_user_id: u.id,
        p_amount: tokensFor(plan),
        p_bucket: "plan",
        p_kind: "grant_plan",
        p_ref_type: "prepaid",
        p_ref_id: `prepago:${u.id}:${vencimento.toISOString()}`,
        p_title: `Recarga mensal do plano ${plan} (período já pago)`,
        p_meta: { cycle, prepaid_until: fimDoPago.toISOString() },
      })
      const r = (grantOut ?? {}) as { ok?: boolean; duplicate?: boolean }
      if (grantErr || !r.ok) {
        // NÃO empurra a data: sem crédito, o vencimento continua vencido e o
        // job tenta de novo amanhã. Empurrar aqui pularia o mês em silêncio.
        console.error(
          `[billing] recarga pré-paga falhou (user ${u.id}):`,
          grantErr?.message ?? JSON.stringify(grantOut),
        )
        continue
      }
      if (!r.duplicate) out.granted++
      await admin
        .from("users")
        .update({
          subscription_status: "active",
          past_due_since: null,
          plan_renews_at: proximoVencimento(vencimento, now, fimDoPago).toISOString(),
        })
        .eq("id", u.id)
      continue
    }

    // Período pago acabou e não existe assinatura no provedor pra renovar:
    // a assinatura chegou ao fim. Encerra SUAVE — o extrato e as peças ficam
    // todos de pé, e a conta volta a ser trial, pronta pra assinar de novo.
    if (fimDoPago && !u.billing_subscription_id) {
      const { data: cur } = await admin.from("users").select("credits").eq("id", u.id).single()
      const rest = Math.max(0, cur?.credits ?? 0)
      if (rest > 0) {
        // A sobra do plano zera no fim do ciclo, como zera em toda renovação.
        // Vira LINHA no extrato, não sumiço: o extrato é o que o cliente lê.
        await admin.rpc("apply_tokens", {
          p_user_id: u.id,
          p_amount: rest,
          p_kind: "strip_plan",
          p_ref_type: "prepaid",
          p_ref_id: `fim:${u.id}:${fimDoPago.toISOString()}`,
          p_title: "Fim do período pago: tokens do plano encerrados",
        })
      }
      await admin
        .from("users")
        .update({
          subscription_status: "trial",
          plan_renews_at: null,
          plan_prepaid_until: null,
          plan_credits_monthly: 0,
          plan_id: null,
          plan_cycle: null,
          past_due_since: null,
        })
        .eq("id", u.id)
      out.closed++
      continue
    }

    const { data: subRow } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", u.id)
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const sub = u.billing_subscription_id ? await billing.getSubscription(u.billing_subscription_id) : null
    const canceled = subRow?.status === "canceled" || sub?.status === "expired" || sub?.status === "inactive"

    if (!canceled && sub?.status === "active" && sub.nextDueDate && new Date(sub.nextDueDate) > now) {
      // Pagou e o webhook não chegou: credita com referência no vencimento.
      const refId = `renewal:${u.billing_subscription_id}:${sub.nextDueDate}`
      // Duas checagens, e a segunda é a que importa: o webhook credita com
      // ref_id = id do PAGAMENTO, e este job com ref_id = vencimento. São
      // chaves diferentes, então só olhar a nossa deixaria o job recreditar
      // um mês que o webhook já tinha creditado (ex.: a fila do Asaas ficou
      // pausada e destravou depois). Se existe qualquer recarga de plano
      // DEPOIS da data de renovação que estamos conciliando, o webhook chegou.
      const { data: dup } = await admin
        .from("token_transactions")
        .select("id")
        .eq("user_id", u.id)
        .eq("ref_id", refId)
        .maybeSingle()
      const { count: jaRecarregou } = await admin
        .from("token_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", u.id)
        .eq("kind", "grant_plan")
        .gte("created_at", u.plan_renews_at as string)
      if (!dup && (jaRecarregou ?? 0) === 0) {
        await admin.rpc("grant_tokens", {
          p_user_id: u.id,
          p_amount: tokensFor(plan),
          p_bucket: "plan",
          p_kind: "grant_plan",
          p_ref_type: "renewal",
          p_ref_id: refId,
          p_title: "Renovação do plano (conciliação)",
        })
        out.granted++
      }
      // O provedor diz até quando está pago (o vencimento seguinte). No ANUAL
      // isso fica a 12 meses, mas as fichas recarregam todo mês: a próxima
      // recarga é daqui a um mês, e o fim do pago é que vai lá na frente.
      // No MENSAL os dois são o mesmo dia, exatamente como antes de 19/09/2026.
      const fimDoPagoProvedor = new Date(sub.nextDueDate)
      const proxRecarga =
        cycle === "annual"
          ? proximoVencimento(new Date(u.plan_renews_at as string), now, fimDoPagoProvedor)
          : fimDoPagoProvedor
      await admin
        .from("users")
        .update({
          subscription_status: "active",
          past_due_since: null,
          plan_renews_at: proxRecarga.toISOString(),
          plan_prepaid_until: fimDoPagoProvedor.toISOString(),
        })
        .eq("id", u.id)
      continue
    }

    const graceEnd = new Date(u.plan_renews_at as string)
    graceEnd.setDate(graceEnd.getDate() + PAST_DUE_GRACE_DAYS)
    if (canceled || now > graceEnd) {
      // Fecha: sem tokens do plano, volta a trial (bônus e avulsos ficam).
      const { data: cur } = await admin.from("users").select("credits").eq("id", u.id).single()
      const rest = Math.max(0, cur?.credits ?? 0)
      if (rest > 0) {
        await admin.rpc("apply_tokens", {
          p_user_id: u.id,
          p_amount: rest,
          p_kind: "strip_plan",
          p_ref_type: "subscription",
          p_ref_id: u.billing_subscription_id ?? subRow?.id ?? null,
          p_title: canceled ? "Assinatura encerrada: tokens do plano removidos" : "Pagamento em atraso: tokens do plano removidos",
        })
      }
      await admin
        .from("users")
        .update({
          subscription_status: canceled ? "canceled" : "past_due",
          plan_renews_at: null,
          plan_credits_monthly: 0,
          // Limpa o plano junto: deixar plan_id/plan_cycle preenchidos numa
          // conta sem plano faz a página de tokens mostrar "Studio" pra quem
          // não tem mais nada.
          plan_id: null,
          plan_cycle: null,
        })
        .eq("id", u.id)
      if (canceled) out.closed++
      else out.downgraded++
    }
  }
  return out
}
