"use client"

// ============================================================================
// Estilo CARTAZ P&B — "The Editorial Drop": fotos em preto e branco, CARTÕES
// brancos retos (sem arredondar) com a marca minúscula em caixa alta no topo,
// título curto em caixa alta pesada, subtítulo minúsculo e @ embaixo. O detalhe
// de cor (vermelho na referência) é a cor da marca (accent).
// Referência: referencias-v2/carrosseis-2026-10/cartaz.webp
//
//   capa      → foto P&B inteira + cartão branco pequeno no centro-baixo
//   conteúdo  → alterna (a) fundo claro, foto quadrada no topo + texto com faixa
//               em accent e (b) cartão grande com título em accent + foto
//   meio      → título GIGANTE em accent por cima da foto (tipo cartaz "SALE")
//   último    → foto + cartão com tag (cta_badge) e @ embaixo
// ============================================================================
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import {
  Attribution,
  FitText,
  HighlightedText,
  Pill,
  ShrinkToFit,
  parseBoldInline,
  splitTheme,
} from "../editorial-shared"
import { PhotoBox, TinyLabel, shapeAttrs, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

/** Foto P&B preenchendo o pai (o PhotoBox é `relative`; o pai absoluto dá o tamanho). */
function PhotoFill({ image, overlay }: { image: Parameters<typeof PhotoBox>[0]["image"]; overlay?: string }) {
  return (
    <div className="absolute inset-0">
      <PhotoBox image={image} grayscale className="h-full w-full" overlay={overlay} />
    </div>
  )
}

const LIGHT_BG = "#EDEAE4"
const CARD_BG = "#FFFFFF"
const INK = "#0A0A0F"

/** "#RRGGBB" → "rgba(r,g,b,a)" (véu da foto no slide do meio). */
function withAlpha(hex: string, alpha: number): string {
  const m = (hex ?? "").trim().replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return alpha === 0 ? "rgba(0,0,0,0)" : hex
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function palette(ctx: StyleRouteContext) {
  const bg = ctx.bgOverride ?? LIGHT_BG
  const th = splitTheme(ctx.bgOverride)
  return {
    bg,
    accent: ctx.accentForBg(ctx.accentOnLight),
    text: th?.text ?? INK,
    muted: th?.muted ?? "rgba(10,10,15,0.78)",
    faint: th?.faint ?? "rgba(10,10,15,0.5)",
    line: th?.line ?? "rgba(10,10,15,0.18)",
  }
}

/**
 * Tamanho do título: pelo comprimento E pela palavra mais comprida (uma palavra
 * de 12+ letras em caixa alta gigante vaza pela lateral antes de o FitText
 * conseguir medir — ele só olha a altura).
 */
function titleSize(title: string, big: string, mid: string, small: string): string {
  const longest = Math.max(0, ...(title ?? "").split(/\s+/).map((w) => w.length))
  if (longest >= 13) return small
  const byLength = titleSizeFor(title, big, mid, small)
  return longest >= 11 && byLength === big ? mid : byLength
}

function counter(orderIndex: number, total: number): string {
  return `${String(orderIndex + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`
}

/** Véu escuro na base da foto (cabeçalho branco legível sobre qualquer foto). */
const PHOTO_VEIL = "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)"

// ---------------------------------------------------------------------------
// CAPA — foto P&B inteira + cartão pequeno no centro-baixo
// ---------------------------------------------------------------------------
function CoverCartaz(ctx: StyleRouteContext) {
  const { coverData: slide, fontClass, orderIndex, totalSlides } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[1.8rem]", "text-[1.55rem]", "text-[1.3rem]")

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative"
      style={{ backgroundColor: ctx.bgOverride ?? "#1A1A1A" }}
    >
      <PhotoFill image={slide.image} overlay={PHOTO_VEIL} />

      <div className="absolute z-10 top-4 left-4 right-4 flex items-center justify-between">
        <TinyLabel color="rgba(255,255,255,0.9)">{slide.brand_label || handle}</TinyLabel>
        <Pill variant="light">{slide.category || "Editorial"}</Pill>
      </div>

      {/* CARTÃO — reto, branco, texto preto; título encolhe pra caber */}
      <div
        className="absolute z-10 left-[11%] right-[11%] bottom-[8%] flex flex-col items-center text-center px-4 pt-4 pb-4"
        style={{ backgroundColor: CARD_BG, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
      >
        <TinyLabel color={p.accent}>{slide.brand_label || handle || slide.category}</TinyLabel>
        <FitText
          className={`mt-2 ${sizeClass} uppercase tracking-[-0.02em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95, color: INK }}
          maxLines={3}
        >
          <HighlightedText text={slide.title} words={slide.highlight_words || []} color={p.accent} />
        </FitText>
        {slide.subtitle && (
          <p
            className="mt-2 text-[9px] uppercase tracking-[0.12em] font-semibold leading-[1.4] line-clamp-2"
            style={{ color: "rgba(10,10,15,0.6)" }}
          >
            {slide.subtitle}
          </p>
        )}
        <div {...shapeAttrs()} className="mt-3 h-[2px] w-8" style={{ backgroundColor: p.accent }} />
        <div className="mt-2 flex items-center gap-3">
          <TinyLabel color="rgba(10,10,15,0.55)">{handle}</TinyLabel>
          <TinyLabel color="rgba(10,10,15,0.55)">{counter(orderIndex, totalSlides)}</TinyLabel>
        </div>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#FFFFFF" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CONTEÚDO (a) — fundo claro, foto quadrada P&B no topo, faixa em accent + texto
// ---------------------------------------------------------------------------
function SplitCartazPhotoTop(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides, imgCount } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[2.1rem]", "text-[1.8rem]", "text-[1.5rem]")

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <div className="flex-shrink-0 px-5 pt-4 flex items-center justify-between">
        <TinyLabel color={p.faint}>{slide.brand_label || handle}</TinyLabel>
        <Pill variant="light">{slide.category || "Conteúdo"}</Pill>
      </div>

      {/* ZONA DE IMAGEM — tamanho fixo (uniforme entre slides), reta, P&B */}
      <div className="relative flex-[0_0_44%] min-h-0 mt-3 mx-5">
        {imgCount >= 2 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-2">
            <PhotoBox image={slide.images[0]} grayscale className="h-full" />
            <PhotoBox image={slide.images[1]} grayscale className="h-full" />
          </div>
        ) : (
          <PhotoFill image={slide.images[0]} />
        )}
      </div>

      {/* ZONA DE TEXTO — escala pra caber no que sobra (nunca invade a foto) */}
      <ShrinkToFit className="flex-1" innerClassName="px-5 pt-4">
        <div {...shapeAttrs()} className="h-[3px] w-10 mb-3" style={{ backgroundColor: p.accent }} />
        <FitText
          className={`${sizeClass} uppercase tracking-[-0.02em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95, color: p.text }}
          maxLines={3}
        >
          <HighlightedText text={slide.title} words={slide.highlight_words || []} color={p.accent} />
        </FitText>
        {slide.body && (
          <p className="mt-3 text-[12.5px] leading-[1.45] whitespace-pre-line line-clamp-5">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </ShrinkToFit>

      <div className="flex-shrink-0 px-5 pb-4 pt-2 flex items-center justify-between">
        <TinyLabel color={p.faint}>{handle}</TinyLabel>
        <TinyLabel color={p.faint}>{counter(orderIndex, totalSlides)}</TinyLabel>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CONTEÚDO (b) — cartão grande branco com título em accent + foto pequena
// ---------------------------------------------------------------------------
function SplitCartazBigCard(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides, imgCount } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[2.5rem]", "text-[2.1rem]", "text-[1.7rem]")

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-4"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <div className="flex-shrink-0 px-1 pb-3 flex items-center justify-between">
        <TinyLabel color={p.faint}>{slide.brand_label || handle}</TinyLabel>
        <TinyLabel color={p.faint}>{counter(orderIndex, totalSlides)}</TinyLabel>
      </div>

      {/* CARTÃO — ocupa o resto; texto escala, foto fixa embaixo */}
      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ backgroundColor: CARD_BG, color: "rgba(10,10,15,0.78)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      >
        <ShrinkToFit className="flex-1" innerClassName="px-5 pt-5">
          <div className="flex items-center justify-between">
            <TinyLabel color={p.accent}>{slide.brand_label || handle || "—"}</TinyLabel>
            <Pill variant="dark">{slide.category || "Conteúdo"}</Pill>
          </div>
          <FitText
            className={`mt-3 ${sizeClass} uppercase tracking-[-0.03em] ${fontClass}`}
            style={{ fontWeight: 900, lineHeight: 0.92, color: p.accent }}
            maxLines={3}
          >
            {slide.title}
          </FitText>
          {slide.body && (
            <p className="mt-3 text-[12.5px] leading-[1.45] whitespace-pre-line line-clamp-5">
              {parseBoldInline(slide.body)}
            </p>
          )}
        </ShrinkToFit>

        <div className="relative flex-[0_0_36%] min-h-0 mx-5 mt-3">
          {imgCount >= 2 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-2">
              <PhotoBox image={slide.images[0]} grayscale className="h-full" />
              <PhotoBox image={slide.images[1]} grayscale className="h-full" />
            </div>
          ) : (
            <PhotoFill image={slide.images[0]} />
          )}
        </div>

        <div className="flex-shrink-0 px-5 py-3 flex items-center justify-between">
          <TinyLabel color="rgba(10,10,15,0.55)">{handle}</TinyLabel>
          <div {...shapeAttrs()} className="h-[2px] w-8" style={{ backgroundColor: p.accent }} />
        </div>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MEIO — título GIGANTE em accent sobre a foto com véu claro (cartaz "SALE")
// ---------------------------------------------------------------------------
function SplitCartazPoster(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[4rem]", "text-[3.2rem]", "text-[2.6rem]")
  const veil = `linear-gradient(to bottom, ${withAlpha(p.bg, 0.3)} 0%, ${withAlpha(p.bg, 0.55)} 45%, ${withAlpha(p.bg, 0.92)} 100%)`

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <PhotoFill image={slide.images[0]} overlay={veil} />

      <div className="relative z-10 flex-shrink-0 px-5 pt-4 flex items-center justify-between">
        <Pill variant="light">{slide.category || "Conteúdo"}</Pill>
        <span className="px-2 py-1" style={{ backgroundColor: CARD_BG }}>
          <TinyLabel color={INK}>{slide.brand_label || handle || counter(orderIndex, totalSlides)}</TinyLabel>
        </span>
      </div>

      {/* Espaço da foto (água) */}
      <div className="flex-1 min-h-[90px]" />

      {/* ZONA DE TEXTO — sólida, na base, onde o véu é mais forte */}
      <div className="relative z-10 flex-shrink-0 px-5 pb-5">
        <FitText
          className={`${sizeClass} uppercase tracking-[-0.04em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.85, color: p.accent }}
          maxLines={3}
        >
          {slide.title}
        </FitText>
        {slide.body && (
          <p
            className="mt-3 px-3 py-2.5 text-[12px] leading-[1.45] whitespace-pre-line line-clamp-3"
            style={{ backgroundColor: CARD_BG, color: "rgba(10,10,15,0.8)" }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <TinyLabel color={p.text}>{handle}</TinyLabel>
          <TinyLabel color={p.text}>{counter(orderIndex, totalSlides)}</TinyLabel>
        </div>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor={p.text} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ÚLTIMO — foto + cartão com a tag em destaque e o @ embaixo
// ---------------------------------------------------------------------------
function SplitCartazCta(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[2rem]", "text-[1.7rem]", "text-[1.45rem]")

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative"
      style={{ backgroundColor: ctx.bgOverride ?? "#1A1A1A" }}
    >
      <PhotoFill image={slide.images[0]} overlay={PHOTO_VEIL} />

      <div className="absolute z-10 top-4 left-4 right-4 flex items-center justify-between">
        <TinyLabel color="rgba(255,255,255,0.9)">{slide.brand_label || handle}</TinyLabel>
        <TinyLabel color="rgba(255,255,255,0.9)">{counter(orderIndex, totalSlides)}</TinyLabel>
      </div>

      <div
        className="absolute z-10 left-4 right-4 bottom-4 flex flex-col px-5 pt-5 pb-4"
        style={{ backgroundColor: CARD_BG, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
      >
        <TinyLabel color={p.accent}>{slide.brand_label || handle || "—"}</TinyLabel>
        <FitText
          className={`mt-2 ${sizeClass} uppercase tracking-[-0.02em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95, color: INK }}
          maxLines={3}
        >
          <HighlightedText text={slide.title} words={slide.highlight_words || []} color={p.accent} />
        </FitText>
        {slide.body && (
          <p
            className="mt-2 text-[11.5px] leading-[1.45] whitespace-pre-line line-clamp-3"
            style={{ color: "rgba(10,10,15,0.72)" }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <Pill variant="dark">{slide.category || "Salve este post"}</Pill>
          <TinyLabel color="rgba(10,10,15,0.55)">{handle}</TinyLabel>
        </div>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#FFFFFF" />
    </div>
  )
}

export const cartazStyle: StyleRenderer = {
  render(ctx) {
    if (ctx.isCover) return <CoverCartaz {...ctx} />
    if (ctx.isLast) return <SplitCartazCta {...ctx} />
    if (ctx.isMidBreak) return <SplitCartazPoster {...ctx} />
    // Alterna foto-no-topo / cartão-grande contando só os slides de conteúdo
    // (o do meio não entra na conta, senão com 5 slides um dos dois nunca sai).
    const middle = ctx.totalSlides >= 5 ? Math.floor(ctx.totalSlides / 2) : -1
    const k = middle > 0 && ctx.orderIndex > middle ? ctx.orderIndex - 1 : ctx.orderIndex
    if (k % 2 === 1) return <SplitCartazPhotoTop {...ctx} />
    return <SplitCartazBigCard {...ctx} />
  },
}
