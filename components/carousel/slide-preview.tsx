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
  return (
    <div
      className="aspect-[4/5] w-full rounded-xl overflow-hidden relative"
      style={{ backgroundColor: light, color: dark }}
    >
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-medium"
          style={{ color: dark, opacity: 0.6 }}
        >
          {slide.cta_badge ||
            (slide.order_index === 0
              ? "EDIÇÃO 01"
              : `FUNCIONALIDADE ${String(slide.order_index).padStart(2, "0")}`)}
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: dark, opacity: 0.4 }}
        >
          {String(slide.order_index + 1).padStart(2, "0")} /{" "}
          {String(totalSlides).padStart(2, "0")}
        </span>
      </div>

      {slide.image.url ? (
        <div className="absolute top-[18%] left-5 right-5 h-[36%] rounded-md overflow-hidden">
          <img
            src={slide.image.url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="absolute top-[18%] left-5 right-5 h-[36%] rounded-md flex items-center justify-center text-[10px] px-2 text-center"
          style={{ backgroundColor: dark, color: light, opacity: 0.5 }}
        >
          {slide.image.error || "sem imagem"}
        </div>
      )}

      <div className="absolute bottom-12 left-5 right-5 space-y-3">
        <h1
          className={`text-3xl leading-[1.1] tracking-tight ${fontClass}`}
          style={{ color: dark }}
        >
          <HighlightedText
            text={slide.title}
            words={slide.highlight_words}
            color={accent}
          />
        </h1>
        {slide.subtitle && (
          <p className="text-sm" style={{ color: dark, opacity: 0.7 }}>
            {slide.subtitle}
          </p>
        )}
        {slide.body && (
          <p
            className="text-xs leading-relaxed"
            style={{ color: dark, opacity: 0.75 }}
          >
            {slide.body}
          </p>
        )}
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
