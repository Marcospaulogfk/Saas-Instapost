import { describe, expect, it } from "vitest"
import { snapToAnchors, type Anchor } from "./anchors"
import type { MeasuredText } from "@/lib/single-posts/extract-layout"

const texto = (over: Partial<MeasuredText> = {}): MeasuredText => ({
  text: "Agendar agora",
  x: 30,
  y: 74,
  w: 40,
  h: 4,
  lines: 1,
  color: "#FFFFFF",
  align: "center",
  font_class: "sans",
  uppercase: false,
  italic: false,
  ...over,
})

describe("snapToAnchors", () => {
  it("texto com pill_bg vira texto simples centrado na âncora pill/button", () => {
    // O caso do lote: CTA com pill_bg e o botão vazio preservado no fundo.
    const anchors: Anchor[] = [{ kind: "button", x: 31.5, y: 72.8, w: 37, h: 6.2 }]
    const [r] = snapToAnchors([texto({ pill_bg: "#C89D3C" })], anchors)
    expect(r.pill_bg).toBeUndefined()
    // Caixa dentro da âncora, não a medida crua do extrator.
    expect(r.x).toBeGreaterThan(31.5)
    expect(r.x + r.w).toBeLessThan(31.5 + 37)
    expect(r.y).toBeGreaterThan(72.8)
  })

  it("pill_bg SEM âncora por perto fica como está (o fundo não tem a cápsula)", () => {
    const anchors: Anchor[] = [{ kind: "button", x: 10, y: 10, w: 20, h: 5 }]
    const [r] = snapToAnchors([texto({ pill_bg: "#C89D3C" })], anchors)
    expect(r.pill_bg).toBe("#C89D3C")
  })

  it("bullet com checkbox à esquerda alinha o y ao centro do marcador", () => {
    // O erro típico: extrator mediu y=72, o marcador real está em y=85.
    const anchors: Anchor[] = [{ kind: "checkbox", x: 9, y: 84.5, w: 4, h: 3 }]
    const [r] = snapToAnchors(
      [texto({ text: "120 obras entregues", x: 15, y: 78, w: 20, h: 3, align: "left" })],
      anchors,
    )
    expect(Math.abs(r.y + r.h / 2 - 86)).toBeLessThan(0.6)
  })

  it("texto medido EM CIMA do ícone é empurrado pra direita dele", () => {
    // Caso petshop: extrator mede a caixa do bullet começando sobre o ícone.
    const anchors: Anchor[] = [{ kind: "icon", x: 11, y: 61, w: 5, h: 4 }]
    const [r] = snapToAnchors(
      [texto({ text: "Busca e entrega grátis", x: 12, y: 58, w: 22, h: 4, align: "left" })],
      anchors,
    )
    expect(r.x).toBeGreaterThan(16) // depois da borda direita do ícone
    expect(Math.abs(r.y + r.h / 2 - 63)).toBeLessThan(0.6) // y no centro do ícone
  })

  it("marcador longe (outra linha) não puxa o texto", () => {
    const anchors: Anchor[] = [{ kind: "icon", x: 9, y: 40, w: 4, h: 3 }]
    const [r] = snapToAnchors(
      [texto({ text: "120 obras", x: 15, y: 78, w: 20, h: 3 })],
      anchors,
    )
    expect(r.y).toBe(78)
  })

  it("marcador à direita não conta (âncora de bullet fica à esquerda)", () => {
    const anchors: Anchor[] = [{ kind: "icon", x: 60, y: 78.5, w: 4, h: 3 }]
    const [r] = snapToAnchors(
      [texto({ text: "120 obras", x: 15, y: 78, w: 20, h: 3 })],
      anchors,
    )
    expect(r.y).toBe(78)
  })
})
