import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

vi.mock("next/server", () => ({ after: (fn: () => unknown) => void fn }))
vi.mock("@/lib/editorial/ai-images", () => ({ generateEditorialImageForRole: vi.fn() }))
vi.mock("@/lib/generation/usage-log", () => ({ logImageUsage: vi.fn() }))
vi.mock("@/lib/fabrica/capture", () => ({ rehostToStorage: vi.fn() }))
vi.mock("@/lib/websync/avisar-crm", () => ({ avisarCrmArtePronta: vi.fn() }))

import { criarPautas, MAX_DESCRICAO_PAUTA } from "@/lib/calendario/operacoes"
import { agendarGeracao } from "@/lib/websync/gerar-arte"
import { avisoDaGeracao, copiaDoDono } from "@/lib/websync/aviso-pauta"

const BRAND = "brand-1"
const HASHTAGS = "#youtube #monetizacao #criadordeconteudo"
const CTA = "Comenta NEXUS que eu te mando o acesso pra fazer o seu."

// Carrossel de 10 slides no tamanho que o Roteirista grava (passa de 4000,
// o teto antigo que cortava hashtags e CTA em silêncio).
function copiaGrande(): string {
  return [
    "Banco do Nexus (N25) | carrossel | copy pronta, o Nexus so diagrama",
    "",
    ...Array.from({ length: 10 }, (_, i) => `Slide ${i + 1}: ${"texto do argumento com acento 🚀 ".repeat(13)}`),
    "",
    `Legenda: ${"Paragrafo da legenda. ".repeat(18).trim()}`,
    CTA,
    HASHTAGS,
    "Fonte: YouTube Blog",
  ].join("\n")
}

function bancoFake() {
  const inseridos: Record<string, unknown>[] = []
  const admin = {
    from(tabela: string) {
      if (tabela === "brands") {
        return { select: () => ({ eq: async () => ({ data: [{ id: BRAND }], error: null }) }) }
      }
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
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

const post = (descricao: string) => ({
  ref: "r1",
  brand_id: BRAND,
  titulo: "Pauta grande",
  descricao,
  formato: "carrossel",
  objetivo: "inform",
  data_sugerida: "2026-10-02",
})

describe("copy acima do teto antigo de 4000 chega inteira ao Nexus", () => {
  it("grava a descricao completa, com hashtags e CTA no fim", async () => {
    const d = copiaGrande()
    expect(d.length).toBeGreaterThan(4000)
    const { admin, inseridos } = bancoFake()
    const r = await criarPautas(admin, "dono", [post(d)])
    expect(r.ok && r.valor[0].resultado).toBe("criado")
    expect(inseridos[0].description).toBe(d)
    expect(String(inseridos[0].description).endsWith("Fonte: YouTube Blog")).toBe(true)
    expect(String(inseridos[0].description)).toContain(HASHTAGS)
    expect(String(inseridos[0].description)).toContain(CTA)
  })

  it("acima do teto novo a pauta e RECUSADA com motivo, nunca cortada", async () => {
    const { admin, inseridos } = bancoFake()
    const r = await criarPautas(admin, "dono", [post("x".repeat(MAX_DESCRICAO_PAUTA + 1))])
    expect(inseridos).toHaveLength(0)
    expect(r.ok && r.valor[0].resultado).toBe("invalido")
    expect(r.ok && r.valor[0].motivo).toContain("Não cortei nada")
  })
})

describe("o critério da IA é o conteúdo, não o formato", () => {
  it("reconhece slides prontos e texto de imagem única", () => {
    expect(copiaDoDono(copiaGrande())).toBe("slides")
    expect(copiaDoDono("Imagem unica: um cartao\n\nLegenda: texto do dono")).toBe("imagem_unica")
    expect(copiaDoDono("Um resumo curto de pauta gerado pela IA do Nexus")).toBeNull()
    expect(copiaDoDono(null)).toBeNull()
  })

  it("pauta marcada como post, mas com slides prontos, e aceita pelo motor (nao vira formato_nao_suportado)", async () => {
    const admin = {
      from(tabela: string) {
        const dados: Record<string, unknown> = {
          scheduled_posts: { id: "p-1", brand_id: BRAND, title: "T", description: copiaGrande(), format: "post", status: "ideia" },
          brands: { id: BRAND },
          editorial_carousels: null,
        }
        const q: Record<string, unknown> = {}
        q.select = () => q
        q.eq = () => q
        q.in = () => q
        q.update = () => q
        q.maybeSingle = async () => ({ data: dados[tabela] ?? null, error: null })
        q.then = (ok: (v: unknown) => unknown) => ok({ data: [{ id: "p-1" }], error: null })
        return q
      },
    } as unknown as SupabaseClient
    expect(await agendarGeracao(admin, "dono", "p-1", {})).toBe("iniciado")
  })
})

describe("o aviso ao dono quando o botão não fez o que ele esperava", () => {
  it("falha de rota nunca fica calada: diz o que não aconteceu e o que fazer", () => {
    const a = avisoDaGeracao(false, undefined)
    expect(a.tom).toBe("atencao")
    expect(a.texto).toContain("nada foi alterado")
    expect(a.texto).toContain("Tente de novo")
  })

  it("todo desfecho que não gerou nada é aviso de atenção; os que geraram são ok", () => {
    for (const arte of ["sem_copy", "formato_nao_suportado", "nao_encontrado", undefined]) {
      expect(avisoDaGeracao(true, arte).tom).toBe("atencao")
    }
    for (const arte of ["iniciado", "em_andamento", "ja_tem_arte"]) {
      expect(avisoDaGeracao(true, arte).tom).toBe("ok")
    }
  })

  it("sem jargão nem travessão longo", () => {
    for (const arte of ["iniciado", "em_andamento", "ja_tem_arte", "sem_copy", "formato_nao_suportado", "nao_encontrado"]) {
      expect(avisoDaGeracao(true, arte).texto).not.toContain("—")
    }
    expect(avisoDaGeracao(false, undefined).texto).not.toContain("—")
  })
})
