"use client"

import {
  Attribution,
  HighlightedText,
  PaginationDots,
  PHOTO_FOCUS,
  Pill,
  type SlideAttribution,
} from "./editorial-shared"
import { readableAccent, isLightColor } from "@/lib/color-contrast"
import {
  CoverWesleyGemini,
  CoverWesleyInternet,
  CoverWesleyLabios,
  CoverWesleyChurrasco,
  CoverBrandsdecodedMassive,
  CoverBrandsdecodedPortrait,
  CoverGradientGlow,
  CoverMinimalClean,
  CoverSeamlessFlow,
  type CoverSlideData,
} from "./editorial-covers"
import {
  SplitWesleyDark,
  SplitBrandsdecodedLight,
  SplitBrandsdecodedDarkSerif,
  SplitBoloCream,
  SplitMyPostFlowCta,
  SplitGradientDark,
  SplitMinimalClean,
  SplitSeamlessFlow,
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
    source: "ai" | "unsplash" | "wikimedia" | null
    attribution: SlideAttribution | null
    error: string | null
  }
  /** Imagens adicionais (cenas DIFERENTES) quando a IA decide que o slide
   *  mostra mais de uma coisa. Vazio na maioria. Usadas em layouts de
   *  comparação/composição — nunca duplicam a principal. */
  extra_images?: Array<{
    url: string | null
    source: "ai" | "unsplash" | "wikimedia" | null
    attribution: SlideAttribution | null
    error: string | null
  }>
}

/** Estilo visual do carrossel — escolhe família de variantes pra capa e splits. */
export type EditorialStyle =
  | "auto" // alternância antiga (cover/image-top/image-bg/image-bottom)
  | "wesley" // capas wesley + splits dark
  | "brandsdecoded" // capas brandsdecoded + splits light/dark-serif
  | "bolo" // capa wesley-labios + splits bolo-cream
  | "mypostflow" // capa wesley + splits mypostflow
  | "gradient" // dark vibrante com glow do accent + highlights em gradiente
  | "minimal" // branco suíço: tipografia gigante + ghost numbers + hairlines
  | "seamless" // panorâmico: linha de progresso avança pelos slides (+completion)

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
  /** Formato do frame: "feed" (4:5) ou "stories" (9:16). Default "feed". */
  format?: "feed" | "stories"
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
  brandLabel = "",
  lightBg = "#FAF8F5",
  darkBg = "#0A0A0A",
  format = "feed",
}: SlidePreviewProps) {
  // REGRA GLOBAL: o accent (cor das palavras destacadas) precisa ser legível
  // sobre o fundo onde aparece. Paletas monocromáticas (ex: preto/branco/cinza)
  // escolhiam preto como destaque e ele sumia em fundos escuros/fotos.
  const accentCandidates = brandColors.length > 0 ? brandColors : ["#FBBF24"]
  const accentOnDark = readableAccent(accentCandidates, darkBg, "#FFFFFF")
  const accentOnLight = readableAccent(accentCandidates, lightBg, "#0A0A0F")
  const dark = brandColors[1] || "#1A1A1A"
  const light = brandColors[2] || "#FAF8F5"

  const inner =
    template === "editorial" ? (
      <EditorialSlideRouter
        slide={slide}
        totalSlides={totalSlides}
        accentOnDark={accentOnDark}
        accentOnLight={accentOnLight}
        dark={dark}
        light={light}
        fontClass={fontClass}
        editorialStyle={editorialStyle}
        handle={handle}
        handleAvatar={handleAvatar}
        brandLabel={brandLabel}
        lightBg={lightBg}
        darkBg={darkBg}
        format={format}
      />
    ) : template === "hybrid" ? (
      <HybridSlide
        slide={slide}
        totalSlides={totalSlides}
        accent={accentOnDark}
        fontClass={fontClass}
      />
    ) : (
      <CinematicSlide
        slide={slide}
        totalSlides={totalSlides}
        accent={accentOnDark}
        fontClass={fontClass}
      />
    )

  return (
    <div className="relative">
      {/* Em "stories" força o frame pra 9:16 (estica), sem tocar nos layouts. */}
      <div
        className={
          format === "stories" ? "w-full [&>*]:!aspect-[9/16]" : "contents"
        }
      >
        {inner}
      </div>
      {showDevBadges && slide.image.source && (
        <div
          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider z-20 ${
            slide.image.source === "ai"
              ? "bg-cyan-400 text-black"
              : "bg-zinc-700 text-white"
          }`}
        >
          {slide.image.source === "ai"
            ? "🤖 IA"
            : slide.image.source === "wikimedia"
              ? "🏢 REAL"
              : "📷 UNSPLASH"}
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
      // Imagens adicionais (cenas diferentes) que a IA decidiu incluir.
      ...(slide.extra_images ?? []).map((img) => ({
        url: img.url,
        attribution: img.attribution,
        error: img.error,
      })),
    ],
    handle: extras.handle,
    handle_avatar: extras.handleAvatar,
    category: slide.cta_badge || "Conteúdo",
    brand_label: extras.brandLabel,
    year_label: `${new Date().getFullYear()} //`,
  }
}

/**
 * Slot multi-imagem (comparação/composição/grid) só vale se a IA gerou 2+
 * imagens DISTINTAS. Senão cai pra uma imagem só — NUNCA duplica a mesma.
 */
function resolveImageSlot(slot: SplitImageSlot, imgCount: number): SplitImageSlot {
  const isMulti =
    slot === "composition-top" ||
    slot === "comparison-bottom" ||
    slot === "bottom-card"
  if (!isMulti) return slot
  if (imgCount >= 2) return slot
  if (imgCount >= 1) return "single-bottom"
  return "none"
}

// ============================================================================
// Router — decide qual variant renderizar baseado em editorialStyle + index
// ============================================================================

interface RouterProps {
  slide: PreviewSlide
  totalSlides: number
  /** Accent legível sobre fundo escuro/foto (já validado por contraste). */
  accentOnDark: string
  /** Accent legível sobre fundo claro (já validado por contraste). */
  accentOnLight: string
  dark: string
  light: string
  fontClass: string
  editorialStyle: EditorialStyle
  handle: string
  handleAvatar?: string
  brandLabel: string
  lightBg: string
  darkBg: string
  format: "feed" | "stories"
}

function EditorialSlideRouter(props: RouterProps) {
  const {
    slide,
    totalSlides,
    accentOnDark,
    accentOnLight,
    dark,
    light,
    fontClass,
    editorialStyle,
    handle,
    handleAvatar,
    brandLabel,
    lightBg,
    darkBg,
    format,
  } = props

  const isCover = slide.order_index === 0
  const isLast = slide.order_index === totalSlides - 1
  const middleIdx = totalSlides >= 5 ? Math.floor(totalSlides / 2) : -1
  const isMidBreak = slide.order_index === middleIdx

  const coverData = toCoverSlideData(slide, { handle, handleAvatar, brandLabel })
  const splitData = toSplitSlideData(slide, { handle, handleAvatar, brandLabel })
  // Quantas imagens DISTINTAS o slide realmente tem (decidido pela IA).
  const imgCount = splitData.images.filter((im) => im.url).length

  // Capas são todas sobre foto/fundo escuro (exceto minimal, branca); cada
  // split tem fundo fixo conhecido — o accent certo é escolhido por fundo.
  const basePropsDark = {
    totalSlides,
    orderIndex: slide.order_index,
    accent: accentOnDark,
    fontClass,
  }
  const basePropsLight = {
    totalSlides,
    orderIndex: slide.order_index,
    accent: accentOnLight,
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
        return <CoverWesleyGemini slide={coverData} {...basePropsDark} />
      if (tag.includes("benefício") || tag.includes("ideia") || tag.includes("dica"))
        return <CoverWesleyLabios slide={coverData} {...basePropsDark} />
      if (tag.includes("erro") || tag.includes("pare") || tag.includes("não"))
        return <CoverWesleyChurrasco slide={coverData} {...basePropsDark} />
      return <CoverWesleyInternet slide={coverData} {...basePropsDark} />
    }
    const rawSlot: SplitImageSlot = isLast
      ? "single-bottom"
      : isMidBreak
        ? "composition-top"
        : slide.order_index % 3 === 1
          ? "single-bottom"
          : slide.order_index % 3 === 2
            ? "comparison-bottom"
            : "none"
    const slot = resolveImageSlot(rawSlot, imgCount)
    return <SplitWesleyDark slide={splitData} {...basePropsDark} imageSlot={slot} />
  }

  // ===== STYLE: BRANDSDECODED =====
  if (editorialStyle === "brandsdecoded") {
    if (isCover) {
      return <CoverBrandsdecodedMassive slide={coverData} {...basePropsDark} />
    }
    if (isMidBreak) {
      return (
        <SplitBrandsdecodedDarkSerif
          slide={splitData}
          {...basePropsDark}
          imageSlot="single-bottom"
        />
      )
    }
    const rawSlot: SplitImageSlot =
      slide.order_index % 3 === 1
        ? "single-top"
        : slide.order_index % 3 === 2
          ? "single-middle"
          : "bottom-card"
    const slot = resolveImageSlot(rawSlot, imgCount)
    return (
      <SplitBrandsdecodedLight
        slide={splitData}
        {...basePropsLight}
        imageSlot={slot}
        titleSize="large"
      />
    )
  }

  // ===== STYLE: BOLO =====
  if (editorialStyle === "bolo") {
    if (isCover) {
      return <CoverWesleyLabios slide={coverData} {...basePropsDark} />
    }
    return (
      <SplitBoloCream
        slide={splitData}
        {...basePropsLight}
        imageSlot={imgCount >= 1 ? "bottom-card" : "none"}
      />
    )
  }

  // ===== STYLE: MYPOSTFLOW =====
  if (editorialStyle === "mypostflow") {
    if (isCover) {
      return <CoverWesleyChurrasco slide={coverData} {...basePropsDark} />
    }
    if (isLast) {
      return (
        <SplitMyPostFlowCta
          slide={splitData}
          {...basePropsLight}
          imageSlot="bottom-large"
        />
      )
    }
    const rawSlot: SplitImageSlot = isMidBreak
      ? "composition-top"
      : slide.order_index % 2 === 1
        ? "single-bottom"
        : "none"
    const slot = resolveImageSlot(rawSlot, imgCount)
    return <SplitWesleyDark slide={splitData} {...basePropsDark} imageSlot={slot} />
  }

  // ===== STYLE: GRADIENT (dark vibrante + glow) =====
  if (editorialStyle === "gradient") {
    if (isCover) {
      return <CoverGradientGlow slide={coverData} {...basePropsDark} />
    }
    // Imagem SEMPRE embaixo do texto em todo slide de conteúdo — nunca deixa
    // slide vazio (antes alternava e o slide 3 ficava sem imagem).
    const rawSlot: SplitImageSlot = isMidBreak ? "composition-top" : "single-bottom"
    const slot = resolveImageSlot(rawSlot, imgCount)
    return <SplitGradientDark slide={splitData} {...basePropsDark} imageSlot={slot} />
  }

  // ===== STYLE: MINIMAL (branco suíço) =====
  if (editorialStyle === "minimal") {
    if (isCover) {
      return <CoverMinimalClean slide={coverData} {...basePropsLight} />
    }
    // Imagem SEMPRE embaixo do texto, em TODO slide de conteúdo (nunca acima
    // da descrição, nunca slide sem foto).
    const slot = resolveImageSlot("single-bottom", imgCount)
    return <SplitMinimalClean slide={splitData} {...basePropsLight} imageSlot={slot} />
  }

  // ===== STYLE: SEAMLESS (panorâmico — linha contínua) =====
  if (editorialStyle === "seamless") {
    if (isCover) {
      return <CoverSeamlessFlow slide={coverData} {...basePropsDark} />
    }
    // Faixa de imagem em TODO slide de conteúdo — a banda panorâmica embaixo
    // reforça a continuidade e preenche o vazio dos slides sem foto.
    const slot = resolveImageSlot("single-bottom", imgCount)
    return <SplitSeamlessFlow slide={splitData} {...basePropsDark} imageSlot={slot} />
  }

  // ===== STYLE: AUTO (legacy) =====
  return (
    <LegacyEditorialSlide
      slide={slide}
      totalSlides={totalSlides}
      accentOnDark={accentOnDark}
      accentOnLight={accentOnLight}
      dark={dark}
      light={light}
      fontClass={fontClass}
      handle={handle}
      lightBg={lightBg}
      darkBg={darkBg}
      format={format}
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
  accentOnDark,
  accentOnLight,
  dark,
  light,
  fontClass,
  handle,
  lightBg,
  darkBg,
  format = "feed",
}: {
  slide: PreviewSlide
  totalSlides: number
  accentOnDark: string
  accentOnLight: string
  dark: string
  light: string
  fontClass: string
  handle: string
  lightBg: string
  darkBg: string
  format?: "feed" | "stories"
}) {
  const variant = pickLegacyVariant(slide.order_index, totalSlides)
  const isStories = format === "stories"
  const categoryTag = slide.cta_badge || "Editorial"

  // Alterna bg dark/light entre splits ímpares e pares pra dar variedade
  // (sem isso ficavam todos no mesmo bg cream).
  const isDarkSplit = slide.order_index % 2 === 0 // par = dark, ímpar = light
  const splitBg = isDarkSplit ? darkBg : lightBg
  // Texto base é SEMPRE neutro (preto no claro, branco no escuro). A cor da
  // marca fica só no destaque (accent) — usar brandColors[1] como texto deixava
  // o título inteiro colorido quando a 2ª cor da marca não era um preto neutro.
  const splitText = isDarkSplit ? "#FFFFFF" : "#0A0A0F"
  const splitAccent = isDarkSplit ? accentOnDark : accentOnLight
  const splitTextMuted = isDarkSplit
    ? "rgba(255,255,255,0.85)"
    : "rgba(10,10,15,0.72)"
  const splitTextOpacity = isDarkSplit ? 0.85 : 0.7
  // Título da capa adapta ao comprimento — evita ficar gigante em títulos longos.
  const coverTitleClass =
    slide.title.length > 58
      ? "text-[1.85rem]"
      : slide.title.length > 40
        ? "text-[2.1rem]"
        : "text-[2.5rem]"

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

        <div
          className={
            isStories
              ? // Stories: bloco do título ocupa do topo (abaixo das pills) ao
                // rodapé, centralizado — evita o título transbordar/colidir.
                "absolute inset-x-5 top-16 bottom-16 z-10 flex flex-col justify-center space-y-3"
              : // Feed: título/subtítulo ancorados EMBAIXO (estilo impacto Wesley),
                // não no meio.
                "absolute inset-x-5 bottom-16 z-10 space-y-3"
          }
        >
          <h1
            className={`${isStories ? "text-[2rem]" : coverTitleClass} uppercase leading-[0.98] tracking-tight text-white ${fontClass}`}
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
          >
            <HighlightedText
              text={slide.title}
              words={slide.highlight_words}
              color={accentOnDark}
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
              color={accentOnDark}
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

      {/* REGRA GLOBAL "template como água": TEXTO é sólido (flex-shrink-0,
          clamps por LINHA — nunca corte em pixel no meio da frase); a IMAGEM
          é água (flex-1, preenche exatamente o que sobra, min-height de
          segurança). Impossível uma invadir a outra. */}
      <div className="px-5 flex flex-col gap-3 min-h-0">
        {imageOnTop && (
          <LegacySlideImage
            slide={slide}
            placeholderBg={isDarkSplit ? "#FFFFFF" : dark}
            placeholderText={isDarkSplit ? dark : light}
          />
        )}

        <div className="space-y-1.5 flex-shrink-0">
          <h1
            className={`text-[1.7rem] leading-[1.1] tracking-tight line-clamp-4 ${fontClass}`}
            style={{ color: splitText }}
          >
            <HighlightedText
              text={slide.title}
              words={slide.highlight_words}
              color={splitAccent}
            />
          </h1>
          {slide.subtitle && (
            <p
              className="text-xs line-clamp-2"
              style={{ color: splitTextMuted, opacity: splitTextOpacity }}
            >
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
  // IMAGEM = ÁGUA: flex-1 preenche exatamente o espaço que SOBRA depois do
  // texto (que é sólido/flex-shrink-0). Container dimensionado pelo flex +
  // <img> absoluta object-cover — mesmo padrão das capas, exporta correto no
  // html-to-image (altura em % quebrava; container flex + absolute não).
  if (slide.image.url) {
    return (
      <div className="w-full rounded-md overflow-hidden flex-1 min-h-[96px] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.image.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: PHOTO_FOCUS }}
        />
      </div>
    )
  }
  return (
    <div
      className="w-full rounded-md flex items-center justify-center text-[10px] px-2 text-center flex-1 min-h-[96px]"
      style={{
        backgroundColor: placeholderBg,
        color: placeholderText,
        opacity: 0.4,
      }}
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
          style={{
            backgroundColor: accent,
            color: isLightColor(accent) ? "#000000" : "#FFFFFF",
          }}
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
