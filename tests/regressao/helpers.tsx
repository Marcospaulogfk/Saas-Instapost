// Apoio dos testes de regressão do carrossel: dados fixos e render estático.
//
// Tudo aqui é DETERMINÍSTICO de propósito: mesma entrada → mesmo HTML. Por isso
// o rodapé vai sempre com footerLabel fixo (sem ele o layout usa o ano atual) e
// as fotos têm URLs fixas de exemplo.
import { renderToStaticMarkup } from "react-dom/server"
import { load as loadHtml } from "cheerio"
import {
  SlidePreview,
  type EditorialStyle,
  type PreviewSlide,
} from "@/components/carousel/slide-preview"

/** Estilos APROVADOS, com a "fotografia" do HTML guardada. Lista fixa: nunca
 *  derivar de CAROUSEL_STYLES (estilo em construção não entra aqui). */
export const ESTILOS_ORIGINAIS = [
  "auto",
  "wesley",
  "brandsdecoded",
  "bolo",
  "mypostflow",
  "gradient",
  "minimal",
  "seamless",
  "cards",
  "perfil",
  // Estilos novos de 24/10/2026, conferidos na prévia (/preview-estilos).
  "lookbook",
  "cinema",
  "estudio",
  "colagem",
  "cartaz",
  "agencia",
  "poster",
  "geometrico",
] as const satisfies readonly EditorialStyle[]

export type EstiloOriginal = (typeof ESTILOS_ORIGINAIS)[number]

export const CORES_MARCA = ["#1668E3", "#1A1A1A", "#FAF8F5"]
export const FOTO_A = "https://img.exemplo.test/foto-a.jpg"
export const FOTO_B = "https://img.exemplo.test/foto-b.jpg"
export const FOTO_C = "https://img.exemplo.test/foto-c.jpg"

export const semImagem: PreviewSlide["image"] = {
  url: null,
  source: null,
  attribution: null,
  error: null,
}

export function comImagem(url: string = FOTO_A): PreviewSlide["image"] {
  return { url, source: "unsplash", attribution: null, error: null }
}

/**
 * Carrossel de 5 slides com dados fixos:
 *   0 capa · 1 conteúdo com corpo · 2 conteúdo com 2 fotos extras ·
 *   3 slide do meio (quebra de ritmo) · 4 último com cta_badge.
 * Com 5 slides o "meio" é o índice 2 (Math.floor(5/2)), então o slide 2
 * acumula as duas coisas: fotos extras + quebra de ritmo. O 3 é um conteúdo
 * comum.
 */
export function carrosselPadrao(): PreviewSlide[] {
  return [
    {
      order_index: 0,
      title: "Como a Nexus triplicou o alcance em 30 dias",
      highlight_words: ["triplicou", "alcance"],
      subtitle: "O método que a gente usa todo dia",
      cta_badge: "Guia",
      image: comImagem(FOTO_A),
    },
    {
      order_index: 1,
      title: "Comece pelo problema do cliente",
      highlight_words: ["problema"],
      subtitle: "Não pelo seu produto",
      body: "Quem fala do próprio produto perde a atenção em 3 segundos. Quem fala da dor de quem lê ganha o próximo slide.",
      cta_badge: "Passo 1",
      image: comImagem(FOTO_A),
    },
    {
      order_index: 2,
      title: "Antes e depois: a mesma marca",
      highlight_words: ["depois"],
      subtitle: "Duas cenas, um resultado",
      body: "À esquerda o perfil antes do método. À direita, o mesmo perfil 30 dias depois com conteúdo que ensina.",
      cta_badge: "Comparação",
      image: comImagem(FOTO_A),
      extra_images: [
        { url: FOTO_B, source: "unsplash", attribution: null, error: null },
        { url: FOTO_C, source: "ai", attribution: null, error: null },
      ],
    },
    {
      order_index: 3,
      title: "Publique no horário em que eles param pra ler",
      highlight_words: ["horário"],
      subtitle: "Teste três faixas e meça",
      body: "Alcance não é só o que você diz, é quando. Troque de horário por uma semana e compare os números.",
      cta_badge: "Passo 2",
      image: comImagem(FOTO_B),
    },
    {
      order_index: 4,
      title: "Quer que a gente monte isso pra você?",
      highlight_words: ["monte"],
      subtitle: "Chame no direct",
      body: "Mande um oi que a gente devolve um plano de 30 dias pro seu perfil.",
      cta_badge: "Chame a Nexus",
      image: comImagem(FOTO_C),
    },
  ]
}

export interface OpcoesRender {
  estilo: EditorialStyle
  format?: "feed" | "stories"
  handle?: string
  brandLabel?: string
  footerLabel?: string
  fontClass?: string
  brandColors?: string[]
  titleWeight?: number
  titleScale?: number
  bodyWeight?: number
  bodyScale?: number
  showDots?: boolean
  showVerified?: boolean
  showFooter?: boolean
  handleAvatar?: string
  handleInitials?: string
}

/** Renderiza UM slide como HTML estático (sem navegador). */
export function renderSlide(
  slide: PreviewSlide,
  totalSlides: number,
  opts: OpcoesRender,
): string {
  return renderToStaticMarkup(
    <SlidePreview
      slide={slide}
      totalSlides={totalSlides}
      template="editorial"
      brandColors={opts.brandColors ?? CORES_MARCA}
      fontClass={opts.fontClass ?? "f"}
      showDevBadges={false}
      editorialStyle={opts.estilo}
      handle={opts.handle ?? "@nexus"}
      brandLabel={opts.brandLabel ?? "Nexus Content"}
      footerLabel={opts.footerLabel ?? "2026 //"}
      format={opts.format ?? "feed"}
      titleWeight={opts.titleWeight}
      titleScale={opts.titleScale}
      bodyWeight={opts.bodyWeight}
      bodyScale={opts.bodyScale}
      showDots={opts.showDots}
      showVerified={opts.showVerified}
      showFooter={opts.showFooter}
      handleAvatar={opts.handleAvatar}
      handleInitials={opts.handleInitials}
    />,
  )
}

/** Renderiza o carrossel inteiro: um HTML por slide. */
export function renderCarrossel(slides: PreviewSlide[], opts: OpcoesRender): string[] {
  return slides.map((s) => renderSlide(s, slides.length, opts))
}

/** Abre o HTML pra inspeção com cheerio. */
export function abrir(html: string) {
  return loadHtml(html)
}

/** Texto visível do HTML (sem tags), com espaços normalizados. */
export function textoVisivel(html: string): string {
  return abrir(html)("body").text().replace(/\s+/g, " ").trim()
}

/**
 * Formata o HTML pra snapshot: uma tag por linha. Assim um diff mostra SÓ a
 * linha que mudou, e não um bloco de 4 KB numa linha só.
 */
export function formatarParaSnapshot(html: string): string {
  return html.replace(/></g, ">\n<")
}
