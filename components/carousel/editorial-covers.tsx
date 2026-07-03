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
  mixWithWhite,
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

      {/* Handle + título num stack único ancorado embaixo: o handle fica sempre
          a um gap fixo acima do título, independente do tamanho do título
          (antes eram blocos separados e o título longo encostava no handle). */}
      <div className="absolute left-6 right-6 z-10" style={{ bottom: "5rem" }}>
        <div className="mb-6">
          <AvatarPill
            avatar={slide.handle_avatar}
            handle={slide.handle || "@brand"}
            variant="light"
          />
        </div>
        <div className="space-y-2.5">
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
        {slide.subtitle && (
          <p
            className="text-sm text-white/85"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            {slide.subtitle}
          </p>
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

// ============================================================================
// 7. cover-gradient-glow — dark vibrante + glow do accent + highlight gradiente
// ============================================================================

export function CoverGradientGlow({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#08080D" }}
    >
      {/* Glow radial do accent (assinatura do estilo) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse 90% 55% at 20% 0%, ${accent}33 0%, transparent 60%), radial-gradient(ellipse 70% 45% at 90% 100%, ${accent}26 0%, transparent 65%)`,
        }}
      />

      <div className="relative z-10 px-4 pt-4 flex items-center justify-between">
        <Pill>{slide.handle || "@brand"}</Pill>
        <Pill>{slide.category || "Viral"}</Pill>
      </div>

      {/* Título gigante com highlight em gradiente */}
      <div className="relative z-10 px-6 pt-8 space-y-4">
        <h1
          className={`text-[2.7rem] uppercase tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95 }}
        >
          <HighlightedGradientText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-sm text-white/75 leading-[1.45]">{slide.subtitle}</p>
        )}
      </div>

      {/* Imagem com aura do accent */}
      <div className="relative z-10 mt-auto px-6 pb-16">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            aspectRatio: "16/10",
            boxShadow: `0 0 44px ${accent}59, 0 10px 28px rgba(0,0,0,0.5)`,
            border: `1px solid ${accent}40`,
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
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white/40 text-[10px] text-center px-4">
              {slide.image.error || "sem imagem"}
            </div>
          )}
        </div>
      </div>

      {/* Footer: arrasta + barra de progresso gradiente */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-6 pb-5 space-y-3">
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

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 8. cover-minimal-clean — branco suíço + tipografia gigante + régua accent
// ============================================================================

export function CoverMinimalClean({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Header texto puro */}
      <div className="px-6 pt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-black/45">
        <span>{slide.handle || "@brand"}</span>
        <span>{slide.category || "Editorial"}</span>
      </div>

      {/* Régua accent + título preto gigante */}
      <div className="px-6 pt-10 space-y-5">
        <div className="h-1 w-12" style={{ backgroundColor: accent }} />
        <h1
          className={`text-[2.9rem] uppercase tracking-tight text-black ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.93 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-sm text-black/60 leading-[1.5] max-w-[85%]">
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* Imagem em janela com hairline */}
      <div className="mt-auto px-6 pb-14">
        <div
          className="rounded-lg overflow-hidden"
          style={{ aspectRatio: "16/10", border: "1px solid rgba(0,0,0,0.12)" }}
        >
          {slide.image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image.url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-black/35 text-[10px] text-center px-4">
              {slide.image.error || "sem imagem"}
            </div>
          )}
        </div>
      </div>

      {/* Footer: linha + contador tabular + arrasta */}
      <div className="absolute bottom-0 inset-x-0 px-6 pb-5">
        <div className="h-px w-full bg-black/10 mb-3" />
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] font-semibold text-black/45">
          <span className="tabular-nums">
            {String(orderIndex + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </span>
          <span>arrasta →</span>
        </div>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#000" />
    </div>
  )
}

// ============================================================================
// 9. cover-seamless-flow — panorâmico: linha contínua que atravessa os slides
//    (elemento "vaza" pro próximo slide → urgência de swipe, +completion)
// ============================================================================

export function CoverSeamlessFlow({
  slide,
  totalSlides,
  orderIndex,
  accent,
  fontClass,
}: CoverProps) {
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative"
      style={{
        // Gradiente panorâmico: cada slide mostra uma "janela" diferente do
        // mesmo fundo — no feed, os slides parecem um pano contínuo.
        backgroundImage: `linear-gradient(115deg, #0B0B10 0%, ${accent}30 50%, #0B0B10 100%)`,
        backgroundSize: `${Math.max(totalSlides, 2) * 100}% 100%`,
        backgroundPosition: `${totalSlides > 1 ? (orderIndex / (totalSlides - 1)) * 100 : 0}% 50%`,
        backgroundColor: "#0B0B10",
      }}
    >
      <div className="absolute top-4 left-5 right-5 flex items-center justify-between z-10">
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold">
          {slide.handle || "@brand"}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-bold tabular-nums"
          style={{ color: accent }}
        >
          {String(orderIndex + 1).padStart(2, "0")} — {String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {/* Título acima da linha */}
      <div className="absolute left-6 right-6 z-10" style={{ bottom: "47%" }}>
        <h1
          className={`text-[2.5rem] uppercase tracking-tight text-white ${fontClass}`}
          style={{ fontWeight: 900, lineHeight: 0.95 }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
      </div>

      {/* A LINHA — começa no meio da capa e SAI pela borda direita (continua
          no próximo slide). Nó marca o início da jornada. */}
      <div
        className="absolute z-10 flex items-center"
        style={{ top: "56%", left: "24px", right: "-2px" }}
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: accent, boxShadow: `0 0 14px ${accent}` }}
        />
        <span
          className="h-[3px] flex-1"
          style={{
            backgroundImage: `linear-gradient(90deg, ${accent}, ${mixWithWhite(accent, 0.4)})`,
          }}
        />
      </div>

      {/* Subtítulo + convite abaixo da linha */}
      <div className="absolute left-6 right-6 z-10 space-y-3" style={{ top: "61%" }}>
        {slide.subtitle && (
          <p className="text-sm text-white/75 leading-[1.45]">{slide.subtitle}</p>
        )}
        <p
          className="text-[11px] uppercase tracking-[0.18em] font-bold"
          style={{ color: mixWithWhite(accent, 0.3) }}
        >
          segue a linha →
        </p>
      </div>

      {/* Imagem: faixa fullwidth colada nas bordas (sangra pro próximo) */}
      {slide.image.url && (
        <div className="absolute bottom-0 inset-x-0" style={{ height: "26%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image.url}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.85 }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(180deg, #0B0B10 0%, transparent 45%)",
            }}
          />
        </div>
      )}

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}

// ============================================================================
// 10. cover-notes-native — screenshot do app Notas (nativo/orgânico,
//     "não parece anúncio" — estética que mais gera share no DM)
// ============================================================================

const NOTES_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

export function CoverNotesNative({
  slide,
  totalSlides,
  orderIndex,
  accent,
}: CoverProps) {
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: "#FBF9F3", fontFamily: NOTES_FONT }}
    >
      {/* Chrome do app Notas */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: "#E8A33D" }}>
          ‹ Notas
        </span>
        <span className="text-[13px] tracking-widest" style={{ color: "#E8A33D" }}>
          ⋯
        </span>
      </div>

      {/* Data centralizada (detalhe que vende o "screenshot real") */}
      <p className="text-center text-[10px] mt-3" style={{ color: "#9C9A94" }}>
        {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} às 09:41
      </p>

      {/* Título natural (sem caixa alta — como se digita numa nota) */}
      <div className="px-6 pt-5 space-y-3">
        <h1
          className="text-[1.9rem] text-black"
          style={{ fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words || []}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-[15px] leading-[1.5]" style={{ color: "#55534E" }}>
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* Imagem como foto anexada na nota */}
      {slide.image.url && (
        <div className="mt-auto px-6 pb-16">
          <div
            className="rounded-xl overflow-hidden"
            style={{ aspectRatio: "16/10", boxShadow: "0 3px 12px rgba(0,0,0,0.12)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image.url} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Footer discreto */}
      <div className="absolute bottom-0 inset-x-0 px-6 pb-4">
        <div className="h-px w-full mb-2.5" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />
        <div
          className="flex items-center justify-between text-[10px]"
          style={{ color: "#9C9A94" }}
        >
          <span>{slide.handle || "@brand"}</span>
          <span className="tabular-nums">
            nota {orderIndex + 1} de {totalSlides} · arrasta →
          </span>
        </div>
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#000" />
    </div>
  )
}
