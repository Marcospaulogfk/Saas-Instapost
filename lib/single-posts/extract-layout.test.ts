import { describe, expect, it } from "vitest"
import { buildSpecFromLayout, type MeasuredText } from "./extract-layout"

const medida = (over: Partial<MeasuredText> = {}): MeasuredText => ({
  text: "SEGURANÇA NO TRABALHO",
  x: 10,
  y: 40,
  w: 34,
  h: 8,
  lines: 2,
  color: "#FFFFFF",
  align: "left",
  font_class: "condensed-heavy",
  uppercase: true,
  italic: false,
  ...over,
})

describe("buildSpecFromLayout", () => {
  it("emite posição em cqw, nunca em % (o % aplicava width duas vezes no editor)", () => {
    const spec = buildSpecFromLayout("https://x/clean.png", [medida()])
    const pos = spec.blocks[0].position as Record<string, string>
    for (const k of ["left", "top", "width"] as const) {
      expect(pos[k]).toMatch(/cqw$/)
      expect(pos[k]).not.toContain("%")
    }
  })

  it("converte y (% da altura) pra cqw multiplicando por 1.25 no canvas 4:5", () => {
    const spec = buildSpecFromLayout("https://x/clean.png", [medida({ y: 40 })])
    const pos = spec.blocks[0].position as Record<string, string>
    expect(pos.top).toBe("50.0cqw") // 40% de 1350px = 540px = 50cqw de 1080
    expect(pos.left).toBe("10.0cqw") // x é % da largura: 1:1
    expect(pos.width).toBe("35.0cqw") // w + 1 de folga, clampado no canvas
  })

  it("width nunca passa da borda direita do canvas", () => {
    const spec = buildSpecFromLayout("https://x/clean.png", [medida({ x: 80, w: 30 })])
    const pos = spec.blocks[0].position as Record<string, string>
    expect(pos.width).toBe("20.0cqw")
  })

  it("fonte larga (archivo) sai menor que fonte estreita (anton) na mesma caixa", () => {
    const larga = buildSpecFromLayout("https://x/c.png", [medida({ font_class: "sans-heavy", h: 16 })])
    const estreita = buildSpecFromLayout("https://x/c.png", [medida({ font_class: "condensed-heavy", h: 16 })])
    const cqw = (b: { font_size?: string }) => parseFloat((b.font_size ?? "").replace("min(", ""))
    expect(cqw(larga.blocks[0] as { font_size?: string })).toBeLessThan(
      cqw(estreita.blocks[0] as { font_size?: string }),
    )
  })

  it("uppercase reduz o corpo vs o mesmo texto em caixa mista", () => {
    // Caixa ALTA de propósito: o limite ativo precisa ser a largura, senão
    // byHeight decide nos dois casos e o fator de glifo não aparece.
    const upper = buildSpecFromLayout("https://x/c.png", [medida({ uppercase: true, h: 16 })])
    const mixed = buildSpecFromLayout("https://x/c.png", [medida({ uppercase: false, h: 16 })])
    const cqw = (b: { font_size?: string }) => parseFloat((b.font_size ?? "").replace("min(", ""))
    expect(cqw(upper.blocks[0] as { font_size?: string })).toBeLessThan(
      cqw(mixed.blocks[0] as { font_size?: string }),
    )
  })

  it("pill_bg vira bloco pill; sem pill_bg vira text", () => {
    const spec = buildSpecFromLayout("https://x/clean.png", [
      medida(),
      medida({ text: "SAIBA MAIS", pill_bg: "#12A5F5", y: 90, h: 4, lines: 1 }),
    ])
    expect(spec.blocks[0].type).toBe("text")
    expect(spec.blocks[1].type).toBe("pill")
  })
})
