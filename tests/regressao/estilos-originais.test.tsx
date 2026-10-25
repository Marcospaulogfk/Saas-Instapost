// SNAPSHOT dos 10 estilos que JÁ FUNCIONAM. Grava o HTML exato de cada slide
// e, nas próximas rodadas, compara. Qualquer mudança no HTML (classe, cor,
// ordem de elementos, texto) faz o teste falhar e mostrar o diff.
//
// Mudou de propósito? `npx vitest run -u` regrava. Mudou sem querer? Conserte
// o código, não o snapshot. (ver tests/README.md)
//
// Os 8 estilos novos (lookbook, cinema, estudio, colagem, cartaz, agencia,
// poster, geometrico) NÃO entram aqui: estão sendo desenhados e mudariam o
// snapshot toda hora. Eles são cobertos pelo contrato (estilos-contrato).
//
// Nota: `el` (mover/escalar/cor por elemento) e `bgGradient` são aplicados num
// layout effect no navegador — no HTML estático só entra o que o layout
// renderiza (o `from` do degradê vira a cor de base). O snapshot deles prova
// que esses campos não quebram o render e que a base sai certa.
import { describe, it, expect } from "vitest"
import type { PreviewSlide } from "@/components/carousel/slide-preview"
import type { SlideBlock } from "@/components/carousel/slide-blocks"
import {
  ESTILOS_ORIGINAIS,
  FOTO_B,
  carrosselPadrao,
  formatarParaSnapshot,
  renderSlide,
  semImagem,
  type OpcoesRender,
} from "./helpers"

const BLOCOS_FIXOS: SlideBlock[] = [
  {
    id: "blk-titulo",
    type: "heading",
    x: 50,
    y: 60,
    w: 320,
    h: 80,
    z: 1,
    text: "Título solto",
    color: "#FFFFFF",
    size: 30,
    weight: 800,
    align: "center",
    lineHeight: 1.1,
  },
  {
    id: "blk-tag",
    type: "pill",
    x: 155,
    y: 400,
    w: 110,
    h: 30,
    z: 2,
    text: "Nova tag",
    variant: "accent",
    color: "#1668E3",
  },
  {
    id: "blk-forma",
    type: "shape",
    x: 20,
    y: 20,
    w: 60,
    h: 60,
    z: 0,
    shape: "circle",
    fill: "#1668E3",
    opacity: 0.9,
  },
  {
    id: "blk-marca",
    type: "brand",
    x: 100,
    y: 460,
    w: 220,
    h: 44,
    z: 3,
    name: "Nexus Content",
    handle: "@nexus",
    color: "#FFFFFF",
    showAvatar: true,
    verified: true,
  },
]

describe.each(ESTILOS_ORIGINAIS)("estilo %s — HTML dos slides não muda", (estilo) => {
  const slides = carrosselPadrao()
  const total = slides.length
  const snap = (slide: PreviewSlide, extra: Partial<OpcoesRender> = {}) =>
    formatarParaSnapshot(renderSlide(slide, total, { ...extra, estilo }))

  it("capa", () => {
    expect(snap(slides[0])).toMatchSnapshot()
  })

  it("conteúdo com corpo", () => {
    expect(snap(slides[1])).toMatchSnapshot()
  })

  it("conteúdo com 2 fotos extras (slide do meio)", () => {
    expect(snap(slides[2])).toMatchSnapshot()
  })

  it("conteúdo comum", () => {
    expect(snap(slides[3])).toMatchSnapshot()
  })

  it("último slide com chamada", () => {
    expect(snap(slides[4])).toMatchSnapshot()
  })

  it("capa em formato stories", () => {
    expect(snap(slides[0], { format: "stories" })).toMatchSnapshot()
  })

  it("conteúdo sem foto", () => {
    expect(snap({ ...slides[1], image: semImagem })).toMatchSnapshot()
  })

  it("conteúdo com fundo claro (#FAF8F5)", () => {
    expect(snap({ ...slides[1], bg: "#FAF8F5" })).toMatchSnapshot()
  })

  it("conteúdo com fundo escuro (#0A0A0F)", () => {
    expect(snap({ ...slides[1], bg: "#0A0A0F" })).toMatchSnapshot()
  })

  it("conteúdo com degradê de fundo", () => {
    expect(
      snap({ ...slides[3], bgGradient: { from: "#1668E3", to: "#0A0A0F", angle: 135 } }),
    ).toMatchSnapshot()
  })

  it("conteúdo com ajustes por elemento (el) e foto reenquadrada", () => {
    expect(
      snap({
        ...slides[1],
        el: {
          "title-0": { dx: 12, dy: -8, scale: 1.1, color: "#FF5500" },
          "text-0": { dy: 6 },
          "badge-0": { text: "Trocado", bg: "#222222" },
          "meta-0": { hidden: true },
        },
        image: { ...slides[1].image, posX: 30, posY: 70, zoom: 120 },
      }),
    ).toMatchSnapshot()
  })

  it("último slide com blocos livres", () => {
    expect(snap({ ...slides[4], blocks: BLOCOS_FIXOS })).toMatchSnapshot()
  })

  it("conteúdo com colagem de 3 fotos e destaque colorido", () => {
    expect(
      snap({
        ...slides[3],
        highlight_styles: { horário: { color: "#FF5500", bg: "#FFF3E0" } },
        image: { ...slides[3].image, collage: [FOTO_B, FOTO_B, FOTO_B], collageLayout: "3" },
      }),
    ).toMatchSnapshot()
  })
})
