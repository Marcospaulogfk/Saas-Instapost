import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import { ArrowUpRight } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

function HighlightLine({
  text,
  highlights,
  highlightColor,
}: {
  text: string
  highlights?: string[]
  highlightColor: string
}) {
  if (!highlights || !highlights.length) return <>{text}</>
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const match = highlights.some((h) => h.toLowerCase() === part.toLowerCase())
        return (
          <span key={i} style={{ color: match ? highlightColor : "inherit" }}>
            {part}
          </span>
        )
      })}
    </>
  )
}

export function ComercialSplitColorProduct({ brand, content, palette }: Props) {
  const photo = content.image_url
  const productPng = content.product_image_url
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["O DESEMPENHO", "QUE ACOMPANHA", "SEU RITMO."]
  )
  const accent = "#FFFFFF"
  const brandColor = palette.dark === palette.accent ? palette.dark : palette.accent

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Top 60% — foto */}
      <div className="absolute" style={{ top: 0, left: 0, right: 0, height: "60%" }}>
        {photo ? (
          <img
            src={photo}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "saturate(1.1) contrast(1.05)" }}
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #404040 100%)" }}
          />
        )}
      </div>

      {/* Bottom 40% — cor sólida marca */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
          background: brandColor,
        }}
      />

      {/* Pill @handle top-left */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Seta diagonal top-right */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          top: "5cqw",
          right: "5cqw",
          width: "min(8cqw, 36px)",
          height: "min(8cqw, 36px)",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          color: "#FFFFFF",
          zIndex: 5,
        }}
      >
        <ArrowUpRight style={{ width: "min(4cqw, 20px)", height: "min(4cqw, 20px)" }} />
      </div>

      {/* Título principal na área de cor sólida */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "20cqw",
          zIndex: 5,
        }}
      >
        <h2
          className={anton.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(13cqw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              <HighlightLine
                text={line}
                highlights={content.highlight_words}
                highlightColor={accent}
              />
            </span>
          ))}
        </h2>
      </div>

      {/* Subtítulo uppercase */}
      {content.subtitle && (
        <div
          className={`${inter.className} absolute uppercase`}
          style={{
            left: "5cqw",
            right: "5cqw",
            bottom: "11cqw",
            color: "rgba(255,255,255,0.85)",
            fontSize: "min(2.6cqw, 0.82rem)",
            fontWeight: 500,
            letterSpacing: "0.1em",
            zIndex: 5,
          }}
        >
          {content.subtitle}
        </div>
      )}

      {/* Footer vazio — @handle pill já está no topo */}
    </div>
  )
}
