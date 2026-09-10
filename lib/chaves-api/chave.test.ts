import { describe, expect, it } from "vitest"
import { gerarChave, hashChave, mascarar, pareceChave, PREFIXO_CHAVE } from "./chave"
import { dentroDoLimite } from "./autenticar"

describe("gerarChave", () => {
  it("tem o prefixo e 32 caracteres de corpo", () => {
    const { chave } = gerarChave()
    expect(chave.startsWith(PREFIXO_CHAVE)).toBe(true)
    expect(chave.slice(PREFIXO_CHAVE.length)).toHaveLength(32)
  })

  it("nunca repete", () => {
    const vistas = new Set(Array.from({ length: 500 }, () => gerarChave().chave))
    expect(vistas.size).toBe(500)
  })

  it("não usa os caracteres ambíguos do base58 (0 O I l)", () => {
    for (let i = 0; i < 200; i++) {
      const corpo = gerarChave().chave.slice(PREFIXO_CHAVE.length)
      expect(corpo).not.toMatch(/[0OIl]/)
    }
  })

  it("o prefixo guardado é um pedaço da chave, e não a chave", () => {
    const { chave, prefixo } = gerarChave()
    expect(chave.startsWith(prefixo)).toBe(true)
    expect(prefixo.length).toBeLessThan(chave.length)
  })

  it("o hash gravado é o da chave completa e não volta atrás", () => {
    const { chave, hash } = gerarChave()
    expect(hash).toBe(hashChave(chave))
    expect(hash).toHaveLength(64)
    expect(hash).not.toContain(chave)
  })
})

describe("pareceChave", () => {
  it("aceita a chave que a gente mesmo gera", () => {
    expect(pareceChave(gerarChave().chave)).toBe(true)
  })

  it("recusa o que não é chave", () => {
    expect(pareceChave("")).toBe(false)
    expect(pareceChave("Bearer nxc_live_abc")).toBe(false)
    expect(pareceChave("sk_live_1234")).toBe(false)
    // Tamanho errado
    expect(pareceChave(`${PREFIXO_CHAVE}abc`)).toBe(false)
    // Caractere fora do alfabeto (o zero é ambíguo de propósito)
    expect(pareceChave(`${PREFIXO_CHAVE}${"0".repeat(32)}`)).toBe(false)
  })
})

describe("mascarar", () => {
  it("mostra o prefixo e esconde o resto", () => {
    const { prefixo } = gerarChave()
    const mascarada = mascarar(prefixo)
    expect(mascarada.startsWith(prefixo)).toBe(true)
    expect(mascarada.length).toBeGreaterThan(prefixo.length)
  })
})

describe("dentroDoLimite", () => {
  it("deixa passar até o teto e barra depois, na mesma janela", () => {
    const id = `chave-${Math.random()}`
    const agora = Date.now()
    for (let i = 0; i < 60; i++) {
      expect(dentroDoLimite(id, agora).ok).toBe(true)
    }
    const barrada = dentroDoLimite(id, agora)
    expect(barrada.ok).toBe(false)
    if (!barrada.ok) expect(barrada.esperarSegundos).toBeGreaterThan(0)
  })

  it("libera de novo quando a janela vira", () => {
    const id = `chave-${Math.random()}`
    const agora = Date.now()
    for (let i = 0; i < 61; i++) dentroDoLimite(id, agora)
    expect(dentroDoLimite(id, agora + 61_000).ok).toBe(true)
  })

  it("uma chave estourada não afeta a outra", () => {
    const agora = Date.now()
    const cheia = `cheia-${Math.random()}`
    const vazia = `vazia-${Math.random()}`
    for (let i = 0; i < 61; i++) dentroDoLimite(cheia, agora)
    expect(dentroDoLimite(cheia, agora).ok).toBe(false)
    expect(dentroDoLimite(vazia, agora).ok).toBe(true)
  })
})
