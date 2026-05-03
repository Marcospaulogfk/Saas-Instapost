"use client"

import {
  AvatarPill,
  Attribution,
  BrandsdecodedFooter,
  BrandsdecodedHeader,
  HighlightedText,
  PaginationDots,
  Pill,
  type SlideAttribution,
} from "./editorial-shared"

export interface CoverSlideData {
  title: string
  subtitle?: string
  highlight_words?: string[]
  image: { url: string | null; attribution: SlideAttribution | null; error: string | null }
  handle?: string
  handle_avatar?: string
  category?: string
  brand_label?: string
  year_label?: string
}

interface CoverProps {
  slide: CoverSlideData
  totalSlides: number
  orderIndex: number
  accent: string
  fontClass: string
}

// ============================================================================
// 1. cover-wesley-gemini — preto sólido + título topo + foto-card centralizada
// ============================================================================

export function CoverWesleyGemini({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{slide.handle || "@brand"}</Pill>
        <Pill>{slide.category || "Editorial"}</Pill>
      </div>

      <div className="absolute top-[12%] left-6 right-6 z-10 space-y-3">
        <h1
          className={`text-[2.5rem] uppercase leading-[0.95] tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 800 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-sm text-white/80">{slide.subtitle}</p>
        )}
      </div>

      <div
        className="absolute left-[6%] right-[6%] aspect-[16/10] rounded-3xl overflow-hidden"
        style={{
          top: "55%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        {slide.image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.image.url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white/40 text-[10px] text-center px-4">
            {slide.image.error || "sem imagem"}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{slide.category || "Editorial"}</Pill>
        <PaginationDots total={totalSlides} active={orderIndex} color="#FFFFFF" />
        <Pill>{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 2. cover-wesley-internet — foto fullbleed + título embaixo (cinematográfico)
// ============================================================================

export function CoverWesleyInternet({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/15" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{slide.handle || "@brand"}</Pill>
        <Pill>{slide.category || "Editorial"}</Pill>
      </div>

      <div className="absolute left-6 right-6 z-10 space-y-3" style={{ bottom: "8rem" }}>
        <h1
          className={`text-[2.2rem] uppercase leading-[0.95] tracking-tight text-white ${fontClass}`}
          style={{
            fontWeight: 800,
            textShadow: "0 2px 14px rgba(0,0,0,0.55)",
          }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
      </div>

      {slide.subtitle && (
        <p
          className="absolute left-6 right-6 text-xs text-white/70 z-10"
          style={{ bottom: "5rem" }}
        >
          {slide.subtitle}
        </p>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{slide.category || "Editorial"}</Pill>
        <PaginationDots total={totalSlides} active={orderIndex} color="#FFFFFF" />
        <Pill>{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 3. cover-wesley-labios — foto fullbleed + AvatarPill + footer só dots (sem header pills)
// ============================================================================

export function CoverWesleyLabios({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

      {/* Sem header pills — visual mais limpo */}

      <div className="absolute left-6 z-10" style={{ bottom: "11rem" }}>
        <AvatarPill
          avatar={slide.handle_avatar}
          handle={slide.handle || "@brand"}
          variant="light"
        />
      </div>

      <div className="absolute left-6 right-6 z-10 space-y-2.5" style={{ bottom: "5rem" }}>
        <h1
          className={`text-[2rem] leading-[1.05] tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 700 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-xs text-white/85">{slide.subtitle}</p>
        )}
      </div>

      <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
        <PaginationDots total={totalSlides} active={orderIndex} color="#FFFFFF" />
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 4. cover-wesley-churrasco — foto fullbleed + título centro-baixo + overlay agressivo
// ============================================================================

export function CoverWesleyChurrasco({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{slide.handle || "@brand"}</Pill>
        <Pill>{slide.category || "Editorial"}</Pill>
      </div>

      <div className="absolute top-[42%] left-6 right-6 z-10 space-y-3">
        <h1
          className={`text-[2.3rem] uppercase leading-[0.95] tracking-tight text-white ${fontClass}`}
          style={{
            fontWeight: 800,
            textShadow: "0 2px 14px rgba(0,0,0,0.55)",
          }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
      </div>

      {slide.subtitle && (
        <p
          className="absolute left-6 right-6 text-xs text-white/85 z-10"
          style={{ bottom: "5rem" }}
        >
          {slide.subtitle}
        </p>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <Pill>{slide.category || "Editorial"}</Pill>
        <PaginationDots total={totalSlides} active={orderIndex} color="#FFFFFF" />
        <Pill>{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 5. cover-brandsdecoded-massive — header texto puro + título GIGANTE + footer linha
// ============================================================================

export function CoverBrandsdecodedMassive({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black flex flex-col">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      <div className="relative z-10">
        <BrandsdecodedHeader
          left={slide.brand_label || "Content Machine"}
          right={slide.year_label || "2026 ®"}
          textColor="rgba(255,255,255,0.5)"
        />
      </div>

      {/* Avatar pill central */}
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 z-10">
        <AvatarPill
          avatar={slide.handle_avatar}
          handle={slide.handle || "@brand"}
          variant="dark"
        />
      </div>

      <div className="absolute left-4 right-4 z-10 space-y-2" style={{ bottom: "5rem" }}>
        <h1
          className={`text-[3rem] uppercase tracking-tight text-white ${fontClass}`}
          style={{
            fontWeight: 900,
            lineHeight: 0.92,
            textShadow: "0 2px 14px rgba(0,0,0,0.55)",
          }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
      </div>

      {slide.subtitle && (
        <p
          className="absolute left-4 right-4 text-xs text-white/60 z-10"
          style={{ bottom: "3rem" }}
        >
          {slide.subtitle}
        </p>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <BrandsdecodedFooter
          pageNumber={orderIndex + 1}
          totalPages={totalSlides}
          textColor="rgba(255,255,255,0.5)"
          lineColor="rgba(255,255,255,0.2)"
        />
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 6. cover-brandsdecoded-portrait — retrato + header 3-col + título médio mistura case
// ============================================================================

export function CoverBrandsdecodedPortrait({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
  return (
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black flex flex-col">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

      <div className="relative z-10">
        <BrandsdecodedHeader
          left={slide.brand_label || "Powered by Content Machine"}
          center={slide.handle || "@brand"}
          right={slide.year_label || "2026 //"}
          textColor="rgba(255,255,255,0.6)"
        />
      </div>

      <div className="absolute left-4 right-4 z-10" style={{ bottom: "5rem" }}>
        <h1
          className={`text-[1.6rem] tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 700, lineHeight: 1 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <BrandsdecodedFooter
          pageNumber={orderIndex + 1}
          totalPages={totalSlides}
          textColor="rgba(255,255,255,0.6)"
          lineColor="rgba(255,255,255,0.2)"
        />
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}
