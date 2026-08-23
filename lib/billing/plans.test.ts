import { describe, expect, it } from "vitest"
import { nextRenewal, priceFor, tokensFor } from "./plans"
import { decodeReference, encodeReference } from "./types"
import { TOKEN_COST, tokenCostForCarousel, tokenCostForSinglePost } from "@/lib/tokens"

describe("planos e ciclos (decisões 22/08/2026)", () => {
  it("anual = 30% no preço, tokens iguais ao mensal", () => {
    expect(priceFor("pro", "monthly").total).toBe(97)
    expect(priceFor("pro", "annual").perMonth).toBe(68)
    expect(priceFor("pro", "annual").total).toBe(68 * 12)
    expect(tokensFor("pro")).toBe(1000)
    expect(priceFor("studio", "annual").total).toBe(Math.round(247 * 0.7) * 12)
  })

  it("renovação: +1 mês / +12 meses", () => {
    const d = new Date("2026-08-22T12:00:00Z")
    expect(nextRenewal(d, "monthly").toISOString().slice(0, 10)).toBe("2026-09-22")
    expect(nextRenewal(d, "annual").toISOString().slice(0, 10)).toBe("2027-08-22")
  })

  it("referência do checkout vai e volta", () => {
    const ref = encodeReference({ userId: "u-1", plan: "studio", cycle: "annual", affiliateCode: "ABCDEFGH" })
    expect(decodeReference(ref)).toEqual({ userId: "u-1", plan: "studio", cycle: "annual", affiliateCode: "ABCDEFGH" })
    expect(decodeReference("lixo")).toEqual({ userId: null, plan: null, cycle: null, affiliateCode: null })
  })
})

describe("tabela v2 de tokens", () => {
  it("valores aprovados", () => {
    expect(TOKEN_COST.textOnly).toBe(8)
    expect(TOKEN_COST.imageCover).toBe(20)
    expect(TOKEN_COST.imageSlide).toBe(2)
    expect(TOKEN_COST.editBitmap).toBe(15)
    expect(TOKEN_COST.ideas).toBe(4)
    expect(tokenCostForSinglePost()).toBe(29)
    expect(tokenCostForCarousel(7, { cover: true, slides: false })).toBe(28)
    expect(tokenCostForCarousel(7, { cover: true, slides: true })).toBe(40)
  })
})
