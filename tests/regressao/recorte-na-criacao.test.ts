// Recorte automático na CRIAÇÃO do carrossel (estilos de foto recortada),
// 25/10/2026.
//
// Travado aqui, com o servidor simulado (fetch falso, sem gastar nada):
//  1. Com recorte ligado, a foto de IA é pedida no estilo "isolated" (fundo
//     liso) e depois vai pro recorte; o slide abre com a foto recortada e a
//     original guardada.
//  2. Se o recorte falhar (sem saldo, Fal fora), a foto fica COM fundo e o
//     carrossel sai normal.
//  3. Sem recorte (os outros 13 estilos), nada muda: nem estilo isolado, nem
//     chamada de recorte.
//  4. O preço mostrado antes de gerar inclui 2 tokens por foto de IA.
import { describe, it, expect, afterEach, vi } from "vitest"
import { generateCarouselImages } from "@/lib/carousel/generate-images"
import { TOKEN_COST, tokenCostForCarousel } from "@/lib/tokens"
import type { ClaudeSlide } from "@/lib/generation/claude"

const FOTO = "https://v3.fal.media/files/foto.jpg"
const PNG = "https://v3.fal.media/files/foto-recortada.png"

function slide(i: number): ClaudeSlide {
  return {
    order_index: i,
    title: i === 0 ? "Obra entregue no prazo" : "Planeje a compra do material",
    highlight_words: [],
    subtitle: "Como a construtora ganhou tempo",
    image_source_recommended: "ai",
    image_prompt: "engenheiro com capacete branco, braços cruzados",
    image_entity: "",
    image_entity_kind: "none",
    image_keywords: [],
  }
}

type Chamada = { url: string; body: Record<string, unknown> }

function servidorFalso(opts: { recorteFalha?: boolean } = {}) {
  const chamadas: Chamada[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { body?: string }) => {
      const body = init?.body ? JSON.parse(init.body) : {}
      chamadas.push({ url, body })
      const json = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } })
      if (url.includes("/api/editorial/generate-image")) return json({ success: true, url: FOTO })
      if (url.includes("/api/editorial/cutout-image"))
        return opts.recorteFalha
          ? json({ success: false, error: "Tokens insuficientes", code: "sem_saldo" }, 402)
          : json({ success: true, url: PNG })
      return json({}) // person-photo etc.: nada encontrado
    }),
  )
  return chamadas
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("recorte na criação do carrossel", () => {
  it("estilo de foto recortada: gera isolada, recorta e guarda a original", async () => {
    const chamadas = servidorFalso()
    const [capa, miolo] = await generateCarouselImages([slide(0), slide(1)], undefined, { cutout: true })
    for (const s of [capa, miolo]) {
      expect(s.image.url).toBe(PNG)
      expect(s.image.cutout).toEqual({ url: PNG, from: FOTO })
    }
    const geracoes = chamadas.filter((c) => c.url.includes("generate-image"))
    expect(geracoes.length).toBe(2)
    expect(geracoes.every((c) => c.body.style === "isolated")).toBe(true)
    expect(chamadas.filter((c) => c.url.includes("cutout-image")).map((c) => c.body.url)).toEqual([FOTO, FOTO])
  })

  it("recorte falhou: a foto fica com fundo e o carrossel sai", async () => {
    servidorFalso({ recorteFalha: true })
    const [capa] = await generateCarouselImages([slide(0)], undefined, { cutout: true })
    expect(capa.image.url).toBe(FOTO)
    expect(capa.image.cutout).toBeUndefined()
    expect(capa.image.error).toBeNull()
  })

  it("outros estilos: sem estilo isolado e sem recorte", async () => {
    const chamadas = servidorFalso()
    const [capa] = await generateCarouselImages([slide(0)])
    expect(capa.image.url).toBe(FOTO)
    expect(capa.image.cutout).toBeUndefined()
    expect(chamadas.some((c) => c.url.includes("cutout-image"))).toBe(false)
    expect(chamadas.find((c) => c.url.includes("generate-image"))?.body.style).toBeUndefined()
  })
})

describe("preço com recorte", () => {
  it("2 tokens por foto de IA, só quando o estilo recorta", () => {
    expect(TOKEN_COST.imageCutout).toBe(2)
    // 7 slides, capa + miolo: 40 sem recorte, +7 fotos × 2 com recorte
    expect(tokenCostForCarousel(7, { cover: true, slides: true })).toBe(40)
    expect(tokenCostForCarousel(7, { cover: true, slides: true }, { cutout: true })).toBe(54)
    // só capa: 28 + 1 foto × 2
    expect(tokenCostForCarousel(7, { cover: true, slides: false }, { cutout: true })).toBe(30)
    // sem imagem: recorte não cobra nada
    expect(tokenCostForCarousel(7, { cover: false, slides: false }, { cutout: true })).toBe(TOKEN_COST.textOnly)
  })
})
