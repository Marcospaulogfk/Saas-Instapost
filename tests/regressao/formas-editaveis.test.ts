// Formas decorativas editáveis (data-edit="shape"), 25/10/2026.
//
// O dono quer clicar num enfeite do slide (círculo, faixa, post-it, palavra-
// fantasma), trocar a cor, mover, escalar e apagar. Aqui fica travada a parte
// do MOTOR (applyElementOverrides): onde a cor pinta, que o giro original da
// forma sobrevive ao mover, e que tirar o ajuste devolve tudo como era.
//
// Os testes rodam sem navegador: um elemento falso com style/dataset/atributos
// basta, porque o motor só lê e escreve essas três coisas.
import { describe, it, expect } from "vitest"
import {
  applyElementOverrides,
  collectEditableNodes,
  composeEditTransform,
  type SlideElementOverrides,
} from "@/components/carousel/editable-overrides"

type FakeEl = HTMLElement & { attrs: Record<string, string> }

function fakeEl(attrs: Record<string, string>, style: Record<string, string> = {}): FakeEl {
  const el = {
    attrs: { ...attrs },
    dataset: {} as Record<string, string>,
    style: { transform: "", transformOrigin: "", visibility: "", color: "", background: "", borderColor: "", backgroundColor: "", ...style },
    getAttribute(n: string) {
      return n in this.attrs ? this.attrs[n] : null
    },
    setAttribute(n: string, v: string) {
      this.attrs[n] = v
    },
  }
  return el as unknown as FakeEl
}

function fakeRoot(nodes: FakeEl[]): HTMLElement {
  return {
    querySelectorAll(sel: string) {
      if (sel.startsWith("p:")) return []
      return nodes.filter((n) => n.getAttribute("data-edit") !== null)
    },
  } as unknown as HTMLElement
}

describe("formas: chave e rótulo", () => {
  it("cada forma ganha chave própria (shape-0, shape-1) sem mexer nas outras", () => {
    const t = fakeEl({ "data-edit": "title" })
    const a = fakeEl({ "data-edit": "shape" })
    const b = fakeEl({ "data-edit": "shape", "data-edit-paint": "text" })
    const keys = collectEditableNodes(fakeRoot([t, a, b])).map((n) => n.key)
    expect(keys).toEqual(["title-0", "shape-0", "shape-1"])
  })
})

describe("formas: cor", () => {
  it("padrão pinta o preenchimento e volta ao original ao restaurar", () => {
    const f = fakeEl({ "data-edit": "shape" }, { background: "rgb(22, 104, 227)" })
    const root = fakeRoot([f])
    applyElementOverrides(root, { "shape-0": { color: "#FF0000" } })
    expect(f.style.background).toBe("#FF0000")
    expect(f.style.color).toBe("")
    applyElementOverrides(root, {})
    expect(f.style.background).toBe("rgb(22, 104, 227)")
  })

  it('paint="text" pinta a cor das letras (palavra-fantasma, SVG currentColor)', () => {
    const f = fakeEl({ "data-edit": "shape", "data-edit-paint": "text" }, { color: "rgba(0,0,0,0.06)" })
    const root = fakeRoot([f])
    applyElementOverrides(root, { "shape-0": { color: "#1668E3" } })
    expect(f.style.color).toBe("#1668E3")
    expect(f.style.background).toBe("")
    applyElementOverrides(root, undefined)
    expect(f.style.color).toBe("rgba(0,0,0,0.06)")
  })

  it('paint="border" pinta o contorno', () => {
    const f = fakeEl({ "data-edit": "shape", "data-edit-paint": "border" })
    applyElementOverrides(fakeRoot([f]), { "shape-0": { color: "#00AA55" } })
    expect(f.style.borderColor).toBe("#00AA55")
  })
})

describe("formas: mover, escalar, apagar", () => {
  it("mover soma ao giro que a forma já tinha e restaurar devolve o giro", () => {
    const f = fakeEl({ "data-edit": "shape" }, { transform: "rotate(-2deg)" })
    const root = fakeRoot([f])
    const el: SlideElementOverrides = { "shape-0": { dx: 10, dy: -4, scale: 1.2 } }
    applyElementOverrides(root, el)
    expect(f.style.transform).toBe("translate(10px, -4px) rotate(-2deg) scale(1.2)")
    // com giro original, a forma continua girando em volta do próprio centro
    expect(f.style.transformOrigin).toBe("")
    applyElementOverrides(root, el) // idempotente: não empilha o giro
    expect(f.style.transform).toBe("translate(10px, -4px) rotate(-2deg) scale(1.2)")
    applyElementOverrides(root, {})
    expect(f.style.transform).toBe("rotate(-2deg)")
  })

  it("sem giro original: igual aos outros elementos (origem no canto)", () => {
    const f = fakeEl({ "data-edit": "shape" })
    applyElementOverrides(fakeRoot([f]), { "shape-0": { dx: 5 } })
    expect(f.style.transform).toBe("translate(5px, 0px)")
    expect(f.style.transformOrigin).toBe("top left")
  })

  it("apagar esconde a forma sem tirar do lugar, e volta ao restaurar", () => {
    const f = fakeEl({ "data-edit": "shape" })
    const root = fakeRoot([f])
    applyElementOverrides(root, { "shape-0": { hidden: true } })
    expect(f.style.visibility).toBe("hidden")
    applyElementOverrides(root, {})
    expect(f.style.visibility).toBe("")
  })

  it("arrastar ao vivo e salvar usam a mesma conta (sem pulo ao soltar)", () => {
    const f = fakeEl({ "data-edit": "shape" }, { transform: "rotate(12deg)" })
    const vivo = composeEditTransform(f, 30, 0, 1)
    f.style.transform = vivo.transform
    f.dataset.editTransformed = "1"
    applyElementOverrides(fakeRoot([f]), { "shape-0": { dx: 30 } })
    expect(f.style.transform).toBe(vivo.transform)
  })
})

describe("título e texto continuam como antes", () => {
  it("cor do título pinta o texto, não o fundo", () => {
    const t = fakeEl({ "data-edit": "title" })
    applyElementOverrides(fakeRoot([t]), { "title-0": { color: "#123456" } })
    expect(t.style.color).toBe("#123456")
    expect(t.style.background).toBe("")
  })

  it("mover o título continua sem transform extra", () => {
    const t = fakeEl({ "data-edit": "title" })
    const root = fakeRoot([t])
    applyElementOverrides(root, { "title-0": { dx: 4, dy: -6, scale: 1.05 } })
    expect(t.style.transform).toBe("translate(4px, -6px) scale(1.05)")
    applyElementOverrides(root, {})
    expect(t.style.transform).toBe("")
  })
})
