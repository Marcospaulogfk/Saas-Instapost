import { describe, expect, it } from "vitest"
import { aplicarPatches } from "./judge"
import type { FreePostSpec, FreeTextBlock } from "@/lib/single-posts/free-spec"

const spec: FreePostSpec = {
  version: 1,
  background: { kind: "photo", photo_url: "https://x/clean.jpg" },
  blocks: [
    {
      type: "text",
      text: "Busca e entrega grátis",
      font: "inter_bold",
      font_size: "min(2.50cqw, 27px)",
      color: "#FFFFFF",
      text_align: "left",
      position: { left: "5.6cqw", top: "65.0cqw", width: "29.5cqw" },
      z: 6,
    },
    {
      type: "pill",
      text: "SÓ ESTA SEMANA",
      bg: "#d4af37",
      fg: "#1A1A1A",
      font: "inter_bold",
      font_size: "min(2.9cqw, 31px)",
      position: { left: "35cqw", top: "11cqw", width: "30cqw" },
      z: 5,
    },
  ],
}

describe("aplicarPatches", () => {
  it("move e redimensiona em cqw sem mutar o spec original", () => {
    const out = aplicarPatches(spec, [{ index: 0, left: 17, top: 84, width: 24 }])
    const b = out.blocks[0] as FreeTextBlock
    expect(b.position).toEqual({ left: "17.0cqw", top: "84.0cqw", width: "24.0cqw" })
    // original intacto
    expect((spec.blocks[0] as FreeTextBlock).position?.left).toBe("5.6cqw")
  })

  it("font_size_cqw vira min(cqw, px) com teto proporcional e clamp", () => {
    const out = aplicarPatches(spec, [{ index: 0, font_size_cqw: 2.0 }])
    expect((out.blocks[0] as FreeTextBlock).font_size).toBe("min(2.00cqw, 22px)")
    const gigante = aplicarPatches(spec, [{ index: 0, font_size_cqw: 99 }])
    expect((gigante.blocks[0] as FreeTextBlock).font_size).toBe("min(16.00cqw, 173px)")
  })

  it("cor em pill vai pro fg; em text vai pro color", () => {
    const out = aplicarPatches(spec, [
      { index: 0, color: "#111111" },
      { index: 1, color: "#FFFFFF" },
    ])
    expect((out.blocks[0] as FreeTextBlock).color).toBe("#111111")
    expect((out.blocks[1] as { fg?: string }).fg).toBe("#FFFFFF")
  })

  it("índice fora do intervalo e texto vazio são ignorados", () => {
    const out = aplicarPatches(spec, [
      { index: 99, left: 1 },
      { index: 0, text: "   " },
    ])
    expect(out.blocks.length).toBe(2)
    expect((out.blocks[0] as FreeTextBlock).text).toBe("Busca e entrega grátis")
  })
})
