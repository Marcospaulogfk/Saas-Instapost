import { describe, expect, it } from "vitest"
import { editableCloneSize } from "./editable-clone"

/**
 * Bug de 26/08: no modo editável o wrapper recebe position.width e o clone
 * repetia o próprio width. Em `%` isso aplica a largura duas vezes (34% do
 * wrapper de 34% = 11,6% do canvas) e o post abre desmontado no editor.
 */
describe("editableCloneSize", () => {
  it("width em % (spec do buildSpecFromLayout antigo) vira 100% — nunca % de %", () => {
    const r = editableCloneSize("text", { left: "10%", top: "20%", width: "34%" }, { width: "34%" })
    expect(r.width).toBe("100%")
  })

  it("width em cqw (o que o resize do editor grava) também vira 100% — resultado idêntico", () => {
    const r = editableCloneSize("pill", { left: "10cqw", top: "20cqw", width: "34cqw" }, { width: "34cqw" })
    expect(r.width).toBe("100%")
  })

  it("bloco sem width no spec segue auto (wrapper shrink-to-fit)", () => {
    const r = editableCloneSize("text", { left: "10cqw", top: "20cqw" }, { width: undefined })
    expect(r.width).toBe("auto")
    expect(r.height).toBeUndefined()
  })

  it("image/shape preenchem o wrapper nas duas dimensões", () => {
    expect(editableCloneSize("image", { width: "40%", height: "30%" }, { width: "40%", height: "30%" }))
      .toEqual({ width: "100%", height: "100%" })
    expect(editableCloneSize("shape", { width: "40%" }, { width: "40%" }).width).toBe("100%")
  })

  it("width próprio do bloco (ícone fit-content, divider thickness) passa intacto", () => {
    // Ícone com fundo força fit-content mesmo com width no spec — o disco não vira cápsula.
    expect(editableCloneSize("icon", { width: "20cqw" }, { width: "fit-content" }).width).toBe("fit-content")
    // Divider vertical: width é a espessura, não a do spec.
    expect(editableCloneSize("divider", { height: "20cqw" }, { width: "2px", height: "20cqw" }))
      .toEqual({ width: "2px", height: "100%" })
  })

  it("height repetido do wrapper vira 100%; height próprio fica", () => {
    expect(editableCloneSize("card", { height: "30%" }, { height: "30%" }).height).toBe("100%")
    expect(editableCloneSize("divider", {}, { height: "min(20cqw, 80px)" }).height).toBe("min(20cqw, 80px)")
  })

  it("position ausente (bloco de flow) não quebra", () => {
    expect(editableCloneSize("text", undefined, { width: "50%" }).width).toBe("50%")
  })
})
