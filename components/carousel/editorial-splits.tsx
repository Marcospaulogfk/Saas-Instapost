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
  type SlideAttribution,
} from "./editorial-shared"

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

  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black p-6 flex flex-col">
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
          className={`${titleSizeClass} uppercase leading-[0.95] tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: titleWeight }}
          maxLines={4}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {slide.body && (
          <p className="mt-4 text-base text-white/85 leading-[1.4] line-clamp-5">
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

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#fff" />
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
}: SplitProps) {
  const base =
    titleSize === "massive"
      ? "text-[3rem]"
      : titleSize === "medium"
        ? "text-[2rem]"
        : "text-[2.5rem]"
  const titleSizeClass = fitTitle(slide.title, base, "text-[2rem]", "text-[1.6rem]")
  const bodyParts = (slide.body || "").split("\n\n")

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#F5F2EC" }}
    >
      <BrandsdecodedHeader
        left={slide.brand_label || slide.handle || ""}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor="rgba(0,0,0,0.5)"
      />

      <div className="flex-1 px-5 pt-3 pb-2 flex flex-col min-h-0">
        {/* TÍTULO — sólido */}
        <FitText
          className={`flex-shrink-0 ${titleSizeClass} uppercase tracking-tight text-black ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.92 }}
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
              <p className="flex-shrink-0 mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-5">
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
              <p className="flex-shrink-0 mt-3 text-sm text-black/75 leading-[1.5] line-clamp-3">
                {parseBoldInline(slide.body)}
              </p>
            )}
          </>
        )}

        {imageSlot === "single-middle" && (
          <>
            {bodyParts[0] && (
              <p className="flex-shrink-0 mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-3">
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
              <p className="flex-shrink-0 mt-3 text-[15px] text-black/80 leading-[1.5] line-clamp-3">
                {parseBoldInline(bodyParts[1])}
              </p>
            )}
          </>
        )}

        {imageSlot === "bottom-card" && (
          <>
            {slide.body && (
              <p className="flex-shrink-0 mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-4">
                {parseBoldInline(slide.body)}
              </p>
            )}
            <div className={`flex-1 ${IMG_MIN} min-h-0 mt-4`}>
              <BottomCardGrid images={slide.images} fill />
            </div>
            {slide.callout && (
              <div className="flex-shrink-0 mt-4 bg-black text-white px-4 py-2.5 rounded-md text-sm">
                {slide.callout}
              </div>
            )}
          </>
        )}

        {imageSlot === "none" && slide.body && (
          <p className="flex-shrink-0 mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-6">
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <BrandsdecodedFooter
        pageNumber={orderIndex + 1}
        totalPages={totalSlides}
        textColor="rgba(0,0,0,0.5)"
        lineColor="rgba(0,0,0,0.2)"
      />

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#000" />
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
}: SplitProps) {
  void totalSlides // não usa footer paginação
  void orderIndex
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#0F0F1F" }}
    >
      <BrandsdecodedHeader
        left={slide.brand_label || slide.handle || ""}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor="rgba(255,255,255,0.6)"
      />

      <div className="flex-1 px-6 pt-4 pb-4 flex flex-col min-h-0">
        {/* TEXTO — sólido */}
        <FitText
          className="flex-shrink-0 text-[1.7rem] tracking-tight text-white"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
          maxLines={4}
        >
          {slide.title}
        </FitText>

        {slide.subtitle && (
          <p
            className="flex-shrink-0 mt-4 text-base leading-[1.4] line-clamp-3"
            style={{ color: "#FDE68A", fontWeight: 500 }}
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
            className="flex-shrink-0 mt-4 text-sm text-white/85 leading-[1.6] line-clamp-6"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {parseBoldInline(slide.body)}
          </p>
        )}
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#fff" />
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
}: SplitProps) {
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#F5F2EC" }}
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
            textColor="#0A0A0F"
            fontClass={fontClass}
          />
        </div>

        {slide.body && (
          <p className="flex-shrink-0 mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-5 whitespace-pre-line">
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
        <PaginationDots total={totalSlides} active={orderIndex} color="#0A0A0F" />
        <Pill variant="light">{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#000" />
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
}: SplitProps) {
  const titleSizeClass = fitTitle(slide.title, "text-[2rem]", "text-[1.7rem]", "text-[1.45rem]")
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-6"
      style={{ backgroundColor: "#F5F2EC" }}
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
        <span className="text-sm text-black/80 font-medium">
          {slide.handle || "@brand"}
        </span>
      </div>

      {/* ZONA DE TEXTO — SÓLIDA (clamps por linha, nunca corte em pixel) */}
      <div className={imageSlot === "bottom-large" && slide.images[0] ? "flex-shrink-0" : "flex-1 min-h-0"}>
        <FitText
          className={`${titleSizeClass} uppercase tracking-tight text-black ${fontClass}`}
          style={{ fontWeight: 800, lineHeight: 1 }}
          maxLines={4}
        >
          {slide.title}
        </FitText>

        {slide.body && (
          <p className="mt-5 text-[15px] text-black/75 leading-[1.5] whitespace-pre-line line-clamp-5">
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

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#000" />
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
}: SplitProps) {
  const hasBottomImage =
    imageSlot === "single-bottom" || imageSlot === "comparison-bottom"
  const titleSizeClass = fitTitle(slide.title, "text-[2.3rem]", "text-[1.9rem]", "text-[1.55rem]")
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#08080D" }}
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
          className={`${titleSizeClass} uppercase leading-[1] tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 800 }}
          maxLines={4}
        >
          <HighlightedGradientText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {slide.body && (
          <p className="mt-5 text-base text-white/80 leading-[1.5] line-clamp-5">
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
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">
            arrasta →
          </span>
        </div>
        <GradientProgressBar total={totalSlides} active={orderIndex} color={accent} />
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#fff" />
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
}: SplitProps) {
  const ghost = String(orderIndex + 1).padStart(2, "0")
  const hasImage =
    imageSlot === "single-bottom" || imageSlot === "comparison-bottom"
  const titleSizeClass = fitTitle(slide.title, "text-[2.2rem]", "text-[1.85rem]", "text-[1.5rem]")
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Ghost number gigante */}
      <div
        className={`absolute top-1 right-4 text-[6.5rem] ${fontClass}`}
        style={{ fontWeight: 900, color: "rgba(0,0,0,0.05)", lineHeight: 1 }}
      >
        {ghost}
      </div>

      {/* Header texto puro */}
      <div className="px-6 pt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-black/45 flex-shrink-0">
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
          className={`${titleSizeClass} uppercase tracking-tight text-black ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95 }}
          maxLines={4}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </FitText>

        {slide.body && (
          <p className="mt-4 text-[15px] text-black/70 leading-[1.55] line-clamp-5 whitespace-pre-line">
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
        <div className="h-px w-full bg-black/10 mb-3" />
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-black/45">
          <span className="tabular-nums">
            {ghost} / {String(totalSlides).padStart(2, "0")}
          </span>
          <span>arrasta →</span>
        </div>
      </div>

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#000" />
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
}: SplitProps) {
  void imageSlot
  const isLast = orderIndex === totalSlides - 1
  const ghost = String(orderIndex + 1).padStart(2, "0")
  const bgUrl = slide.images[0]?.url ?? null
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#0A0A12" }}
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
            backgroundImage: `linear-gradient(150deg, #0A0A12 0%, ${accent}22 45%, #0A0A12 100%)`,
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
