/**
 * Escalação de modelos por PAPEL, não por produto (CUSTOS-IA-MARGEM, 21/08/2026).
 *
 * - ESCRITOR: o texto que o leitor final vê (roteiro do carrossel, copy do
 *   post único, carrossel editorial). Vai a teste cego; até lá, Sonnet 4.6.
 * - MECANICO: resumos internos, validações, listas, planejamento, chat do
 *   assistente, leitura de logo. Nada disso chega ao leitor como copy, então
 *   roda no Haiku 4.5 (3x mais barato na escrita, 5x na leitura).
 *
 * Override por env sem deploy: MODEL_ESCRITOR / MODEL_MECANICO.
 *
 * Cuidado ao mover algo pro MECANICO: Haiku 4.5 NÃO aceita `output_config.effort`
 * (retorna 400). `thinking: { type: "disabled" }` e `output_config.format`
 * (structured outputs) funcionam.
 */
export const MODEL_ESCRITOR = process.env.MODEL_ESCRITOR || "claude-sonnet-4-6"
export const MODEL_MECANICO = process.env.MODEL_MECANICO || "claude-haiku-4-5"

export interface ModelPrice {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

/** USD por milhão de tokens (docs Anthropic, 21/08/2026). */
export const PRICE_BY_MODEL: Record<string, ModelPrice> = {
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-sonnet-5": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
  "claude-opus-4-7": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-opus-4-6": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
}

/**
 * Tabela de preço de um modelo. Modelo desconhecido cai na tabela do Sonnet
 * (o caso mais caro entre os que usamos) pra nunca SUBESTIMAR custo.
 */
export function priceFor(model: string): ModelPrice {
  return PRICE_BY_MODEL[model] ?? PRICE_BY_MODEL["claude-sonnet-4-6"]
}
