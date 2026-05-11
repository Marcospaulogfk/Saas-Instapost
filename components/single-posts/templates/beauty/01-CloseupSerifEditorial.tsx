import { HandlePill } from "../../shared/HandlePill"
import { InlineFooter } from "../../shared/InlineFooter"
import { playfair, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function BeautyCloseupSerifEditorial({ brand, content, palette }: Props) {
  const photo = content.image_url
  const titleLines = content.title_lines && content.title_lines.length
    ? content.title_lines
    : ["A boca", "perfeita", "existe..."]

  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-900">
      {photo ? (
        <img
          src={photo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #2a1f18 0%, #5c3a2c 100%)" }}
        />
      )}

      {/* Pill @handle top-left */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Título editorial — metade vertical esquerda */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          top: "50%",
          transform: "translateY(-50%)",
          width: "55%",
        }}
      >
        <div
          className={playfair.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(15cqw, 4rem)",
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {titleLines.map((line, i) => {
            const isMiddle = i === 1 && titleLines.length === 3
            return (
              <p
                key={i}
                style={{
                  fontStyle: isMiddle ? "italic" : "normal",
                  fontWeight: isMiddle ? 400 : 500,
                }}
              >
                {line}
              </p>
            )
          })}
        </div>

        {/* Divisor accent */}
        <div
          style={{
            width: "min(15cqw, 60px)",
            height: 1,
            background: palette.accent,
            margin: "min(5cqw, 22px) 0 min(3.5cqw, 16px)",
          }}
        />

        {content.body && (
          <p
            className={inter.className}
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: "min(3cqw, 0.92rem)",
              fontWeight: 400,
              lineHeight: 1.45,
              maxWidth: "85%",
            }}
          >
            {renderBodyWithHighlights(content.body, content.highlight_words)}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="absolute" style={{ bottom: "5cqw", left: "5cqw", right: "5cqw" }}>
        <InlineFooter
          brand={brand}
          variant="dark"
          align="left"
          tagline={brand.tagline}
        />
      </div>
    </div>
  )
}

function renderBodyWithHighlights(text: string, highlights?: string[]) {
  if (!highlights || !highlights.length) return text
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return parts.map((part, i) => {
    const isMatch = highlights.some((h) => h.toLowerCase() === part.toLowerCase())
    if (!isMatch) return <span key={i}>{part}</span>
    return (
      <em key={i} style={{ fontWeight: 600, fontStyle: "italic" }}>
        {part}
      </em>
    )
  })
}
