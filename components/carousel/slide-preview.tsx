"use client"

interface SlideAttribution {
  photographerName: string
  photographerUrl: string
}

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

interface SlidePreviewProps {
  slide: PreviewSlide
  totalSlides: number
  template: "editorial" | "cinematic" | "hybrid"
  brandColors: string[]
  fontClass: string
  showDevBadges?: boolean
}

export function SlidePreview({
  slide,
  totalSlides,
  template,
  brandColors,
  fontClass,
  showDevBadges = true,
}: SlidePreviewProps) {
  const accent = brandColors[0] || "#00D4FF"
  const dark = brandColors[1] || "#1A1A1A"
  const light = brandColors[2] || "#FAF8F5"

  const inner =
    template === "editorial" ? (
      <EditorialSlide
        slide={slide}
        totalSlides={totalSlides}
        accent={accent}
        dark={dark}
        light={light}
        fontClass={fontClass}
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

function SlideImage({
  slide,
  dark,
  light,
}: {
  slide: PreviewSlide
  dark: string
  light: string
}) {
  if (slide.image.url) {
    return (
      <div className="rounded-md overflow-hidden flex-shrink-0" style={{ height: "44%" }}>
        <img
          src={slide.image.url}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    )
  }
  return (
    <div
      className="rounded-md flex items-center justify-center text-[10px] px-2 text-center flex-shrink-0"
      style={{ height: "44%", backgroundColor: dark, color: light, opacity: 0.4 }}
    >
      {slide.image.error || "sem imagem"}
    </div>
  )
}

function HighlightedText({
  text,
  words,
  color,
}: {
  text: string
  words: string[]
  color: string
}) {
  if (!words?.length) return <>{text}</>
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const isHighlight = words.some(
          (w) => w.toLowerCase() === part.toLowerCase(),
        )
        return isHighlight ? (
          <span key={i} style={{ color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

function Attribution({
  attribution,
  textColor,
}: {
  attribution: SlideAttribution | null
  textColor: string
}) {
  if (!attribution) return null
  return (
    <div
      className="absolute bottom-1.5 left-2 right-2 text-[8px] flex items-center gap-1 z-10"
      style={{ color: textColor, opacity: 0.7 }}
    >
      <span>Foto: </span>
      <a
        href={attribution.photographerUrl}
        target="_blank"
        rel="noreferrer"
        className="underline hover:opacity-100 truncate"
      >
        {attribution.photographerName}
      </a>
      <span>/ Unsplash</span>
    </div>
  )
}

/**
 * Decide a variante visual:
 * - Capa (idx 0): SEMPRE foto fullbleed (cover)
 * - Quebra opcional no meio do carrossel: foto fullbleed (image-bg)
 *   — apenas em carrosséis com 5+ slides, num índice no meio
 * - Demais: layout SPLIT alternando imagem-em-cima ou imagem-embaixo
 *   (texto e imagem em áreas separadas, fundo cream/light)
 */
type EditorialVariant = "cover" | "image-top" | "image-bg" | "image-bottom"

function pickVariant(orderIndex: number, totalSlides: number): EditorialVariant {
  if (orderIndex === 0) return "cover"

  // 1 quebra fullbleed no meio (só pra 5+ slides)
  const middleBreakIdx =
    totalSlides >= 5 ? Math.floor(totalSlides / 2) : -1
  if (orderIndex === middleBreakIdx) return "image-bg"

  // Resto alterna split: ímpar = imagem em cima, par = imagem embaixo
  return orderIndex % 2 === 1 ? "image-top" : "image-bottom"
}

/** Pill arredondado com bg preto translúcido (estilo refs @emp.wesleysilva). */
function Pill({
  children,
  variant = "dark",
  className = "",
}: {
  children: React.ReactNode
  variant?: "dark" | "light"
  className?: string
}) {
  const isDark = variant === "dark"
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium ${className}`}
      style={{
        backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        color: isDark ? "#FFFFFF" : "#0A0A0F",
      }}
    >
      {children}
    </span>
  )
}

/** Dots de paginação. */
function PaginationDots({
  total,
  active,
  color,
}: {
  total: number
  active: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full transition-all"
          style={{
            backgroundColor: color,
            opacity: i === active ? 0.95 : 0.35,
            transform: i === active ? "scale(1.4)" : "scale(1)",
          }}
        />
      ))}
    </div>
  )
}

function EditorialSlide({
  slide,
  totalSlides,
  accent,
  dark,
  light,
  fontClass,
}: {
  slide: PreviewSlide
  totalSlides: number
  accent: string
  dark: string
  light: string
  fontClass: string
}) {
  const variant = pickVariant(slide.order_index, totalSlides)

  // Debug: log variant escolhido pra cada slide. Visível no DevTools.
  if (typeof window !== "undefined") {
    console.log(
      `[SlidePreview] slide ${slide.order_index + 1}/${totalSlides} → variant: ${variant}`,
    )
  }

  const handle = "@brand"
  const categoryTag = slide.cta_badge || "Editorial"

  // Capa: foto fullbleed + overlay + título centro-baixo + pills header + dots+CTA footer
  if (variant === "cover") {
    return (
      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
        {slide.image.url ? (
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

        {/* Header: pill-handle (esq) + pill-categoria (dir) */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Pill>{handle}</Pill>
          <Pill>{categoryTag}</Pill>
        </div>

        {/* Bloco de título no centro-meio (não bem no fundo) */}
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
          {slide.subtitle && (
            <p className="text-sm text-white/85">{slide.subtitle}</p>
          )}
        </div>

        {/* Footer: pill-tag (esq) + dots (centro) + pill-CTA (dir) */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
          <Pill>{categoryTag}</Pill>
          <PaginationDots total={totalSlides} active={slide.order_index} color="#FFFFFF" />
          <Pill>{`arrasta →`}</Pill>
        </div>

        <Attribution attribution={slide.image.attribution} textColor="#fff" />
      </div>
    )
  }

  // image-bg: foto fullbleed + texto sobre, título alinhado no fundo (variação do cover)
  if (variant === "image-bg") {
    return (
      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-black">
        {slide.image.url ? (
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

        {/* Título mais embaixo no image-bg (diferente da capa que fica no centro-meio) */}
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
          {slide.subtitle && (
            <p className="text-xs text-white/85">{slide.subtitle}</p>
          )}
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

  // Image-top OU image-bottom: layout split com texto e imagem em áreas separadas (sem sobrepor).
  const imageOnTop = variant === "image-top"

  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative grid grid-rows-[auto_minmax(0,1fr)_auto]"
      style={{ backgroundColor: light, color: dark }}
    >
      {/* Header com pills (estilo refs v2) */}
      <div className="px-4 pt-4 flex items-center justify-between z-10">
        <Pill variant="light">{handle}</Pill>
        <Pill variant="light">{categoryTag}</Pill>
      </div>

      {/*
        Conteúdo principal: texto + imagem juntos (gap pequeno), ancorados pro
        topo no image-top ou pro rodapé no image-bottom. Sem `flex-1` no texto
        — o bloco encolhe ao tamanho natural e fica colado num lado.
      */}
      <div
        className={`px-5 flex flex-col gap-3 min-h-0 ${
          imageOnTop ? "justify-start" : "justify-end pb-1"
        }`}
      >
        {/* Imagem */}
        {imageOnTop && <SlideImage slide={slide} dark={dark} light={light} />}

        {/* Texto */}
        <div className="space-y-1.5 overflow-hidden">
          <h1
            className={`text-[1.7rem] leading-[1.1] tracking-tight ${fontClass}`}
            style={{ color: dark }}
          >
            <HighlightedText
              text={slide.title}
              words={slide.highlight_words}
              color={accent}
            />
          </h1>
          {slide.subtitle && (
            <p className="text-xs" style={{ color: dark, opacity: 0.7 }}>
              {slide.subtitle}
            </p>
          )}
          {slide.body && (
            <p
              className="text-[11px] leading-relaxed line-clamp-3"
              style={{ color: dark, opacity: 0.75 }}
            >
              {slide.body}
            </p>
          )}
        </div>

        {!imageOnTop && <SlideImage slide={slide} dark={dark} light={light} />}
      </div>

      {/* Footer com pills + dots (estilo refs v2) */}
      <div className="px-4 pb-4 pt-2 flex items-center justify-between">
        <Pill variant="light">{categoryTag}</Pill>
        <PaginationDots total={totalSlides} active={slide.order_index} color={dark} />
        <Pill variant="light">{`arrasta →`}</Pill>
      </div>

      <Attribution attribution={slide.image.attribution} textColor={dark} />
    </div>
  )
}

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
    <div className="aspect-[4/5] w-full rounded-xl overflow-hidden relative bg-zinc-900">
      {slide.image.url ? (
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

      <div className="absolute top-0 inset-x-0 px-4 py-3 bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex items-center justify-between text-white text-[10px] uppercase tracking-widest font-bold">
          <span>
            {slide.cta_badge ||
              `EDIÇÃO ${String(slide.order_index + 1).padStart(2, "0")}`}
          </span>
          <span className="tabular-nums opacity-70">
            {String(slide.order_index + 1).padStart(2, "0")}/
            {String(totalSlides).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-10 left-4 right-4 p-4 rounded-md z-10"
        style={{ backgroundColor: accent }}
      >
        <h1
          className={`text-2xl uppercase leading-[1.05] text-white tracking-tight ${fontClass}`}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words}
            color="#fff"
          />
        </h1>
        {slide.subtitle && (
          <p className="text-[11px] text-white/95 mt-2 uppercase tracking-wider">
            {slide.subtitle}
          </p>
        )}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <span
            key={i}
            className={`h-1 w-1 rounded-full ${
              i === slide.order_index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <Attribution attribution={slide.image.attribution} textColor="#fff" />
    </div>
  )
}
