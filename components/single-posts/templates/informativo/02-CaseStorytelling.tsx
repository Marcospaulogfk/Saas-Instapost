import { BrandHeader } from "../../shared/BrandHeader"
import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import { Star } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

function HighlightInline({ text, highlights }: { text: string; highlights?: string[] }) {
  if (!highlights || !highlights.length) return <>{text}</>
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const match = highlights.some((h) => h.toLowerCase() === part.toLowerCase())
        return (
          <span key={i} style={{ fontWeight: match ? 700 : "inherit" }}>
            {part}
          </span>
        )
      })}
    </>
  )
}

export function InformativoCaseStorytelling({ brand, content, palette }: Props) {
  const ghostWord = content.ghost_word || "REAL"
  const kicker = content.kicker || "TRANSFORMAÇÃO REAL:"
  const title = content.title || "Conheça a história"
  const body = content.body
  const accent = palette.accent

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: accent }}>
      {/* Texto fantasma vertical lateral */}
      <div
        className={anton.className}
        style={{
          position: "absolute",
          left: "-5%",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          color: "rgba(0,0,0,0.08)",
          fontSize: "min(45cqw, 13rem)",
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: "-0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {ghostWord}
      </div>

      {/* Header marca */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <BrandHeader brand={brand} textColor={palette.dark} logoBg={palette.dark} logoFg={accent} />
      </div>

      {/* @handle pill top-right */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="light" size="sm" />
      </div>

      {/* Card escuro central */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "5cqw",
          top: "50%",
          transform: "translateY(-50%)",
          background: palette.dark,
          borderRadius: 24,
          padding: "min(6cqw, 28px)",
          zIndex: 4,
        }}
      >
        <p
          className={anton.className}
          style={{
            color: accent,
            fontSize: "min(8cqw, 2.2rem)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </p>
        <p
          className={inter.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(4.5cqw, 1.3rem)",
            fontWeight: 400,
            lineHeight: 1.3,
            marginTop: "min(2cqw, 10px)",
          }}
        >
          <HighlightInline text={title} highlights={content.highlight_words} />
        </p>

        {body && (
          <>
            <div
              style={{
                width: "min(15cqw, 60px)",
                height: 2,
                background: "rgba(255,255,255,0.25)",
                margin: "min(4cqw, 18px) 0",
              }}
            />
            <p
              className={inter.className}
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: "min(2.8cqw, 0.92rem)",
                fontWeight: 400,
                lineHeight: 1.5,
                maxWidth: "100%",
              }}
            >
              {body}
            </p>
          </>
        )}
      </div>

      {/* Selo circular pequeno bottom-left */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          left: "5cqw",
          bottom: "13cqw",
          width: "min(11cqw, 48px)",
          height: "min(11cqw, 48px)",
          background: palette.dark,
          border: `2px solid ${accent}`,
          color: accent,
          zIndex: 5,
        }}
      >
        <Star
          style={{
            width: "min(5cqw, 22px)",
            height: "min(5cqw, 22px)",
            fill: accent,
          }}
        />
      </div>

      {/* Footer info contato */}
      {(brand.phone || brand.website || brand.tagline) && (
        <div
          className={`${inter.className} absolute flex items-end justify-between`}
          style={{
            left: "5cqw",
            right: "5cqw",
            bottom: "4cqw",
            color: palette.dark,
            fontSize: "min(1.9cqw, 0.62rem)",
            opacity: 0.75,
            lineHeight: 1.4,
            zIndex: 5,
          }}
        >
          {(brand.phone || brand.website) ? (
            <div>
              {brand.phone && <p>{brand.phone}</p>}
              {brand.website && <p>{brand.website}</p>}
            </div>
          ) : <span />}
          {brand.tagline && (
            <p style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {brand.tagline}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
