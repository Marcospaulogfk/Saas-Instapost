// =====================================================================
// lib/billing/memory-rate-limit.ts
// Rate limit EM MEMÓRIA pra rota de cartão (não existe Redis/Upstash neste
// repo hoje — ao contrário do EverReply). Sem isto a rota vira ferramenta
// de "card testing": validar lotes de cartão roubado na NOSSA conta Asaas
// (compartilhada com o EverReply), o que derruba a reputação antifraude dela.
//
// LIMITAÇÃO CONHECIDA: em memória do processo, não sobrevive a redeploy nem
// é compartilhado entre instâncias/regiões. É uma rede de segurança BÁSICA,
// não substitui um rate limit distribuído — se o produto crescer ou rodar
// multi-instância, migrar pra Redis (padrão já usado no EverReply,
// `apps/web/lib/rate-limit.ts`).
// =====================================================================

interface Balde {
  count: number
  resetAt: number
}

const baldes = new Map<string, Balde>()

// Housekeeping simples: evita o Map crescer pra sempre em processo de vida
// longa. Roda a cada N chamadas em vez de num setInterval (sem timer solto
// sobrevivendo a testes/serverless cold start).
let chamadasDesdeLimpeza = 0
function limparExpirados(agora: number) {
  chamadasDesdeLimpeza++
  if (chamadasDesdeLimpeza < 200) return
  chamadasDesdeLimpeza = 0
  for (const [k, v] of baldes) {
    if (v.resetAt <= agora) baldes.delete(k)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetSeconds: number
}

/**
 * `limit` tentativas a cada `windowSeconds`, por `key`. 5 tentativas a cada
 * 10min por usuário: um dono real erra dígito 2–3 vezes; quem precisa de 20
 * tentativas está testando cartão roubado.
 */
export function checkMemoryRateLimit(
  key: string,
  opts: { limit: number; windowSeconds: number },
): RateLimitResult {
  const agora = Date.now()
  limparExpirados(agora)

  const atual = baldes.get(key)
  if (!atual || atual.resetAt <= agora) {
    baldes.set(key, { count: 1, resetAt: agora + opts.windowSeconds * 1000 })
    return { allowed: true, remaining: opts.limit - 1, resetSeconds: opts.windowSeconds }
  }

  atual.count++
  const remaining = Math.max(0, opts.limit - atual.count)
  const resetSeconds = Math.max(0, Math.ceil((atual.resetAt - agora) / 1000))
  return { allowed: atual.count <= opts.limit, remaining, resetSeconds }
}

/** Só pra testes: zera o estado entre casos. */
export function _resetMemoryRateLimitForTests(): void {
  baldes.clear()
}
