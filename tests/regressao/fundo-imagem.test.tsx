// Imagem de fundo do slide ("Fundo do Slide" → Imagem de fundo), 25/10/2026.
//
// O que fica travado aqui:
//  1. As contas da camada (escurecer/clarear, intensidade, posição) e do
//     destaque legível sobre a foto.
//  2. Com imagem de fundo, TODOS os 18 estilos abrem, mostram o título e
//     tratam o texto pelo tom da camada (escurecer = texto claro).
//  3. Sem imagem de fundo nada muda (as fotografias dos estilos cobrem isso;
//     aqui só conferimos que a capa do Minimalista segue sem cor inline).
//
// A pintura da foto em si acontece depois do render (mesmo ponto do degradê)
// e é conferida no navegador: /preview-estilos?estilo=<id>&todos=1&fundo=dark
import { describe, it, expect } from "vitest"
import type { PreviewSlide } from "@/components/carousel/slide-preview"
import { contrastRatio } from "@/lib/color-contrast"
import {
  BG_IMAGE_DEFAULT_SHADE,
  BG_IMAGE_MIN_ACCENT_CONTRAST,
  BG_IMAGE_TONE_COLOR,
  accentOnBgImage,
  bgImageCss,
  bgImageToneColor,
  bgImageWorstBackground,
  type SlideBgImage,
} from "@/components/carousel/slide-bg-image"
import { ESTILOS_ORIGINAIS, abrir, carrosselPadrao, renderSlide, textoVisivel } from "./helpers"

const FUNDO = "https://img.exemplo.test/fundo.jpg"

describe("imagem de fundo: contas da camada", () => {
  it("padrão: escurecer a 60%, foto centralizada e cobrindo o slide", () => {
    const css = bgImageCss({ url: FUNDO })
    expect(BG_IMAGE_DEFAULT_SHADE).toBe(60)
    expect(css.backgroundImage).toContain("rgba(11,11,16,0.60)")
    expect(css.backgroundImage).toContain(`url("${FUNDO}")`)
    expect(css.backgroundSize).toBe("cover")
    expect(css.backgroundPosition).toBe("50% 50%")
    expect(css.backgroundRepeat).toBe("no-repeat")
  })

  it("clarear usa camada clara; intensidade e posição respeitam os limites", () => {
    const css = bgImageCss({ url: FUNDO, tone: "light", shade: 150, posX: -20, posY: 130 })
    expect(css.backgroundImage).toContain("rgba(247,245,240,0.90)")
    expect(css.backgroundPosition).toBe("0% 100%")
  })

  it("a cor do tom decide o texto: escurecer = fundo escuro, clarear = fundo claro", () => {
    expect(bgImageToneColor({ url: FUNDO })).toBe(BG_IMAGE_TONE_COLOR.dark)
    expect(bgImageToneColor({ url: FUNDO, tone: "light" })).toBe(BG_IMAGE_TONE_COLOR.light)
  })

  it("o destaque fica legível sobre a foto em qualquer intensidade e cor de marca", () => {
    const marcas = ["#1668E3", "#E11D48", "#111111", "#FAFAFA", "#22C55E", "#7C3AED"]
    for (const tone of ["dark", "light"] as const) {
      for (const shade of [0, 30, 60, 90]) {
        const img: SlideBgImage = { url: FUNDO, tone, shade }
        const fundo = bgImageWorstBackground(img)
        // Sem camada (0%) nem o branco puro alcança 3:1 sobre uma área clara
        // da foto: aí vale o melhor possível (branco ou quase preto).
        const extremo = tone === "light" ? "#0A0A0F" : "#FFFFFF"
        const melhorPossivel = contrastRatio(extremo, fundo)
        for (const cor of marcas) {
          const a = accentOnBgImage(cor, img)
          expect(contrastRatio(a, fundo), `${cor} ${tone} ${shade}`).toBeGreaterThanOrEqual(
            Math.min(BG_IMAGE_MIN_ACCENT_CONTRAST, melhorPossivel) - 0.01,
          )
        }
      }
    }
  })

  it("com camada forte a cor da marca volta a ser a original", () => {
    expect(accentOnBgImage("#1668E3", { url: FUNDO, shade: 90 })).toBe("#1668e3")
  })
})

function comFundo(slide: PreviewSlide, tone: "dark" | "light"): PreviewSlide {
  return { ...slide, bgImage: { url: FUNDO, tone } }
}

describe("imagem de fundo: os 18 estilos", () => {
  const slides = carrosselPadrao()

  for (const estilo of ESTILOS_ORIGINAIS) {
    for (const tone of ["dark", "light"] as const) {
      it(`${estilo} (${tone === "dark" ? "escurecer" : "clarear"}): todo slide abre com o título`, () => {
        for (const s of slides) {
          const html = renderSlide(comFundo(s, tone), slides.length, { estilo })
          expect(textoVisivel(html)).toContain(s.title.split(" ")[0])
        }
      })
    }
  }
})

describe("imagem de fundo: contraste do texto", () => {
  const capa = carrosselPadrao()[0]

  it("Minimalista: capa com foto escurecida põe o título em branco", () => {
    const html = renderSlide(comFundo(capa, "dark"), 5, { estilo: "minimal" })
    const style = abrir(html)('[data-edit="title"]').attr("style") ?? ""
    expect(style).toMatch(/color:\s*#FFFFFF/i)
  })

  it("Minimalista: capa com foto clareada põe o título escuro", () => {
    const html = renderSlide(comFundo(capa, "light"), 5, { estilo: "minimal" })
    const style = abrir(html)('[data-edit="title"]').attr("style") ?? ""
    expect(style).toMatch(/color:\s*#0A0A0F/i)
  })

  it("Minimalista sem fundo escolhido: título sem cor inline (igual a antes)", () => {
    const html = renderSlide(capa, 5, { estilo: "minimal" })
    const style = abrir(html)('[data-edit="title"]').attr("style") ?? ""
    expect(style).not.toMatch(/(^|;)\s*color:/i)
  })
})
