"use client"

import {
  AvatarPill,
  Attribution,
  BrandsdecodedFooter,
  BrandsdecodedHeader,
  GradientProgressBar,
  HighlightedGradientText,
  HighlightedText,
  PaginationDots,
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
  const real = images.filter((img) => img.url).slice(0, 3)
  const cols = Math.max(1, real.length)
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {real.map((img, i) => (
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

      {/* ZONA DE TEXTO — flex-1, recorta se longo (nunca invade a imagem) */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
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

        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-8"
          style={{ backgroundImage: "linear-gradient(180deg, transparent, #000)" }}
        />
      </div>

      {/* ZONA DE IMAGEM — flex-shrink-0, sempre ABAIXO do texto */}
      {imageSlot === "single-bottom" && (
        <div className="flex-shrink-0 pt-3">
          <SingleImageBox
            imageUrl={slide.images[0]?.url}
            error={slide.images[0]?.error}
            aspect="16/9"
            rounded="rounded-2xl"
          />
        </div>
      )}
      {imageSlot === "comparison-bottom" && (
        <div className="flex-shrink-0 pt-3">
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
        left={slide.brand_label || slide.handle || ""}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor="rgba(0,0,0,0.5)"
      />

      <div className="flex-1 px-5 pt-3 flex flex-col min-h-0 overflow-hidden">
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
          <div className="mt-4">
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
        left={slide.brand_label || slide.handle || ""}
        center={slide.handle}
        right={slide.year_label || "2026 //"}
        textColor="rgba(255,255,255,0.6)"
      />

      <div className="flex-1 px-6 pt-4 flex flex-col min-h-0 overflow-hidden">
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
          <div className="mt-4 pb-2">
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

      <div className="flex-1 px-4 pt-5 flex flex-col min-h-0 overflow-hidden">
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
          <div className="mt-4 pb-2">
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

      {/* ZONA DE TEXTO — flex-1, recorta se longo (nunca invade a imagem) */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
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

        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-8"
          style={{ backgroundImage: "linear-gradient(180deg, transparent, #F5F2EC)" }}
        />
      </div>

      {/* ZONA DE IMAGEM — flex-shrink-0, sempre ABAIXO do texto */}
      {imageSlot === "bottom-large" && slide.images[0] && (
        <div
          className="flex-shrink-0 mt-4 rounded-2xl overflow-hidden"
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

      {/* Composition top (imagem no topo — zona própria, flex-shrink-0) */}
      {imageSlot === "composition-top" && (
        <div className="relative z-10 px-6 pt-6 flex-shrink-0">
          <CompositionImages images={slide.images} />
        </div>
      )}

      {/* ZONA DE TEXTO — flex-1, recorta se longo. Nunca compartilha espaço com
          a imagem (que tem zona própria abaixo) → impossível sobrepor. */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden px-6 pt-6">
        <div className="mb-5">
          <AvatarPill
            avatar={slide.handle_avatar}
            handle={slide.handle || "@brand"}
            variant="transparent"
          />
        </div>

        <h2
          className={`text-[2.3rem] uppercase leading-[1] tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 800 }}
        >
          <HighlightedGradientText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h2>

        {slide.body && (
          <p className="mt-6 text-base text-white/80 leading-[1.5] line-clamp-6">
            {parseBoldInline(slide.body)}
          </p>
        )}

        {/* Fade no rodapé da zona de texto — suaviza o corte quando longo */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-10"
          style={{ backgroundImage: "linear-gradient(180deg, transparent, #08080D)" }}
        />
      </div>

      {/* ZONA DE IMAGEM — flex-shrink-0, sempre ABAIXO do texto, com aura */}
      {hasBottomImage && (
        <div className="relative z-10 px-6 pt-3 flex-shrink-0">
          {imageSlot === "comparison-bottom" ? (
            <ComparisonImages images={slide.images} />
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                aspectRatio: "16/9",
                boxShadow: `0 0 32px ${accent}47, 0 8px 22px rgba(0,0,0,0.5)`,
                border: `1px solid ${accent}33`,
              }}
            >
              {slide.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.images[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white/40 text-[10px] text-center px-4">
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
      <div className="px-6 pt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-black/45">
        <span>{slide.handle || "@brand"}</span>
      </div>

      {/* Zona de TEXTO — flex-1 e clipa se ficar muito longo. Separada da
          imagem pra nunca haver sobreposição (título/descrição vs foto). */}
      <div className="relative z-10 flex-1 px-6 pt-8 min-h-0 overflow-hidden">
        {/* Kicker accent */}
        <div
          className="text-[11px] uppercase tracking-[0.18em] font-bold mb-3"
          style={{ color: accent }}
        >
          {slide.category || "Conteúdo"} · {ghost}
        </div>

        <h2
          className={`text-[2.2rem] uppercase tracking-tight text-black ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h2>

        {slide.body && (
          <p className="mt-4 text-[15px] text-black/70 leading-[1.55] line-clamp-5 whitespace-pre-line">
            {parseBoldInline(slide.body)}
          </p>
        )}

        {/* Fade no rodapé da zona de texto — suaviza o corte quando o texto é
            longo (some quando o texto é curto, pois fica sobre o branco). */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-10"
          style={{
            backgroundImage: "linear-gradient(180deg, transparent, #FFFFFF)",
          }}
        />
      </div>

      {/* Zona de IMAGEM — sempre ABAIXO do texto, altura própria (flex-shrink-0),
          nunca invade a descrição. */}
      {(imageSlot === "single-bottom" || imageSlot === "comparison-bottom") && (
        <div className="relative z-10 px-6 pt-3 flex-shrink-0">
          {imageSlot === "comparison-bottom" ? (
            <ComparisonImages images={slide.images} />
          ) : (
            slide.images[0] && (
              <div
                className="rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9", border: "1px solid rgba(0,0,0,0.12)" }}
              >
                {slide.images[0].url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-black/35 text-[10px] text-center px-4">
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
// ============================================================================

export function SplitSeamlessFlow({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
  imageSlot = "none",
}: SplitProps) {
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
        <h2
          className={`text-[2rem] uppercase tracking-tight text-white line-clamp-3 ${fontClass}`}
          style={{
            fontWeight: 800,
            lineHeight: 0.98,
            textShadow: "0 2px 22px rgba(0,0,0,0.7)",
          }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h2>

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
