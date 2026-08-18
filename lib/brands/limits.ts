// =====================================================================
// lib/brands/limits.ts
// Teto de marcas por plano — leitura, formatação e checagem server-side.
//
// Regra: a UI mostra o limite ANTES da ação (no pico de intenção), mas quem
// MANDA é o servidor. Toda escrita que cria marca (createBrand,
// duplicateBrand) passa por `checkBrandLimit` antes do insert.
//
// O limite é derivado do plano (lib/tokens.ts), não guardado no banco — não
// existe migration pra isso de propósito: trocar de plano já muda o teto.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { brandLimitFor, planFromProfile, type Plan } from "@/lib/tokens"

/** Nome do plano como o usuário vê (usado nas mensagens de bloqueio). */
export const PLAN_LABEL: Record<Plan, string> = {
  trial: "Teste grátis",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
}

export interface BrandLimitState {
  plan: Plan
  /** Quantas marcas o usuário já tem. */
  used: number
  /** Teto do plano. Pode ser Infinity se o plano virar "ilimitado". */
  limit: number
  /** Quantas ainda cabem (0 quando estourou). */
  remaining: number
  /** `true` se ainda dá pra criar/duplicar. */
  canCreate: boolean
}

type ProfileLike = {
  subscription_status?: string | null
  plan_credits_monthly?: number | null
} | null

/** Plano + teto a partir do perfil (`public.users`). Perfil nulo cai no trial. */
export function resolveBrandLimit(profile: ProfileLike): {
  plan: Plan
  limit: number
} {
  const plan = planFromProfile(profile ?? {})
  return { plan, limit: brandLimitFor(plan) }
}

/** Monta o estado completo a partir do perfil e da contagem já conhecida. */
export function buildBrandLimitState(
  profile: ProfileLike,
  used: number,
): BrandLimitState {
  const { plan, limit } = resolveBrandLimit(profile)
  const safeUsed = Math.max(0, used)
  return {
    plan,
    used: safeUsed,
    limit,
    remaining: Math.max(0, limit - safeUsed),
    canCreate: safeUsed < limit,
  }
}

/**
 * Indicador de uso: "3 de 5 marcas".
 * Se o plano for ilimitado, some com o "de N" em vez de imprimir "Infinity".
 */
export function formatBrandUsage(state: BrandLimitState): string {
  const noun = state.used === 1 ? "marca" : "marcas"
  if (!Number.isFinite(state.limit)) {
    return `${state.used} ${noun} (ilimitado)`
  }
  return `${state.used} de ${state.limit} ${state.used === 1 && state.limit === 1 ? "marca" : "marcas"}`
}

/**
 * Mensagem de bloqueio. Nunca genérica: diz o plano, o teto, e o que fazer.
 * O texto sai daqui (e não da UI) porque a mesma frase precisa aparecer no
 * retorno da server action — o onboarding só mostra `result.error`.
 */
export function brandLimitMessage(state: BrandLimitState): string {
  const plano = PLAN_LABEL[state.plan]
  if (state.limit === 1) {
    return `O plano ${plano} permite 1 marca e você já cadastrou a sua. Pra gerenciar várias marcas (os seus clientes, por exemplo), faça upgrade em Plano e cobrança.`
  }
  return `O plano ${plano} permite ${state.limit} marcas e você já usou todas. Faça upgrade em Plano e cobrança pra liberar mais marcas.`
}

/**
 * Checagem server-side: lê o plano do usuário e conta as marcas dele.
 *
 * Recebe o client já autenticado (a RLS de brands é por user_id, então a
 * contagem é a do próprio usuário).
 *
 * FAIL-OPEN deliberado: se a contagem falhar (erro de rede/RLS), `count` vem
 * null, `used` = 0 e a criação passa. O teto é regra de MONETIZAÇÃO, não de
 * segurança — travar um cliente pagante por erro transitório custa mais caro
 * do que uma marca a mais escapando.
 */
export async function checkBrandLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<BrandLimitState> {
  const [profileRes, countRes] = await Promise.all([
    supabase
      .from("users")
      .select("subscription_status, plan_credits_monthly")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("brands")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ])

  return buildBrandLimitState(
    (profileRes.data as ProfileLike) ?? null,
    countRes.count ?? 0,
  )
}
