import { readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

// =====================================================================
// A PAUTA DO CRM CHEGA INTACTA (reclamação do dono: "escrevo de um jeito no
// CRM e sobe pro Nexus de outro").
//
// Regra de ouro: o que o dono escreveu é respeitado ao pé da letra; a IA só
// gera o que estiver vazio. Aqui o banco é um fake e todo serviço de IA é um
// mock: nenhuma rede, nenhum custo.
// =====================================================================

const { gerarImagem } = vi.hoisted(() => ({
  gerarImagem: vi.fn(async () => ({
    url: "https://fal.exemplo/capa.png",
    model: "mock",
    costUsd: 0,
  })),
}))

vi.mock("next/server", () => ({ after: (fn: () => unknown) => void fn }))
vi.mock("@/lib/editorial/ai-images", () => ({ generateEditorialImageForRole: gerarImagem }))
vi.mock("@/lib/generation/usage-log", () => ({ logImageUsage: vi.fn(async () => {}) }))
vi.mock("@/lib/fabrica/capture", () => ({
  rehostToStorage: vi.fn(async (_a: unknown, url: string) => url),
}))
vi.mock("@/lib/websync/avisar-crm", () => ({ avisarCrmArtePronta: vi.fn(async () => {}) }))

import { criarPautas } from "@/lib/calendario/operacoes"
import { gerarArteDaPauta } from "@/lib/websync/gerar-arte"
import { lerCopyDoCrm, montarSlides } from "@/lib/websync/copy-crm"

// A descricao como o CRM manda: o que a Ponte devolve de limparParaEnvio
// (sem Gancho alternativo / Imagem slide / Busca slide). Acento, emoji,
// negrito, \n\n entre paragrafos da legenda, CTA e hashtags.
const DESCRICAO = [
  "Banco do Nexus (N25) | carrossel | copy pronta, o Nexus so diagrama",
  "",
  "Slide 1: O **YouTube** dobrou a régua 🚀 pra você monetizar.",
  "Slide 2: Canal novo precisa de 8 mil horas ou 20 milhões de views em Shorts. Fonte: YouTube Blog, 10/08/2026.",
  "Slide 3: Primeiro, as horas: Até fevereiro eram 4 mil horas assistidas em 12 meses para começar a monetizar vídeos longos.",
  "Slide 4: Virada: quem demora não perde a vaga, perde a régua antiga.",
  "Slide 5: Este carrossel saiu da Nexus Content em 3 minutos. Comenta NEXUS que eu te mando o acesso.",
  "",
  "Legenda: O YouTube dobrou a régua 🚀 pela primeira vez desde 2018.",
  "",
  "A mudança vale pra canal novo, a partir de 1º de fevereiro de 2027.",
  "",
  "Seu canal já bate a régua antiga?",
  "Comenta NEXUS que eu te mando o acesso pra fazer o seu.",
  "#youtube #monetizacao #criadordeconteudo",
  "Fonte: YouTube Blog; TechCrunch, 10/08/2026",
].join("\n")

const OWNER = "dono-1"
const BRAND = "brand-1"

/** Fake do Supabase so com o que criarPautas usa. */
function bancoFake() {
  const inseridos: Record<string, unknown>[] = []
  const admin = {
    from(tabela: string) {
      if (tabela === "brands") {
        return {
          select: () => ({ eq: async () => ({ data: [{ id: BRAND }], error: null }) }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }),
          }),
        }),
        insert: (linha: Record<string, unknown>) => {
          inseridos.push(linha)
          return { select: () => ({ single: async () => ({ data: { id: "p-1" }, error: null }) }) }
        },
      }
    },
  } as unknown as SupabaseClient
  return { admin, inseridos }
}

describe("a travessia: o que o CRM manda e o que o Nexus grava", () => {
  it("a descricao gravada e IGUAL a enviada, caractere a caractere", async () => {
    const { admin, inseridos } = bancoFake()
    // O mesmo caminho do fio: JSON de ida e volta, como o fetch do worker faz.
    const corpo = JSON.parse(
      JSON.stringify({
        posts: [
          {
            ref: "r1",
            brand_id: BRAND,
            marca: "@nexus",
            titulo: "Banco do Nexus: YouTube dobra a régua 🚀",
            descricao: DESCRICAO,
            formato: "carrossel",
            objetivo: "inform",
            data_sugerida: "2026-10-02",
          },
        ],
      }),
    )
    const r = await criarPautas(admin, OWNER, corpo.posts)
    expect(r.ok && r.valor[0].resultado).toBe("criado")
    expect(inseridos).toHaveLength(1)
    expect(inseridos[0].title).toBe("Banco do Nexus: YouTube dobra a régua 🚀")
    expect(inseridos[0].description).toBe(DESCRICAO)
  })
})

describe("a leitura da copy: nenhum texto do dono se perde ou muda", () => {
  const copy = lerCopyDoCrm(DESCRICAO)!

  it("a legenda mantem emoji, negrito, CTA, hashtags e os \\n\\n", () => {
    expect(copy.legenda).toBe(
      [
        "O YouTube dobrou a régua 🚀 pela primeira vez desde 2018.",
        "",
        "A mudança vale pra canal novo, a partir de 1º de fevereiro de 2027.",
        "",
        "Seu canal já bate a régua antiga?",
        "Comenta NEXUS que eu te mando o acesso pra fazer o seu.",
        "#youtube #monetizacao #criadordeconteudo",
      ].join("\n"),
    )
  })

  it("os 5 slides saem na ordem, com o texto exato", () => {
    expect(copy.slides).toEqual([
      "O **YouTube** dobrou a régua 🚀 pra você monetizar.",
      "Canal novo precisa de 8 mil horas ou 20 milhões de views em Shorts. Fonte: YouTube Blog, 10/08/2026.",
      "Primeiro, as horas: Até fevereiro eram 4 mil horas assistidas em 12 meses para começar a monetizar vídeos longos.",
      "Virada: quem demora não perde a vaga, perde a régua antiga.",
      "Este carrossel saiu da Nexus Content em 3 minutos. Comenta NEXUS que eu te mando o acesso.",
    ])
  })

  it("diagramar (titulo + corpo) so reparte o texto: as palavras todas continuam la", () => {
    const palavras = (t: string) => t.replace(/[:\s]+/g, " ").trim()
    const slides = montarSlides(copy.slides, new Map())
    slides.forEach((s, i) => {
      expect(palavras(`${s.title} ${s.body}`)).toBe(palavras(copy.slides[i]))
    })
  })
})

describe("campo preenchido nunca e reescrito pela IA", () => {
  beforeEach(() => gerarImagem.mockClear())

  it("a arte gravada leva a copy do dono; a unica IA chamada e a da imagem da capa", async () => {
    const carrosseis: Record<string, any>[] = []
    const admin = {
      from(tabela: string) {
        if (tabela === "brands") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name: "Nexus", instagram_handle: "nexus", brand_colors: null },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (tabela === "editorial_carousels") {
          return {
            insert: (linha: Record<string, any>) => {
              carrosseis.push(linha)
              return { select: () => ({ single: async () => ({ data: { id: "c-1" }, error: null }) }) }
            },
          }
        }
        return { update: () => ({ eq: async () => ({ error: null }) }) }
      },
    } as unknown as SupabaseClient

    await gerarArteDaPauta(
      admin,
      OWNER,
      {
        id: "p-1",
        brand_id: BRAND,
        title: "Banco do Nexus",
        description: DESCRICAO,
        format: "carrossel",
        status: "em_criacao",
      },
      {},
    )

    expect(carrosseis).toHaveLength(1)
    const dados = carrosseis[0].carousel_data
    const copy = lerCopyDoCrm(DESCRICAO)!
    expect(dados.caption).toBe(copy.legenda)
    expect(dados.slides).toHaveLength(copy.slides.length)
    dados.slides.forEach((s: { title: string; body: string }, i: number) => {
      const junto = `${s.title} ${s.body}`.replace(/[:\s]+/g, " ").trim()
      expect(junto).toBe(copy.slides[i].replace(/[:\s]+/g, " ").trim())
    })
    // Imagem so para a capa vazia; nenhum modelo de texto no caminho.
    expect(gerarImagem).toHaveBeenCalledTimes(1)
  })

  it("o motor da Ponte nao importa nenhum cliente de modelo de texto", () => {
    for (const arq of ["gerar-arte.ts", "copy-crm.ts"]) {
      const fonte = readFileSync(join(__dirname, arq), "utf8")
      expect(fonte).not.toMatch(/from\s+["'][^"']*(anthropic|openai|generate-script|generateText)/i)
    }
  })
})

describe("o botao Gerar post do Pipeline", () => {
  it("pauta com copy pronta do CRM NAO passa pelo wizard de IA: vai pro motor que so diagrama", () => {
    const fonte = readFileSync(
      join(__dirname, "../../app/dashboard/calendario/pipeline-pautas.tsx"),
      "utf8",
    )
    const posRota = fonte.indexOf("/api/calendario/pauta-pronta")
    const posWizard = fonte.indexOf("briefingDaPauta({")
    expect(fonte).toContain("copiaDoDono(p.description)")
    expect(fonte).not.toMatch(/p.format === "carrossel"/)
    expect(fonte).toContain("res.ok")
    expect(posRota).toBeGreaterThan(-1)
    // O desvio vem ANTES de montar o briefing que o wizard entrega ao modelo.
    expect(posRota).toBeLessThan(posWizard)
  })
})
