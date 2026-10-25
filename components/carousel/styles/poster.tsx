"use client"

// ============================================================================
// Estilo PÔSTER — cartaz de escola/curso/comunidade (ref.: grade da escola de
// atuação). Fundo marrom quase preto, título em CAIXA ALTA enorme na cor da
// marca com as palavras de destaque em branco, @ miúdo no topo, foto num
// card tipo polaroid girado, post-it na cor da marca e, no fechamento, um
// cartão branco com o corpo como depoimento + a tag em pílula.
//
//   capa      → foto de fundo com véu escuro, @ no topo, título embaixo
//   conteúdo  → fundo sólido, título + corpo, polaroid girada + post-it
//   meio      → foto de fundo com véu forte e título centralizado (respiro)
//   último    → cartão branco de depoimento + tag em pílula
// ============================================================================
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import { isLightColor } from "@/lib/color-contrast"
import {
  Attribution,
  FitText,
  HighlightedText,
  Pill,
  ShrinkToFit,
  parseBoldInline,
  splitTheme,
} from "../editorial-shared"
import type { CoverSlideData } from "../editorial-covers"
import type { SplitSlideData } from "../editorial-splits"
import { PhotoBox, TinyLabel, shapeAttrs, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

/** Fundo padrão do Pôster: marrom bem escuro (não é preto chapado). */
const POSTER_BG = "#1A1410"

/** "#RRGGBB" / "#RGB" → "rgba(r,g,b,a)". Cor inválida cai num escuro neutro. */
function rgba(hex: string, alpha: number): string {
  const m = (hex || "").replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  const n = parseInt(full, 16)
  if (Number.isNaN(n) || full.length !== 6) return `rgba(26,20,16,${alpha})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Paleta do slide: padrão escuro do estilo ou derivada do fundo escolhido. */
function palette(bgOverride: string | undefined) {
  const th = splitTheme(bgOverride)
  return {
    bg: th?.bg ?? POSTER_BG,
    isDark: th ? th.isDark : true,
    text: th?.text ?? "#FFFFFF",
    muted: th?.muted ?? "rgba(255,255,255,0.82)",
    faint: th?.faint ?? "rgba(255,255,255,0.55)",
  }
}

/** Classe do título: caixa alta, apertado, pesado — o "cartaz" do estilo. */
const TITLE_CLASS = "uppercase tracking-[-0.03em]"

/**
 * Degrau do título (4 classes, da maior pra menor). Além do comprimento total
 * (titleSizeFor), olha a PALAVRA mais longa: em caixa alta pesada, uma palavra
 * de 12+ letras não cabe na largura do slide e o FitText não encolhe por
 * largura — então já parte de um degrau menor pra nunca estourar o slide.
 */
function posterTitleClass(title: string, ladder: [string, string, string, string]): string {
  const byLength = titleSizeFor(title, "0", "1", "2")
  let idx = Number(byLength)
  const longest = Math.max(0, ...(title ?? "").split(/\s+/).map((w) => w.length))
  if (longest >= 12) idx = Math.max(idx, 3)
  else if (longest >= 10) idx = Math.max(idx, 2)
  else if (longest >= 8) idx = Math.max(idx, 1)
  return ladder[idx]
}

// ============================================================================
// CAPA — foto de fundo com véu escuro, @ no topo, título gigante embaixo
// ============================================================================
function PosterCover({
  slide,
  accent,
  fontClass,
  bgOverride,
}: {
  slide: CoverSlideData
  accent: string
  fontClass: string
  bgOverride?: string
}) {
  const p = palette(bgOverride)
  const handle = handleVisivel(slide.handle)
  const veil = `linear-gradient(to top, ${rgba(p.bg, 0.96)} 0%, ${rgba(p.bg, 0.55)} 55%, ${rgba(p.bg, 0.2)} 100%)`
  const sizeClass = posterTitleClass(slide.title, ["text-[3.1rem]", "text-[2.6rem]", "text-[2.15rem]", "text-[1.8rem]"])

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg }}
    >
      {/* Foto de fundo (ou placeholder) com véu escuro subindo do rodapé.
          Wrapper absoluto próprio: o PhotoBox é `relative` por dentro. */}
      <div className="absolute inset-0">
        <PhotoBox image={slide.image} className="h-full w-full" overlay={veil} />
      </div>

      {/* Topo: @ da marca e categoria, miúdos em caixa alta */}
      <div className="relative z-10 flex-shrink-0 px-6 pt-5 flex items-center justify-between">
        <TinyLabel color={p.muted} className="tracking-[0.25em]">
          {handle}
        </TinyLabel>
        <TinyLabel color={p.faint}>{slide.category}</TinyLabel>
      </div>

      {/* Respiro: a foto aparece aqui */}
      <div className="flex-1 min-h-0" />

      {/* Título + subtítulo ancorados embaixo (zona sólida) */}
      <div className="relative z-10 flex-shrink-0 px-6 pb-7 space-y-3">
        <div {...shapeAttrs()} className="h-1 w-10" style={{ backgroundColor: accent }} aria-hidden />
        <FitText
          className={`${sizeClass} ${TITLE_CLASS} ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: accent }}
          maxLines={5}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={p.text}
          />
        </FitText>
        {slide.subtitle && (
          <p
            className="text-[11px] uppercase tracking-[0.08em] font-semibold leading-[1.35] max-w-[88%] line-clamp-3"
            style={{ color: p.muted }}
          >
            {slide.subtitle}
          </p>
        )}
      </div>

      <Attribution attribution={slide.image.attribution} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// CONTEÚDO — fundo sólido, título + corpo, polaroid girada e post-it accent
// ============================================================================
function PosterContent({
  slide,
  accent,
  fontClass,
  bgOverride,
}: {
  slide: SplitSlideData
  accent: string
  fontClass: string
  bgOverride?: string
}) {
  const p = palette(bgOverride)
  const handle = handleVisivel(slide.handle)
  const image = slide.images[0]
  const sizeClass = posterTitleClass(slide.title, ["text-[2.8rem]", "text-[2.35rem]", "text-[1.9rem]", "text-[1.6rem]"])
  // Post-it na cor da marca: texto preto se a cor for clara, branco se escura.
  const postItText = isLightColor(accent) ? "#1A1410" : "#FFFFFF"

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-6"
      style={{ backgroundColor: p.bg }}
    >
      {/* Topo: @ e categoria */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <TinyLabel color={p.muted} className="tracking-[0.25em]">
          {handle}
        </TinyLabel>
        <TinyLabel color={p.faint}>{slide.category}</TinyLabel>
      </div>

      {/* ZONA DE TEXTO — escala pra caber acima da foto (nunca corta/sobrepõe) */}
      <ShrinkToFit className="flex-1" innerClassName="pt-5">
        <FitText
          className={`${sizeClass} ${TITLE_CLASS} ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: accent }}
          maxLines={4}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={p.text}
          />
        </FitText>
        {slide.body && (
          <p
            className="mt-4 text-[14px] leading-[1.45] whitespace-pre-line line-clamp-5"
            style={{ color: p.muted }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </ShrinkToFit>

      {/* ZONA DE IMAGEM — tamanho fixo: polaroid girada + post-it por cima */}
      <div className="relative flex-[0_0_40%] min-h-0 mt-4">
        <div
          className="absolute inset-x-3 inset-y-2 rotate-[-2deg] p-1.5 rounded-[3px]"
          style={{
            backgroundColor: "#F4EFE6",
            boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
          }}
        >
          <PhotoBox image={image} className="h-full w-full" rounded="rounded-[2px]" />
        </div>
        {slide.subtitle && (
          <div
            {...shapeAttrs()}
            className="absolute -bottom-1 -right-1 w-[54%] rotate-[2deg] px-3 py-2.5 rounded-[2px]"
            style={{
              backgroundColor: accent,
              boxShadow: "0 10px 22px rgba(0,0,0,0.4)",
            }}
          >
            <p
              className="text-[10.5px] leading-[1.3] font-medium line-clamp-4"
              style={{ color: postItText }}
            >
              {slide.subtitle}
            </p>
          </div>
        )}
      </div>

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// MEIO — foto de fundo com véu forte e título centralizado (quebra de ritmo)
// ============================================================================
function PosterMidBreak({
  slide,
  accent,
  fontClass,
  bgOverride,
}: {
  slide: SplitSlideData
  accent: string
  fontClass: string
  bgOverride?: string
}) {
  const p = palette(bgOverride)
  const handle = handleVisivel(slide.handle)
  const image = slide.images[0]
  const veil = `linear-gradient(to bottom, ${rgba(p.bg, 0.55)} 0%, ${rgba(p.bg, 0.88)} 45%, ${rgba(p.bg, 0.97)} 100%)`
  const sizeClass = posterTitleClass(slide.title, ["text-[3.3rem]", "text-[2.75rem]", "text-[2.25rem]", "text-[1.9rem]"])

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-6"
      style={{ backgroundColor: p.bg }}
    >
      <div className="absolute inset-0">
        <PhotoBox image={image} className="h-full w-full" overlay={veil} />
      </div>

      <div className="relative z-10 flex-shrink-0 flex items-center justify-between">
        <TinyLabel color={p.muted} className="tracking-[0.25em]">
          {handle}
        </TinyLabel>
        <TinyLabel color={p.faint}>{slide.category}</TinyLabel>
      </div>

      {/* Título centralizado no meio do slide + corpo logo abaixo */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center text-center">
        <FitText
          className={`${sizeClass} ${TITLE_CLASS} ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: accent }}
          maxLines={5}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={p.text}
          />
        </FitText>
        {slide.body && (
          <p
            className="mt-5 text-[13.5px] leading-[1.45] whitespace-pre-line line-clamp-5 mx-auto max-w-[92%]"
            style={{ color: p.muted }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <div className="relative z-10 flex-shrink-0 flex justify-center pt-3">
        <TinyLabel color={p.faint} className="tracking-[0.25em]">
          {handle}
        </TinyLabel>
      </div>

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// ÚLTIMO — cartão branco com o corpo como depoimento + tag em pílula
// ============================================================================
function PosterLast({
  slide,
  accent,
  fontClass,
  bgOverride,
}: {
  slide: SplitSlideData
  accent: string
  fontClass: string
  bgOverride?: string
}) {
  const p = palette(bgOverride)
  const handle = handleVisivel(slide.handle)
  const image = slide.images[0]
  const sizeClass = posterTitleClass(slide.title, ["text-[2.3rem]", "text-[1.95rem]", "text-[1.65rem]", "text-[1.4rem]"])

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-6"
      style={{ backgroundColor: p.bg }}
    >
      <div className="flex-shrink-0 flex items-center justify-between">
        <TinyLabel color={p.muted} className="tracking-[0.25em]">
          {handle}
        </TinyLabel>
        <TinyLabel color={p.faint}>{slide.category}</TinyLabel>
      </div>

      {/* Título (zona sólida) */}
      <div className="flex-shrink-0 pt-5">
        <FitText
          className={`${sizeClass} ${TITLE_CLASS} ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: accent }}
          maxLines={3}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={p.text}
          />
        </FitText>
      </div>

      {/* ZONA DE IMAGEM (água) com o cartão de depoimento por cima, embaixo */}
      <div className="relative flex-1 min-h-0 mt-4">
        <div className="absolute inset-0">
          <PhotoBox
            image={image}
            className="h-full w-full"
            rounded="rounded-lg"
            overlay={`linear-gradient(to top, ${rgba(p.bg, 0.6)} 0%, transparent 55%)`}
          />
        </div>
        <div
          className="absolute left-0 right-8 bottom-1 rotate-[-1deg] rounded-md px-4 py-3.5"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 14px 30px rgba(0,0,0,0.45)" }}
        >
          {slide.body && (
            <p className="text-[11.5px] leading-[1.4] whitespace-pre-line line-clamp-6 text-black/85">
              {parseBoldInline(slide.body)}
            </p>
          )}
          {slide.category && (
            <div className={slide.body ? "mt-3" : ""}>
              <Pill variant="dark">{slide.category}</Pill>
            </div>
          )}
        </div>
      </div>

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// Router do estilo
// ============================================================================
export const posterStyle: StyleRenderer = {
  render(ctx: StyleRouteContext) {
    // Fundo padrão escuro: accent validado sobre escuro; com override, pelo
    // fundo escolhido.
    const accent = ctx.accentForBg(ctx.accentOnDark)
    const common = { accent, fontClass: ctx.fontClass, bgOverride: ctx.bgOverride }
    if (ctx.isCover) return <PosterCover slide={ctx.coverData} {...common} />
    if (ctx.isLast) return <PosterLast slide={ctx.splitData} {...common} />
    if (ctx.isMidBreak) return <PosterMidBreak slide={ctx.splitData} {...common} />
    return <PosterContent slide={ctx.splitData} {...common} />
  },
}
