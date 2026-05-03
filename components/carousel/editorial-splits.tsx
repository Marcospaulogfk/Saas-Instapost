"use client"

import {
  AvatarPill,
  Attribution,
  BrandsdecodedFooter,
  BrandsdecodedHeader,
  HighlightedText,
  PaginationDots,
  Pill,
  SectionTag,
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
// Sub-componentes de imagem reutilizáveis
// ============================================================================

function SingleImageBox({
  imageUrl,
  error,
  className = "",
  aspect = "16/9",
  rounded = "rounded-2xl",
}: {
  imageUrl: string | null | undefined
  error: string | null | undefined
  className?: string
  aspect?: string
  rounded?: string
}) {
  return (
    <div
      className={`overflow-hidden ${rounded} ${className}`}
      style={{ aspectRatio: aspect, boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-zinc-800/30 flex items-center justify-center text-[10px] opacity-60 text-center px-2">
          {error || "sem imagem"}
        </div>
      )}
    </div>
  )
}

function ComparisonImages({ images }: { images: SplitSlideData["images"] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {images.slice(0, 2).map((img, i) => (
        <SingleImageBox
          key={i}
          imageUrl={img.url}
          error={img.error}
          aspect="3/4"
          rounded="rounded-xl"
        />
      ))}
    </div>
  )
}

function CompositionImages({ images }: { images: SplitSlideData["images"] }) {
  return (
    <div className="flex gap-2">
      <div className="w-2/5">
        <SingleImageBox
          imageUrl={images[0]?.url}
          error={images[0]?.error}
          aspect="4/3"
          rounded="rounded-lg"
        />
      </div>
      <div className="w-3/5">
        <SingleImageBox
          imageUrl={images[1]?.url}
          error={images[1]?.error}
          aspect="4/3"
          rounded="rounded-lg"
        />
      </div>
    </div>
  )
}

function BottomCardGrid({ images }: { images: SplitSlideData["images"] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {images.slice(0, 3).map((img, i) => (
        <SingleImageBox
          key={i}
          imageUrl={img.url}
          error={img.error}
          aspect="3/4"
          rounded="rounded-xl"
        />
      ))}
    </div>
  )
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
  const titleSizeClass =
    titleSize === "massive"
      ? "text-[2.8rem]"
      : titleSize === "medium"
        ? "text-[2rem]"
        : "text-[2.5rem]"
  const titleWeight = titleSize === "massive" ? 900 : 800

  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black p-6 flex flex-col">
      {/* Composition top — imagem antes do header */}
      {imageSlot === "composition-top" && (
        <div className="mb-6 flex-shrink-0">
          <CompositionImages images={slide.images} />
        </div>
      )}

      {/* Avatar */}
      <div className="mb-3">
        <AvatarPill
          avatar={slide.handle_avatar}
          handle={slide.handle || "@brand"}
          variant="transparent"
        />
      </div>

      {/* Título */}
      <h2
        className={`${titleSizeClass} uppercase leading-[0.95] tracking-tight text-white ${fontClass}`}
        style={{ fontWeight: titleWeight }}
      >
        <HighlightedText
          text={slide.title}
          words={slide.highlight_words || []}
          color={accent}
        />
      </h2>

      {/* Body */}
      {slide.body && (
        <p className="mt-4 text-base text-white/85 leading-[1.4] line-clamp-6">
          {parseBoldInline(slide.body)}
        </p>
      )}

      {/* Slot de imagem inferior */}
      {imageSlot === "single-bottom" && (
        <div className="mt-auto">
          <SingleImageBox
            imageUrl={slide.images[0]?.url}
            error={slide.images[0]?.error}
            aspect="16/9"
            rounded="rounded-2xl"
          />
        </div>
      )}
      {imageSlot === "comparison-bottom" && (
        <div className="mt-auto">
          <ComparisonImages images={slide.images} />
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
  const titleSizeClass =
    titleSize === "massive"
      ? "text-[3rem]"
      : titleSize === "medium"
        ? "text-[2rem]"
        : "text-[2.5rem]"

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#F5F2EC" }}
    >
      <BrandsdecodedHeader
        left={slide.brand_label || "Content Machine"}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor="rgba(0,0,0,0.5)"
      />

      <div className="flex-1 px-5 pt-3 flex flex-col min-h-0">
        <h2
          className={`${titleSizeClass} uppercase tracking-tight text-black ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.92 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h2>

        {slide.body && imageSlot !== "single-middle" && (
          <p className="mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-4">
            {parseBoldInline(slide.body)}
          </p>
        )}

        {/* Slot de imagem */}
        {imageSlot === "single-bottom" && slide.images[0] && (
          <div className="mt-4">
            <SingleImageBox
              imageUrl={slide.images[0].url}
              error={slide.images[0].error}
              aspect="4/3"
              rounded="rounded-2xl"
            />
          </div>
        )}
        {imageSlot === "single-top" && slide.images[0] && (
          <>
            <div className="mt-4">
              <SingleImageBox
                imageUrl={slide.images[0].url}
                error={slide.images[0].error}
                aspect="16/10"
                rounded="rounded-2xl"
              />
            </div>
            {slide.body && (
              <p className="mt-3 text-sm text-black/75 leading-[1.5] line-clamp-3">
                {parseBoldInline(slide.body)}
              </p>
            )}
          </>
        )}
        {imageSlot === "single-middle" && slide.body && (
          <>
            <p className="mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-3">
              {parseBoldInline(slide.body.split("\n\n")[0] || slide.body)}
            </p>
            {slide.images[0] && (
              <div className="mt-3">
                <SingleImageBox
                  imageUrl={slide.images[0].url}
                  error={slide.images[0].error}
                  aspect="16/9"
                  rounded="rounded-xl"
                />
              </div>
            )}
            {slide.body.split("\n\n")[1] && (
              <p className="mt-3 text-[15px] text-black/80 leading-[1.5] line-clamp-3">
                {parseBoldInline(slide.body.split("\n\n")[1])}
              </p>
            )}
          </>
        )}
        {imageSlot === "bottom-card" && (
          <div className="mt-auto">
            <BottomCardGrid images={slide.images} />
            {slide.callout && (
              <div className="mt-4 bg-black text-white px-4 py-2.5 rounded-md text-sm">
                {slide.callout}
              </div>
            )}
          </div>
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
        left={slide.brand_label || "Powered by Content Machine"}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor="rgba(255,255,255,0.6)"
      />

      <div className="flex-1 px-6 pt-4 flex flex-col min-h-0">
        <h2
          className="text-[1.7rem] tracking-tight text-white"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {slide.title}
        </h2>

        {slide.subtitle && (
          <p
            className="mt-4 text-base leading-[1.4]"
            style={{ color: "#FDE68A", fontWeight: 500 }}
          >
            {slide.subtitle}
          </p>
        )}

        {imageSlot === "single-bottom" && slide.images[0] && (
          <div className="mt-auto pb-2">
            <SingleImageBox
              imageUrl={slide.images[0].url}
              error={slide.images[0].error}
              aspect="16/10"
              rounded="rounded-2xl"
            />
          </div>
        )}

        {imageSlot === "none" && slide.body && (
          <p
            className="mt-4 text-sm text-white/85 leading-[1.6]"
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
      <div className="px-4 pt-4 flex items-center justify-between">
        <Pill variant="light">{slide.handle || "@brand"}</Pill>
        <Pill variant="light">{slide.category || "Editorial"}</Pill>
      </div>

      <div className="flex-1 px-4 pt-5 flex flex-col min-h-0">
        <SectionTag
          prefix={slide.section_prefix || "IDEIA"}
          number={slide.section_number || `${String(orderIndex + 1).padStart(2, "0")}:`}
          suffix={slide.title}
          prefixColor={accent}
          textColor="#0A0A0F"
          fontClass={fontClass}
        />

        {slide.body && (
          <p className="mt-4 text-[15px] text-black/80 leading-[1.5] line-clamp-6 whitespace-pre-line">
            {parseBoldInline(slide.body)}
          </p>
        )}

        {imageSlot === "bottom-card" && slide.images[0] && (
          <div className="mt-auto pb-2">
            <SingleImageBox
              imageUrl={slide.images[0].url}
              error={slide.images[0].error}
              aspect="16/10"
              rounded="rounded-3xl"
            />
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
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
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col p-6"
      style={{ backgroundColor: "#F5F2EC" }}
    >
      {/* Avatar pill — square icon (não circular) */}
      <div className="inline-flex items-center gap-2 mb-4">
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

      <h2
        className={`text-[2rem] uppercase tracking-tight text-black ${fontClass}`}
        style={{ fontWeight: 800, lineHeight: 1 }}
      >
        {slide.title}
      </h2>

      {slide.body && (
        <p className="mt-5 text-[15px] text-black/75 leading-[1.5] whitespace-pre-line line-clamp-6">
          {parseBoldInline(slide.body)}
        </p>
      )}

      {imageSlot === "bottom-large" && slide.images[0] && (
        <div
          className="mt-auto rounded-2xl overflow-hidden"
          style={{ aspectRatio: "16/10", boxShadow: "0 12px 32px rgba(0,0,0,0.15)" }}
        >
          {slide.images[0].url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.images[0].url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-300 flex items-center justify-center text-[10px] opacity-60">
              {slide.images[0].error || "sem imagem"}
            </div>
          )}
        </div>
      )}

      <Attribution attribution={slide.images[0]?.attribution || null} textColor="#000" />
    </div>
  )
}
