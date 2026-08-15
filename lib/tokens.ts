// =====================================================================
// lib/tokens.ts
// Fonte única da verdade do sistema de TOKENS do Nexus Content.
//
// Estratégia completa (números, planos, margens): ver
// ESTRATEGIA-MONETIZACAO.md na raiz do repo.
//
// Moeda = token. O usuário escolhe, por carrossel, se quer imagem de IA na
// CAPA e/ou nos DEMAIS slides — e cada escolha queima tokens:
//   - roteiro + legenda (sempre)                          =  4 tokens
//   - imagem de CAPA (Nano Banana 2 / Gemini 3.1 Flash)    = 25 tokens
//   - imagem por slide de miolo (Flux Schnell)             =  2 tokens
//
// A capa é o único slide que justifica modelo caro: é ela que para o scroll.
// O miolo roda no modelo barato, então "imagem em tudo" custa quase o mesmo
// que "só a capa" — a conta é dominada pela capa.
//
// CALIBRAGEM (regra de negócio): os números acima saem de uma restrição, não
// de gosto — margem bruta >= 80% em TODOS os planos com o usuário queimando
// 100% dos tokens, em qualquer um dos três modos (sem imagem / só capa /
// tudo). Mexer em qualquer custo aqui exige refazer essa verificação.
//
// PRÉ-REQUISITO do textOnly=4: prompt caching ligado no system prompt do
// Claude (texto a ~R$0,05/carrossel). Sem cache o texto custa R$0,12 e o modo
// "sem imagem" desaba pra ~58% de margem.
//
// Este módulo é ADITIVO: os campos de crédito já existentes no perfil
// (`credits`, `plan_credits_monthly`, `plan_credits_used_this_month`)
// passam a ser lidos com semântica de "tokens" — sem tabela nova.
// =====================================================================

/** Custo em tokens por tipo de ação. Ver §3 do ESTRATEGIA-MONETIZACAO.md. */
export const TOKEN_COST = {
  /** Roteiro + legenda. Cobrado sempre, mesmo sem imagem nenhuma. */
  textOnly: 4,
  /** Imagem de CAPA — Nano Banana 2 (Gemini 3.1 Flash Image), ~US$0,08. */
  imageCover: 25,
  /** Imagem de slide de miolo — Flux Schnell, ~US$0,003. */
  imageSlide: 2,
} as const

/** O que o usuário marcou no wizard antes de gerar. */
export interface ImageChoice {
  /** Gerar a imagem da capa com IA. */
  cover: boolean
  /** Gerar imagem de IA em cada slide de miolo. */
  slides: boolean
}

/**
 * Quanto custa gerar um carrossel com as escolhas do usuário.
 * É esta função que alimenta o "vai custar N tokens" na tela de geração — o
 * preço nunca deve ser recalculado à mão em outro lugar.
 *
 * @param totalSlides total de slides do carrossel (capa inclusa).
 */
export function tokenCostForCarousel(
  totalSlides: number,
  choice: ImageChoice,
): number {
  const n = Math.max(1, totalSlides)
  let cost = TOKEN_COST.textOnly
  if (choice.cover) cost += TOKEN_COST.imageCover
  if (choice.slides) cost += TOKEN_COST.imageSlide * Math.max(0, n - 1)
  return cost
}

/** Planos disponíveis. `trial` = teste grátis (≈ 7 slides, ver §5). */
export type Plan = "trial" | "starter" | "pro" | "studio"

/** Qualidade de imagem que o usuário pode pedir. */
export type ImageQuality = "normal" | "pro"

/**
 * Tokens concedidos por mês em cada plano (grant recorrente).
 * O trial é um one-shot (~7 slides de imagem normal ≈ 40 tokens, §5).
 */
export const PLAN_TOKENS: Record<Plan, number> = {
  // 1 carrossel de 7 slides COMPLETO (4 texto + 25 capa + 6×2 miolo = 41),
  // com folga. O trial mostra o produto no melhor estado possível — custa
  // ~R$0,56 de COGS, o CAC mais barato do funil.
  trial: 45,
  starter: 300,
  pro: 1000,
  studio: 3000,
}

/** Ciclos de cobrança e o desconto de cada um (espelha app/pricing/page.tsx). */
export type BillingCycleId = "monthly" | "quarterly" | "semiannual" | "annual"

/**
 * Tokens/mês por plano em CADA ciclo.
 *
 * Por que o grant encolhe quando o preço cai: o token é o que trava o COGS.
 * Manter 1.000 tokens no anual (−40%) significaria entregar o mesmo custo por
 * 60% da receita — o Pro anual fecharia em 72,7% e o Studio em 67,6%, abaixo
 * do piso de 80% que rege a tabela de custos acima.
 *
 * Os números saem da mesma restrição: no modo mais caro (só capa, R$0,466 por
 * carrossel de 29 tokens), tokens <= 0,20 × receita_liquida / 0,016069.
 * Todos os pares abaixo fecham entre 80,4% e 81,5%.
 *
 * O Starter não muda em ciclo nenhum: 300 está bem abaixo do teto dele (554),
 * então sobra folga mesmo no anual.
 */
export const PLAN_TOKENS_BY_CYCLE: Record<
  BillingCycleId,
  Record<Exclude<Plan, "trial">, number>
> = {
  monthly: { starter: 300, pro: 1000, studio: 3000 },
  quarterly: { starter: 300, pro: 950, studio: 2500 },
  semiannual: { starter: 300, pro: 800, studio: 2100 },
  annual: { starter: 300, pro: 700, studio: 1800 },
}

/** Tokens/mês de um plano num ciclo. Fallback seguro no grant mensal. */
export function planTokensForCycle(
  plan: Exclude<Plan, "trial">,
  cycle: BillingCycleId,
): number {
  return PLAN_TOKENS_BY_CYCLE[cycle]?.[plan] ?? PLAN_TOKENS[plan]
}

/**
 * Quais planos podem usar Nano Banana Pro.
 * Starter e trial ficam na imagem normal (gancho de upgrade).
 */
export const PLAN_ALLOWS_PRO: Record<Plan, boolean> = {
  trial: false,
  starter: false,
  pro: true,
  studio: true,
}

/**
 * `true` se o plano pode gerar com Nano Banana Pro.
 * Aceita string desconhecida (fallback = false, seguro por padrão).
 */
export function canUseNanoBananaPro(plan: string | null | undefined): boolean {
  if (!plan) return false
  return PLAN_ALLOWS_PRO[plan as Plan] ?? false
}

/**
 * Custo em tokens de UMA imagem conforme o PAPEL dela no carrossel.
 *
 * O que decide o preço deixou de ser o plano do usuário e passou a ser o
 * slide: capa roda no modelo caro, miolo no barato — para todo mundo.
 */
export function tokenCostForRole(role: "cover" | "slide"): number {
  return role === "cover" ? TOKEN_COST.imageCover : TOKEN_COST.imageSlide
}

/**
 * COMPAT com a assinatura antiga (quality). Os endpoints de geração ainda
 * raciocinam em "normal x pro"; o mapa abaixo os liga na tabela nova sem
 * quebrar nada: "pro" = modelo caro (hoje a capa), "normal" = Flux.
 *
 * @deprecated Usar tokenCostForRole() quando os endpoints passarem a mandar
 * o papel do slide em vez da qualidade derivada do plano.
 */
export function tokenCostForImage(quality: ImageQuality): number {
  return quality === "pro" ? TOKEN_COST.imageCover : TOKEN_COST.imageSlide
}

/**
 * Resolve a qualidade EFETIVA de imagem para um plano.
 * Se o usuário pediu "pro" mas o plano não permite, cai para "normal"
 * (nunca erro — degrada de forma graciosa). Gate server-side.
 */
export function resolveImageQuality(
  plan: string | null | undefined,
  requested: ImageQuality,
): ImageQuality {
  if (requested === "pro" && canUseNanoBananaPro(plan)) return "pro"
  return "normal"
}

/**
 * Deriva o plano a partir do perfil (`public.users`).
 *
 * NÃO existe coluna de plano explícita no schema — o plano é inferido de:
 *  - `subscription_status`: só "active" é pago; qualquer outro (trial,
 *    past_due, canceled, incomplete, null) cai para "trial".
 *  - `plan_credits_monthly`: o grant mensal de tokens mapeia o tier:
 *    3000+ → studio · 1000+ → pro · 300+ → starter · resto → trial.
 *
 * Seguro por padrão: qualquer estado inesperado retorna "trial" (Flux normal).
 */
export function planFromProfile(p: {
  subscription_status?: string | null
  plan_credits_monthly?: number | null
}): Plan {
  const status = p.subscription_status ?? "trial"
  if (status !== "active") return "trial" // só ativo é pago
  const m = p.plan_credits_monthly ?? 0
  if (m >= 3000) return "studio"
  if (m >= 1000) return "pro"
  if (m >= 300) return "starter"
  return "trial"
}

// ---------------------------------------------------------------------
// Mapa plano → tokens usado pelo webhook da Cakto (§8.6 do doc) para
// creditar o grant mensal quando uma compra/renovação é aprovada.
// Aceita os slugs de oferta que a Cakto mandar (normalize antes).
// ---------------------------------------------------------------------
export function planTokensFor(plan: string | null | undefined): number {
  if (!plan) return 0
  return PLAN_TOKENS[plan as Plan] ?? 0
}

// =====================================================================
// Débito de tokens (best-effort).
//
// Decrementa o saldo de tokens do usuário reusando a função SQL
// `consume_image_credit` (0004_credit_functions.sql) num loop de N
// chamadas — cada chamada tira 1 token de forma atômica (FOR UPDATE).
//
// IMPORTANTE: é best-effort. NÃO deve bloquear a geração se falhar.
// Sempre chamar dentro de try/catch nos endpoints; a função já não
// lança (retorna { ok, debited }).
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export interface DebitResult {
  ok: boolean
  /** Quantos tokens foram efetivamente debitados. */
  debited: number
  error?: string
}

/**
 * Debita `amount` tokens do usuário, best-effort.
 *
 * @param client Supabase client (server ou admin) já autenticado.
 * @param userId UUID do usuário.
 * @param amount Total de tokens a debitar (ex: tokenCostForImage()).
 *
 * Nunca lança: em qualquer erro retorna { ok:false } e a geração segue.
 * Reusa `consume_image_credit` (RPC) — 1 token por chamada.
 */
export async function debitTokens(
  client: SupabaseClient,
  userId: string,
  amount: number,
): Promise<DebitResult> {
  if (!userId || amount <= 0) return { ok: true, debited: 0 }
  let debited = 0
  try {
    for (let i = 0; i < amount; i++) {
      const { data, error } = await client.rpc("consume_image_credit", {
        p_user_id: userId,
      })
      // data === false → saldo esgotou; error → falha de RPC.
      if (error || data === false) break
      debited++
    }
    return { ok: debited === amount, debited }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, debited, error: message }
  }
}
