// =====================================================================
// lib/tokens.ts
// Fonte única da verdade do sistema de TOKENS do SyncPost.
//
// Estratégia completa (números, planos, margens): ver
// ESTRATEGIA-MONETIZACAO.md na raiz do repo.
//
// Moeda = token. Cada ação "queima" tokens conforme a qualidade:
//   - texto sozinho (roteiro/legenda, sem imagem) = 1 token
//   - imagem NORMAL (Flux / Nano Banana normal)    = 5 tokens
//   - imagem Nano Banana PRO                        = 20 tokens
//
// Nano Banana Pro só é liberado nos planos Pro e Studio (Starter e trial
// caem para imagem normal — é o gancho de upgrade, §5 do doc).
//
// Este módulo é ADITIVO: os campos de crédito já existentes no perfil
// (`credits`, `plan_credits_monthly`, `plan_credits_used_this_month`)
// passam a ser lidos com semântica de "tokens" — sem tabela nova.
// =====================================================================

/** Custo em tokens por tipo de ação. Ver §3 do ESTRATEGIA-MONETIZACAO.md. */
export const TOKEN_COST = {
  /** Texto sozinho (roteiro/legenda, sem imagem). */
  textOnly: 1,
  /** Imagem normal — Flux Schnell / Flux Pro / Nano Banana normal. */
  imageNormal: 5,
  /** Imagem Nano Banana Pro (Gemini 3 Pro Image) — 4× mais cara. */
  imagePro: 20,
} as const

/** Planos disponíveis. `trial` = teste grátis (≈ 7 slides, ver §5). */
export type Plan = "trial" | "starter" | "pro" | "studio"

/** Qualidade de imagem que o usuário pode pedir. */
export type ImageQuality = "normal" | "pro"

/**
 * Tokens concedidos por mês em cada plano (grant recorrente).
 * O trial é um one-shot (~7 slides de imagem normal ≈ 40 tokens, §5).
 */
export const PLAN_TOKENS: Record<Plan, number> = {
  trial: 40,
  starter: 300,
  pro: 1000,
  studio: 3000,
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

/** Custo em tokens de uma imagem conforme a qualidade escolhida. */
export function tokenCostForImage(quality: ImageQuality): number {
  return quality === "pro" ? TOKEN_COST.imagePro : TOKEN_COST.imageNormal
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
