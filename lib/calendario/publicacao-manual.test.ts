import { describe, expect, it } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { avisoDeRepeticao, pautaDaPeca, registrarPublicacaoManual } from "./publicacao-manual"

// Banco de mentira: cada tabela é uma lista de linhas; os filtros .eq()
// valem, o resto (order/limit) devolve a lista como está.
function bancoFalso(tabelas: Record<string, Array<Record<string, unknown>>>) {
  const escritas: Array<{ tabela: string; op: string; dados: unknown; id?: unknown }> = []
  const from = (tabela: string) => {
    const filtros: Array<[string, unknown]> = []
    const linhas = () =>
      (tabelas[tabela] ?? []).filter((l) => filtros.every(([c, v]) => l[c] === v))
    const q: Record<string, unknown> = {
      select: () => q,
      eq: (c: string, v: unknown) => {
        filtros.push([c, v])
        return q
      },
      order: () => q,
      limit: () => Promise.resolve({ data: linhas(), error: null }),
      maybeSingle: () => Promise.resolve({ data: linhas()[0] ?? null, error: null }),
      insert: (dados: unknown) => {
        escritas.push({ tabela, op: "insert", dados })
        return Promise.resolve({ error: null })
      },
      update: (dados: unknown) => ({
        eq: (_c: string, id: unknown) => {
          escritas.push({ tabela, op: "update", dados, id })
          return Promise.resolve({ error: null })
        },
      }),
    }
    return q
  }
  return { cliente: { from } as unknown as SupabaseClient, escritas }
}

describe("pautaDaPeca", () => {
  it("acha a pauta do carrossel", async () => {
    const { cliente } = bancoFalso({
      editorial_carousels: [{ id: "c1", scheduled_post_id: "p1" }],
      scheduled_posts: [{ id: "p1" }],
    })
    expect(await pautaDaPeca(cliente, "carousel", "c1")).toBe("p1")
  })

  it("peça sem pauta, sem id ou de tipo estranho não liga em nada", async () => {
    const { cliente } = bancoFalso({
      single_posts: [{ id: "s1", scheduled_post_id: null }],
      scheduled_posts: [],
    })
    expect(await pautaDaPeca(cliente, "single_post", "s1")).toBeNull()
    expect(await pautaDaPeca(cliente, "carousel", undefined)).toBeNull()
    expect(await pautaDaPeca(cliente, "outra", "s1")).toBeNull()
  })

  it("pauta que o RLS esconde (de outro dono) não volta", async () => {
    const { cliente } = bancoFalso({
      editorial_carousels: [{ id: "c1", scheduled_post_id: "p-alheia" }],
      scheduled_posts: [],
    })
    expect(await pautaDaPeca(cliente, "carousel", "c1")).toBeNull()
  })
})

describe("avisoDeRepeticao", () => {
  it("pauta agendada ou pronta publica sem perguntar", async () => {
    for (const status of ["agendado", "pronto"]) {
      const { cliente } = bancoFalso({
        scheduled_posts: [{ id: "p1", status }],
        publish_attempts: [],
      })
      expect(await avisoDeRepeticao(cliente, "p1")).toBeNull()
    }
  })

  it("pauta já publicada pergunta, com a data em horário de Brasília", async () => {
    const { cliente } = bancoFalso({
      scheduled_posts: [{ id: "p1", status: "publicado" }],
      publish_attempts: [
        { scheduled_post_id: "p1", ok: true, error: null, attempted_at: "2026-10-21T12:00:00Z" },
      ],
    })
    expect(await avisoDeRepeticao(cliente, "p1")).toBe(
      "Este post já foi publicado no Instagram em 21/10 às 09:00. Publicar de novo repete o post no perfil.",
    )
  })

  it("agendamento no meio da publicação também pergunta", async () => {
    const { cliente } = bancoFalso({
      scheduled_posts: [{ id: "p1", status: "agendado" }],
      publish_attempts: [
        { scheduled_post_id: "p1", ok: false, error: "em andamento", attempted_at: "2026-10-21T12:00:00Z" },
      ],
    })
    expect(await avisoDeRepeticao(cliente, "p1")).toMatch(/agendamento começou a publicar/)
  })
})

describe("registrarPublicacaoManual", () => {
  it("carimba publicado e deixa o rastro", async () => {
    const { cliente, escritas } = bancoFalso({})
    await registrarPublicacaoManual(cliente, "p1", "ig123", 7)
    expect(escritas).toContainEqual({
      tabela: "scheduled_posts",
      op: "update",
      dados: { status: "publicado" },
      id: "p1",
    })
    expect(escritas).toContainEqual({
      tabela: "publish_attempts",
      op: "insert",
      dados: { scheduled_post_id: "p1", ok: true, ig_media_id: "ig123", image_count: 7 },
    })
  })
})
