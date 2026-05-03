"use client"

import {
  Attribution,
  HighlightedText,
  PaginationDots,
  Pill,
  type SlideAttribution,
} from "./editorial-shared"
import {
  CoverWesleyGemini,
  CoverWesleyInternet,
  CoverWesleyLabios,
  CoverWesleyChurrasco,
  CoverBrandsdecodedMassive,
  CoverBrandsdecodedPortrait,
  type CoverSlideData,
} from "./editorial-covers"
import {
  SplitWesleyDark,
  SplitBrandsdecodedLight,
  SplitBrandsdecodedDarkSerif,
  SplitBoloCream,
  SplitMyPostFlowCta,
  type SplitSlideData,
  type SplitImageSlot,
} from "./editorial-splits"

export interface PreviewSlide {
  order_index: number
  title: string
  highlight_words: string[]
  subtitle: string
  body?: string
  cta_badge?: string
  image: {
    url: string | null
    source: "ai" | "unsplash" | null
    attribution: SlideAttribution | null
    error: string | null
  }
}

/** Estilo visual do carrossel — escolhe família de variantes pra capa e splits. */
export type EditorialStyle =
  | "auto" // alternância antiga (cover/image-top/image-bg/image-bottom)
  | "wesley" // capas wesley + splits dark
  | "brandsdecoded" // capas brandsdecoded + splits light/dark-serif
  | "bolo" // capa wesley-labios + splits bolo-cream
  | "mypostflow" // capa wesley + splits mypostflow

interface SlidePreviewProps {
  slide: PreviewSlide
  totalSlides: number
  template: "editorial" | "cinematic" | "hybrid"
  brandColors: string[]
  fontClass: string
  showDevBadges?: boolean
  /** Estilo do template editorial. Default 'auto'. */
  editorialStyle?: EditorialStyle
  /** Handle exibido nas pills/avatar. Default '@brand'. */
  handle?: string
  /** URL do avatar (foto) — opcional, usa iniciais como fallback. */
  handleAvatar?: string
  /** Brand label pros styles brandsdecoded. Default 'Content Machine'. */
  brandLabel?: string
  /** Cor do bg "claro" no auto-legacy. Default cream. */
  lightBg?: string
  /** Cor do bg "escuro" no auto-legacy. Default preto. */
  darkBg?: string
}

export function SlidePreview({
  slide,
  totalSlides,
  template,
  brandColors,
  fontClass,
  showDevBadges = true,
  editorialStyle = "auto",
  handle = "@brand",
  handleAvatar,
  brandLabel = "Content Machine",
  lightBg = "#FAF8F5",
  darkBg = "#0A0A0A",
}: SlidePreviewProps) {
  const accent = brandColors[0] || "#FBBF24"
  const dark = brandColors[1] || "#1A1A1A"
  const light = brandColors[2] || "#FAF8F5"

  const inner =
    template === "editorial" ? (
      <EditorialSlideRouter
        slide={slide}
        totalSlides={totalSlides}
        accent={accent}
        dark={dark}
        light={light}
        fontClass={fontClass}
        editorialStyle={editorialStyle}
        handle={handle}
        handleAvatar={handleAvatar}
        brandLabel={brandLabel}
        lightBg={lightBg}
        darkBg={darkBg}
      />
    ) : template === "hybrid" ? (
      <HybridSlide
        slide={slide}
        totalSlides={totalSlides}
        accent={accent}
        fontClass={fontClass}
      />
    ) : (
      <CinematicSlide
        slide={slide}
        totalSlides={totalSlides}
        accent={accent}
        fontClass={fontClass}
      />
    )

  return (
    <div className="relative">
      {inner}
      {showDevBadges && slide.image.source && (
        <div
          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider z-20 ${
            slide.image.source === "ai"
              ? "bg-cyan-400 text-black"
              : "bg-zinc-700 text-white"
          }`}
        >
          {slide.image.source === "ai" ? "🤖 IA" : "📷 UNSPLASH"}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Adapter — converte PreviewSlide pra SlideData esperado pelos componentes
// ============================================================================

function toCoverSlideData(
  slide: PreviewSlide,
  extras: { handle: string; handleAvatar?: string; brandLabel: string },
): CoverSlideData {
  return {
    title: slide.title,
    subtitle: slide.subtitle,
    highlight_words: slide.highlight_words,
    image: {
      url: slide.image.url,
      attribution: slide.image.attribution,
      error: slide.image.error,
    },
    handle: extras.handle,
    handle_avatar: extras.handleAvatar,
    category: slide.cta_badge || "Editorial",
    brand_label: extras.brandLabel,
    year_label: `${new Date().getFullYear()} //`,
  }
}

function toSplitSlideData(
  slide: PreviewSlide,
  extras: { handle: string; handleAvatar?: string; brandLabel: string },
): SplitSlideData {
  return {
    title: slide.title,
    body: slide.body,
    subtitle: slide.subtitle,
    highlight_words: slide.highlight_words,
    images: [
      {
        url: slide.image.url,
        attribution: slide.image.attribution,
        error: slide.image.error,
      },
    ],
    handle: extras.handle,
    handle_avatar: extras.handleAvatar,
    category: slide.cta_badge || "Conteúdo",
    brand_label: extras.brandLabel,
    year_label: `${new Date().getFullYear()} //`,
  }
}

// ============================================================================
// Router — decide qual variant renderizar baseado em editorialStyle + index
// ============================================================================

interface RouterProps {
  slide: PreviewSlide
  totalSlides: number
  accent: string
  dark: string
  light: string
  fontClass: string
  editorialStyle: EditorialStyle
  handle: string
  handleAvatar?: string
  brandLabel: string
  lightBg: string
  darkBg: string
}

function EditorialSlideRouter(props: RouterProps) {
  const {
    slide,
    totalSlides,
    accent,
    dark,
    light,
    fontClass,
    editorialStyle,
    handle,
    handleAvatar,
    brandLabel,
  } = props

  const isCover = slide.order_index === 0
  const isLast = slide.order_index === totalSlides - 1
  const middleIdx = totalSlides >= 5 ? Math.floor(totalSlides / 2) : -1
  const isMidBreak = slide.order_index === middleIdx

  const coverData = toCoverSlideData(slide, { handle, handleAvatar, brandLabel })
  const splitData = toSplitSlideData(slide, { handle, handleAvatar, brandLabel })

  const baseProps = {
    totalSlides,
    orderIndex: slide.order_index,
    accent,
    fontClass,
  }

  // Debug
  if (typeof window !== "undefined") {
    console.log(
      `[SlidePreview] slide ${slide.order_index + 1}/${totalSlides} · style=${editorialStyle} · ${
        isCover ? "COVER" : isMidBreak ? "MID-BREAK" : "SPLIT"
      }`,
    )
  }

  // ===== STYLE: WESLEY =====
  if (editorialStyle === "wesley") {
    if (isCover) {
      const tag = (slide.cta_badge || "").toLowerCase()
      if (tag.includes("passo") || tag.includes("tutorial") || tag.includes("como"))
        return <CoverWesleyGemini slide={coverData} {...baseProps} />
      if (tag.includes("benefício") || tag.includes("ideia") || tag.includes("dica"))
        return <CoverWesleyLabios slide={coverData} {...baseProps} />
      if (tag.includes("erro") || tag.includes("pare") || tag.includes("não"))
        return <CoverWesleyChurrasco slide={coverData} {...baseProps} />
      return <CoverWesleyInternet slide={coverData} {...baseProps} />
    }
    const slot: SplitImageSlot = isLast
      ? "single-bottom"
      : isMidBreak
        ? "composition-top"
        : slide.order_index % 3 === 1
          ? "single-bottom"
          : slide.order_index % 3 === 2
            ? "comparison-bottom"
            : "none"
    // composition-top precisa de 2 imagens; comparison-bottom também
    const splitDataExpanded =
      slot === "composition-top" || slot === "comparison-bottom"
        ? { ...splitData, images: [splitData.images[0], splitData.images[0]] }
        : splitData
    return <SplitWesleyDark slide={splitDataExpanded} {...baseProps} imageSlot={slot} />
  }

  // ===== STYLE: BRANDSDECODED =====
  if (editorialStyle === "brandsdecoded") {
    if (isCover) {
      return <CoverBrandsdecodedMassive slide={coverData} {...baseProps} />
    }
    if (isMidBreak) {
      return (
        <SplitBrandsdecodedDarkSerif
          slide={splitData}
          {...baseProps}
          imageSlot="single-bottom"
        />
      )
    }
    const slot: SplitImageSlot =
      slide.order_index % 3 === 1
        ? "single-top"
        : slide.order_index % 3 === 2
          ? "single-middle"
          : "bottom-card"
    const expanded =
      slot === "bottom-card"
        ? {
            ...splitData,
            images: [splitData.images[0], splitData.images[0], splitData.images[0]],
            callout: "Esse carrossel foi feito no Claude.",
          }
        : splitData
    return (
      <SplitBrandsdecodedLight
        slide={expanded}
        {...baseProps}
        imageSlot={slot}
        titleSize="massive"
      />
    )
  }

  // ===== STYLE: BOLO =====
  if (editorialStyle === "bolo") {
    if (isCover) {
      return <CoverWesleyLabios slide={coverData} {...baseProps} />
    }
    return (
      <SplitBoloCream
        slide={splitData}
        {...baseProps}
        imageSlot={isLast ? "none" : "bottom-card"}
      />
    )
  }

  // ===== STYLE: MYPOSTFLOW =====
  if (editorialStyle === "mypostflow") {
    if (isCover) {
      return <CoverWesleyChurrasco slide={coverData} {...baseProps} />
    }
    if (isLast) {
      return (
        <SplitMyPostFlowCta
          slide={splitData}
          {...baseProps}
          imageSlot="bottom-large"
        />
      )
    }
    const slot: SplitImageSlot = isMidBreak
      ? "composition-top"
      : slide.order_index % 2 === 1
        ? "single-bottom"
        : "none"
    const expanded =
      slot === "composition-top"
        ? { ...splitData, images: [splitData.images[0], splitData.images[0]] }
        : splitData
    return <SplitWesleyDark slide={expanded} {...baseProps} imageSlot={slot} />
  }

  // ===== STYLE: AUTO (legacy) =====
  return (
    <LegacyEditorialSlide
      slide={slide}
      totalSlides={totalSlides}
      accent={accent}
      dark={dark}
      light={light}
      fontClass={fontClass}
      handle={handle}
      lightBg={lightBg}
      darkBg={darkBg}
    />
  )
}

// ============================================================================
// Legacy: sistema de variantes original (cover/image-top/image-bg/image-bottom)
// ============================================================================

type LegacyVariant = "cover" | "image-top" | "image-bg" | "image-bottom"

function pickLegacyVariant(orderIndex: number, totalSlides: number): LegacyVariant {
  if (orderIndex === 0) return "cover"
  const middleBreakIdx = totalSlides >= 5 ? Math.floor(totalSlides / 2) : -1
  if (orderIndex === middleBreakIdx) return "image-bg"
  return orderIndex % 2 === 1 ? "image-top" : "image-bottom"
}

function LegacyEditorialSlide({
  slide,
  totalSlides,
  accent,
  dark,
  light,
  fontClass,
  handle,
  lightBg,
  darkBg,
}: {
  slide: PreviewSlide
  totalSlides: number
  accent: string
  dark: string
  light: string
  fontClass: string
  handle: string
  lightBg: string
  darkBg: string
}) {
  const variant = pickLegacyVariant(slide.order_index, totalSlides)
  const categoryTag = slide.cta_badge || "Editorial"

  // Alterna bg dark/light entre splits ímpares e pares pra dar variedade
  // (sem isso ficavam todos no mesmo bg cream).
  const isDarkSplit = slide.order_index % 2 === 0 // par = dark, ímpar = light
  const splitBg = isDarkSplit ? darkBg : lightBg
  const splitText = isDarkSplit ? "#FFFFFF" : dark
  const splitTextMuted = isDarkSplit ? "rgba(255,255,255,0.85)" : dark
  const splitTextOpacity = isDarkSplit ? 0.85 : 0.7

  if (variant === "cover") {
    return (
      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
        {slide.image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.image.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[10px] px-4 text-center">
            {slide.image.error || "sem imagem"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Pill>{handle}</Pill>
          <Pill>{categoryTag}</Pill>
        </div>

        <div className="absolute inset-x-5 top-[44%] z-10 space-y-3">
          <h1
            className={`text-[2.5rem] uppercase leading-[0.98] tracking-tight text-white ${fontClass}`}
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
          >
            <HighlightedText
              text={slide.title}
              words={slide.highlight_words}
              color={accent}
            />
          </h1>
          {slide.subtitle && <p className="text-sm text-white/85">{slide.subtitle}</p>}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
          <Pill>{categoryTag}</Pill>
          <PaginationDots total={totalSlides} active={slide.order_index} color="#FFFFFF" />
          <Pill>{`arrasta →`}</Pill>
        </div>

        <Attribution attribution={slide.image.attribution} textColor="#fff" />
      </div>
    )
  }

  if (variant === "image-bg") {
    return (
      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
        {slide.image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.image.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[10px] px-4 text-center">
            {slide.image.error || "sem imagem"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Pill>{handle}</Pill>
          <Pill>{categoryTag}</Pill>
        </div>

        <div className="absolute bottom-20 left-5 right-5 z-10 space-y-2.5">
          <h1
            className={`text-[2rem] uppercase leading-[1.02] tracking-tight text-white ${fontClass}`}
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
          >
            <HighlightedText
              text={slide.title}
              words={slide.highlight_words}
              color={accent}
            />
          </h1>
          {slide.subtitle && <p className="text-xs text-white/85">{slide.subtitle}</p>}
          {slide.body && (
            <p className="text-[11px] text-white/75 leading-relaxed line-clamp-3">
              {slide.body}
            </p>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
          <Pill>{categoryTag}</Pill>
          <PaginationDots total={totalSlides} active={slide.order_index} color="#FFFFFF" />
          <Pill>{`arrasta →`}</Pill>
        </div>

        <Attribution attribution={slide.image.attribution} textColor="#fff" />
      </div>
    )
  }

  // image-top OU image-bottom — alterna bg dark/light por idx pra variedade
  const imageOnTop = variant === "image-top"
  const pillVariant = isDarkSplit ? "dark" : "light"

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative grid grid-rows-[auto_minmax(0,1fr)_auto]"
      style={{ backgroundColor: splitBg, color: splitText }}
    >
      <div className="px-4 pt-4 flex items-center justify-between z-10">
        <Pill variant={pillVariant}>{handle}</Pill>
        <Pill variant={pillVariant}>{categoryTag}</Pill>
      </div>

      <div
        className={`px-5 flex flex-col gap-3 min-h-0 ${
          imageOnTop ? "justify-start" : "justify-end pb-1"
        }`}
      >
        {imageOnTop && (
          <LegacySlideImage
            slide={slide}
            placeholderBg={isDarkSplit ? "#FFFFFF" : dark}
            placeholderText={isDarkSplit ? dark : light}
          />
        )}

        <div className="space-y-1.5 overflow-hidden">
          <h1
            className={`text-[1.7rem] leading-[1.1] tracking-tight ${fontClass}`}
            style={{ color: splitText }}
          >
            <HighlightedText
              text={slide.title}
              words={slide.highlight_words}
              color={accent}
            />
          </h1>
          {slide.subtitle && (
            <p className="text-xs" style={{ color: splitTextMuted, opacity: splitTextOpacity }}>
              {slide.subtitle}
            </p>
          )}
          {slide.body && (
            <p
              className="text-[11px] leading-relaxed line-clamp-3"
              style={{ color: splitTextMuted, opacity: splitTextOpacity }}
            >
              {slide.body}
            </p>
          )}
        </div>

        {!imageOnTop && (
          <LegacySlideImage
            slide={slide}
            placeholderBg={isDarkSplit ? "#FFFFFF" : dark}
            placeholderText={isDarkSplit ? dark : light}
          />
        )}
      </div>

      <div className="px-4 pb-4 pt-2 flex items-center justify-between">
        <Pill variant={pillVariant}>{categoryTag}</Pill>
        <PaginationDots total={totalSlides} active={slide.order_index} color={splitText} />
        <Pill variant={pillVariant}>{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.image.attribution} textColor={splitText} />
    </div>
  )
}

function LegacySlideImage({
  slide,
  placeholderBg,
  placeholderText,
}: {
  slide: PreviewSlide
  placeholderBg: string
  placeholderText: string
}) {
  if (slide.image.url) {
    return (
      <div className="rounded-md overflow-hidden flex-shrink-0" style={{ height: "44%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image.url} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className="rounded-md flex items-center justify-center text-[10px] px-2 text-center flex-shrink-0"
      style={{ height: "44%", backgroundColor: placeholderBg, color: placeholderText, opacity: 0.4 }}
    >
      {slide.image.error || "sem imagem"}
    </div>
  )
}

// ============================================================================
// Templates não-editorial (mantidos)
// ============================================================================

function CinematicSlide({
  slide,
  totalSlides,
  accent,
  fontClass,
}: {
  slide: PreviewSlide
  totalSlides: number
  accent: string
  fontClass: string
}) {
  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
      {slide.image.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[10px] px-4 text-center">
          {slide.image.error || "sem imagem"}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />

      {slide.cta_badge && (
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold z-10"
          style={{ backgroundColor: accent, color: "#000" }}
        >
          {slide.cta_badge}
        </div>
      )}

      <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 z-10">
        <h1
          className={`text-4xl uppercase leading-[0.95] text-white tracking-tight ${fontClass}`}
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-xs text-white/85 mt-3 uppercase tracking-wider font-medium">
            {slide.subtitle}
          </p>
        )}
      </div>

      {slide.body && (
        <div className="absolute bottom-12 left-5 right-5 z-10">
          <p className="text-xs text-white/80 leading-relaxed">{slide.body}</p>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === slide.order_index ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

/** Stories 9:16 — formato vertical do Instagram Stories. */
function HybridSlide({
  slide,
  totalSlides,
  accent,
  fontClass,
}: {
  slide: PreviewSlide
  totalSlides: number
  accent: string
  fontClass: string
}) {
  return (
    <div className="aspect-[9/16] w-full rounded-xl overflow-hidden relative bg-black">
      {slide.image.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-[10px] px-4 text-center">
          {slide.image.error || "sem imagem"}
        </div>
      )}

      {/* Story progress bar (Instagram-style) */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <span
            key={i}
            className="flex-1 h-0.5 rounded-full"
            style={{
              backgroundColor:
                i < slide.order_index
                  ? "rgba(255,255,255,0.85)"
                  : i === slide.order_index
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      {/* Top: handle + tag */}
      <div className="absolute top-6 inset-x-0 px-4 z-10">
        <div className="flex items-center justify-between text-white text-[11px] font-medium">
          <span className="opacity-90">
            {slide.cta_badge || `Story ${slide.order_index + 1}`}
          </span>
        </div>
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

      {/* Título centralizado vertical */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-10">
        <h1
          className={`text-3xl uppercase leading-[0.95] text-white tracking-tight ${fontClass}`}
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-sm text-white/90 mt-3">{slide.subtitle}</p>
        )}
      </div>

      {/* Bottom: body + CTA */}
      {slide.body && (
        <div className="absolute bottom-16 left-6 right-6 z-10">
          <p className="text-xs text-white/85 leading-relaxed line-clamp-3">
            {slide.body}
          </p>
        </div>
      )}

      {/* CTA "arrasta pra cima" do Stories */}
      <div className="absolute bottom-5 inset-x-0 flex flex-col items-center gap-1 z-10 text-white/85">
        <span className="text-base">↑</span>
        <span className="text-[10px] uppercase tracking-wider font-medium">
          arrasta pra cima
        </span>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}
