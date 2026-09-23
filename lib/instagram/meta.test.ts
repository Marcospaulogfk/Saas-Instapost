import { describe, expect, it, afterEach } from "vitest"
import { limpaCode, redirectUri, redirectUriVeioDe, redirectUriTinhaLixo } from "./meta"

// =====================================================================
// O que este arquivo protege são duas strings que a Meta compara byte a
// byte e recusa o login inteiro quando diferem: o `code` e o
// `redirect_uri`. Nenhuma das duas falha de um jeito visível — a Meta
// responde a MESMA frase genérica sobre redirect_uri para o code sujo,
// para o code gasto e para a credencial errada. Em 22/09/2026 isso custou
// um dia de diagnóstico às cegas.
// =====================================================================

const uriOriginal = process.env.INSTAGRAM_REDIRECT_URI
afterEach(() => {
  if (uriOriginal === undefined) delete process.env.INSTAGRAM_REDIRECT_URI
  else process.env.INSTAGRAM_REDIRECT_URI = uriOriginal
})

describe("limpaCode", () => {
  it("tira o #_ que o Instagram gruda no fim do code", () => {
    expect(limpaCode("AQIYLtaP123#_")).toBe("AQIYLtaP123")
  })

  it("não encosta num code que já vem limpo", () => {
    expect(limpaCode("AQIYLtaP123")).toBe("AQIYLtaP123")
  })

  it("tira espaço e quebra de linha das pontas", () => {
    expect(limpaCode(" AQIYLtaP123\n")).toBe("AQIYLtaP123")
  })

  it("só remove o #_ do FIM, não um que apareça no meio", () => {
    expect(limpaCode("AQ#_IY#_")).toBe("AQ#_IY")
  })
})

describe("redirectUri", () => {
  it("usa a env quando ela existe, ignorando a origem", () => {
    process.env.INSTAGRAM_REDIRECT_URI = "https://app.nexuscontentai.com.br/api/instagram/callback"
    expect(redirectUri("https://outro.dominio")).toBe(
      "https://app.nexuscontentai.com.br/api/instagram/callback",
    )
    expect(redirectUriVeioDe()).toBe("env")
  })

  it("apara o espaço que vem colado do painel, e registra que ele existia", () => {
    process.env.INSTAGRAM_REDIRECT_URI = "https://app.nexuscontentai.com.br/api/instagram/callback\n"
    expect(redirectUri("https://x")).toBe(
      "https://app.nexuscontentai.com.br/api/instagram/callback",
    )
    expect(redirectUriTinhaLixo()).toBe(true)
  })

  it("sem env, deriva da origem pública — e é a MESMA string nas duas pontas", () => {
    delete process.env.INSTAGRAM_REDIRECT_URI
    const origem = "https://app.nexuscontentai.com.br"
    expect(redirectUri(origem)).toBe(`${origem}/api/instagram/callback`)
    expect(redirectUri(origem)).toBe(redirectUri(origem))
    expect(redirectUriVeioDe()).toBe("derivado")
    expect(redirectUriTinhaLixo()).toBe(false)
  })
})
