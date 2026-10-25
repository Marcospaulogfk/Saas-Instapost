"use client"

// ============================================================================
// Estilo GEOMÉTRICO — construtora/indústria/clínica (ref.: grade "CANLAR").
// Fundo branco com formas geométricas na cor da marca (faixa inclinada,
// círculo parcial, bloco "L"), o nome da marca GIGANTE e apagado atravessando
// o slide, nome da marca pequeno com tracking largo centralizado no topo,
// título preto com uma palavra na cor da marca, foto ocupando ~45% com um
// bloco sólido da cor da marca deslocado atrás (sombra chapada) e rodapé com
// a marca numa pílula preta.
//
//   capa      → título + subtítulo em cima, foto grande embaixo
//   conteúdo  → título + corpo em cima, foto embaixo (formas alternam)
//   meio      → fundo preto, foto em cima, título branco centralizado
//   último    → título + corpo + botão com a chamada (tag) + @, foto embaixo
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
import { GhostWord, PhotoBox, TinyLabel, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

const GEO_LIGHT_BG = "#FFFFFF"
const GEO_DARK_BG = "#0A0A0A"

/** "#RRGGBB" / "#RGB" → "rgba(r,g,b,a)". Cor inválida cai num cinza neutro. */
function rgba(hex: string, alpha: number): string {
  const m = (hex || "").replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  const n = parseInt(full, 16)
  if (Number.isNaN(n) || full.length !== 6) return `rgba(128,128,128,${alpha})`
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Paleta: padrão claro (ou escuro no slide do meio) ou derivada do override. */
function palette(bgOverride: string | undefined, darkDefault: boolean) {
  const th = splitTheme(bgOverride)
  const isDark = th ? th.isDark : darkDefault
  return {
    bg: th?.bg ?? (darkDefault ? GEO_DARK_BG : GEO_LIGHT_BG),
    isDark,
    text: th?.text ?? (darkDefault ? "#FFFFFF" : "#0A0A0A"),
    muted: th?.muted ?? (darkDefault ? "rgba(255,255,255,0.82)" : "rgba(10,10,10,0.72)"),
    faint: th?.faint ?? (darkDefault ? "rgba(255,255,255,0.55)" : "rgba(10,10,10,0.5)"),
  }
}

/**
 * Degrau do título (4 classes, da maior pra menor): comprimento total
 * (titleSizeFor) + palavra mais longa, pra uma palavra de 12+ letras não
 * estourar a largura do slide (o FitText só encolhe por número de linhas).
 */
function geoTitleClass(title: string, ladder: [string, string, string, string]): string {
  let idx = Number(titleSizeFor(title, "0", "1", "2"))
  const longest = Math.max(0, ...(title ?? "").split(/\s+/).map((w) => w.length))
  if (longest >= 15) idx = Math.max(idx, 3)
  else if (longest >= 12) idx = Math.max(idx, 2)
  else if (longest >= 10) idx = Math.max(idx, 1)
  return ladder[idx]
}

/** Nome da marca pra etiqueta/ghost: brand_label, senão o @ sem arroba. */
function brandName(brand: string | undefined, handle: string | undefined): string {
  const b = (brand ?? "").trim()
  if (b) return b
  return handleVisivel(handle).replace(/^@/, "")
}

type ShapeVariant = "cover" | "band" | "corner" | "dark"

/**
 * Formas decorativas na cor da marca, atrás de tudo (sem data-edit).
 * REGRA: forma SÓLIDA nunca fica atrás da zona do título — a palavra
 * destacada é da mesma cor e sumiria. Sólidas ficam atrás da FOTO e nas
 * bordas; perto do título só anel fino ou risquinho.
 *   cover/band/corner → texto em cima, foto embaixo (sólidas na metade de baixo)
 *   dark              → foto em cima, texto embaixo (sólidas na metade de cima)
 */
function Shapes({ accent, variant }: { accent: string; variant: ShapeVariant }) {
  const base = "absolute pointer-events-none"
  const solid = { backgroundColor: accent }
  if (variant === "cover") {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* círculo grande saindo pela direita, atrás da foto */}
        <div className={`${base} -right-24 top-[48%] w-64 h-64 rounded-full`} style={solid} />
        {/* faixa inclinada atravessando atrás da foto */}
        <div className={`${base} -left-16 bottom-[20%] w-[80%] h-9 rotate-12`} style={solid} />
        {/* risquinhos nos cantos de cima (longe do título) */}
        <div className={`${base} left-0 top-0 w-14 h-1.5`} style={solid} />
        <div className={`${base} right-0 top-0 w-1.5 h-14`} style={solid} />
      </div>
    )
  }
  if (variant === "band") {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* faixa larga inclinada atravessando atrás da foto */}
        <div className={`${base} -left-20 bottom-[16%] w-[150%] h-12 rotate-[-12deg]`} style={solid} />
        {/* anel fino saindo pelo canto superior direito */}
        <div
          className={`${base} -top-20 -right-20 w-40 h-40 rounded-full`}
          style={{ border: `10px solid ${accent}` }}
        />
        <div className={`${base} left-0 top-0 w-14 h-1.5`} style={solid} />
      </div>
    )
  }
  if (variant === "corner") {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* bloco "L" no canto inferior esquerdo (na calha, atrás da foto) */}
        <div className={`${base} left-0 bottom-0 w-5 h-48`} style={solid} />
        <div className={`${base} left-0 bottom-0 w-40 h-4`} style={solid} />
        {/* círculo cheio saindo pela direita, na altura da foto */}
        <div className={`${base} -right-24 top-[50%] w-56 h-56 rounded-full`} style={solid} />
        <div className={`${base} right-0 top-0 w-1.5 h-14`} style={solid} />
      </div>
    )
  }
  // dark: foto em cima → sólidas na metade de cima, título embaixo fica limpo
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`${base} -top-24 -right-24 w-48 h-48 rounded-full`} style={solid} />
      <div className={`${base} -left-16 top-[40%] w-[120%] h-10 rotate-[-12deg]`} style={solid} />
      <div className={`${base} left-0 top-0 w-14 h-1.5`} style={solid} />
      <div className={`${base} right-0 bottom-0 w-24 h-1.5`} style={solid} />
    </div>
  )
}

/** Nome gigante e apagado da marca atravessando o slide. */
function Ghost({
  text,
  accent,
  fontClass,
  isDark,
  bottom = "36%",
}: {
  text: string
  accent: string
  fontClass: string
  isDark: boolean
  bottom?: string
}) {
  return (
    <GhostWord
      text={text}
      className={`${fontClass} uppercase`}
      color={rgba(accent, isDark ? 0.16 : 0.1)}
      style={{ fontSize: "6.5rem", left: "-0.35rem", bottom, letterSpacing: "-0.05em" }}
    />
  )
}

/** Foto com bloco sólido da cor da marca deslocado atrás (sombra chapada). */
function ShadowPhoto({
  image,
  accent,
}: {
  image: SplitSlideData["images"][number] | CoverSlideData["image"] | undefined
  accent: string
}) {
  return (
    <div className="relative h-full w-full pr-[10px] pb-[10px]">
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[10px] translate-y-[10px] pointer-events-none"
        style={{ backgroundColor: accent }}
      />
      <PhotoBox image={image} className="relative h-full w-full" />
    </div>
  )
}

/** Rodapé: categoria (tag) | marca na pílula preta | @ */
function Footer({
  brand,
  handle,
  category,
  isDark,
  faint,
}: {
  brand: string
  handle: string
  category?: string
  isDark: boolean
  faint: string
}) {
  return (
    <div className="relative z-10 flex-shrink-0 pt-3 grid grid-cols-3 items-center">
      <div className="justify-self-start">
        {category ? (
          <Pill variant={isDark ? "light" : "dark"} className="!px-2.5 !py-1 !text-[9px] uppercase tracking-[0.12em]">
            {category}
          </Pill>
        ) : (
          <span />
        )}
      </div>
      <div className="justify-self-center">
        {brand ? (
          <span
            data-edit="meta"
            className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap"
            style={{
              backgroundColor: isDark ? "#FFFFFF" : "#0A0A0A",
              color: isDark ? "#0A0A0A" : "#FFFFFF",
            }}
          >
            {brand}
          </span>
        ) : (
          <span />
        )}
      </div>
      <div className="justify-self-end">
        <TinyLabel color={faint} className="normal-case tracking-[0.05em]">
          {handle}
        </TinyLabel>
      </div>
    </div>
  )
}

/** Etiqueta do topo: nome da marca centralizado com tracking largo. */
function TopLabel({ brand, color }: { brand: string; color: string }) {
  return (
    <div className="relative z-10 flex-shrink-0 flex justify-center pt-5">
      <TinyLabel color={color} className="tracking-[0.38em]">
        {brand}
      </TinyLabel>
    </div>
  )
}

// ============================================================================
// CAPA
// ============================================================================
function GeoCover({
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
  const p = palette(bgOverride, false)
  const brand = brandName(slide.brand_label, slide.handle)
  const handle = handleVisivel(slide.handle)
  const sizeClass = geoTitleClass(slide.title, ["text-[2.5rem]", "text-[2.1rem]", "text-[1.75rem]", "text-[1.5rem]"])

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col px-6 pb-5"
      style={{ backgroundColor: p.bg }}
    >
      <Shapes accent={accent} variant="cover" />
      <Ghost text={brand} accent={accent} fontClass={fontClass} isDark={p.isDark} bottom="30%" />

      <TopLabel brand={brand} color={p.faint} />

      {/* Título + subtítulo (zona sólida) */}
      <div className="relative z-10 flex-shrink-0 pt-6 space-y-3">
        <FitText
          className={`${sizeClass} tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1.02, color: p.text }}
          maxLines={3}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>
        {slide.subtitle && (
          <p
            className="text-[12px] leading-[1.45] max-w-[90%] line-clamp-2"
            style={{ color: p.muted }}
          >
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* Foto (água) com a sombra chapada da cor da marca */}
      <div className="relative z-10 flex-1 min-h-0 mt-5">
        <ShadowPhoto image={slide.image} accent={accent} />
      </div>

      <Footer brand={brand} handle={handle} category={slide.category} isDark={p.isDark} faint={p.faint} />

      <Attribution attribution={slide.image.attribution} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// CONTEÚDO — título + corpo em cima, foto embaixo; formas alternam por slide
// ============================================================================
function GeoContent({
  slide,
  accent,
  fontClass,
  bgOverride,
  orderIndex,
}: {
  slide: SplitSlideData
  accent: string
  fontClass: string
  bgOverride?: string
  orderIndex: number
}) {
  const p = palette(bgOverride, false)
  const brand = brandName(slide.brand_label, slide.handle)
  const handle = handleVisivel(slide.handle)
  const image = slide.images[0]
  const sizeClass = geoTitleClass(slide.title, ["text-[2.1rem]", "text-[1.8rem]", "text-[1.5rem]", "text-[1.3rem]"])

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col px-6 pb-5"
      style={{ backgroundColor: p.bg }}
    >
      {/* ímpar = "L" + círculo; par = faixa + anel (alterna slide a slide) */}
      <Shapes accent={accent} variant={orderIndex % 2 === 1 ? "corner" : "band"} />
      <Ghost text={brand} accent={accent} fontClass={fontClass} isDark={p.isDark} />

      <TopLabel brand={brand} color={p.faint} />

      {/* ZONA DE TEXTO — escala pra caber acima da foto fixa */}
      <ShrinkToFit className="relative z-10 flex-1" innerClassName="pt-5">
        <FitText
          className={`${sizeClass} tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1.02, color: p.text }}
          maxLines={3}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>
        {slide.body && (
          <p
            className="mt-3 text-[12.5px] leading-[1.45] whitespace-pre-line line-clamp-5"
            style={{ color: p.muted }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </ShrinkToFit>

      {/* ZONA DE IMAGEM — tamanho fixo (~45%) com sombra chapada */}
      <div className="relative z-10 flex-[0_0_45%] min-h-0 mt-4">
        <ShadowPhoto image={image} accent={accent} />
      </div>

      <Footer brand={brand} handle={handle} category={slide.category} isDark={p.isDark} faint={p.faint} />

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// MEIO — fundo preto, foto em cima, título branco centralizado
// ============================================================================
function GeoMidBreak({
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
  const p = palette(bgOverride, true)
  const brand = brandName(slide.brand_label, slide.handle)
  const handle = handleVisivel(slide.handle)
  const image = slide.images[0]
  const sizeClass = geoTitleClass(slide.title, ["text-[2.3rem]", "text-[1.95rem]", "text-[1.6rem]", "text-[1.4rem]"])

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col px-6 pb-5"
      style={{ backgroundColor: p.bg }}
    >
      <Shapes accent={accent} variant="dark" />
      <Ghost text={brand} accent={accent} fontClass={fontClass} isDark={p.isDark} bottom="44%" />

      <TopLabel brand={brand} color={p.faint} />

      {/* Foto em cima (tamanho fixo) */}
      <div className="relative z-10 flex-[0_0_40%] min-h-0 mt-5 mx-4">
        <ShadowPhoto image={image} accent={accent} />
      </div>

      {/* Título + corpo centralizados (escala pra caber) */}
      <ShrinkToFit className="relative z-10 flex-1" innerClassName="pt-5 text-center">
        <FitText
          className={`${sizeClass} tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1.02, color: p.text }}
          maxLines={3}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>
        {slide.body && (
          <p
            className="mt-3 text-[12.5px] leading-[1.45] whitespace-pre-line line-clamp-4 mx-auto max-w-[92%]"
            style={{ color: p.muted }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </ShrinkToFit>

      <Footer brand={brand} handle={handle} category={slide.category} isDark={p.isDark} faint={p.faint} />

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// ÚLTIMO — título + corpo + botão com a chamada (tag) + @, foto embaixo
// ============================================================================
function GeoLast({
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
  const p = palette(bgOverride, false)
  const brand = brandName(slide.brand_label, slide.handle)
  const handle = handleVisivel(slide.handle)
  const image = slide.images[0]
  const sizeClass = geoTitleClass(slide.title, ["text-[2.1rem]", "text-[1.8rem]", "text-[1.5rem]", "text-[1.3rem]"])
  const btnText = isLightColor(accent) ? "#0A0A0A" : "#FFFFFF"

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col px-6 pb-5"
      style={{ backgroundColor: p.bg }}
    >
      <Shapes accent={accent} variant="band" />
      <Ghost text={brand} accent={accent} fontClass={fontClass} isDark={p.isDark} bottom="28%" />

      <TopLabel brand={brand} color={p.faint} />

      <ShrinkToFit className="relative z-10 flex-1" innerClassName="pt-5">
        <FitText
          className={`${sizeClass} tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1.02, color: p.text }}
          maxLines={3}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>
        {slide.body && (
          <p
            className="mt-3 text-[12.5px] leading-[1.45] whitespace-pre-line line-clamp-4"
            style={{ color: p.muted }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
        {/* Chamada pra ação: a tag vira botão na cor da marca + @ ao lado */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {slide.category && (
            <span
              data-edit="badge"
              className="inline-flex items-center px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ backgroundColor: accent, color: btnText }}
            >
              {slide.category}
            </span>
          )}
          <TinyLabel color={p.faint} className="normal-case tracking-[0.05em] text-[10px]">
            {handle}
          </TinyLabel>
        </div>
      </ShrinkToFit>

      <div className="relative z-10 flex-[0_0_36%] min-h-0 mt-4">
        <ShadowPhoto image={image} accent={accent} />
      </div>

      <Footer brand={brand} handle={handle} isDark={p.isDark} faint={p.faint} />

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ============================================================================
// Router do estilo
// ============================================================================
export const geometricoStyle: StyleRenderer = {
  render(ctx: StyleRouteContext) {
    const common = { fontClass: ctx.fontClass, bgOverride: ctx.bgOverride }
    if (ctx.isCover) {
      return <GeoCover slide={ctx.coverData} accent={ctx.accentForBg(ctx.accentOnLight)} {...common} />
    }
    if (ctx.isLast) {
      return <GeoLast slide={ctx.splitData} accent={ctx.accentForBg(ctx.accentOnLight)} {...common} />
    }
    if (ctx.isMidBreak) {
      // Slide do meio é preto por padrão: accent validado sobre escuro.
      return <GeoMidBreak slide={ctx.splitData} accent={ctx.accentForBg(ctx.accentOnDark)} {...common} />
    }
    return (
      <GeoContent
        slide={ctx.splitData}
        accent={ctx.accentForBg(ctx.accentOnLight)}
        orderIndex={ctx.orderIndex}
        {...common}
      />
    )
  },
}
