import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

vi.mock("next/server", () => ({ after: (fn: () => unknown) => void fn }))
vi.mock("@/lib/editorial/ai-images", () => ({
  generateEditorialImageForRole: vi.fn(async () => ({
    url: "https://fal.media/capa.png",
    model: "m",
    costUsd: 0,
  })),
}))
vi.mock("@/lib/generation/usage-log", () => ({ logImageUsage: vi.fn() }))
vi.mock("@/lib/fabrica/capture", () => ({
  rehostToStorage: vi.fn(async (_a: unknown, url: string) => url),
}))
vi.mock("@/lib/websync/avisar-crm", () => ({ avisarCrmArtePronta: vi.fn() }))

import { generateEditorialImageForRole } from "@/lib/editorial/ai-images"
import { criarPautas, pedirGeracao } from "@/lib/calendario/operacoes"
import { gerarArteDaPauta, lerModoArte, lerNSlides } from "@/lib/websync/gerar-arte"

const BRAND = "brand-1"
const UUID = "11111111-1111-4111-8111-111111111111"

function descricao(n: number): string {
  return [
    "Título | carrossel | obs",
    "",
    ...Array.from({ length: n }, (_, i) => `Slide ${i + 1}: texto do slide ${i + 1}`),
    "",
    "Legenda: legenda do post",
  ].join("\n")
}

/** Banco fake que guarda o carousel_data gravado. */
function bancoDaGeracao() {
  const gravados: Array<{ carousel_data: { slides: Array<{ image: { url: string | null } }> } }> = []
  const admin = {
    from(tabela: string) {
      if (tabela === "brands") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { name: "Culturize-se", instagram_handle: "culturizesebrasil", brand_colors: null },
                error: null,
              }),
            }),
          }),
        }
      }
      if (tabela === "editorial_carousels") {
        return {
          insert: (linha: (typeof gravados)[number]) => {
            gravados.push(linha)
            return { select: () => ({ single: async () => ({ data: { id: "c-1" }, error: null }) }) }
          },
        }
      }
      return { update: () => ({ eq: async () => ({ error: null }) }) }
    },
  } as unknown as SupabaseClient
  return { admin, gravados }
}

const pauta = (n: number) => ({
  id: "pauta-1",
  brand_id: BRAND,
  title: "Pauta",
  description: descricao(n),
  format: "carrossel",
  status: "em_criacao",
})

beforeEach(() => vi.clearAllMocks())

describe("lerModoArte / lerNSlides", () => {
  it("só 'fotos_do_crm' muda o modo; ausente ou estranho é 'criar'", () => {
    expect(lerModoArte("fotos_do_crm")).toBe("fotos_do_crm")
    expect(lerModoArte("criar")).toBe("criar")
    expect(lerModoArte(undefined)).toBe("criar")
    expect(lerModoArte("xyz")).toBe("criar")
  })
  it("n_slides só aceita inteiro positivo", () => {
    expect(lerNSlides(7)).toBe(7)
    expect(lerNSlides(0)).toBeUndefined()
    expect(lerNSlides(2.5)).toBeUndefined()
    expect(lerNSlides("7")).toBeUndefined()
  })
})

describe("gerarArteDaPauta por modo", () => {
  it("sem o campo (como hoje): gera a capa por IA quando o slide 1 não tem foto", async () => {
    const { admin, gravados } = bancoDaGeracao()
    await gerarArteDaPauta(admin, "dono", pauta(9), {})
    expect(generateEditorialImageForRole).toHaveBeenCalledTimes(1)
    expect(gravados[0].carousel_data.slides).toHaveLength(9)
    expect(gravados[0].carousel_data.slides[0].image.url).toBe("https://fal.media/capa.png")
  })

  it("fotos_do_crm: nunca chama IA, usa só as fotos do CRM e deixa o resto só texto", async () => {
    const { admin, gravados } = bancoDaGeracao()
    await gerarArteDaPauta(admin, "dono", pauta(5), {
      modoArte: "fotos_do_crm",
      nSlides: 5,
      imagens: [
        { slide: 2, url: "https://crm/foto2.jpg", origem: null },
        { slide: 4, url: "https://crm/foto4.jpg", origem: null },
        { slide: 99, url: "https://crm/fora.jpg", origem: null },
      ],
    })
    expect(generateEditorialImageForRole).not.toHaveBeenCalled()
    const urls = gravados[0].carousel_data.slides.map((s) => s.image.url)
    expect(urls).toEqual([null, "https://crm/foto2.jpg", null, "https://crm/foto4.jpg", null])
  })

  it("fotos_do_crm com foto no slide 1: usa a foto, sem IA", async () => {
    const { admin, gravados } = bancoDaGeracao()
    await gerarArteDaPauta(admin, "dono", pauta(3), {
      modoArte: "fotos_do_crm",
      imagens: [{ slide: 1, url: "https://crm/capa.jpg", origem: null }],
    })
    expect(generateEditorialImageForRole).not.toHaveBeenCalled()
    expect(gravados[0].carousel_data.slides[0].image.url).toBe("https://crm/capa.jpg")
  })

  it("respeita a quantidade de slides da descrição, mesmo com n_slides divergente", async () => {
    const { admin, gravados } = bancoDaGeracao()
    await gerarArteDaPauta(admin, "dono", pauta(6), { modoArte: "fotos_do_crm", nSlides: 8 })
    expect(gravados[0].carousel_data.slides).toHaveLength(6)
  })
})

describe("eco na resposta", () => {
  function bancoDeCriar() {
    return {
      from(tabela: string) {
        if (tabela === "brands") {
          return { select: () => ({ eq: async () => ({ data: [{ id: BRAND }], error: null }) }) }
        }
        return {
          select: () => ({
            eq: () => ({
              // agendarGeracao: pauta não achada → "nao_encontrado", sem gerar nada.
              maybeSingle: async () => ({ data: null }),
              eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }),
            }),
          }),
          insert: () => ({ select: () => ({ single: async () => ({ data: { id: "p-1" }, error: null }) }) }),
        }
      },
    } as unknown as SupabaseClient
  }

  const post = (extra: Record<string, unknown>) => ({
    ref: "r1",
    brand_id: BRAND,
    titulo: "Pauta",
    descricao: descricao(7),
    formato: "carrossel",
    ...extra,
  })

  it("com gerar:true devolve modo_arte entendido e n_slides lido", async () => {
    const res = await criarPautas(bancoDeCriar(), "dono", [
      post({ gerar: true, modo_arte: "fotos_do_crm", n_slides: 7 }),
    ])
    expect(res.ok && res.valor[0]).toMatchObject({ modo_arte: "fotos_do_crm", n_slides: 7 })
  })

  it("sem o campo, o eco diz 'criar' (padrão)", async () => {
    const res = await criarPautas(bancoDeCriar(), "dono", [post({ gerar: true })])
    expect(res.ok && res.valor[0].modo_arte).toBe("criar")
  })

  it("sem gerar:true não ecoa nada (resposta igual à de antes)", async () => {
    const res = await criarPautas(bancoDeCriar(), "dono", [post({ modo_arte: "fotos_do_crm" })])
    expect(res.ok && res.valor[0]).not.toHaveProperty("modo_arte")
  })

  it("a rota /gerar também ecoa o modo", async () => {
    const admin = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      }),
    } as unknown as SupabaseClient
    const res = await pedirGeracao(admin, "dono", [{ id: UUID, modo_arte: "fotos_do_crm" }])
    expect(res[0]).toMatchObject({ resultado: "nao_encontrado", modo_arte: "fotos_do_crm" })
  })
})
