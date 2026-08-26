import { describe, expect, it } from "vitest"
import { avaliarArte, podeAgendar, urlPublicavel, type PecaBruta } from "./arte"

const BASE = "https://exemplo.supabase.co"
const NOSSA = `${BASE}/storage/v1/object/public/editorial-uploads/arte-1080.png`
const THUMB = `${BASE}/storage/v1/object/public/editorial-uploads/thumb-540.png`
const DO_FAL = "https://v3.fal.media/files/abc/saida.png"

function peca(over: Partial<PecaBruta> = {}): PecaBruta {
  return {
    tipo: "single_post",
    id: "p1",
    publishImageUrls: null,
    publishPreparedAt: null,
    thumbUrl: null,
    updatedAt: null,
    ...over,
  }
}

describe("avaliarArte", () => {
  it("sem peça nenhuma: sem_arte", () => {
    const a = avaliarArte(null, BASE)
    expect(a.estado).toBe("sem_arte")
    expect(podeAgendar(a)).toBe(false)
  })

  it("só miniatura NÃO é publicável, e diz por quê", () => {
    // O caso real medido em 26/08: 6 posts com URL pública de 540px.
    const a = avaliarArte(peca({ thumbUrl: THUMB }), BASE)
    expect(a.estado).toBe("so_miniatura")
    expect(a.motivo).toContain("540px")
    expect(podeAgendar(a)).toBe(false)
  })

  it("arte preparada no nosso storage é publicável", () => {
    const a = avaliarArte(peca({ publishImageUrls: [NOSSA], thumbUrl: THUMB }), BASE)
    expect(a.estado).toBe("publicavel")
    expect(a.imagens).toEqual([NOSSA])
    expect(a.motivo).toBeNull()
    expect(podeAgendar(a)).toBe(true)
  })

  it("URL do Fal não conta como preparada: ela expira antes do dia", () => {
    const a = avaliarArte(peca({ publishImageUrls: [DO_FAL], thumbUrl: THUMB }), BASE)
    expect(a.estado).toBe("sem_arte")
    expect(a.motivo).toContain("expirar")
    expect(podeAgendar(a)).toBe(false)
  })

  it("mantém a ordem dos slides do carrossel", () => {
    const urls = [`${NOSSA}?s=1`, `${NOSSA}?s=2`, `${NOSSA}?s=3`]
    const a = avaliarArte(peca({ tipo: "carousel", publishImageUrls: urls }), BASE)
    expect(a.imagens).toEqual(urls)
  })

  it("recem-preparada NAO avisa: o trigger de updated_at carimba depois do preparo", () => {
    // single_posts tem trigger BEFORE UPDATE (0008): o mesmo write que grava
    // publish_prepared_at bota updated_at alguns ms na frente. Sem folga, todo
    // post preparado nasceria com aviso de desatualizado.
    const a = avaliarArte(
      peca({
        publishImageUrls: [NOSSA],
        publishPreparedAt: "2026-08-26T10:00:00.000Z",
        updatedAt: "2026-08-26T10:00:00.850Z",
      }),
      BASE,
    )
    expect(a.estado).toBe("publicavel")
    expect(a.motivo).toBeNull()
  })

  it("editada depois de preparada: publica mesmo assim, mas avisa", () => {
    const a = avaliarArte(
      peca({
        publishImageUrls: [NOSSA],
        publishPreparedAt: "2026-08-26T10:00:00.000Z",
        updatedAt: "2026-08-26T18:00:00.000Z",
      }),
      BASE,
    )
    expect(a.estado).toBe("publicavel")
    expect(a.motivo).toContain("versão preparada")
  })
})

describe("urlPublicavel", () => {
  it("aceita só o nosso storage público", () => {
    expect(urlPublicavel(NOSSA, BASE)).toBe(true)
    expect(urlPublicavel(DO_FAL, BASE)).toBe(false)
    expect(urlPublicavel(`${BASE}/storage/v1/object/sign/x.png`, BASE)).toBe(false)
    expect(urlPublicavel("", BASE)).toBe(false)
  })
})
