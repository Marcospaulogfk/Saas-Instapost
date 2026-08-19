// =====================================================================
// lib/generation/image.ts
// Dispatcher de geração de imagem pelo PAPEL da imagem na peça.
//
// Regra atual: capa (cover) → Nano Banana 2; miolo (slide) → Flux Schnell.
// Vale pra TODOS os planos — a regra antiga por plano (Pro/Studio → premium)
// morreu; só `generateBrandImage` (deprecada) ainda a usa.
//
// NÃO-QUEBRANTE: se o Nano Banana falhar (após os retries internos dele),
// CAI PRA FLUX (generateImage) e cobra como 'normal'. A geração nunca quebra
// por causa do modelo premium.
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
/**
 * Gera a imagem "de marca" pelo PAPEL dela na peça, não pelo plano.
 *
 * Espelha `generateEditorialImageForRole` do carrossel: o que decide o modelo
 * é a função da imagem, para todo mundo. No post único a imagem é sempre
 * `cover` — é uma peça só, e é ela que para o scroll.
 *
 * NÃO-QUEBRANTE: se o Nano Banana 2 falhar, cai pro Flux e volta como
 * quality 'normal' — o usuário é cobrado 2 tokens em vez de 25, que é o que
 * ele de fato recebeu.
 */
export async function generateBrandImageForRole(
  prompt: string,
  role: "cover" | "slide",
): Promise<BrandImageResult> {
  if (role === "cover") {
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
      console.error("[image] Nano Banana 2 falhou na capa, fallback Flux", e)
      // segue pro Flux abaixo — e cobra como miolo.
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
 * @deprecated O modelo deixou de ser função do plano — use
 * `generateBrandImageForRole`. Mantida enquanto houver chamadas pela
 * assinatura antiga.
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
