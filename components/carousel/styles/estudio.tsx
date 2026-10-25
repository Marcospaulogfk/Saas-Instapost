"use client"

// ============================================================================
// Estilo ESTÚDIO — grade "Herground": creme claro, título ENORME em letras
// minúsculas na cor da marca, etiquetas minúsculas nos cantos, rodapé com uma
// descrição curta à esquerda e uma seta fina à direita.
//
//   capa      → título gigante (palavra destacada sublinhada) + foto recortada
//               numa forma orgânica + descrição/seta no rodapé
//   conteúdo  → alterna: foto full-bleed no topo (~42%) + título/corpo;
//               slide SÓLIDO na cor da marca com texto creme (meio do
//               carrossel); título + corpo com muito respiro (destaque em
//               itálico serifado)
//   último    → título + corpo + pílula com o cta_badge na cor da marca + seta
//
// Cores: "vinho" da referência = `accent` (cor da marca validada por contraste
// sobre fundo claro). Fundo creme fixo; com `bgOverride` o root usa a cor do
// usuário e os textos derivam de splitTheme().
// ============================================================================
import type { ReactNode } from "react"
import { handleVisivel } from "@/lib/carousel/handle-visivel"
import {
  Attribution,
  FitText,
  ShrinkToFit,
  parseBoldInline,
  splitTheme,
} from "../editorial-shared"
import { PhotoBox, SERIF_ITALIC_CLASS, StyledWords, TinyLabel, titleSizeFor } from "./shared"
import type { StyleRenderer, StyleRouteContext } from "./types"

const CREAM = "#F3EFE8"
const INK = "#1A1A1A"

/** Forma orgânica (blob) que recorta a foto — a "mancha" da referência. */
const BLOB_RADIUS = "58% 42% 47% 53% / 46% 55% 45% 54%"

interface Palette {
  bg: string
  text: string
  muted: string
  faint: string
  accent: string
}

/** Paleta do slide creme (ou do fundo escolhido pelo usuário). */
function creamPalette(ctx: StyleRouteContext): Palette {
  const th = splitTheme(ctx.bgOverride)
  return {
    bg: th?.bg ?? CREAM,
    text: th?.text ?? INK,
    muted: th?.muted ?? "rgba(26,26,26,0.72)",
    faint: th?.faint ?? "rgba(26,26,26,0.55)",
    accent: ctx.accentForBg(ctx.accentOnLight),
  }
}

/** Paleta do slide SÓLIDO (fundo = cor da marca, texto creme). */
function solidPalette(ctx: StyleRouteContext): Palette {
  const th = splitTheme(ctx.bgOverride)
  if (th) {
    return {
      bg: th.bg,
      text: th.text,
      muted: th.muted,
      faint: th.faint,
      accent: ctx.accentForBg(ctx.accentOnLight),
    }
  }
  return {
    bg: ctx.accentOnLight,
    text: CREAM,
    muted: "rgba(243,239,232,0.82)",
    faint: "rgba(243,239,232,0.65)",
    accent: CREAM,
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/**
 * Corpo "longo" = já ocupa o slide (4+ linhas de ~45 caracteres ou 3+ quebras);
 * aí o subtítulo repetido no rodapé some, pra não espremer o texto.
 */
function corpoLongo(body?: string): boolean {
  if (!body) return false
  const quebras = body.split("\n").length - 1
  return body.length > 135 || quebras >= 3
}

// ---------------------------------------------------------------------------
// Peças locais
// ---------------------------------------------------------------------------

/** Topo: nome da marca à esquerda, etiquetas empilhadas à direita. */
function StudioHeader({
  left,
  tags,
  color,
}: {
  left: string
  tags: string[]
  color: string
}) {
  const list = tags.filter((t) => !!t)
  return (
    <div className="flex-shrink-0 px-6 pt-5 flex items-start justify-between gap-4">
      <TinyLabel color={color}>{left}</TinyLabel>
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

/** Seta fina e comprida do rodapé. */
function ThinArrow({ color }: { color: string }) {
  return (
    <span
      data-edit="meta"
      className="leading-none flex-shrink-0 select-none"
      style={{ color, fontSize: 30, fontWeight: 300 }}
    >
      →
    </span>
  )
}

/** Pílula da chamada final (cta_badge) na cor da marca. */
function BadgePill({
  children,
  bg,
  color,
}: {
  children: ReactNode
  bg: string
  color: string
}) {
  return (
    <span
      data-edit="badge"
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </span>
  )
}

/** Título em minúsculas, pesado, na cor da marca; destaque sublinhado ou em itálico serifado. */
function StudioTitle({
  text,
  words,
  color,
  fontClass,
  size,
  mode,
  maxLines = 4,
}: {
  text: string
  words: string[]
  color: string
  fontClass: string
  size: string
  mode: "underline" | "italic"
  maxLines?: number
}) {
  return (
    <FitText
      className={`${size} lowercase ${fontClass}`}
      style={{ fontWeight: 800, lineHeight: 0.93, letterSpacing: "-0.03em", color }}
      maxLines={maxLines}
    >
      <StyledWords
        text={text}
        words={words}
        className={
          mode === "italic"
            ? `${SERIF_ITALIC_CLASS} font-medium`
            : "underline decoration-[0.06em] underline-offset-[0.1em]"
        }
      />
    </FitText>
  )
}

function BodyText({
  body,
  color,
  clamp = "line-clamp-5",
}: {
  body?: string
  color: string
  /** line-clamp-4 nos slides com foto (corpo nunca abaixo de 13px). */
  clamp?: string
}) {
  if (!body) return null
  return (
    <p
      className={`mt-4 text-[13px] leading-[1.55] whitespace-pre-line ${clamp}`}
      style={{ color }}
    >
      {parseBoldInline(body)}
    </p>
  )
}

/** Rodapé: descrição curta (ou contador) à esquerda, seta à direita. */
function StudioFooter({
  left,
  color,
  arrowColor,
}: {
  left: ReactNode
  color: string
  arrowColor: string
}) {
  return (
    <div
      className="flex-shrink-0 px-6 pt-4 pb-5 flex items-end justify-between gap-4"
      style={{ color }}
    >
      {left ?? <span />}
      <ThinArrow color={arrowColor} />
    </div>
  )
}

function FooterNote({ text, color }: { text?: string; color: string }) {
  if (!text) return <span />
  return (
    <p
      className="text-[10px] uppercase tracking-[0.08em] leading-[1.45] line-clamp-3 max-w-[62%]"
      style={{ color }}
    >
      {text}
    </p>
  )
}

// ---------------------------------------------------------------------------
// CAPA
// ---------------------------------------------------------------------------

function StudioCover(ctx: StyleRouteContext) {
  const p = creamPalette(ctx)
  const d = ctx.coverData
  const handle = handleVisivel(d.handle)
  const left = handle || d.brand_label || ""
  const tags = [d.category || "", d.brand_label && d.brand_label !== left ? d.brand_label : ""]
  const size = titleSizeFor(d.title, "text-[3.4rem]", "text-[2.9rem]", "text-[2.4rem]")

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg }}
    >
      <StudioHeader left={left} tags={tags} color={p.faint} />

      {/* ZONA DE TÍTULO — sólida */}
      <div className="flex-shrink-0 px-6 pt-6">
        <StudioTitle
          text={d.title}
          words={d.highlight_words || []}
          color={p.accent}
          fontClass={ctx.fontClass}
          size={size}
          mode="underline"
        />
      </div>

      {/* ZONA DE FOTO — água, recortada numa forma orgânica */}
      <div className="flex-1 min-h-0 px-6 pt-5 flex justify-end">
        <div className="h-full w-[78%] overflow-hidden" style={{ borderRadius: BLOB_RADIUS }}>
          <PhotoBox image={d.image} className="h-full w-full" />
        </div>
      </div>

      <StudioFooter
        left={<FooterNote text={d.subtitle} color={p.muted} />}
        color={p.muted}
        arrowColor={p.text}
      />

      <Attribution attribution={d.image.attribution} textColor={p.text} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// CONTEÚDO
// ---------------------------------------------------------------------------

function StudioContent(ctx: StyleRouteContext) {
  const s = ctx.splitData
  const variant: "last" | "solid" | "photo" | "text" = ctx.isLast
    ? "last"
    : ctx.isMidBreak
      ? "solid"
      : ctx.orderIndex % 2 === 1
        ? "photo"
        : "text"
  const p = variant === "solid" ? solidPalette(ctx) : creamPalette(ctx)
  const handle = handleVisivel(s.handle)
  const left = handle || s.brand_label || ""
  const tags = [s.category || "", s.brand_label && s.brand_label !== left ? s.brand_label : ""]
  const words = s.highlight_words || []
  const counter = `${pad2(ctx.orderIndex + 1)} / ${pad2(ctx.totalSlides)}`
  const image = s.images[0]

  // ----- (a) foto full-bleed no topo + título/corpo embaixo -----
  if (variant === "photo") {
    const size = titleSizeFor(s.title, "text-[2.4rem]", "text-[2.1rem]", "text-[1.8rem]")
    return (
      <div
        className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
        style={{ backgroundColor: p.bg }}
      >
        <StudioHeader left={left} tags={tags} color={p.faint} />

        {/* FOTO — tamanho fixo (uniforme entre slides); menor pra sobrar
            espaço de leitura: texto legível vale mais que foto grande */}
        <div className="flex-[0_0_34%] min-h-0 mt-4">
          <PhotoBox image={image} className="h-full w-full" />
        </div>

        {/* TEXTO — encolhe no máximo 15%; o resto o line-clamp corta na linha */}
        <ShrinkToFit className="flex-1" innerClassName="px-6 pt-5" minScale={0.85}>
          <StudioTitle
            text={s.title}
            words={words}
            color={p.accent}
            fontClass={ctx.fontClass}
            size={size}
            mode="underline"
          />
          <BodyText body={s.body} color={p.muted} clamp="line-clamp-4" />
        </ShrinkToFit>

        <StudioFooter
          left={
            <span
              data-edit="meta"
              className="text-[9px] uppercase tracking-[0.2em] font-semibold tabular-nums"
              style={{ color: p.faint }}
            >
              {counter}
            </span>
          }
          color={p.muted}
          arrowColor={p.text}
        />

        <Attribution attribution={image?.attribution || null} textColor={p.text} />
      </div>
    )
  }

  // ----- (d) último: fechamento com cta_badge em pílula -----
  if (variant === "last") {
    const size = titleSizeFor(s.title, "text-[3rem]", "text-[2.6rem]", "text-[2.2rem]")
    const cta = ctx.slide.cta_badge || s.category || "Vamos conversar"
    return (
      <div
        className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
        style={{ backgroundColor: p.bg }}
      >
        <StudioHeader left={left} tags={tags} color={p.faint} />

        <div className="flex-1 min-h-0 px-6 pt-6 flex flex-col justify-center">
          <StudioTitle
            text={s.title}
            words={words}
            color={p.accent}
            fontClass={ctx.fontClass}
            size={size}
            mode="italic"
          />
          <BodyText body={s.body || s.subtitle} color={p.muted} />
        </div>

        <StudioFooter
          left={
            <BadgePill bg={p.accent} color={ctx.bgOverride ? p.bg : CREAM}>
              {cta}
            </BadgePill>
          }
          color={p.muted}
          arrowColor={p.text}
        />

        <Attribution attribution={image?.attribution || null} textColor={p.text} />
      </div>
    )
  }

  // ----- (b) sólido na cor da marca / (c) texto com respiro -----
  // Regra da casa: slide de conteúdo nunca perde a foto que a IA/usuário
  // escolheu. Com foto, ela entra como cartão fixo embaixo do texto (28%);
  // sem foto, o slide fica só-texto como na referência.
  const hasPhoto = !!image?.url
  const size = hasPhoto
    ? titleSizeFor(s.title, "text-[2.4rem]", "text-[2.1rem]", "text-[1.8rem]")
    : titleSizeFor(s.title, "text-[3rem]", "text-[2.6rem]", "text-[2.2rem]")
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: p.bg }}
    >
      <StudioHeader left={left} tags={tags} color={p.faint} />

      <div
        className={`flex-1 min-h-0 px-6 pt-6 flex flex-col ${hasPhoto ? "justify-end" : "justify-center"}`}
      >
        <StudioTitle
          text={s.title}
          words={words}
          color={variant === "solid" ? p.text : p.accent}
          fontClass={ctx.fontClass}
          size={size}
          mode={variant === "solid" ? "underline" : "italic"}
        />
        <BodyText body={s.body} color={p.muted} />
      </div>

      {hasPhoto && (
        <div className="flex-[0_0_28%] min-h-0 px-6 pt-4">
          <PhotoBox image={image} className="h-full w-full" rounded="rounded-md" />
        </div>
      )}

      <StudioFooter
        left={<FooterNote text={corpoLongo(s.body) ? "" : s.subtitle} color={p.muted} />}
        color={p.muted}
        arrowColor={p.text}
      />

      <Attribution attribution={image?.attribution || null} textColor={p.text} />
    </div>
  )
}

export const estudioStyle: StyleRenderer = {
  render(ctx) {
    if (ctx.isCover) return <StudioCover {...ctx} />
    return <StudioContent {...ctx} />
  },
}
