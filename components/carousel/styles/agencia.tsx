"use client"

// ============================================================================
// Estilo AGÊNCIA — grade "Nexora": slides alternam fundo PRETO e CREME; no
// topo, logo (losango na cor da marca) + nome da marca à esquerda e etiquetas
// minúsculas à direita; título em caixa alta pesada com as palavras-chave na
// cor da marca; texto curto; foto "recortada" ocupando ~40% do slide (à
// direita/embaixo nos pretos, à esquerda/em cima nos cremes) com uma linha
// fina na cor da marca cruzando o slide; rodapé com frase curta à esquerda e
// seta arredondada na cor da marca à direita.
//
//   capa      → preta: título + subtítulo, foto recortada embaixo à direita
//   conteúdo  → ímpar = preto (foto embaixo), par = creme (foto em cima)
//   último    → preto: título + corpo, botão com o cta_badge na cor da marca
//               e arcos decorativos na cor da marca
//
// Cores: "limão" da referência = `accent` (cor da marca validada por
// contraste pro fundo de cada slide). Com `bgOverride` o root usa a cor do
// usuário e os textos derivam de splitTheme().
// ============================================================================
import type { ReactNode } from "react"
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import {
  Attribution,
  FitText,
  HighlightedText,
  ShrinkToFit,
  isCutoutActive,
  parseBoldInline,
  splitTheme,
} from "../editorial-shared"
import { ArrowCta, PhotoBox, TinyLabel, shapeAttrs, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

const BLACK = "#0B0B0B"
const CREAM = "#F3EFE8"

interface Palette {
  dark: boolean
  bg: string
  text: string
  muted: string
  faint: string
  accent: string
}

/** Paleta do slide pelo fundo padrão (preto/creme) ou pelo fundo do usuário. */
function paletteFor(ctx: StyleRouteContext, darkDefault: boolean): Palette {
  const th = splitTheme(ctx.bgOverride)
  const dark = th ? th.isDark : darkDefault
  return {
    dark,
    bg: th?.bg ?? (darkDefault ? BLACK : CREAM),
    text: th?.text ?? (darkDefault ? "#FFFFFF" : BLACK),
    muted: th?.muted ?? (darkDefault ? "rgba(255,255,255,0.78)" : "rgba(11,11,11,0.72)"),
    faint: th?.faint ?? (darkDefault ? "rgba(255,255,255,0.55)" : "rgba(11,11,11,0.5)"),
    accent: ctx.accentForBg(dark ? ctx.accentOnDark : ctx.accentOnLight),
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

// ---------------------------------------------------------------------------
// Peças locais
// ---------------------------------------------------------------------------

/** Topo: losango (logo) + marca à esquerda, etiquetas empilhadas à direita. */
function AgencyHeader({
  brand,
  tags,
  accent,
  color,
}: {
  brand: string
  tags: string[]
  accent: string
  color: string
}) {
  const list = tags.filter((t) => !!t)
  return (
    <div className="flex-shrink-0 px-6 pt-5 flex items-start justify-between gap-4 relative z-[2]">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block w-2 h-2 rotate-45 flex-shrink-0"
          style={{ backgroundColor: accent }}
        />
        <TinyLabel color={color}>{brand}</TinyLabel>
      </span>
      <div className="flex flex-col items-end gap-0.5 text-right">
        {list.map((t, i) => (
          <TinyLabel key={i} color={color}>
            {t}
          </TinyLabel>
        ))}
      </div>
    </div>
  )
}

/** Título em caixa alta pesada; palavras-chave na cor da marca. */
function AgencyTitle({
  text,
  words,
  color,
  accent,
  fontClass,
  size,
  maxLines = 4,
}: {
  text: string
  words: string[]
  color: string
  accent: string
  fontClass: string
  size: string
  maxLines?: number
}) {
  return (
    <FitText
      className={`${size} uppercase ${fontClass}`}
      style={{ fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.01em", color }}
      maxLines={maxLines}
    >
      <HighlightedText text={text} words={words} color={accent} />
    </FitText>
  )
}

function BodyText({
  body,
  color,
  className = "",
  clamp = "line-clamp-5",
}: {
  body?: string
  color: string
  className?: string
  /** line-clamp-4 nos slides com foto (corpo nunca abaixo de 13px). */
  clamp?: string
}) {
  if (!body) return null
  return (
    <p
      className={`mt-4 text-[13px] leading-[1.55] whitespace-pre-line ${clamp} ${className}`}
      style={{ color }}
    >
      {parseBoldInline(body)}
    </p>
  )
}

/** Linha fina na cor da marca cruzando o slide (decoração, atravessa a foto). */
function AccentLine({ color, top, angle }: { color: string; top: string; angle: number }) {
  return (
    <div
      {...shapeAttrs()}
      aria-hidden
      className="absolute left-[-20%] right-[-20%] h-px pointer-events-none z-[1]"
      style={{ top, backgroundColor: color, transform: `rotate(${angle}deg)`, opacity: 0.9 }}
    />
  )
}

/**
 * Zona da foto "recortada": a foto fica colada numa borda do slide (direita
 * ou esquerda) com um canto bem arredondado, e a linha fina atravessa.
 */
function CutoutPhoto({
  image,
  side,
  accent,
  className,
  cutout = false,
}: {
  image: StyleRouteContext["splitData"]["images"][number] | undefined
  side: "right" | "left"
  accent: string
  className: string
  /** Foto é PNG sem fundo: sem caixa arredondada, recorte solto (CutoutStage). */
  cutout?: boolean
}) {
  if (cutout) return <CutoutStage image={image} side={side} accent={accent} className={className} />
  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-y-0 overflow-hidden ${
          side === "right" ? "right-0 left-[24%] rounded-tl-[2.75rem]" : "left-0 right-[24%] rounded-br-[2.75rem]"
        }`}
      >
        <PhotoBox image={image} className="h-full w-full" />
      </div>
      <AccentLine color={accent} top={side === "right" ? "30%" : "68%"} angle={-9} />
    </div>
  )
}

/**
 * Foto RECORTADA (PNG sem fundo), como os objetos soltos da referência: sem a
 * caixa de canto arredondado. Camadas (todas abaixo do texto, que é z-[2]):
 * forma/linha da marca z-[1] atrás → recorte z-[1] por cima delas.
 *   right (slides pretos, foto embaixo) → recorte grande à direita, desce até
 *     a base do slide passando ATRÁS do rodapé; anel fino da marca atrás.
 *   left (slides creme, foto em cima, texto embaixo) → recorte à esquerda
 *     "saindo" de um bloco da cor da marca (canto arredondado da referência)
 *     que esconde o corte do busto no meio do slide.
 */
function CutoutStage({
  image,
  side,
  accent,
  className,
}: {
  image: StyleRouteContext["splitData"]["images"][number] | undefined
  side: "right" | "left"
  accent: string
  className: string
}) {
  if (side === "right") {
    return (
      <div className={`relative ${className}`}>
        <div
          {...shapeAttrs("border")}
          aria-hidden
          className="absolute left-[26%] w-[92%] aspect-square top-[4%] rounded-full pointer-events-none z-[1]"
          style={{ border: `2px solid ${accent}` }}
        />
        <AccentLine color={accent} top="30%" angle={-9} />
        <div className="absolute z-[1] left-[16%] -right-[6%] top-0 -bottom-16">
          <PhotoBox image={image} className="h-full w-full" />
        </div>
      </div>
    )
  }
  return (
    <div className={`relative ${className}`}>
      <AccentLine color={accent} top="40%" angle={-9} />
      <div className="absolute z-[1] -left-[6%] right-[26%] top-0 bottom-[10%]">
        <PhotoBox image={image} className="h-full w-full" />
      </div>
      <div
        {...shapeAttrs()}
        aria-hidden
        className="absolute left-0 right-[30%] bottom-0 h-[16%] rounded-tr-[2.75rem] pointer-events-none z-[1]"
        style={{ backgroundColor: accent }}
      />
    </div>
  )
}

/** Rodapé: frase curta (ou contador) à esquerda, seta arredondada à direita. */
function AgencyFooter({
  left,
  accent,
  dark,
}: {
  left: ReactNode
  accent: string
  dark: boolean
}) {
  return (
    <div className="flex-shrink-0 px-6 pt-3 pb-5 flex items-end justify-between gap-4 relative z-[2]">
      {left ?? <span />}
      <ArrowCta label="→" bg={accent} color={dark ? BLACK : "#FFFFFF"} className="flex-shrink-0" />
    </div>
  )
}

function FooterNote({ text, color }: { text?: string; color: string }) {
  if (!text) return <span />
  return (
    <p className="text-[10.5px] leading-[1.4] line-clamp-2 max-w-[66%]" style={{ color }}>
      {text}
    </p>
  )
}

function Counter({ text, color }: { text: string; color: string }) {
  return (
    <span
      data-edit="meta"
      className="text-[9px] uppercase tracking-[0.2em] font-semibold tabular-nums"
      style={{ color }}
    >
      {text}
    </span>
  )
}

/** Botão da chamada final (cta_badge) na cor da marca. */
function CtaButton({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span
      data-edit="badge"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em]"
      style={{ backgroundColor: bg, color }}
    >
      {children}
      <span aria-hidden>→</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// CAPA (preta)
// ---------------------------------------------------------------------------

function AgencyCover(ctx: StyleRouteContext) {
  const p = paletteFor(ctx, true)
  const d = ctx.coverData
  const handle = handleVisivel(d.handle)
  const brand = d.brand_label || handle
  const tags = [handle && handle !== brand ? handle : "", d.category || ""]
  const size = titleSizeFor(d.title, "text-[2.8rem]", "text-[2.4rem]", "text-[2rem]")
  const counter = `${pad2(ctx.orderIndex + 1)} / ${pad2(ctx.totalSlides)}`

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg }}
    >
      <AgencyHeader brand={brand} tags={tags} accent={p.accent} color={p.faint} />

      {/* ZONA DE TÍTULO — sólida */}
      <div className="flex-shrink-0 px-6 pt-6 relative z-[2]">
        <AgencyTitle
          text={d.title}
          words={d.highlight_words || []}
          color={p.text}
          accent={p.accent}
          fontClass={ctx.fontClass}
          size={size}
        />
        {d.subtitle && (
          <p
            className="mt-4 text-[12px] leading-[1.5] line-clamp-2 max-w-[70%]"
            style={{ color: p.muted }}
          >
            {d.subtitle}
          </p>
        )}
      </div>

      {/* ZONA DE FOTO — água, recortada à direita */}
      <CutoutPhoto
        image={d.image}
        side="right"
        accent={p.accent}
        className="flex-1 min-h-0 mt-4"
        cutout={isCutoutActive(ctx.slide.image)}
      />

      <AgencyFooter left={<Counter text={counter} color={p.faint} />} accent={p.accent} dark={p.dark} />

      <Attribution attribution={d.image.attribution} textColor={p.text} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CONTEÚDO (preto ímpar / creme par) e ÚLTIMO (preto com botão)
// ---------------------------------------------------------------------------

function AgencyContent(ctx: StyleRouteContext) {
  const s = ctx.splitData
  const darkDefault = ctx.isLast || ctx.orderIndex % 2 === 1
  const p = paletteFor(ctx, darkDefault)
  const handle = handleVisivel(s.handle)
  const brand = s.brand_label || handle
  const tags = [handle && handle !== brand ? handle : "", s.category || ""]
  const words = s.highlight_words || []
  const image = s.images[0]
  const counter = `${pad2(ctx.orderIndex + 1)} / ${pad2(ctx.totalSlides)}`
  const cutout = isCutoutActive(ctx.slide.image)

  // ----- último: fechamento com botão cta_badge -----
  if (ctx.isLast) {
    const size = titleSizeFor(s.title, "text-[3rem]", "text-[2.6rem]", "text-[2.2rem]")
    const cta = ctx.slide.cta_badge || s.category || "Vamos conversar"
    return (
      <div
        className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
        style={{ backgroundColor: p.bg }}
      >
        {/* arcos decorativos na cor da marca (canto inferior direito) */}
        <div
          {...shapeAttrs("border")}
          aria-hidden
          className="absolute -right-24 -bottom-28 w-72 h-72 rounded-full pointer-events-none"
          style={{ border: `2px solid ${p.accent}` }}
        />
        <div
          {...shapeAttrs("border")}
          aria-hidden
          className="absolute -right-32 -bottom-36 w-96 h-96 rounded-full pointer-events-none"
          style={{ border: `1px solid ${p.accent}`, opacity: 0.4 }}
        />

        <AgencyHeader brand={brand} tags={tags} accent={p.accent} color={p.faint} />

        <div className="flex-1 min-h-0 px-6 pt-6 flex flex-col justify-center relative z-[2]">
          <AgencyTitle
            text={s.title}
            words={words}
            color={p.text}
            accent={p.accent}
            fontClass={ctx.fontClass}
            size={size}
          />
          <BodyText body={s.body || s.subtitle} color={p.muted} className="max-w-[80%]" />
        </div>

        <div className="flex-shrink-0 px-6 pt-3 pb-5 flex items-end justify-between gap-4 relative z-[2]">
          <CtaButton bg={p.accent} color={p.dark ? BLACK : "#FFFFFF"}>
            {cta}
          </CtaButton>
          <Counter text={counter} color={p.faint} />
        </div>

        <Attribution attribution={image?.attribution || null} textColor={p.text} />
      </div>
    )
  }

  const size = titleSizeFor(s.title, "text-[2.4rem]", "text-[2.1rem]", "text-[1.8rem]")
  const textBlock = (
    <>
      <AgencyTitle
        text={s.title}
        words={words}
        color={p.text}
        accent={p.accent}
        fontClass={ctx.fontClass}
        size={size}
      />
      <BodyText body={s.body} color={p.muted} clamp="line-clamp-4" />
    </>
  )

  // ----- preto (ímpar): texto em cima, foto recortada embaixo à direita -----
  if (darkDefault) {
    return (
      <div
        className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
        style={{ backgroundColor: p.bg }}
      >
        <AgencyHeader brand={brand} tags={tags} accent={p.accent} color={p.faint} />

        {/* TEXTO — escala pra caber, nunca corta nem invade a foto */}
        <ShrinkToFit className="flex-1 z-[2]" innerClassName="px-6 pt-6" minScale={0.85}>
          {textBlock}
        </ShrinkToFit>

        {/* FOTO — tamanho fixo (uniforme entre slides) */}
        <CutoutPhoto
          image={image}
          side="right"
          accent={p.accent}
          className="flex-[0_0_38%] min-h-0 mt-3"
          cutout={cutout}
        />

        <AgencyFooter left={<FooterNote text={s.subtitle} color={p.muted} />} accent={p.accent} dark={p.dark} />

        <Attribution attribution={image?.attribution || null} textColor={p.text} />
      </div>
    )
  }

  // ----- creme (par): foto recortada em cima à esquerda, texto embaixo -----
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg }}
    >
      <AgencyHeader brand={brand} tags={tags} accent={p.accent} color={p.faint} />

      {/* FOTO — tamanho fixo (uniforme entre slides) */}
      <CutoutPhoto
        image={image}
        side="left"
        accent={p.accent}
        className="flex-[0_0_38%] min-h-0 mt-4"
        cutout={cutout}
      />

      {/* TEXTO — encolhe no máximo 15%; o resto o line-clamp corta na linha */}
      <ShrinkToFit className="flex-1 z-[2]" innerClassName="px-6 pt-5" minScale={0.85}>
        {textBlock}
      </ShrinkToFit>

      <AgencyFooter left={<FooterNote text={s.subtitle} color={p.muted} />} accent={p.accent} dark={p.dark} />

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

export const agenciaStyle: StyleRenderer = {
  render(ctx) {
    if (ctx.isCover) return <AgencyCover {...ctx} />
    return <AgencyContent {...ctx} />
  },
}
