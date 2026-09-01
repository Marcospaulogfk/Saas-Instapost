import { describe, expect, it } from "vitest"
import { _resetMemoryRateLimitForTests, checkMemoryRateLimit } from "./memory-rate-limit"

describe("checkMemoryRateLimit", () => {
  it("libera até o limite e bloqueia a partir daí", () => {
    _resetMemoryRateLimitForTests()
    const key = "cartao:user-teste"
    const opts = { limit: 3, windowSeconds: 60 }
    expect(checkMemoryRateLimit(key, opts).allowed).toBe(true)
    expect(checkMemoryRateLimit(key, opts).allowed).toBe(true)
    expect(checkMemoryRateLimit(key, opts).allowed).toBe(true)
    const quarta = checkMemoryRateLimit(key, opts)
    expect(quarta.allowed).toBe(false)
    expect(quarta.remaining).toBe(0)
  })

  it("chaves diferentes não compartilham o balde", () => {
    _resetMemoryRateLimitForTests()
    const opts = { limit: 1, windowSeconds: 60 }
    expect(checkMemoryRateLimit("cartao:a", opts).allowed).toBe(true)
    expect(checkMemoryRateLimit("cartao:b", opts).allowed).toBe(true)
    expect(checkMemoryRateLimit("cartao:a", opts).allowed).toBe(false)
  })
})
