"use client"

// ============================================================================
// Estilo COLAGEM — grade de agência: fundo sólido NA COR DA MARCA, foto em
// preto e branco "recortada" ocupando metade do slide, título enorme em caixa
// alta, uma palavra em letra manuscrita e uma palavra-fantasma gigante atrás.
// Referência: referencias-v2/carrosseis-2026-10/colagem.webp
//
//   capa      → título gigante + kicker manuscrito + foto P&B embaixo
//   conteúdo  → título + corpo em cima, foto P&B embaixo (ou foto em cima no
//               slide do meio, pra quebrar o ritmo)
//   último    → título + benefícios em pílulas + tag em destaque + foto
// ============================================================================
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import {
  Attribution,
  FitText,
  Pill,
  isCutoutActive,
  parseBoldInline,
  splitTheme,
} from "../editorial-shared"
import {
  ArrowCta,
  GhostWord,
  PhotoBox,
  SCRIPT_CLASS,
  StyledWords,
  TinyLabel,
  shapeAttrs,
  titleSizeFor,
} from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

/** Foto P&B preenchendo o pai (o PhotoBox é `relative`; o pai absoluto dá o tamanho). */
function PhotoFill({ image, overlay }: { image: Parameters<typeof PhotoBox>[0]["image"]; overlay?: string }) {
  return (
    <div className="absolute inset-0">
      <PhotoBox image={image} grayscale className="h-full w-full" overlay={overlay} />
    </div>
  )
}

/**
 * FOTO RECORTADA (PNG sem fundo) — como na referência: o assunto em P&B fica
 * solto sobre a cor da marca, grande, apoiado na base do slide (sai pela borda
 * de baixo) e sobe um pouco por trás da zona de texto (z menor: o texto nunca
 * é coberto). Atrás dele, um traço manuscrito solto (forma editável).
 *   side → de que lado o assunto se apoia (alterna entre slides).
 *   fade → funde a base no fundo (quando o assunto NÃO encosta na borda).
 */
function CutoutStage({
  image,
  swirlColor,
  side,
  fade,
  className,
}: {
  image: Parameters<typeof PhotoBox>[0]["image"]
  swirlColor: string
  side: "left" | "right" | "center"
  fade?: string
  className: string
}) {
  const pos =
    side === "right" ? "left-[18%] right-[-10%]" : side === "left" ? "left-[-10%] right-[18%]" : "left-[6%] right-[6%]"
  const swirlPos =
    side === "right" ? "left-[2%] top-[-6%]" : side === "left" ? "right-[2%] top-[-6%]" : "left-[-8%] top-[4%]"
  return (
    <>
      <svg
        {...shapeAttrs("text")}
        aria-hidden
        viewBox="0 0 200 160"
        fill="none"
        className={`absolute pointer-events-none w-[78%] h-auto ${swirlPos}`}
        style={{ color: swirlColor }}
      >
        <path
          d="M6 128 C 30 40, 120 6, 150 52 S 96 150, 70 98 S 150 18, 196 30"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute bottom-0 ${pos} ${className}`}>
        <PhotoBox image={image} grayscale className="h-full w-full" overlay={fade} />
      </div>
    </>
  )
}

/** Classes da palavra manuscrita dentro do título (caixa normal, mais solta). */
const SCRIPT_IN_TITLE = `${SCRIPT_CLASS} normal-case tracking-normal`

/** "#RRGGBB" → "rgba(r,g,b,a)" (pro degradê que funde a foto no fundo). */
function withAlpha(hex: string, alpha: number): string {
  const m = (hex ?? "").trim().replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return alpha === 0 ? "rgba(0,0,0,0)" : hex
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Paleta do slide: fundo = cor da marca (ou o fundo escolhido pelo usuário). */
function palette(ctx: StyleRouteContext) {
  const bg = ctx.bgOverride ?? ctx.accentOnLight
  // splitTheme sempre devolve paleta quando há cor (bg nunca é vazio aqui).
  const th = splitTheme(bg)
  const isDark = th?.isDark ?? true
  return {
    bg,
    isDark,
    ink: th?.text ?? "#FFFFFF",
    muted: th?.muted ?? "rgba(255,255,255,0.85)",
    faint: th?.faint ?? "rgba(255,255,255,0.6)",
    ghost: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)",
    /** Traço manuscrito atrás do recorte. */
    swirl: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.3)",
    /** Foto funde no fundo pelo topo (ou pela base) — efeito "recortada". */
    fadeTop: `linear-gradient(to bottom, ${bg} 0%, ${withAlpha(bg, 0)} 38%)`,
    fadeBottom: `linear-gradient(to top, ${bg} 0%, ${withAlpha(bg, 0)} 38%)`,
    pillVariant: (isDark ? "light" : "dark") as "light" | "dark",
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
  return `${String(orderIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
}

/** Ghost gigante: a categoria (tag) em caixa alta, apagada, atrás de tudo. */
function Ghost({ text, color, fontClass, className }: { text: string; color: string; fontClass: string; className: string }) {
  return (
    <GhostWord
      text={(text || "").toUpperCase()}
      color={color}
      className={`${fontClass} text-[6.4rem] uppercase tracking-[-0.05em] ${className}`}
    />
  )
}

// ---------------------------------------------------------------------------
// CAPA
// ---------------------------------------------------------------------------
function CoverColagem(ctx: StyleRouteContext) {
  const { coverData: slide, fontClass, orderIndex, totalSlides } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const words = slide.highlight_words || []
  const hasScriptInTitle = words.length > 0
  const sizeClass = titleSize(slide.title, "text-[3.5rem]", "text-[2.9rem]", "text-[2.4rem]")
  const cut = isCutoutActive(ctx.slide.image)

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <Ghost text={slide.category || ""} color={p.ghost} fontClass={fontClass} className="left-[-3%] top-[38%]" />

      {/* Header: @ à esquerda, tag à direita */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-4 flex items-center justify-between">
        <TinyLabel color={p.faint}>{handle}</TinyLabel>
        <Pill variant={p.pillVariant}>{slide.category || "Editorial"}</Pill>
      </div>

      {/* ZONA DE TEXTO — sólida */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-4">
        {!hasScriptInTitle && slide.subtitle && (
          <p
            className={`${SCRIPT_CLASS} text-[1.6rem] leading-[1] line-clamp-2 mb-1`}
            style={{ color: p.ink }}
          >
            {slide.subtitle}
          </p>
        )}
        <FitText
          className={`${sizeClass} uppercase tracking-[-0.03em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.88, color: p.ink }}
          maxLines={3}
        >
          <StyledWords
            text={slide.title}
            words={words}
            className={SCRIPT_IN_TITLE}
            style={{ fontSize: "1.08em", fontWeight: 700 }}
          />
        </FitText>
        {hasScriptInTitle && slide.subtitle && (
          <p className="mt-3 text-[13px] leading-[1.45] line-clamp-2 max-w-[88%]">
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* ZONA DE IMAGEM — água: preenche o que sobra, P&B, fundindo no fundo */}
      <div className="relative z-[5] flex-1 min-h-[150px] mt-2">
        {cut ? (
          <CutoutStage image={slide.image} swirlColor={p.swirl} side="right" className="top-[-14%]" />
        ) : (
          <PhotoFill image={slide.image} overlay={p.fadeTop} />
        )}
      </div>

      {/* Rodapé fino sobre a foto */}
      <div className="absolute z-10 bottom-4 left-5 right-5 flex items-center justify-between">
        <TinyLabel color={p.isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)"}>
          {counter(orderIndex, totalSlides)}
        </TinyLabel>
        <ArrowCta color={p.isDark ? "#0A0A0F" : "#FFFFFF"} bg={p.isDark ? "#FFFFFF" : "#0A0A0F"} />
      </div>

      <Attribution attribution={slide.image.attribution} textColor={p.ink} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CONTEÚDO — título + corpo em cima, foto embaixo (padrão)
// ---------------------------------------------------------------------------
function SplitColagemPhotoBottom(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides, imgCount } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[3rem]", "text-[2.5rem]", "text-[2.05rem]")
  const twoPhotos = imgCount >= 2
  const cut = !twoPhotos && isCutoutActive(ctx.slide.image)

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <Ghost text={slide.category || ""} color={p.ghost} fontClass={fontClass} className="right-[-6%] top-[44%]" />

      <div className="relative z-10 flex-shrink-0 px-5 pt-4 flex items-center justify-between">
        <TinyLabel color={p.faint}>{handle}</TinyLabel>
        <TinyLabel color={p.faint}>{counter(orderIndex, totalSlides)}</TinyLabel>
      </div>

      <div className="relative z-10 flex-shrink-0 px-5 pt-4">
        <FitText
          className={`${sizeClass} uppercase tracking-[-0.03em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: p.ink }}
          maxLines={3}
        >
          <StyledWords
            text={slide.title}
            words={slide.highlight_words || []}
            className={SCRIPT_IN_TITLE}
            style={{ fontSize: "1.08em", fontWeight: 700 }}
          />
        </FitText>
        {slide.body && (
          <p className="mt-3 text-[13.5px] leading-[1.45] whitespace-pre-line line-clamp-4 max-w-[92%]">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <div className="relative z-[5] flex-1 min-h-[130px] mt-2">
        {twoPhotos ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 px-5">
            <PhotoBox image={slide.images[0]} grayscale className="h-full" overlay={p.fadeTop} />
            <PhotoBox image={slide.images[1]} grayscale className="h-full" overlay={p.fadeTop} />
          </div>
        ) : cut ? (
          <CutoutStage image={slide.images[0]} swirlColor={p.swirl} side="left" className="top-[-14%]" />
        ) : (
          <PhotoFill image={slide.images[0]} overlay={p.fadeTop} />
        )}
      </div>

      <div className="absolute z-10 bottom-4 right-5">
        <ArrowCta color={p.isDark ? "#0A0A0F" : "#FFFFFF"} bg={p.isDark ? "#FFFFFF" : "#0A0A0F"} />
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor={p.ink} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CONTEÚDO — quebra de ritmo (meio): foto em cima, kicker manuscrito + título
// ---------------------------------------------------------------------------
function SplitColagemPhotoTop(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[3rem]", "text-[2.5rem]", "text-[2.05rem]")
  const cut = isCutoutActive(ctx.slide.image)

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <Ghost text={slide.category || ""} color={p.ghost} fontClass={fontClass} className="left-[-4%] top-[30%]" />

      {/* ZONA DE IMAGEM — água, em cima, fundindo no fundo pela base */}
      <div className="relative z-[5] flex-1 min-h-[140px]">
        {cut ? (
          <CutoutStage image={slide.images[0]} swirlColor={p.swirl} side="center" fade={p.fadeBottom} className="top-9" />
        ) : (
          <PhotoFill image={slide.images[0]} overlay={p.fadeBottom} />
        )}
        <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
          <TinyLabel color={p.isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)"}>{handle}</TinyLabel>
          <TinyLabel color={p.isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)"}>
            {counter(orderIndex, totalSlides)}
          </TinyLabel>
        </div>
      </div>

      {/* ZONA DE TEXTO — sólida, embaixo */}
      <div className="relative z-10 flex-shrink-0 px-5 pb-5 pt-1">
        {slide.subtitle && (
          <p
            className={`${SCRIPT_CLASS} text-[1.6rem] leading-[1] line-clamp-2 mb-1`}
            style={{ color: p.ink }}
          >
            {slide.subtitle}
          </p>
        )}
        <FitText
          className={`${sizeClass} uppercase tracking-[-0.03em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: p.ink }}
          maxLines={3}
        >
          <StyledWords
            text={slide.title}
            words={slide.highlight_words || []}
            className={SCRIPT_IN_TITLE}
            style={{ fontSize: "1.08em", fontWeight: 700 }}
          />
        </FitText>
        {slide.body && (
          <p className="mt-3 text-[13px] leading-[1.45] whitespace-pre-line line-clamp-3 max-w-[92%]">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor={p.ink} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ÚLTIMO — chamada pra ação: benefícios em pílulas + tag grande + foto
// ---------------------------------------------------------------------------
function SplitColagemCta(ctx: StyleRouteContext) {
  const { splitData: slide, fontClass, orderIndex, totalSlides } = ctx
  const p = palette(ctx)
  const handle = handleVisivel(slide.handle)
  const sizeClass = titleSize(slide.title, "text-[3rem]", "text-[2.5rem]", "text-[2.05rem]")
  const body = slide.body || ""
  const benefits = body.includes("\n")
    ? body.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : []
  const pillBg = p.isDark ? "#FFFFFF" : "#0A0A0F"
  const pillInk = p.isDark ? "#0A0A0F" : "#FFFFFF"
  const cut = isCutoutActive(ctx.slide.image)

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg, color: p.muted }}
    >
      <Ghost text={slide.category || ""} color={p.ghost} fontClass={fontClass} className="right-[-6%] top-[48%]" />

      <div className="relative z-10 flex-shrink-0 px-5 pt-4 flex items-center justify-between">
        <TinyLabel color={p.faint}>{handle}</TinyLabel>
        <TinyLabel color={p.faint}>{counter(orderIndex, totalSlides)}</TinyLabel>
      </div>

      <div className="relative z-10 flex-shrink-0 px-5 pt-4">
        {slide.subtitle && (
          <p
            className={`${SCRIPT_CLASS} text-[1.5rem] leading-[1] line-clamp-2 mb-1`}
            style={{ color: p.ink }}
          >
            {slide.subtitle}
          </p>
        )}
        <FitText
          className={`${sizeClass} uppercase tracking-[-0.03em] ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.9, color: p.ink }}
          maxLines={3}
        >
          <StyledWords
            text={slide.title}
            words={slide.highlight_words || []}
            className={SCRIPT_IN_TITLE}
            style={{ fontSize: "1.08em", fontWeight: 700 }}
          />
        </FitText>

        {benefits.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5 max-w-[92%]">
            {benefits.map((b, i) => (
              <p
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold leading-[1.3] line-clamp-1"
                style={{
                  backgroundColor: i % 2 === 1 ? pillInk : pillBg,
                  color: i % 2 === 1 ? pillBg : pillInk,
                  border: `1px solid ${pillBg}`,
                }}
              >
                {b}
              </p>
            ))}
          </div>
        ) : (
          body && (
            <p className="mt-3 text-[13px] leading-[1.45] whitespace-pre-line line-clamp-3 max-w-[92%]">
              {parseBoldInline(body)}
            </p>
          )
        )}

        <div className="mt-3 flex items-center gap-2">
          <Pill variant={p.pillVariant}>{slide.category || "Salve este post"}</Pill>
          <ArrowCta color={p.ink} />
        </div>
      </div>

      <div className="relative z-[5] flex-1 min-h-[110px] mt-2">
        {cut ? (
          <CutoutStage image={slide.images[0]} swirlColor={p.swirl} side="right" className="top-[-26%]" />
        ) : (
          <PhotoFill image={slide.images[0]} overlay={p.fadeTop} />
        )}
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor={p.ink} />
    </div>
  )
}

export const colagemStyle: StyleRenderer = {
  render(ctx) {
    if (ctx.isCover) return <CoverColagem {...ctx} />
    if (ctx.isLast) return <SplitColagemCta {...ctx} />
    if (ctx.isMidBreak) return <SplitColagemPhotoTop {...ctx} />
    return <SplitColagemPhotoBottom {...ctx} />
  },
}
