import { describe, expect, it, afterEach, vi } from "vitest"
import {
  limpaCode,
  publishStories,
  redirectUri,
  redirectUriVeioDe,
  redirectUriTinhaLixo,
} from "./meta"

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

describe("publishStories", () => {
  /** Meta de mentira: guarda cada chamada e responde conforme `publish`. */
  function metaFalsa(publish: (n: number) => Record<string, unknown>, status = "FINISHED") {
    const chamadas: Array<{ url: string; corpo: URLSearchParams | null }> = []
    let criados = 0
    let publicados = 0
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      const corpo = init?.body ? new URLSearchParams(String(init.body)) : null
      chamadas.push({ url, corpo })
      const data = url.includes("/media_publish")
        ? publish(++publicados)
        : url.includes("/media")
          ? { id: `c${++criados}` }
          : { status_code: status }
      return { ok: !data.error, json: async () => data } as Response
    })
    return chamadas
  }

  afterEach(() => vi.unstubAllGlobals())

  it("cria um story por imagem e publica na ordem, sem legenda", async () => {
    const chamadas = metaFalsa((n) => ({ id: `ig${n}` }))
    const res = await publishStories("u", "t", ["a.png", "b.png"])
    expect(res).toEqual({ id: "ig1" })
    const criacoes = chamadas.filter((c) => c.corpo?.has("image_url"))
    expect(criacoes.map((c) => c.corpo?.get("image_url"))).toEqual(["a.png", "b.png"])
    expect(criacoes.every((c) => c.corpo?.get("media_type") === "STORIES")).toBe(true)
    expect(criacoes.every((c) => !c.corpo?.has("caption"))).toBe(true)
    expect(chamadas.filter((c) => c.url.includes("media_publish")).map((c) => c.corpo?.get("creation_id")))
      .toEqual(["c1", "c2"])
  })

  it("imagem recusada não publica nenhum story", async () => {
    const chamadas = metaFalsa((n) => ({ id: `ig${n}` }), "ERROR")
    await expect(publishStories("u", "t", ["a.png", "b.png"])).rejects.toThrow(/não aceitou a imagem do story/)
    expect(chamadas.some((c) => c.url.includes("media_publish"))).toBe(false)
  })

  it("falha no meio diz quantos saíram", async () => {
    metaFalsa((n) => (n === 1 ? { id: "ig1" } : { error: { message: "limite" } }))
    await expect(publishStories("u", "t", ["a.png", "b.png"])).rejects.toThrow(/Saíram 1 de 2 stories/)
  })

  it("sem imagem não chama a Meta", async () => {
    const chamadas = metaFalsa((n) => ({ id: `ig${n}` }))
    await expect(publishStories("u", "t", [])).rejects.toThrow()
    expect(chamadas).toHaveLength(0)
  })
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
