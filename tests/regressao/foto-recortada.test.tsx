// Foto recortada (PNG sem fundo), 25/10/2026.
//
// Travado aqui:
//  1. Que URL vai pra Fal (pública e absoluta; o embrulho do proxy da casa é
//     desfeito; caminho local é recusado com aviso em vez de quebrar).
//  2. Quando o recorte vale: só enquanto a foto do slide É o PNG recortado.
//     Trocar a foto desliga o recorte sozinho (nenhum "modo recortado" preso
//     numa foto nova).
//  3. Nos 18 estilos, a foto principal recortada sai inteira (contain), com
//     data-cutout, e o resto do slide continua aparecendo.
//  4. Preço: 2 tokens, igual a uma foto de miolo.
import { describe, it, expect } from "vitest"
import { publicImageUrl } from "@/lib/generation/cutout"
import { isCutoutActive } from "@/components/carousel/editorial-shared"
import { TOKEN_COST } from "@/lib/tokens"
import { CUTOUT_FRIENDLY_STYLES } from "@/components/carousel/carousel-styles"
import type { PreviewSlide } from "@/components/carousel/slide-preview"
import { ESTILOS_ORIGINAIS, FOTO_A, abrir, carrosselPadrao, renderSlide, textoVisivel } from "./helpers"

const PNG = "https://v3b.fal.media/files/b/xx/recorte.png"

describe("recorte: URL que vai pra Fal", () => {
  it("URL pública passa como está", () => {
    expect(publicImageUrl("https://abc.supabase.co/storage/v1/object/public/a.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/a.jpg",
    )
  })

  it("desfaz o embrulho do proxy da casa", () => {
    const orig = "https://v3.fal.media/files/foto.jpg"
    expect(publicImageUrl(`/api/proxy-image?url=${encodeURIComponent(orig)}`)).toBe(orig)
  })

  it("caminho local, vazio ou esquisito é recusado (a Fal não acharia)", () => {
    expect(publicImageUrl("/refs-posts-unicos/a.jpg")).toBeNull()
    expect(publicImageUrl("")).toBeNull()
    expect(publicImageUrl("data:image/png;base64,AAAA")).toBeNull()
  })
})

describe("recorte: quando vale", () => {
  it("vale enquanto a foto do slide é o próprio PNG", () => {
    expect(isCutoutActive({ url: PNG, cutout: { url: PNG, from: FOTO_A } })).toBe(true)
  })

  it("trocou a foto: o recorte desliga sozinho", () => {
    expect(isCutoutActive({ url: FOTO_A, cutout: { url: PNG, from: FOTO_A } })).toBe(false)
    expect(isCutoutActive({ url: null, cutout: { url: PNG, from: FOTO_A } })).toBe(false)
    expect(isCutoutActive({ url: PNG })).toBe(false)
  })

  it("custa 2 tokens e começa ligado nos 5 estilos de foto recortada", () => {
    expect(TOKEN_COST.imageCutout).toBe(2)
    expect([...CUTOUT_FRIENDLY_STYLES].sort()).toEqual(
      ["agencia", "cartaz", "colagem", "geometrico", "poster"],
    )
  })
})

function recortado(s: PreviewSlide): PreviewSlide {
  return { ...s, image: { ...s.image, url: PNG, cutout: { url: PNG, from: FOTO_A } } }
}

describe("recorte: os 18 estilos", () => {
  const slides = carrosselPadrao()
  for (const estilo of ESTILOS_ORIGINAIS) {
    it(`${estilo}: foto recortada sai inteira e o slide continua completo`, () => {
      let comRecorte = 0
      for (const s of slides) {
        const html = renderSlide(recortado(s), slides.length, { estilo })
        const $ = abrir(html)
        expect(textoVisivel(html)).toContain(s.title.split(" ")[0])
        $('img[data-cutout="1"]').each((_, el) => {
          comRecorte++
          const style = $(el).attr("style") ?? ""
          expect(style).toContain("object-fit:contain")
          expect($(el).attr("data-edit")).toBe("image")
        })
      }
      // Todo estilo mostra a foto principal em pelo menos um slide.
      expect(comRecorte).toBeGreaterThan(0)
    })
  }
})
