import { describe, expect, it, beforeAll } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { agendarPeca } from "./agendar-peca"

const BASE = "https://exemplo.supabase.co"
const ARTE = `${BASE}/storage/v1/object/public/artes/1.png`
const AGORA = new Date("2026-10-30T15:00:00Z") // 12:00 em Brasília

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = BASE
})

// Mesmo banco de mentira de publicacao-manual.test.ts, com insert que devolve id.
function bancoFalso(tabelas: Record<string, Array<Record<string, unknown>>>) {
  const escritas: Array<{ tabela: string; op: string; dados?: unknown; id?: unknown }> = []
  const falhas = new Set<string>()
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
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "pauta-nova" }, error: null }),
          }),
        }
      },
      update: (dados: unknown) => ({
        eq: (_c: string, id: unknown) => {
          escritas.push({ tabela, op: "update", dados, id })
          return Promise.resolve({ error: falhas.has(tabela) ? { message: "x" } : null })
        },
      }),
      delete: () => ({
        eq: (_c: string, id: unknown) => {
          escritas.push({ tabela, op: "delete", id })
          return Promise.resolve({ error: null })
        },
      }),
    }
    return q
  }
  return { cliente: { from } as unknown as SupabaseClient, escritas, falhas }
}

const conectado = { instagram_connections: [{ user_id: "u1" }] }

const post = (extra: Record<string, unknown> = {}) => ({
  id: "s1",
  brand_id: "b1",
  title: "Meu post",
  content: { _format: "post" },
  publish_image_urls: [ARTE],
  publish_prepared_at: "2026-10-30T14:59:00Z",
  scheduled_post_id: null,
  ...extra,
})

const carrossel = (extra: Record<string, unknown> = {}) => ({
  id: "c1",
  user_id: "u1",
  topic: "Meu carrossel",
  brand_name: "Culturize-se",
  carousel_data: { format: "feed" },
  publish_image_urls: [ARTE, ARTE],
  publish_prepared_at: "2026-10-30T14:59:00Z",
  scheduled_post_id: null,
  ...extra,
})

const pedidoPost = { tipo: "single_post" as const, pecaId: "s1", data: "2026-10-31", hora: "18:00" }
const pedidoCarrossel = { tipo: "carousel" as const, pecaId: "c1", data: "2026-10-31", hora: "18:00" }

describe("agendarPeca", () => {
  it("peça sem pauta ganha uma pauta agendada e fica ligada a ela", async () => {
    const { cliente, escritas } = bancoFalso({ ...conectado, single_posts: [post()] })
    const res = await agendarPeca(cliente, "u1", pedidoPost, AGORA)
    expect(res).toEqual({ ok: true, pautaId: "pauta-nova", stories: false })
    expect(escritas[0]).toMatchObject({
      tabela: "scheduled_posts",
      op: "insert",
      dados: {
        brand_id: "b1",
        title: "Meu post",
        status: "agendado",
        format: "post",
        network: "instagram",
        scheduled_date: "2026-10-31",
        scheduled_time: "18:00",
        source: "manual",
      },
    })
    expect(escritas[1]).toMatchObject({
      tabela: "single_posts",
      op: "update",
      dados: { scheduled_post_id: "pauta-nova" },
      id: "s1",
    })
  })

  it("carrossel acha a marca pelo nome e entra como carrossel", async () => {
    const { cliente, escritas } = bancoFalso({
      ...conectado,
      editorial_carousels: [carrossel()],
      brands: [
        { id: "b0", user_id: "u1", name: "Outra" },
        { id: "b1", user_id: "u1", name: "Culturize-se" },
      ],
    })
    await agendarPeca(cliente, "u1", pedidoCarrossel, AGORA)
    expect(escritas[0].dados).toMatchObject({ brand_id: "b1", format: "carrossel" })
  })

  it("peça que veio do calendário usa a pauta dela, sem criar outra", async () => {
    const { cliente, escritas } = bancoFalso({
      ...conectado,
      single_posts: [post({ scheduled_post_id: "p1" })],
      scheduled_posts: [{ id: "p1", status: "pronto" }],
    })
    const res = await agendarPeca(cliente, "u1", pedidoPost, AGORA)
    expect(res).toMatchObject({ ok: true, pautaId: "p1" })
    expect(escritas).toHaveLength(1)
    expect(escritas[0]).toMatchObject({
      tabela: "scheduled_posts",
      op: "update",
      id: "p1",
      dados: { status: "agendado", scheduled_time: "18:00" },
    })
  })

  it("reagendar peça que já estava agendada só muda o horário", async () => {
    const { cliente, escritas } = bancoFalso({
      ...conectado,
      single_posts: [post({ scheduled_post_id: "p1" })],
      scheduled_posts: [{ id: "p1", status: "agendado" }],
    })
    const res = await agendarPeca(cliente, "u1", { ...pedidoPost, hora: "20:30" }, AGORA)
    expect(res.ok).toBe(true)
    expect(escritas[0].dados).toMatchObject({ scheduled_time: "20:30" })
  })

  it("post e carrossel em formato Stories vão como stories", async () => {
    const a = bancoFalso({
      ...conectado,
      single_posts: [post({ content: { _format: "story" } })],
    })
    expect(await agendarPeca(a.cliente, "u1", pedidoPost, AGORA)).toMatchObject({ stories: true })
    expect(a.escritas[0].dados).toMatchObject({ format: "stories" })

    const b = bancoFalso({
      ...conectado,
      editorial_carousels: [carrossel({ carousel_data: { format: "stories" } })],
      brands: [{ id: "b1", user_id: "u1", name: "Culturize-se" }],
    })
    await agendarPeca(b.cliente, "u1", pedidoCarrossel, AGORA)
    expect(b.escritas[0].dados).toMatchObject({ format: "stories" })
  })

  it("recusa horário que já passou", async () => {
    const { cliente, escritas } = bancoFalso({ ...conectado, single_posts: [post()] })
    const res = await agendarPeca(cliente, "u1", { ...pedidoPost, data: "2026-10-30", hora: "11:00" }, AGORA)
    expect(res).toMatchObject({ ok: false })
    expect(escritas).toHaveLength(0)
  })

  it("recusa peça já publicada", async () => {
    const { cliente, escritas } = bancoFalso({
      ...conectado,
      single_posts: [post({ scheduled_post_id: "p1" })],
      scheduled_posts: [{ id: "p1", status: "publicado" }],
    })
    const res = await agendarPeca(cliente, "u1", pedidoPost, AGORA)
    expect(res).toMatchObject({ ok: false })
    expect(escritas).toHaveLength(0)
  })

  it("recusa peça sem arte preparada", async () => {
    const { cliente, escritas } = bancoFalso({
      ...conectado,
      single_posts: [post({ publish_image_urls: null })],
    })
    const res = await agendarPeca(cliente, "u1", pedidoPost, AGORA)
    expect(res).toMatchObject({ ok: false })
    expect(escritas).toHaveLength(0)
  })

  it("recusa conta sem Instagram conectado", async () => {
    const { cliente, escritas } = bancoFalso({ single_posts: [post()] })
    const res = await agendarPeca(cliente, "u1", pedidoPost, AGORA)
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining("Conecte o Instagram") })
    expect(escritas).toHaveLength(0)
  })

  it("carrossel de outra conta não é encontrado", async () => {
    const { cliente } = bancoFalso({ ...conectado, editorial_carousels: [carrossel({ user_id: "u2" })] })
    expect(await agendarPeca(cliente, "u1", pedidoCarrossel, AGORA)).toMatchObject({ ok: false })
  })

  it("se não conseguir ligar a peça, apaga a pauta recém-criada", async () => {
    const { cliente, escritas, falhas } = bancoFalso({ ...conectado, single_posts: [post()] })
    falhas.add("single_posts")
    const res = await agendarPeca(cliente, "u1", pedidoPost, AGORA)
    expect(res).toMatchObject({ ok: false })
    expect(escritas.at(-1)).toMatchObject({ tabela: "scheduled_posts", op: "delete", id: "pauta-nova" })
  })
})
