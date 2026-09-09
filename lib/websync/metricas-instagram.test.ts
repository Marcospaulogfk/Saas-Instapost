import { describe, expect, it } from "vitest"
import type { InstagramMedia } from "@/lib/instagram/meta"
import {
  manchete,
  paraIso,
  mapearPautas,
  montarPost,
  montarTotais,
  num,
} from "./metricas-instagram"

// =====================================================================
// O que este arquivo protege é uma frase só: número não medido é `null`,
// nunca `0`. A tela do CRM desenha "-" pra null e desenha o número pra 0,
// e as duas coisas dizem coisas diferentes pro Reinaldo.
//
// Trocar um null por 0 aqui não quebraria nada visivelmente: a tela
// continuaria montando, só passaria a afirmar que o post teve zero
// salvamento. É o tipo de erro que só aparece numa reunião, tarde.
// =====================================================================

function midia(over: Partial<InstagramMedia> = {}): InstagramMedia {
  return {
    id: "media-1",
    caption: "Primeira linha\nsegunda linha",
    mediaType: "CAROUSEL_ALBUM",
    mediaUrl: null,
    thumbnailUrl: null,
    permalink: "https://instagram.com/p/x",
    timestamp: "2026-09-08T12:00:00+0000",
    likeCount: 10,
    commentsCount: 3,
    ...over,
  }
}

describe("não medido não é zero", () => {
  it("métrica ausente vira null", () => {
    expect(num(undefined)).toBeNull()
    expect(num(null)).toBeNull()
  })

  it("zero de verdade continua zero", () => {
    // O outro lado do mesmo cuidado: post que realmente teve 0 salvamento
    // não pode virar "-", senão some um dado que existe.
    expect(num(0)).toBe(0)
  })

  it("post sem leitura vem com tudo null, menos os comentários", () => {
    const p = montarPost(midia(), null, null)

    expect(p.alcance).toBeNull()
    expect(p.salvamentos).toBeNull()
    expect(p.compartilhamentos).toBeNull()
    // Este sobrevive porque vem da mídia, não dos insights.
    expect(p.comentarios).toBe(3)
  })

  it("post lido com zero salvamento devolve 0, não null", () => {
    const p = montarPost(midia(), { reach: 500, saved: 0, shares: 2 }, null)

    expect(p.alcance).toBe(500)
    expect(p.salvamentos).toBe(0)
    expect(p.compartilhamentos).toBe(2)
  })

  it("insight parcial: o que veio é número, o que não veio é null", () => {
    const p = montarPost(midia(), { reach: 120 }, null)

    expect(p.alcance).toBe(120)
    expect(p.salvamentos).toBeNull()
  })
})

describe("totais de 30 dias", () => {
  it("série vazia não vira crescimento zero", () => {
    // Conta com menos de 100 seguidores: a Meta devolve a série vazia e não
    // avisa. Somar [] daria 0 e diria "não cresceu", que é outra afirmação.
    const t = montarTotais({ reach: 900, saves: 4, shares: 1 }, [])

    expect(t.seguidoresGanhos).toBeNull()
    expect(t.alcance).toBe(900)
  })

  it("série cheia soma os dias", () => {
    const t = montarTotais({}, [
      { date: "2026-09-07", value: 3 },
      { date: "2026-09-08", value: 5 },
    ])

    expect(t.seguidoresGanhos).toBe(8)
  })

  it("totais que a Meta não entregou ficam null", () => {
    const t = montarTotais({}, [])

    expect(t).toEqual({
      alcance: null,
      seguidoresGanhos: null,
      salvamentos: null,
      compartilhamentos: null,
    })
  })

  it("traduz o nome da métrica da conta (saves), não o da mídia (saved)", () => {
    // A conta chama `saves` e a mídia chama `saved`. Ler a chave errada
    // devolveria null sempre, e ninguém notaria: parece conta sem dado.
    const t = montarTotais({ saves: 12 }, [])

    expect(t.salvamentos).toBe(12)
  })
})

describe("data que todo navegador le", () => {
  it("o fuso sem dois-pontos da Meta vira ISO de verdade", () => {
    // Este é o caso real: a Graph API devolve +0000, sem os dois-pontos.
    // O Chrome lê, o Safari devolve Invalid Date — a data sumia SÓ no
    // iPhone, que é o único aparelho onde o Reinaldo abre isso.
    expect(paraIso("2026-09-08T12:00:00+0000")).toBe("2026-09-08T12:00:00.000Z")
  })

  it("o que já está em ISO continua válido", () => {
    expect(paraIso("2026-09-08T12:00:00.000Z")).toBe("2026-09-08T12:00:00.000Z")
  })

  it("o formato que quebra: sai daqui com os dois-pontos no fuso", () => {
    // A garantia que interessa pra tela, dita sem depender de um valor fixo.
    const saida = paraIso("2026-09-08T12:00:00+0000")
    expect(Number.isNaN(new Date(saida).getTime())).toBe(false)
    expect(saida).toMatch(/(Z|[+-]\d{2}:\d{2})$/)
  })

  it("vazio continua vazio, sem virar a data de hoje", () => {
    // `new Date("")` é inválida, mas `new Date(undefined as any)` não é o
    // ponto: inventar "agora" aqui carimbaria post sem data com a data da
    // leitura, e ninguém desconfiaria.
    expect(paraIso("")).toBe("")
    expect(paraIso(null)).toBe("")
  })

  it("data ilegível volta como veio, em vez de virar algo inventado", () => {
    expect(paraIso("ontem à noite")).toBe("ontem à noite")
  })
})

describe("manchete", () => {
  it("pega a primeira linha não vazia da legenda", () => {
    expect(manchete("\n\n  A chamada  \nresto")).toBe("A chamada")
  })

  it("legenda vazia ou ausente vira null, não string vazia", () => {
    expect(manchete(null)).toBeNull()
    expect(manchete("")).toBeNull()
    expect(manchete("   \n  ")).toBeNull()
  })

  it("corta legenda longa em 120", () => {
    expect(manchete("a".repeat(300))?.length).toBe(120)
  })
})

describe("a corrente que devolve o pilar", () => {
  it("liga a mídia à pauta que a gerou", () => {
    const mapa = mapearPautas([
      { ig_media_id: "media-1", scheduled_post_id: "pauta-1" },
    ])
    const p = montarPost(midia(), { reach: 1 }, mapa.get("media-1") ?? null)

    expect(p.scheduledPostId).toBe("pauta-1")
    expect(p.viaSyncPost).toBe(true)
  })

  it("post subido na mão não tem pauta, e isso não é falha", () => {
    const mapa = mapearPautas([])
    const p = montarPost(midia({ id: "na-mao" }), { reach: 1 }, mapa.get("na-mao") ?? null)

    expect(p.scheduledPostId).toBeNull()
    expect(p.viaSyncPost).toBe(false)
  })

  it("republicação não troca o vínculo que já existe", () => {
    const mapa = mapearPautas([
      { ig_media_id: "media-1", scheduled_post_id: "primeira" },
      { ig_media_id: "media-1", scheduled_post_id: "segunda" },
    ])

    expect(mapa.get("media-1")).toBe("primeira")
  })

  it("linha sem id ou sem pauta é descartada em vez de virar vínculo torto", () => {
    const mapa = mapearPautas([
      { ig_media_id: "media-1", scheduled_post_id: null },
      { ig_media_id: null, scheduled_post_id: "pauta-2" },
      { ig_media_id: "media-3" },
    ])

    expect(mapa.size).toBe(0)
  })
})
