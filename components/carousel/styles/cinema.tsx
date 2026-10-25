"use client"

// ============================================================================
// Estilo CINEMA — "Sociyell": foto com véu escuro FORTE (quase preto e branco),
// nome da marca pequeno no topo à esquerda, título em caixa alta branca,
// centralizado e grande no terço inferior, com a palavra destacada em serifa
// itálica; subtítulo pequeno em caixa alta com tracking; rodapé em 3 colunas
// minúsculas ("Tema / categoria", "Por / marca", "Salve / este post").
//
//   capa      → título central-baixo + subtítulo em caixa alta + rodapé 3 col.
//   conteúdo  → título menor + corpo centralizado + rodapé 3 col.
//   último    → fechamento: título + botão branco com o cta_badge
// ============================================================================
import type { ReactNode } from "react"
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import {
  Attribution,
  FitText,
  ImagePlaceholder,
  SmartSlideImage,
  parseBoldInline,
  splitTheme,
  type SlideAttribution,
} from "../editorial-shared"
import { SERIF_ITALIC_CLASS, StyledWords, TinyLabel, shapeAttrs, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

type Img = { url: string | null; error?: string | null; attribution?: SlideAttribution | null }

const DEFAULT_BG = "#0A0A0A"

/** Fotos de fundo dessaturadas: 1 foto cobre tudo; 2+ dividem lado a lado. */
function BackgroundPhotos({ images, dark }: { images: Img[]; dark: boolean }) {
  const list = images.filter((im) => im?.url).slice(0, 2)
  // Quase preto e branco — é o que dá o clima de cinema. (filter comum, não
  // backdrop-filter: exporta certo no PNG.)
  const filterStyle = { filter: dark ? "grayscale(0.8) contrast(1.08) brightness(0.92)" : "grayscale(0.6)" }
  if (list.length === 0) {
    return <ImagePlaceholder className="absolute inset-0" label={images[0]?.error ?? null} />
  }
  if (list.length === 1) {
    return (
      <div className="absolute inset-0" style={filterStyle}>
        <SmartSlideImage fill src={list[0].url as string} className="absolute inset-0 w-full h-full" />
      </div>
    )
  }
  return (
    <div className="absolute inset-0 flex" style={filterStyle}>
      {list.map((im, i) => (
        <div key={i} className="relative flex-1 min-w-0 overflow-hidden">
          <SmartSlideImage fill src={im.url as string} className="absolute inset-0 w-full h-full" />
        </div>
      ))}
    </div>
  )
}

/** Coluna do rodapé: linha de cima apagada, linha de baixo em negrito. */
function FooterCol({
  top,
  bottom,
  align,
  color,
  faint,
}: {
  top: string
  bottom: string
  align: "left" | "center" | "right"
  color: string
  faint: string
}) {
  if (!bottom) return <span />
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center"
  return (
    <TinyLabel
      color={color}
      className={`flex flex-col text-[8px] normal-case tracking-[0.06em] font-normal ${alignClass}`}
      style={{ lineHeight: 1.35 }}
    >
      <span style={{ color: faint }}>{top}</span>
      <span className="font-bold">{bottom}</span>
    </TinyLabel>
  )
}

function CinemaTitle({
  title,
  words,
  fontClass,
  color,
  sizeClass,
  maxLines,
}: {
  title: string
  words: string[]
  fontClass: string
  color: string
  sizeClass: string
  maxLines: number
}) {
  return (
    <FitText
      className={`${sizeClass} ${fontClass} uppercase leading-[0.92] text-center`}
      style={{
        fontWeight: 800,
        letterSpacing: "-0.025em",
        color,
        textShadow: color === "#FFFFFF" ? "0 2px 22px rgba(0,0,0,0.45)" : undefined,
      }}
      maxLines={maxLines}
    >
      <StyledWords
        text={title}
        words={words}
        className={SERIF_ITALIC_CLASS}
        style={{ fontWeight: 400, letterSpacing: "0" }}
      />
    </FitText>
  )
}

function CinemaFrame({
  ctx,
  images,
  veil,
  children,
  textColor,
  faintColor,
  brandSlot,
}: {
  ctx: StyleRouteContext
  images: Img[]
  veil: string
  children: ReactNode
  textColor: string
  faintColor: string
  /** Texto da coluna "Por / ..." (marca ou @). */
  brandSlot: string
}) {
  const { coverData, splitData, bgOverride, isCover, isLast, totalSlides, orderIndex } = ctx
  const dark = textColor === "#FFFFFF"
  const accent = ctx.accentForBg(ctx.accentOnDark)
  const brand = (coverData.brand_label ?? "").trim()
  const handle = handleVisivel(coverData.handle)
  const category = (isCover ? coverData.category : splitData.category) || "Conteúdo"
  const counter = `${String(orderIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: bgOverride ?? DEFAULT_BG }}
    >
      {/* FOTO — água: cobre o slide inteiro, atrás de tudo */}
      <div className="absolute inset-0">
        <BackgroundPhotos images={images} dark={dark} />
      </div>
      {/* Véu escuro forte (sem backdrop-filter) */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: veil }} />

      {/* TOPO — marca pequena à esquerda, @ ou contador à direita */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent }}
          />
          {brand || handle ? (
            <TinyLabel color={faintColor} className="text-[8px]" style={{ letterSpacing: "0.22em" }}>
              {brand || handle}
            </TinyLabel>
          ) : (
            <span />
          )}
        </div>
        {isCover ? (
          handle && brand ? (
            <TinyLabel color={faintColor} className="text-[8px] normal-case" style={{ letterSpacing: "0.08em" }}>
              {handle}
            </TinyLabel>
          ) : (
            <span />
          )
        ) : (
          <TinyLabel color={faintColor} className="text-[8px] tabular-nums" style={{ letterSpacing: "0.18em" }}>
            {counter}
          </TinyLabel>
        )}
      </div>

      {/* MIOLO — texto sólido, centralizado, no terço inferior */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center px-6">{children}</div>

      {/* RODAPÉ — 3 colunas minúsculas */}
      <div className="relative z-10 flex-shrink-0 px-5 pb-4 pt-3 grid grid-cols-3 items-end gap-2">
        {/* No fechamento a categoria É o cta (já está no botão) → mostra o contador. */}
        {isLast ? (
          <FooterCol top="Fim" bottom={counter} align="left" color={textColor} faint={faintColor} />
        ) : (
          <FooterCol top="Tema" bottom={category} align="left" color={textColor} faint={faintColor} />
        )}
        <FooterCol top="Por" bottom={brandSlot} align="center" color={textColor} faint={faintColor} />
        <FooterCol
          top="Salve"
          bottom={isLast ? "e compartilhe" : "este post"}
          align="right"
          color={textColor}
          faint={faintColor}
        />
      </div>

      <Attribution attribution={images[0]?.attribution ?? null} textColor={textColor} />
    </div>
  )
}

export const cinemaStyle: StyleRenderer = {
  render(ctx) {
    const { coverData, splitData, fontClass, bgOverride, isCover, isLast } = ctx
    const th = splitTheme(bgOverride)
    // Sobre a foto com véu preto o texto é branco; fundo CLARO escolhido pelo
    // usuário inverte o véu (branco) e o texto (escuro).
    const dark = th ? th.isDark : true
    const textColor = dark ? "#FFFFFF" : "#0A0A0F"
    const faintColor = dark ? "rgba(255,255,255,0.62)" : "rgba(10,10,15,0.55)"
    const bodyColor = dark ? "rgba(255,255,255,0.88)" : "rgba(10,10,15,0.8)"
    const v = dark ? "0,0,0" : "255,255,255"
    const accent = ctx.accentForBg(ctx.accentOnDark)
    const words = (isCover ? coverData.highlight_words : splitData.highlight_words) ?? []
    const images: Img[] = isCover ? [coverData.image] : splitData.images
    const brandSlot = (coverData.brand_label ?? "").trim() || handleVisivel(coverData.handle)

    // ---------------- CAPA ----------------
    if (isCover) {
      const veil = `linear-gradient(to bottom, rgba(${v},0.55) 0%, rgba(${v},0.3) 35%, rgba(${v},0.45) 55%, rgba(${v},0.9) 100%)`
      const size = titleSizeFor(coverData.title, "text-[3rem]", "text-[2.6rem]", "text-[2.2rem]")
      return (
        <CinemaFrame
          ctx={ctx}
          images={images}
          veil={veil}
          textColor={textColor}
          faintColor={faintColor}
          brandSlot={brandSlot}
        >
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-end pb-5 gap-3">
            <CinemaTitle
              title={coverData.title}
              words={words}
              fontClass={fontClass}
              color={textColor}
              sizeClass={size}
              maxLines={4}
            />
            {coverData.subtitle && (
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em] leading-[1.6] text-center line-clamp-2 max-w-[92%]"
                style={{ color: bodyColor }}
              >
                {coverData.subtitle}
              </p>
            )}
          </div>
        </CinemaFrame>
      )
    }

    // ---------------- ÚLTIMO SLIDE (fechamento) ----------------
    if (isLast) {
      const veil = `linear-gradient(to bottom, rgba(${v},0.6) 0%, rgba(${v},0.4) 30%, rgba(${v},0.92) 100%)`
      const size = titleSizeFor(splitData.title, "text-[2.6rem]", "text-[2.25rem]", "text-[1.9rem]")
      const cta = splitData.category || "Salve este post"
      return (
        <CinemaFrame
          ctx={ctx}
          images={images}
          veil={veil}
          textColor={textColor}
          faintColor={faintColor}
          brandSlot={brandSlot}
        >
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-end pb-5 gap-4">
            <div {...shapeAttrs()} className="h-px w-10 flex-shrink-0" style={{ backgroundColor: accent }} />
            <CinemaTitle
              title={splitData.title}
              words={words}
              fontClass={fontClass}
              color={textColor}
              sizeClass={size}
              maxLines={4}
            />
            {splitData.body && (
              <p
                className="text-[12px] leading-[1.5] text-center whitespace-pre-line line-clamp-3 max-w-[88%]"
                style={{ color: bodyColor }}
              >
                {parseBoldInline(splitData.body)}
              </p>
            )}
            <span
              data-edit="badge"
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] ${fontClass}`}
              style={{
                backgroundColor: textColor,
                color: dark ? "#0A0A0F" : "#FFFFFF",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              }}
            >
              {cta} →
            </span>
          </div>
        </CinemaFrame>
      )
    }

    // ---------------- CONTEÚDO ----------------
    const veil = `linear-gradient(to bottom, rgba(${v},0.58) 0%, rgba(${v},0.32) 30%, rgba(${v},0.7) 55%, rgba(${v},0.95) 100%)`
    const size = titleSizeFor(splitData.title, "text-[2.2rem]", "text-[1.95rem]", "text-[1.7rem]")
    return (
      <CinemaFrame
        ctx={ctx}
        images={images}
        veil={veil}
        textColor={textColor}
        faintColor={faintColor}
        brandSlot={brandSlot}
      >
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-end pb-4 gap-3">
          <div {...shapeAttrs()} className="h-px w-10 flex-shrink-0" style={{ backgroundColor: accent }} />
          <CinemaTitle
            title={splitData.title}
            words={words}
            fontClass={fontClass}
            color={textColor}
            sizeClass={size}
            maxLines={3}
          />
          {splitData.body && (
            <p
              className="text-[12.5px] leading-[1.5] text-center whitespace-pre-line line-clamp-5 max-w-[92%]"
              style={{ color: bodyColor }}
            >
              {parseBoldInline(splitData.body)}
            </p>
          )}
        </div>
      </CinemaFrame>
    )
  },
}
