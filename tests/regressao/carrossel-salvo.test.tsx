// "Carrossel salvo ontem": um JSON completo no formato que vai pro banco
// (CarouselV2Data), com TODOS os campos opcionais preenchidos. Garante que
// uma peça já salva continua abrindo em cada um dos 10 estilos originais
// depois de qualquer mudança no código.
//
// Carregar/salvar de verdade (loadCarouselV2, saveCarouselV2, listCarouselsV2)
// depende do Supabase e de usuário logado — não dá pra testar sem banco. As
// duas funções de normalização do handle da página do editor (handleFromBrand,
// normalizeHandle) não são exportadas. Por isso aqui só o RENDER é testado.
import { describe, it, expect } from "vitest"
import type { CarouselV2Data } from "@/app/actions/carousel"
import type { PreviewSlide } from "@/components/carousel/slide-preview"
import { fontClassById } from "@/components/carousel/carousel-fonts"
import {
  ESTILOS_ORIGINAIS,
  FOTO_A,
  FOTO_B,
  FOTO_C,
  abrir,
  renderSlide,
  textoVisivel,
} from "./helpers"

const ATRIB = { photographerName: "Ana Fotógrafa", photographerUrl: "https://unsplash.com/@ana" }

const SLIDES_SALVOS: PreviewSlide[] = [
  {
    order_index: 0,
    title: "5 erros que afastam cliente da sua clínica",
    highlight_words: ["erros", "clínica"],
    highlight_styles: {
      erros: { color: "#FF5500" },
      clínica: { color: "#FFFFFF", bg: "#1668E3" },
    },
    subtitle: "E como consertar cada um esta semana",
    cta_badge: "Guia prático",
    bg: "#0B1F3A",
    glow: "#1668E3",
    el: {
      "title-0": { dx: 4, dy: -6, scale: 1.05 },
      "badge-0": { bg: "#1668E3", color: "#FFFFFF" },
    },
    image: {
      url: FOTO_A,
      source: "unsplash",
      attribution: ATRIB,
      error: null,
      posX: 40,
      posY: 30,
      zoom: 115,
    },
  },
  {
    order_index: 1,
    title: "Erro 1: responder só no dia seguinte",
    highlight_words: ["dia seguinte"],
    subtitle: "Quem espera, marca em outro lugar",
    body: "Metade das pessoas que mandam mensagem fecham com quem responde primeiro. Deixe uma resposta automática com horário de retorno.",
    cta_badge: "Erro 1",
    bgGradient: { from: "#FAF8F5", to: "#E8E2D8", angle: 160 },
    image: { url: FOTO_B, source: "ai", attribution: null, error: null },
    blocks: [
      {
        id: "b-seta",
        type: "pill",
        x: 150,
        y: 470,
        w: 120,
        h: 30,
        z: 1,
        text: "continua →",
        variant: "accent",
        color: "#1668E3",
      },
      {
        id: "b-marca",
        type: "brand",
        x: 24,
        y: 24,
        w: 220,
        h: 44,
        z: 2,
        name: "Clínica Vida",
        handle: "@clinicavida",
        color: "#0A0A0F",
        verified: true,
        showAvatar: false,
        font: "playfair",
        shadow: false,
      },
    ],
  },
  {
    order_index: 2,
    title: "Erro 2: fotos escuras do consultório",
    highlight_words: ["fotos"],
    subtitle: "Antes e depois de 10 minutos de luz",
    body: "Abra a persiana, desligue o flash e tire a foto de frente. **Luz natural** vende confiança.",
    cta_badge: "Erro 2",
    image: {
      url: FOTO_A,
      source: "unsplash",
      attribution: ATRIB,
      error: null,
      collage: [FOTO_A, FOTO_B, FOTO_C],
      collageLayout: "3",
    },
    extra_images: [
      { url: FOTO_B, source: "unsplash", attribution: ATRIB, error: null },
      { url: FOTO_C, source: "ai", attribution: null, error: null },
    ],
  },
  {
    order_index: 3,
    title: "Erro 3: não pedir avaliação",
    highlight_words: ["avaliação"],
    subtitle: "Quem saiu feliz quer contar",
    body: "Peça a avaliação no dia da consulta, com o link pronto. Uma por semana já muda sua posição no mapa.",
    cta_badge: "Erro 3",
    el: { "text-0": { hidden: true }, "meta-0": { text: "passa pro lado" } },
    image: { url: null, source: null, attribution: null, error: "Foto indisponível" },
  },
  {
    order_index: 4,
    title: "Quer um plano pra sua clínica?",
    highlight_words: ["plano"],
    subtitle: "Manda um oi no direct",
    body: "A gente monta os 30 dias de conteúdo e você só aprova.",
    cta_badge: "Fale com a gente",
    bg: "#0A0A0F",
    image: { url: FOTO_C, source: "wikimedia", attribution: null, error: null },
  },
]

const CARROSSEL_SALVO: CarouselV2Data = {
  _kind: "carousel-v2",
  slides: SLIDES_SALVOS,
  title: "5 erros que afastam cliente da clínica",
  caption: "Salve este post e manda pro sócio. #clinica #marketing",
  brandName: "Clínica Vida",
  handle: "@clinicavida",
  avatarInitials: "CV",
  chrome: {
    handleAvatar: "https://img.exemplo.test/avatar.png",
    showDots: true,
    showVerified: true,
    showFooter: true,
    footerLabel: "2026 //",
  },
  colors: ["#1668E3", "#0B1F3A", "#FAF8F5"],
  template: "editorial",
  editorialStyle: "minimal",
  format: "feed",
  font: "playfair",
  titleWeight: 900,
  titleScale: 1.1,
  bodyWeight: 500,
  bodyScale: 0.95,
  coverImageUrl: "https://img.exemplo.test/capa-composta.png",
}

function renderSalvo(dados: CarouselV2Data, estilo: (typeof ESTILOS_ORIGINAIS)[number]) {
  return dados.slides.map((s) =>
    renderSlide(s, dados.slides.length, {
      estilo,
      format: dados.format,
      handle: dados.handle,
      brandLabel: dados.brandName,
      footerLabel: dados.chrome?.footerLabel,
      fontClass: fontClassById(dados.font),
      brandColors: dados.colors,
      titleWeight: dados.titleWeight,
      titleScale: dados.titleScale,
      bodyWeight: dados.bodyWeight,
      bodyScale: dados.bodyScale,
      showDots: dados.chrome?.showDots,
      showVerified: dados.chrome?.showVerified,
      showFooter: dados.chrome?.showFooter,
      handleAvatar: dados.chrome?.handleAvatar,
      handleInitials: dados.avatarInitials,
    }),
  )
}

describe("carrossel salvo ontem", () => {
  it("o JSON salvo é do tipo do editor novo e tem 5 slides em ordem", () => {
    expect(CARROSSEL_SALVO._kind).toBe("carousel-v2")
    expect(CARROSSEL_SALVO.slides.map((s) => s.order_index)).toEqual([0, 1, 2, 3, 4])
  })

  it("a fonte salva (playfair) é reconhecida; fonte desconhecida cai no Inter", () => {
    // Nos testes next/font/google vira "font-<nome>" (tests/stubs).
    expect(fontClassById(CARROSSEL_SALVO.font)).toBe("font-playfair-display")
    expect(fontClassById("fonte-que-nao-existe")).toBe("font-inter")
    expect(fontClassById(undefined)).toBe("font-inter")
  })

  describe.each(ESTILOS_ORIGINAIS)("abre no estilo %s", (estilo) => {
    const htmls = renderSalvo(CARROSSEL_SALVO, estilo)

    it("todos os 5 slides renderizam sem erro e com o título", () => {
      expect(htmls).toHaveLength(5)
      htmls.forEach((h, i) => {
        expect(textoVisivel(h), `slide ${i}`).toContain(SLIDES_SALVOS[i].title.slice(0, 18))
      })
    })

    it("os blocos livres salvos aparecem no slide 2", () => {
      const $ = abrir(htmls[1])
      expect($('[data-edit="block"][data-edit-key="b-seta"]').length).toBe(1)
      expect($('[data-edit="block"][data-edit-key="b-marca"]').length).toBe(1)
      expect(textoVisivel(htmls[1])).toContain("continua →")
      expect(textoVisivel(htmls[1])).toContain("@clinicavida")
    })

    it("o slide 3 traz pelo menos a foto principal (colagem de 3 fotos)", () => {
      expect(abrir(htmls[2])("img").length).toBeGreaterThanOrEqual(1)
    })

    it("o fundo escolhido pelo usuário aparece nos slides com bg", () => {
      expect(htmls[4].toLowerCase()).toContain("#0a0a0f")
      // Degradê: o `from` vira a cor de base no HTML estático.
      expect(htmls[1].toLowerCase()).toContain("#faf8f5")
    })

    it("nenhum slide sai com lixo no HTML", () => {
      for (const h of htmls) {
        expect(h).not.toContain("undefined")
        expect(h).not.toContain("NaN")
        expect(h).not.toContain("[object Object]")
      }
    })
  })

  it("o mesmo carrossel abre em stories", () => {
    const htmls = renderSalvo({ ...CARROSSEL_SALVO, format: "stories" }, "wesley")
    for (const h of htmls) expect(h).toContain("aspect-[9/16]")
  })

  it("carrossel salvo SEM os campos opcionais (peça antiga) também abre", () => {
    const antigo: CarouselV2Data = {
      _kind: "carousel-v2",
      slides: SLIDES_SALVOS.map((s) => ({
        order_index: s.order_index,
        title: s.title,
        highlight_words: s.highlight_words,
        subtitle: s.subtitle,
        body: s.body,
        cta_badge: s.cta_badge,
        image: { url: s.image.url, source: s.image.source, attribution: null, error: null },
      })),
      title: "Antigo",
      caption: "",
      brandName: "",
      handle: "",
      colors: [],
      template: "editorial",
      editorialStyle: "auto",
      format: "feed",
    }
    for (const estilo of ESTILOS_ORIGINAIS) {
      const htmls = renderSalvo(antigo, estilo)
      expect(htmls).toHaveLength(5)
      for (const h of htmls) expect(h).not.toContain("undefined")
    }
  })
})
