"use client"

// ============================================================================
// Estilo LOOKBOOK — "Mobile Editing Club": foto quente ocupando o slide todo,
// nome da marca em 3 linhas minúsculas no topo à esquerda, ícone pequeno à
// direita, título branco GIGANTE em sans pesada (tracking negativo) com UMA
// palavra em serifa itálica fina, e uma pílula branca pequena centralizada
// embaixo com texto em caixa alta. Véu suave no topo e na base.
//
//   capa      → título no terço inferior + subtítulo + pílula (categoria)
//   conteúdo  → título menor + corpo sobre véu mais forte + pílula (categoria)
//   último    → fechamento: título + botão grande com o cta_badge
// ============================================================================
import type { CSSProperties, ReactNode } from "react"
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import {
  Attribution,
  FitText,
  ImagePlaceholder,
  Pill,
  SmartSlideImage,
  parseBoldInline,
  splitTheme,
  type SlideAttribution,
} from "../editorial-shared"
import { SERIF_ITALIC_CLASS, StyledWords, TinyLabel, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

type Img = { url: string | null; error?: string | null; attribution?: SlideAttribution | null }

/** Fundo padrão (aparece só atrás do placeholder / nas bordas): bege quente. */
const DEFAULT_BG = "#B9916E"

/** Luminância simples de um hex → decide a cor do texto sobre o accent. */
function isLightHex(hex: string): boolean {
  const m = hex.replace("#", "")
  if (m.length < 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

/** Nome da marca quebrado em até 3 linhas (uma palavra por linha). */
function brandLines(brandLabel: string | undefined, handle: string | undefined): string[] {
  const label = (brandLabel ?? "").trim()
  if (label) {
    const words = label.split(/\s+/).filter(Boolean)
    if (words.length <= 3) return words
    // mais de 3 palavras: 2 primeiras + resto junto
    return [words[0], words[1], words.slice(2).join(" ")]
  }
  const h = handleVisivel(handle)
  return h ? [h] : []
}

/** Fotos de fundo: 1 foto cobre tudo; 2+ dividem o slide lado a lado. */
function BackgroundPhotos({ images }: { images: Img[] }) {
  const list = images.filter((im) => im?.url).slice(0, 2)
  if (list.length === 0) {
    return <ImagePlaceholder className="absolute inset-0" label={images[0]?.error ?? null} />
  }
  if (list.length === 1) {
    return (
      <SmartSlideImage fill src={list[0].url as string} className="absolute inset-0 w-full h-full" />
    )
  }
  return (
    <div className="absolute inset-0 flex">
      {list.map((im, i) => (
        <div key={i} className="relative flex-1 min-w-0 overflow-hidden">
          <SmartSlideImage fill src={im.url as string} className="absolute inset-0 w-full h-full" />
        </div>
      ))}
    </div>
  )
}

/** Ícone pequeno do canto superior direito (quadrado arredondado, como na ref). */
function CornerMark({ color }: { color: string }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke={color} strokeWidth="1.6" />
      <rect x="5" y="5" width="6" height="6" rx="1.5" fill={color} />
    </svg>
  )
}

function LookbookTitle({
  title,
  words,
  fontClass,
  color,
  sizeClass,
  maxLines,
  shadow,
}: {
  title: string
  words: string[]
  fontClass: string
  color: string
  sizeClass: string
  maxLines: number
  shadow: boolean
}) {
  return (
    <FitText
      className={`${sizeClass} ${fontClass} leading-[0.9]`}
      style={{
        fontWeight: 800,
        letterSpacing: "-0.035em",
        color,
        textShadow: shadow ? "0 2px 18px rgba(0,0,0,0.35)" : undefined,
      }}
      maxLines={maxLines}
    >
      <StyledWords
        text={title}
        words={words}
        className={SERIF_ITALIC_CLASS}
        style={{ fontWeight: 400, letterSpacing: "-0.01em" }}
      />
    </FitText>
  )
}

function LookbookFrame({
  ctx,
  images,
  veil,
  children,
  bottom,
  textColor,
  faintColor,
}: {
  ctx: StyleRouteContext
  images: Img[]
  veil: string
  children: ReactNode
  bottom: ReactNode
  textColor: string
  faintColor: string
}) {
  const { coverData, bgOverride, totalSlides, orderIndex } = ctx
  const accent = ctx.accentForBg(ctx.accentOnDark)
  const lines = brandLines(coverData.brand_label, coverData.handle)
  const counter = `${String(orderIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`
  const labelStyle: CSSProperties = { lineHeight: 1.15, letterSpacing: "0.16em" }

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: bgOverride ?? DEFAULT_BG }}
    >
      {/* FOTO — água: cobre o slide inteiro, atrás de tudo */}
      <div className="absolute inset-0">
        <BackgroundPhotos images={images} />
      </div>
      {/* Véu (sem backdrop-filter: export PNG limpo) */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: veil }} />

      {/* TOPO — marca em 3 linhas + ícone */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-4 flex items-start justify-between">
        <div className="flex flex-col">
          {lines.length > 0 ? (
            lines.map((l, i) => (
              <TinyLabel key={i} color={textColor} className="text-[8px]" style={labelStyle}>
                {l}
              </TinyLabel>
            ))
          ) : (
            <span />
          )}
        </div>
        <div className="flex items-center gap-2">
          {!ctx.isCover && (
            <TinyLabel color={faintColor} className="text-[8px] tabular-nums" style={labelStyle}>
              {counter}
            </TinyLabel>
          )}
          <CornerMark color={accent} />
        </div>
      </div>

      {/* MIOLO — texto sólido, sempre acima do véu */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col px-5">{children}</div>

      {/* RODAPÉ — pílula centralizada */}
      <div className="relative z-10 flex-shrink-0 px-5 pb-5 pt-3 flex items-center justify-center">
        {bottom}
      </div>

      <Attribution attribution={images[0]?.attribution ?? null} textColor={textColor} />
    </div>
  )
}

export const lookbookStyle: StyleRenderer = {
  render(ctx) {
    const { coverData, splitData, fontClass, bgOverride, isCover, isLast } = ctx
    const th = splitTheme(bgOverride)
    // Sobre foto o texto é branco; só vira escuro se o usuário escolher um
    // fundo CLARO (o véu acompanha: branco em vez de preto).
    const dark = th ? th.isDark : true
    const textColor = dark ? "#FFFFFF" : "#0A0A0F"
    const faintColor = dark ? "rgba(255,255,255,0.72)" : "rgba(10,10,15,0.6)"
    const bodyColor = dark ? "rgba(255,255,255,0.9)" : "rgba(10,10,15,0.82)"
    const v = dark ? "0,0,0" : "255,255,255"
    const accent = ctx.accentForBg(ctx.accentOnDark)
    const words = (isCover ? coverData.highlight_words : splitData.highlight_words) ?? []
    const images: Img[] = isCover ? [coverData.image] : splitData.images
    const handle = handleVisivel(coverData.handle)
    const pillClass = "uppercase tracking-[0.14em] text-[9px]! px-3.5 py-1.5"

    // ---------------- CAPA ----------------
    if (isCover) {
      const veil = `linear-gradient(to bottom, rgba(${v},0.38) 0%, rgba(${v},0) 28%, rgba(${v},0) 42%, rgba(${v},0.62) 100%)`
      const size = titleSizeFor(coverData.title, "text-[3.4rem]", "text-[2.9rem]", "text-[2.35rem]")
      return (
        <LookbookFrame
          ctx={ctx}
          images={images}
          veil={veil}
          textColor={textColor}
          faintColor={faintColor}
          bottom={
            <Pill variant={dark ? "light" : "dark"} className={pillClass}>
              {coverData.category || "Editorial"}
            </Pill>
          }
        >
          <div className="flex-1 min-h-0 flex flex-col justify-end pb-3 gap-3">
            <LookbookTitle
              title={coverData.title}
              words={words}
              fontClass={fontClass}
              color={textColor}
              sizeClass={size}
              maxLines={4}
              shadow={dark}
            />
            {coverData.subtitle && (
              <p
                className="text-[12px] leading-[1.45] line-clamp-2 max-w-[88%]"
                style={{ color: bodyColor }}
              >
                {coverData.subtitle}
              </p>
            )}
            {handle && (
              <span
                data-edit="meta"
                className="text-[10px] font-semibold tracking-[0.08em]"
                style={{ color: faintColor }}
              >
                {handle}
              </span>
            )}
          </div>
        </LookbookFrame>
      )
    }

    // ---------------- ÚLTIMO SLIDE (fechamento) ----------------
    if (isLast) {
      const veil = `linear-gradient(to bottom, rgba(${v},0.42) 0%, rgba(${v},0.1) 30%, rgba(${v},0.78) 100%)`
      const size = titleSizeFor(splitData.title, "text-[2.9rem]", "text-[2.5rem]", "text-[2.1rem]")
      const cta = splitData.category || "Salve este post"
      const ctaText = isLightHex(accent) ? "#0A0A0F" : "#FFFFFF"
      return (
        <LookbookFrame
          ctx={ctx}
          images={images}
          veil={veil}
          textColor={textColor}
          faintColor={faintColor}
          bottom={
            <span
              data-edit="badge"
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] ${fontClass}`}
              style={{
                backgroundColor: accent,
                color: ctaText,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              {cta} →
            </span>
          }
        >
          <div className="flex-1 min-h-0 flex flex-col justify-end pb-4 gap-3">
            <LookbookTitle
              title={splitData.title}
              words={words}
              fontClass={fontClass}
              color={textColor}
              sizeClass={size}
              maxLines={4}
              shadow={dark}
            />
            {splitData.body && (
              <p
                className="text-[13px] leading-[1.5] whitespace-pre-line line-clamp-3 max-w-[92%]"
                style={{ color: bodyColor }}
              >
                {parseBoldInline(splitData.body)}
              </p>
            )}
            {handle && (
              <span
                data-edit="meta"
                className="text-[10px] font-semibold tracking-[0.08em]"
                style={{ color: faintColor }}
              >
                {handle}
              </span>
            )}
          </div>
        </LookbookFrame>
      )
    }

    // ---------------- CONTEÚDO ----------------
    // Corpo em cima da foto: véu mais forte na metade de baixo pra garantir
    // leitura; o texto fica no terço inferior, nunca colide com o rosto.
    const veil = `linear-gradient(to bottom, rgba(${v},0.38) 0%, rgba(${v},0.05) 25%, rgba(${v},0.64) 52%, rgba(${v},0.9) 100%)`
    const size = titleSizeFor(splitData.title, "text-[2.5rem]", "text-[2.15rem]", "text-[1.85rem]")
    return (
      <LookbookFrame
        ctx={ctx}
        images={images}
        veil={veil}
        textColor={textColor}
        faintColor={faintColor}
        bottom={
          <Pill variant={dark ? "light" : "dark"} className={pillClass}>
            {splitData.category || "Conteúdo"}
          </Pill>
        }
      >
        <div className="flex-1 min-h-0 flex flex-col justify-end pb-3 gap-3">
          <LookbookTitle
            title={splitData.title}
            words={words}
            fontClass={fontClass}
            color={textColor}
            sizeClass={size}
            maxLines={3}
            shadow={dark}
          />
          {splitData.body && (
            <p
              className="text-[13px] leading-[1.5] whitespace-pre-line line-clamp-5"
              style={{ color: bodyColor }}
            >
              {parseBoldInline(splitData.body)}
            </p>
          )}
        </div>
      </LookbookFrame>
    )
  },
}
