import { describe, expect, it } from "vitest"
import { handleVisivel } from "./handle-visivel"

// R4-10: o @ que aparece no slide. Vazio = a linha some. Os marcadores de
// exemplo precisam sumir TAMBÉM quando já estão gravados em peça antiga.
describe("handleVisivel", () => {
  it("esconde quando não há handle", () => {
    expect(handleVisivel(undefined)).toBe("")
    expect(handleVisivel(null)).toBe("")
    expect(handleVisivel("")).toBe("")
    expect(handleVisivel("   ")).toBe("")
    expect(handleVisivel("@")).toBe("")
  })

  it("esconde os marcadores de exemplo, em qualquer caixa", () => {
    for (const m of ["marca", "@marca", "@MARCA", "@brand", "BRAND", "@sua_marca"]) {
      expect(handleVisivel(m)).toBe("")
    }
  })

  it("mostra o handle de verdade, sempre com um @ só", () => {
    expect(handleVisivel("padariadobairro")).toBe("@padariadobairro")
    expect(handleVisivel("@padariadobairro")).toBe("@padariadobairro")
    expect(handleVisivel("  @nexuscontent_ai ")).toBe("@nexuscontent_ai")
  })

  it("não confunde marca real que contém a palavra", () => {
    expect(handleVisivel("@marcaoficial")).toBe("@marcaoficial")
    expect(handleVisivel("@brandstudio")).toBe("@brandstudio")
  })
})
