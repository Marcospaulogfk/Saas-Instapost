"use client"

import {
  AvatarPill,
  Attribution,
  BrandsdecodedFooter,
  BrandsdecodedHeader,
  GradientProgressBar,
  HighlightedGradientText,
  HighlightedText,
  FitText,
  PaginationDots,
  SmartSlideImage,
  Pill,
  SectionTag,
  SeamlessProgressLine,
  mixWithWhite,
  parseBoldInline,
  splitTheme,
  type SlideAttribution,
} from "./editorial-shared"
import { proxiedImageUrl } from "@/lib/proxy-image"

export interface SplitSlideData {
  title: string
  body?: string
  subtitle?: string
  highlight_words?: string[]
  images: Array<{
    url: string | null
    attribution: SlideAttribution | null
    error: string | null
  }>
  handle?: string
  handle_avatar?: string
  category?: string
  brand_label?: string
  year_label?: string
  section_prefix?: string
  section_number?: string
  callout?: string
}

export type SplitImageSlot =
  | "none"
  | "single-bottom"
  | "single-top"
  | "single-middle"
  | "comparison-bottom"
  | "composition-top"
  | "bottom-card"
  | "bottom-large"

interface SplitProps {
  slide: SplitSlideData
  totalSlides: number
  orderIndex: number
  accent: string
  fontClass: string
  imageSlot?: SplitImageSlot
  titleSize?: "medium" | "large" | "massive"
  /** Cor de fundo custom (slide.bg). Quando definida, o slide troca o bg e
   *  deriva texto/contraste legível; undefined = usa o padrão do estilo. */
  bgOverride?: string
}

// ============================================================================
// REGRA GLOBAL — "template como água":
//   TEXTO é SÓLIDO  → zona flex-shrink-0; título/corpo com line-clamp (corte
//                     sempre em limite de LINHA, nunca no meio em pixel).
//   IMAGEM é ÁGUA   → zona flex-1 min-h-0 SEM aspect-ratio fixo; a foto
//                     preenche exatamente o espaço que SOBRA (object-cover),
//                     com min-height de segurança. Nunca invade o texto.
// O padrão de preenchimento (container dimensionado pelo flex + <img>
// absoluta inset-0) é o mesmo das capas — exporta correto no html-to-image
// (altura em % quebrava; container flex + absolute não).
// ============================================================================

/** Altura mínima da zona de imagem fluida — a foto nunca vira um fiapo. */
const IMG_MIN = "min-h-[140px]"

function SingleImageBox({
  imageUrl,
  error,
  className = "",
  aspect = "16/9",
  rounded = "rounded-2xl",
  fill = false,
}: {
  imageUrl: string | null | undefined
  error: string | null | undefined
  className?: string
  aspect?: string
  rounded?: string
  /** true = preenche o container pai (zona fluida), sem aspect fixo. */
  fill?: boolean
}) {
  if (fill) {
    return (
      <div
        className={`relative overflow-hidden ${rounded} h-full w-full ${className}`}
        style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <SmartSlideImage
            src={imageUrl}
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800/30 flex items-center justify-center text-[10px] opacity-60 text-center px-2">
            {error || "sem imagem"}
          </div>
        )}
      </div>
    )
  }
  return (
    <div
      className={`overflow-hidden ${rounded} ${className}`}
      style={{ aspectRatio: aspect, boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <SmartSlideImage src={imageUrl} className="w-full h-full" />
      ) : (
        <div className="w-full h-full bg-zinc-800/30 flex items-center justify-center text-[10px] opacity-60 text-center px-2">
          {error || "sem imagem"}
        </div>
      )}
    </div>
  )
}

function ComparisonImages({
  images,
  fill = false,
}: {
  images: SplitSlideData["images"]
  fill?: boolean
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${fill ? "h-full" : ""}`}>
      {images.slice(0, 2).map((img, i) => (
        <SingleImageBox
          key={i}
          imageUrl={img.url}
          error={img.error}
          aspect="3/4"
          rounded="rounded-xl"
          fill={fill}
        />
      ))}
    </div>
  )
}

function CompositionImages({
  images,
  fill = false,
}: {
  images: SplitSlideData["images"]
  fill?: boolean
}) {
  return (
    <div className={`flex gap-2 ${fill ? "h-full" : ""}`}>
      <div className={fill ? "w-2/5 h-full" : "w-2/5"}>
        <SingleImageBox
          imageUrl={images[0]?.url}
          error={images[0]?.error}
          aspect="4/3"
          rounded="rounded-lg"
          fill={fill}
        />
      </div>
      <div className={fill ? "w-3/5 h-full" : "w-3/5"}>
        <SingleImageBox
          imageUrl={images[1]?.url}
          error={images[1]?.error}
          aspect="4/3"
          rounded="rounded-lg"
          fill={fill}
        />
      </div>
    </div>
  )
}

function BottomCardGrid({
  images,
  fill = false,
}: {
  images: SplitSlideData["images"]
  fill?: boolean
}) {
  const real = images.filter((img) => img.url).slice(0, 3)
  const cols = Math.max(1, real.length)
  return (
    <div
      className={`grid gap-3 ${fill ? "h-full" : ""}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {real.map((img, i) => (
        <SingleImageBox
          key={i}
          imageUrl={img.url}
          error={img.error}
          aspect="3/4"
          rounded="rounded-xl"
          fill={fill}
        />
      ))}
    </div>
  )
}

/** Título menor quando o texto é longo — o layout se adapta, não o contrário. */
function fitTitle(title: string, base: string, mid: string, small: string) {
  if (title.length > 88) return small
  if (title.length > 56) return mid
  return base
}

// ============================================================================
// 1. split-wesley-dark — fundo preto + avatar + título UPPERCASE com accent
// ============================================================================

export function SplitWesleyDark({
  slide,
  accent,
  fontClass,
  imageSlot = "none",
  titleSize = "large",
  bgOverride,
}: SplitProps) {
  const base =
    titleSize === "massive"
      ? "text-[2.8rem]"
      : titleSize === "medium"
        ? "text-[2rem]"
        : "text-[2.5rem]"
  const titleSizeClass = fitTitle(slide.title, base, "text-[2rem]", "text-[1.6rem]")
  const titleWeight = titleSize === "massive" ? 900 : 800
  const hasBottomImage =
    imageSlot === "single-bottom" || imageSlot === "comparison-bottom"
  const th = splitTheme(bgOverride)

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative p-6 flex flex-col"
      style={{ backgroundColor: th?.bg ?? "#000000" }}
    >
      {/* Composition top — zona de imagem FLUIDA acima do texto */}
      {imageSlot === "composition-top" && (
        <div className={`flex-1 ${IMG_MIN} min-h-0 mb-5`}>
          <CompositionImages images={slide.images} fill />
        </div>
      )}

      {/* ZONA DE TEXTO — SÓLIDA (nunca cortada em pixel; clamps por linha) */}
      <div className={hasBottomImage || imageSlot === "composition-top" ? "flex-shrink-0" : "flex-1 min-h-0"}>
        <div className="mb-3">
          <AvatarPill
            avatar={slide.handle_avatar}
            handle={slide.handle || "@brand"}
            variant="transparent"
          />
        </div>

        <FitText
          className={`${titleSizeClass} uppercase leading-[0.95] tracking-tight ${fontClass}`}
          style={{ fontWeight: titleWeight, color: th?.text ?? "#FFFFFF" }}
          maxLines={4}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {slide.body && (
          <p
            className="mt-4 text-base leading-[1.4] line-clamp-5"
            style={{ color: th?.muted ?? "rgba(255,255,255,0.85)" }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      {/* ZONA DE IMAGEM — ÁGUA: preenche o que sobra, sempre ABAIXO do texto */}
      {imageSlot === "single-bottom" && (
        <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
          <SingleImageBox
            imageUrl={slide.images[0]?.url}
            error={slide.images[0]?.error}
            rounded="rounded-2xl"
            fill
          />
        </div>
      )}
      {imageSlot === "comparison-bottom" && (
        <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
          <ComparisonImages images={slide.images} fill />
        </div>
      )}

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={th?.text ?? "#fff"}
      />
    </div>
  )
}

// ============================================================================
// 2. split-brandsdecoded-light — cream + header texto puro + título massive
// ============================================================================

export function SplitBrandsdecodedLight({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "single-bottom",
  titleSize = "large",
  bgOverride,
}: SplitProps) {
  const base =
    titleSize === "massive"
      ? "text-[3rem]"
      : titleSize === "medium"
        ? "text-[2rem]"
        : "text-[2.5rem]"
  const titleSizeClass = fitTitle(slide.title, base, "text-[2rem]", "text-[1.6rem]")
  const bodyParts = (slide.body || "").split("\n\n")
  const th = splitTheme(bgOverride)
  const cBg = th?.bg ?? "#F5F2EC"
  const cText = th?.text ?? "#000000"
  const cBody = th?.muted ?? "rgba(0,0,0,0.8)"
  const cFaint = th?.faint ?? "rgba(0,0,0,0.5)"
  const cLine = th?.line ?? "rgba(0,0,0,0.2)"

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: cBg, color: cBody }}
    >
      <BrandsdecodedHeader
        left={slide.brand_label || slide.handle || ""}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor={cFaint}
      />

      <div className="flex-1 px-5 pt-3 pb-2 flex flex-col min-h-0">
        {/* TÍTULO — sólido */}
        <FitText
          className={`flex-shrink-0 ${titleSizeClass} uppercase tracking-tight ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.92, color: cText }}
          maxLines={4}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {imageSlot === "single-bottom" && (
          <>
            {slide.body && (
              <p className="flex-shrink-0 mt-4 text-[15px] leading-[1.5] line-clamp-5">
                {parseBoldInline(slide.body)}
              </p>
            )}
            {slide.images[0] && (
              <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
                <SingleImageBox
                  imageUrl={slide.images[0].url}
                  error={slide.images[0].error}
                  rounded="rounded-2xl"
                  fill
                />
              </div>
            )}
          </>
        )}

        {imageSlot === "single-top" && (
          <>
            {slide.images[0] && (
              <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
                <SingleImageBox
                  imageUrl={slide.images[0].url}
                  error={slide.images[0].error}
                  rounded="rounded-2xl"
                  fill
                />
              </div>
            )}
            {slide.body && (
              <p
                className="flex-shrink-0 mt-3 text-sm leading-[1.5] line-clamp-3"
                style={{ opacity: 0.94 }}
              >
                {parseBoldInline(slide.body)}
              </p>
            )}
          </>
        )}

        {imageSlot === "single-middle" && (
          <>
            {bodyParts[0] && (
              <p className="flex-shrink-0 mt-4 text-[15px] leading-[1.5] line-clamp-3">
                {parseBoldInline(bodyParts[0])}
              </p>
            )}
            {slide.images[0] && (
              <div className={`flex-1 ${IMG_MIN} min-h-0 mt-3`}>
                <SingleImageBox
                  imageUrl={slide.images[0].url}
                  error={slide.images[0].error}
                  rounded="rounded-xl"
                  fill
                />
              </div>
            )}
            {bodyParts[1] && (
              <p className="flex-shrink-0 mt-3 text-[15px] leading-[1.5] line-clamp-3">
                {parseBoldInline(bodyParts[1])}
              </p>
            )}
          </>
        )}

        {imageSlot === "bottom-card" && (
          <>
            {slide.body && (
              <p className="flex-shrink-0 mt-4 text-[15px] leading-[1.5] line-clamp-4">
                {parseBoldInline(slide.body)}
              </p>
            )}
            <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
              <BottomCardGrid images={slide.images} fill />
            </div>
            {slide.callout && (
              <div
                className="flex-shrink-0 mt-4 px-4 py-2.5 rounded-md text-sm"
                style={{ backgroundColor: cText, color: cBg }}
              >
                {slide.callout}
              </div>
            )}
          </>
        )}

        {imageSlot === "none" && slide.body && (
          <p className="flex-shrink-0 mt-4 text-[15px] leading-[1.5] line-clamp-6">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <BrandsdecodedFooter
        pageNumber={orderIndex + 1}
        totalPages={totalSlides}
        textColor={cFaint}
        lineColor={cLine}
      />

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={cText}
      />
    </div>
  )
}

// ============================================================================
// 3. split-brandsdecoded-dark-serif — navy + Playfair forçado + amarelo claro
// ============================================================================

export function SplitBrandsdecodedDarkSerif({
  slide,
  totalSlides,
  orderIndex,
  imageSlot = "single-bottom",
  bgOverride,
}: SplitProps) {
  void totalSlides // não usa footer paginação
  void orderIndex
  const th = splitTheme(bgOverride)
  const cBg = th?.bg ?? "#0F0F1F"
  const cText = th?.text ?? "#FFFFFF"
  const cBody = th?.muted ?? "rgba(255,255,255,0.85)"
  const cFaint = th?.faint ?? "rgba(255,255,255,0.6)"
  // Âmbar é a identidade do estilo; num fundo claro custom troca por um âmbar
  // escuro pra manter contraste.
  const cSub = th ? (th.isDark ? "#FDE68A" : "#92400E") : "#FDE68A"
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: cBg, color: cBody }}
    >
      <BrandsdecodedHeader
        left={slide.brand_label || slide.handle || ""}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor={cFaint}
      />

      <div className="flex-1 px-6 pt-4 pb-4 flex flex-col min-h-0">
        {/* TEXTO — sólido */}
        <FitText
          className="flex-shrink-0 text-[1.7rem] tracking-tight"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            lineHeight: 1.15,
            color: cText,
          }}
          maxLines={4}
        >
          {slide.title}
        </FitText>

        {slide.subtitle && (
          <p
            className="flex-shrink-0 mt-4 text-base leading-[1.4] line-clamp-3"
            style={{ color: cSub, fontWeight: 500 }}
          >
            {slide.subtitle}
          </p>
        )}

        {/* IMAGEM — água */}
        {imageSlot === "single-bottom" && slide.images[0] && (
          <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
            <SingleImageBox
              imageUrl={slide.images[0].url}
              error={slide.images[0].error}
              rounded="rounded-2xl"
              fill
            />
          </div>
        )}

        {imageSlot === "none" && slide.body && (
          <p
            className="flex-shrink-0 mt-4 text-sm leading-[1.6] line-clamp-6"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: cBody }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={cText}
      />
    </div>
  )
}

// ============================================================================
// 4. split-bolo-cream — cream + pills + SectionTag + dots no footer
// ============================================================================

export function SplitBoloCream({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "bottom-card",
  bgOverride,
}: SplitProps) {
  const th = splitTheme(bgOverride)
  const cBg = th?.bg ?? "#F5F2EC"
  const cText = th?.text ?? "#0A0A0F"
  const cBody = th?.muted ?? "rgba(0,0,0,0.8)"
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: cBg, color: cBody }}
    >
      <div className="px-4 pt-4 flex items-center justify-between flex-shrink-0">
        <Pill variant="light">{slide.handle || "@brand"}</Pill>
        <Pill variant="light">{slide.category || "Editorial"}</Pill>
      </div>

      <div className="flex-1 px-4 pt-5 pb-2 flex flex-col min-h-0">
        {/* TEXTO — sólido */}
        <div className="flex-shrink-0">
          <SectionTag
            prefix={slide.section_prefix || "IDEIA"}
            number={slide.section_number || `${String(orderIndex + 1).padStart(2, "0")}:`}
            suffix={slide.title}
            prefixColor={accent}
            textColor={cText}
            fontClass={fontClass}
          />
        </div>

        {slide.body && (
          <p className="flex-shrink-0 mt-4 text-[15px] leading-[1.5] line-clamp-5 whitespace-pre-line">
            {parseBoldInline(slide.body)}
          </p>
        )}

        {/* IMAGEM — água */}
        {imageSlot === "bottom-card" && slide.images[0] && (
          <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
            <SingleImageBox
              imageUrl={slide.images[0].url}
              error={slide.images[0].error}
              rounded="rounded-3xl"
              fill
            />
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2 flex items-center justify-between flex-shrink-0">
        <Pill variant="light">{slide.category || "Conteúdo"}</Pill>
        <PaginationDots total={totalSlides} active={orderIndex} color={cText} />
        <Pill variant="light">{`arrasta →`}</Pill>
      </div>

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={cText}
      />
    </div>
  )
}

// ============================================================================
// 5. split-mypostflow-cta — branco/cream + avatar app icon + título limpo
// ============================================================================

export function SplitMyPostFlowCta({
  slide,
  fontClass,
  imageSlot = "bottom-large",
  bgOverride,
}: SplitProps) {
  const titleSizeClass = fitTitle(slide.title, "text-[2rem]", "text-[1.7rem]", "text-[1.45rem]")
  const th = splitTheme(bgOverride)
  const cBg = th?.bg ?? "#F5F2EC"
  const cText = th?.text ?? "#000000"
  const cBody = th?.muted ?? "rgba(0,0,0,0.8)"
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-6"
      style={{ backgroundColor: cBg, color: cBody }}
    >
      {/* Avatar pill — square icon (não circular) */}
      <div className="inline-flex items-center gap-2 mb-4 flex-shrink-0">
        <span
          className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: "#7C3AED", color: "#FFFFFF", fontSize: 11, fontWeight: 700 }}
        >
          {slide.handle_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.handle_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            slide.handle?.replace(/^@/, "").slice(0, 2).toUpperCase() || "MP"
          )}
        </span>
        <span className="text-sm font-medium">
          {slide.handle || "@brand"}
        </span>
      </div>

      {/* ZONA DE TEXTO — SÓLIDA (clamps por linha, nunca corte em pixel) */}
      <div className={imageSlot === "bottom-large" && slide.images[0] ? "flex-shrink-0" : "flex-1 min-h-0"}>
        <FitText
          className={`${titleSizeClass} uppercase tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1, color: cText }}
          maxLines={4}
        >
          {slide.title}
        </FitText>

        {slide.body && (
          <p className="mt-5 text-[15px] leading-[1.5] whitespace-pre-line line-clamp-5">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      {/* ZONA DE IMAGEM — ÁGUA */}
      {imageSlot === "bottom-large" && slide.images[0] && (
        <div
          className={`flex-1 ${IMG_MIN} min-h-0 mt-4 relative rounded-2xl overflow-hidden`}
          style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.15)" }}
        >
          {slide.images[0].url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <SmartSlideImage
              src={slide.images[0].url}
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-300 flex items-center justify-center text-[10px] opacity-60">
              {slide.images[0].error || "sem imagem"}
            </div>
          )}
        </div>
      )}

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={cText}
      />
    </div>
  )
}

// ============================================================================
// 6. split-gradient-dark — dark vibrante + glow do accent + progresso gradiente
// ============================================================================

export function SplitGradientDark({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "none",
  bgOverride,
}: SplitProps) {
  const hasBottomImage =
    imageSlot === "single-bottom" || imageSlot === "comparison-bottom"
  const titleSizeClass = fitTitle(slide.title, "text-[2.3rem]", "text-[1.9rem]", "text-[1.55rem]")
  const th = splitTheme(bgOverride)
  const cBg = th?.bg ?? "#08080D"
  const cText = th?.text ?? "#FFFFFF"
  const cBody = th?.muted ?? "rgba(255,255,255,0.8)"
  const cFaint = th?.faint ?? "rgba(255,255,255,0.6)"
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: cBg, color: cBody }}
    >
      {/* Glow radial sutil (menos intenso que a capa) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 85% 0%, ${accent}24 0%, transparent 60%)`,
        }}
      />

      {/* Composition top — zona de imagem FLUIDA acima do texto */}
      {imageSlot === "composition-top" && (
        <div className={`relative z-10 px-6 pt-6 flex-1 ${IMG_MIN} min-h-0`}>
          <CompositionImages images={slide.images} fill />
        </div>
      )}

      {/* ZONA DE TEXTO — SÓLIDA (clamps por linha; nunca corte em pixel) */}
      <div
        className={`relative z-10 px-6 pt-6 ${
          hasBottomImage || imageSlot === "composition-top"
            ? "flex-shrink-0"
            : "flex-1 min-h-0"
        }`}
      >
        <div className="mb-5">
          <AvatarPill
            avatar={slide.handle_avatar}
            handle={slide.handle || "@brand"}
            variant="transparent"
          />
        </div>

        <FitText
          className={`${titleSizeClass} uppercase leading-[1] tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, color: cText }}
          maxLines={4}
        >
          <HighlightedGradientText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {slide.body && (
          <p className="mt-5 text-base leading-[1.5] line-clamp-5">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      {/* ZONA DE IMAGEM — ÁGUA: preenche o que sobra, com aura do accent */}
      {hasBottomImage && (
        <div className={`relative z-10 px-6 pt-4 flex-1 ${IMG_MIN} min-h-0`}>
          {imageSlot === "comparison-bottom" ? (
            <ComparisonImages images={slide.images} fill />
          ) : (
            <div
              className="relative h-full w-full rounded-2xl overflow-hidden"
              style={{
                boxShadow: `0 0 32px ${accent}47, 0 8px 22px rgba(0,0,0,0.5)`,
                border: `1px solid ${accent}33`,
              }}
            >
              {slide.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <SmartSlideImage
                  src={slide.images[0].url}
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-white/40 text-[10px] text-center px-4">
                  {slide.images[0]?.error || "sem imagem"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer no FLUXO (flex-shrink-0) — imagem fica sempre acima dele */}
      <div className="relative z-10 flex-shrink-0 px-6 pt-3 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: mixWithWhite(accent, 0.35) }}
          >
            {String(orderIndex + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: cFaint }}
          >
            arrasta →
          </span>
        </div>
        <GradientProgressBar total={totalSlides} active={orderIndex} color={accent} />
      </div>

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={cText}
      />
    </div>
  )
}

// ============================================================================
// 7. split-minimal-clean — branco suíço + ghost number + hairlines
// ============================================================================

export function SplitMinimalClean({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "none",
  bgOverride,
}: SplitProps) {
  const ghost = String(orderIndex + 1).padStart(2, "0")
  const hasImage =
    imageSlot === "single-bottom" || imageSlot === "comparison-bottom"
  const titleSizeClass = fitTitle(slide.title, "text-[2.2rem]", "text-[1.85rem]", "text-[1.5rem]")
  const th = splitTheme(bgOverride)
  const cBg = th?.bg ?? "#FFFFFF"
  const cText = th?.text ?? "#000000"
  const cBody = th?.muted ?? "rgba(0,0,0,0.7)"
  const cFaint = th?.faint ?? "rgba(0,0,0,0.45)"
  const cLine = th?.line ?? "rgba(0,0,0,0.1)"
  const cGhost = th ? (th.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") : "rgba(0,0,0,0.05)"
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: cBg, color: cBody }}
    >
      {/* Ghost number gigante */}
      <div
        className={`absolute top-1 right-4 text-[6.5rem] ${fontClass}`}
        style={{ fontWeight: 900, color: cGhost, lineHeight: 1 }}
      >
        {ghost}
      </div>

      {/* Header texto puro */}
      <div
        className="px-6 pt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold flex-shrink-0"
        style={{ color: cFaint }}
      >
        <span>{slide.handle || "@brand"}</span>
      </div>

      {/* ZONA DE TEXTO — SÓLIDA (clamps por linha) */}
      <div
        className={`relative z-10 px-6 pt-7 ${hasImage ? "flex-shrink-0" : "flex-1 min-h-0"}`}
      >
        {/* Kicker accent */}
        <div
          className="text-[11px] uppercase tracking-[0.18em] font-bold mb-3"
          style={{ color: accent }}
        >
          {slide.category || "Conteúdo"} · {ghost}
        </div>

        <FitText
          className={`${titleSizeClass} uppercase tracking-tight ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95, color: cText }}
          maxLines={4}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {slide.body && (
          <p className="mt-4 text-[15px] leading-[1.55] line-clamp-5 whitespace-pre-line">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      {/* ZONA DE IMAGEM — ÁGUA: sempre abaixo do texto, preenche o que sobra */}
      {hasImage && (
        <div className={`relative z-10 px-6 pt-4 flex-1 ${IMG_MIN} min-h-0`}>
          {imageSlot === "comparison-bottom" ? (
            <ComparisonImages images={slide.images} fill />
          ) : (
            slide.images[0] && (
              <div
                className="relative h-full w-full rounded-lg overflow-hidden"
                style={{ border: "1px solid rgba(0,0,0,0.12)" }}
              >
                {slide.images[0].url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <SmartSlideImage
                    src={slide.images[0].url}
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-black/35 text-[10px] text-center px-4">
                    {slide.images[0].error || "sem imagem"}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Footer no FLUXO (flex-shrink-0): linha + contador + arrasta */}
      <div className="relative z-10 flex-shrink-0 px-6 pt-3 pb-5">
        <div className="h-px w-full mb-3" style={{ backgroundColor: cLine }} />
        <div
          className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: cFaint }}
        >
          <span className="tabular-nums">
            {ghost} / {String(totalSlides).padStart(2, "0")}
          </span>
          <span>arrasta →</span>
        </div>
      </div>

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={cText}
      />
    </div>
  )
}

// ============================================================================
// 8. split-seamless-flow — a linha contínua ENTRA pela esquerda e SAI pela
//    direita (no último slide, termina num nó). Fundo panorâmico desloca.
//    (Foto é FUNDO full-bleed com overlay — texto nunca colide com imagem.)
// ============================================================================

export function SplitSeamlessFlow({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "none",
  bgOverride,
}: SplitProps) {
  void imageSlot
  const isLast = orderIndex === totalSlides - 1
  const ghost = String(orderIndex + 1).padStart(2, "0")
  const bgUrl = slide.images[0]?.url ?? null
  // Seamless é foto-full-bleed com overlay escuro + texto branco (identidade).
  // O override de cor só troca a BASE (aparece nos slides sem foto); o overlay
  // e o texto branco continuam pra não quebrar o estilo.
  const cBase = bgOverride || "#0A0A12"
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: cBase }}
    >
      {/* FOTO como fundo full-bleed */}
      {bgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(150deg, ${cBase} 0%, ${accent}22 45%, ${cBase} 100%)`,
          }}
        />
      )}
      {/* Overlay escuro pra legibilidade + tint do accent */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,10,18,0.86) 0%, rgba(10,10,18,0.5) 45%, rgba(10,10,18,0.6) 70%, rgba(10,10,18,0.94) 100%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 45% at 20% 100%, ${accent}2E 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between flex-shrink-0 z-10">
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/80 font-semibold">
          {slide.handle || "@brand"}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-bold tabular-nums"
          style={{ color: accent }}
        >
          {ghost} — {String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {/* Conteúdo ancorado embaixo, sobre a foto */}
      <div className="mt-auto px-6 pb-6 z-10 space-y-4">
        <FitText
          className={`text-[2rem] uppercase tracking-tight text-white ${fontClass}`}
          style={{
            fontWeight: 800,
            lineHeight: 0.98,
            textShadow: "0 2px 22px rgba(0,0,0,0.7)",
          }}
          maxLines={3}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {/* Linha de PROGRESSO — avança slide a slide */}
        <SeamlessProgressLine
          orderIndex={orderIndex}
          totalSlides={totalSlides}
          accent={accent}
        />

        {slide.body && (
          <p
            className="text-[15px] text-white/85 leading-[1.5] line-clamp-4"
            style={{ textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
        <p
          className="text-[11px] uppercase tracking-[0.18em] font-bold"
          style={{ color: mixWithWhite(accent, 0.4) }}
        >
          {isLast ? "fim da linha · salva esse post" : "arrasta →"}
        </p>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// split-cards-white — estilo MyPostFlow: canvas escuro + CARD BRANCO flutuante.
// Card = badge pill (ícone + label) + título escuro + corpo cinza + image box.
// A imagem alterna topo/baixo (imageSlot single-top vs single-bottom). Rodapé
// marca/@handle + "arrasta →" fica no canvas escuro, ABAIXO do card.
// ============================================================================

export function SplitCardsWhite({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "single-bottom",
  bgOverride,
}: SplitProps) {
  void totalSlides
  const isLast = orderIndex === totalSlides - 1
  const canvas = bgOverride || "#0E0E12"
  // Cores do rodapé adaptam ao canvas (que o usuário pode trocar via "Fundo").
  const ct = splitTheme(canvas)!
  const brand = slide.brand_label || "SyncPost"
  const titleSizeClass = fitTitle(
    slide.title,
    "text-[1.9rem]",
    "text-[1.6rem]",
    "text-[1.35rem]",
  )
  const bodyParts = (slide.body || "").split("\n\n").filter(Boolean)
  // Só mostra o image box quando há foto de verdade (sem foto = card só texto,
  // sem placeholder vazio no export).
  const hasImage = !!slide.images[0]?.url
  const imageTop =
    hasImage &&
    (imageSlot === "single-top" || imageSlot === "composition-top")

  const ImageBox = (
    <div className={`flex-1 ${IMG_MIN} min-h-0 rounded-2xl overflow-hidden relative bg-[#2A2E37]`}>
      <SmartSlideImage
        src={slide.images[0]!.url as string}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )

  const Badge = (
    <div
      className="flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2.5"
      style={{ backgroundColor: "#EDEFF2" }}
    >
      <span style={{ color: accent, fontSize: 12 }}>✦</span>
      <span
        className="text-[11px] uppercase tracking-[0.14em] font-bold truncate"
        style={{ color: "#4A5160" }}
      >
        {slide.category || "Conteúdo"}
      </span>
    </div>
  )

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-4"
      style={{ backgroundColor: canvas }}
    >
      {/* CARD BRANCO flutuante */}
      <div
        className="flex-1 min-h-0 rounded-[20px] bg-white flex flex-col gap-4 p-6"
        style={{ boxShadow: "0 18px 44px rgba(0,0,0,0.35)" }}
      >
        {imageTop && ImageBox}

        {Badge}

        <FitText
          className={`flex-shrink-0 ${titleSizeClass} uppercase tracking-tight ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1.02, color: "#15151A" }}
          maxLines={4}
        >
          {slide.title}
        </FitText>

        {bodyParts.length > 0 && (
          <div className="flex-shrink-0 space-y-2.5">
            {bodyParts.slice(0, 2).map((p, i) => (
              <p
                key={i}
                className="text-[14px] leading-[1.55] line-clamp-4"
                style={{ color: "#5B6270" }}
              >
                {parseBoldInline(p)}
              </p>
            ))}
          </div>
        )}

        {!imageTop && hasImage && ImageBox}
      </div>

      {/* Rodapé no canvas, abaixo do card (cores adaptam ao canvas) */}
      <div className="flex-shrink-0 flex items-end justify-between px-1 pt-3">
        <div className="leading-tight">
          <div className="text-[12px] font-bold" style={{ color: ct.text }}>
            {brand}
          </div>
          <div className="text-[10px]" style={{ color: ct.faint }}>
            {slide.handle || "@brand"}
          </div>
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.14em] font-semibold"
          style={{ color: ct.faint }}
        >
          {isLast ? "salva esse post" : "arrasta →"}
        </div>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// VerifiedBadge — selo azul verificado (estilo X/Twitter). SVG inline pra
// exportar certo no html-to-image.
// ============================================================================

function VerifiedBadge({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      style={{ flexShrink: 0, display: "inline-block" }}
      aria-hidden
    >
      <path
        fill="#1D9BF0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.635.132 1.294.084 1.902-.14.27.586.7 1.084 1.24 1.44.541.356 1.167.554 1.814.57.646-.016 1.273-.213 1.813-.567s.969-.854 1.24-1.44c.604.239 1.266.303 1.909.185.643-.12 1.237-.416 1.71-.855.44-.472.739-1.056.859-1.688.12-.633.057-1.286-.18-1.883.588-.27 1.09-.7 1.448-1.24.36-.54.561-1.17.582-1.817zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  )
}

// ============================================================================
// split-profile-post — estilo "Perfil" do MyPostFlow: post de rede social.
// Fundo escuro full-bleed + header de perfil (avatar + nome com selo verificado
// + @handle) + texto do post + caixa de imagem. Mesmo layout em TODOS os slides
// (inclusive a capa) — imita print de tweet viral.
// ============================================================================

export function SplitProfilePost({
  slide,
  bgOverride,
}: SplitProps) {
  const th = splitTheme(bgOverride)
  const bg = th?.bg ?? "#0A0A0F"
  const text = th?.text ?? "#FFFFFF"
  // Texto do post: um cinza-claro uniforme (como o tweet do MyPostFlow).
  const post = th?.muted ?? "rgba(255,255,255,0.9)"
  const faint = th?.faint ?? "rgba(255,255,255,0.5)"
  const name = slide.brand_label || (slide.handle || "@perfil").replace(/^@/, "")
  const initials = (slide.handle || slide.brand_label || "SP")
    .replace(/^@/, "")
    .slice(0, 2)
    .toUpperCase()
  const hasImg = !!slide.images[0]?.url

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col justify-center px-7 text-left"
      style={{ backgroundColor: bg }}
    >
      {/* Header do perfil (avatar + nome + selo + @handle) */}
      <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(127,127,140,0.28)", color: text }}
        >
          {slide.handle_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxiedImageUrl(slide.handle_avatar)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[11px] font-bold">{initials}</span>
          )}
        </div>
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-1">
            <span
              className="font-bold text-[14px] truncate"
              style={{ color: text }}
            >
              {name}
            </span>
            <VerifiedBadge size={15} />
          </div>
          <div className="text-[12px]" style={{ color: faint }}>
            {slide.handle || "@perfil"}
          </div>
        </div>
      </div>

      {/* Texto do post — parágrafo UNIFORME (sem headline), como um tweet.
          Fonte neutra (não usa fontClass de display) e peso regular. */}
      <div className="flex-shrink-0 space-y-2.5">
        <p
          className="text-[15px] leading-[1.5]"
          style={{ color: post, fontWeight: 400 }}
        >
          {slide.title}
        </p>
        {(slide.body || slide.subtitle) && (
          <p
            className="text-[15px] leading-[1.5] line-clamp-6 whitespace-pre-line"
            style={{ color: post, fontWeight: 400 }}
          >
            {parseBoldInline(slide.body || slide.subtitle || "")}
          </p>
        )}
      </div>

      {/* Mídia do post (só quando há foto) */}
      {hasImg && (
        <div
          className="mt-4 rounded-2xl overflow-hidden relative flex-shrink-0"
          style={{
            aspectRatio: "16/10",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <SmartSlideImage
            src={slide.images[0]!.url as string}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      )}

      <Attribution
        attribution={slide.images[0]?.attribution || null}
        textColor={text}
      />
    </div>
  )
}
