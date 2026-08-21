// =====================================================================
// lib/generation/usage-log.ts
// Registro do custo REAL de API por geração.
//
// Existe porque `computeCost()` já rodava em três lugares e o resultado morria
// no retorno da função: dava pra ver o custo de uma chamada no debugger e
// nunca a série. Sem série não dá pra responder as duas perguntas que decidem
// o produto — "quanto custa de fato um post único?" e "o teto de 4 tentativas
// do compositor se paga?" — e as duas viraram chute.
//
// REGRA DE OURO: logar custo NUNCA derruba geração. O usuário já queimou o
// token dele; perder a peça porque a tabela de auditoria não existe seria
// trocar receita por observabilidade. Toda falha aqui é engolida, e a ausência
// da tabela (migration 0017 ainda não aplicada) desliga o módulo sozinha.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { MODEL_ESCRITOR, PRICE_BY_MODEL, priceFor } from "@/lib/generation/models"

/**
 * Preço vigente do Sonnet 4.6, em USD por milhão de tokens.
 *
 * Fonte única: havia uma cópia desta tabela em lib/generation/claude.ts e
 * outra em lib/single-posts/free-generate.ts. Duas cópias de um preço são duas
 * chances de o custo real divergir do custo medido — que é exatamente o buraco
 * que esta instrumentação fecha.
 */
export const PRICE_PER_MTOK = PRICE_BY_MODEL[MODEL_ESCRITOR]

export interface UsageLike {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

/** Custo em USD de uma chamada, pela tabela do MODELO que rodou. */
export function computeCostUsd(
  usage: UsageLike,
  model: string = MODEL_ESCRITOR,
): number {
  const p = priceFor(model)
  return (
    (usage.input_tokens * p.input) / 1_000_000 +
    (usage.output_tokens * p.output) / 1_000_000 +
    ((usage.cache_creation_input_tokens ?? 0) * p.cacheWrite) / 1_000_000 +
    ((usage.cache_read_input_tokens ?? 0) * p.cacheRead) / 1_000_000
  )
}

export type UsageStage =
  | "post_unico_copy"
  | "post_unico_compose"
  | "post_unico_layout"
  | "carousel_copy"
  /** /api/refine-prompt: organiza o briefing do modo do-zero (migration 0018). */
  | "refine_briefing"
  /** /api/extract-content: leitura estruturada do link (migration 0018). */
  | "extract_link"
  | "outro"

export interface LogUsageInput {
  stage: UsageStage
  usage: UsageLike
  model?: string
  userId?: string | null
  brandId?: string | null
  /** Chamadas ao modelo que a etapa gastou (loop de compose = 1..4). */
  attempts?: number
  /** Tentativa em que a crítica aprovou; null = estourou o teto. */
  approvedOnAttempt?: number | null
  /** Tokens do PRODUTO cobrados do usuário nesta ação (lib/tokens.ts). */
  tokensCharged?: number
  durationMs?: number
  /**
   * Observações da etapa (coluna jsonb, migration 0018). Só é enviada quando
   * definida, pra que stages antigos continuem gravando antes da migration.
   */
  meta?: Record<string, unknown>
}

/**
 * `true` quando a migration 0017 ainda não rodou neste ambiente. Fica em
 * memória de propósito: sem isso, todo post geraria mais um round-trip
 * condenado ao mesmo erro — o log ficaria mais caro que a coisa que ele mede.
 */
let tableMissing = false

/** Código do Postgres pra "relation does not exist". */
const UNDEFINED_TABLE = "42P01"

/**
 * Grava uma linha de custo. Best-effort: nunca lança, nunca retorna erro.
 *
 * @returns `true` se gravou — só pra teste; nenhum caller deve ramificar nisso.
 */
export async function logGenerationUsage(
  supabase: SupabaseClient,
  input: LogUsageInput,
): Promise<boolean> {
  if (tableMissing) return false

  try {
    const { error } = await supabase.from("generation_usage").insert({
      user_id: input.userId ?? null,
      brand_id: input.brandId ?? null,
      stage: input.stage,
      model: input.model ?? MODEL_ESCRITOR,
      input_tokens: input.usage.input_tokens,
      output_tokens: input.usage.output_tokens,
      cache_creation_input_tokens: input.usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: input.usage.cache_read_input_tokens ?? 0,
      cost_usd: Number(
        computeCostUsd(input.usage, input.model ?? MODEL_ESCRITOR).toFixed(6),
      ),
      attempts: input.attempts ?? 1,
      approved_on_attempt: input.approvedOnAttempt ?? null,
      tokens_charged: input.tokensCharged ?? 0,
      duration_ms:
        typeof input.durationMs === "number"
          ? Math.round(input.durationMs)
          : null,
      ...(input.meta ? { meta: input.meta } : {}),
    })

    if (error) {
      if (error.code === UNDEFINED_TABLE) {
        tableMissing = true
        console.info(
          "[usage-log] generation_usage não existe — migration 0017 pendente. Log desligado nesta instância.",
        )
      } else {
        console.warn("[usage-log] insert falhou:", error.message)
      }
      return false
    }
    return true
  } catch (err) {
    console.warn("[usage-log] erro inesperado:", err)
    return false
  }
}
