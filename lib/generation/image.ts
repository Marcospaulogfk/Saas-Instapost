// =====================================================================
// lib/generation/image.ts
// Dispatcher de geração de imagem por plano.
//
// Regra de produto (ESTRATEGIA-MONETIZACAO.md §5):
//   - Pro / Studio  → Nano Banana Pro (modelo premium)
//   - trial / starter → modelo NORMAL atual (Flux Schnell) — inalterado
//
// ADITIVO e NÃO-QUEBRANTE: se a geração Nano Banana Pro falhar (erro ou
// timeout), CAI PRA FLUX (generateImage). A geração NUNCA quebra por causa
// do modelo premium — sempre há fallback.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { generateImage } from "@/lib/generation/fal"
import { generateNanoBanana } from "@/lib/generation/nano-banana"
import { canUseNanoBananaPro, planFromProfile, type Plan } from "@/lib/tokens"

export interface BrandImageResult {
  url: string
  width: number
  height: number
  costUsd: number
  ms: number
  /** Qualidade EFETIVA gerada — usada pra debitar tokens (pro=20, normal=5). */
  quality: "normal" | "pro"
}

/**
 * Gera a imagem "de marca" respeitando o plano do usuário.
 *
 * - Pro/Studio → tenta Nano Banana Pro; se falhar, fallback pra Flux.
 * - Demais planos → Flux Schnell (comportamento atual, intocado).
 *
 * Nunca lança por causa do modelo premium: o fallback pra Flux garante que
 * a geração continua funcionando mesmo se o Nano Banana Pro estiver fora.
 * (A geração base pelo Flux ainda pode lançar se o Fal cair — igual hoje.)
 */
export async function generateBrandImage(
  prompt: string,
  plan: Plan,
): Promise<BrandImageResult> {
  if (canUseNanoBananaPro(plan)) {
    try {
      const r = await generateNanoBanana(prompt, "pro")
      return {
        url: r.url,
        width: r.width,
        height: r.height,
        costUsd: r.costUsd,
        ms: r.ms,
        quality: "pro",
      }
    } catch (e) {
      console.error("[image] Nano Banana Pro falhou, fallback Flux", e)
      // segue pro Flux abaixo
    }
  }

  const r = await generateImage(prompt)
  return {
    url: r.url,
    width: r.width,
    height: r.height,
    costUsd: r.costUsd,
    ms: r.ms,
    quality: "normal",
  }
}

/**
 * Lê o plano do usuário logado a partir do perfil (`public.users`).
 *
 * Em QUALQUER erro (sem sessão, sem perfil, coluna faltando) retorna "trial"
 * — o caminho seguro (Flux normal). Nunca lança.
 */
export async function getUserPlan(supabase: SupabaseClient): Promise<Plan> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return "trial"

    const { data: profile, error } = await supabase
      .from("users")
      .select("subscription_status, plan_credits_monthly")
      .eq("id", user.id)
      .single()
    if (error || !profile) return "trial"

    return planFromProfile(profile)
  } catch {
    return "trial"
  }
}
