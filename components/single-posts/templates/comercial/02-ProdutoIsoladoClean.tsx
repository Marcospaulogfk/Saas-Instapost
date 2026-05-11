import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import { ArrowUpRight, Star } from "lucide-react"
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

export function ComercialProdutoIsoladoClean({ brand, content, palette }: Props) {
  const productPng = content.product_image_url
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["QUEM TEM,", "NÃO VOLTA", "ATRÁS."]
  )

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(circle at center, #FFFFFF 0%, ${palette.surface} 100%)`,
      }}
    >
      {/* Pill @handle top-left */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="light" size="sm" />
      </div>

      {/* Seta diagonal top-right */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          top: "5cqw",
          right: "5cqw",
          width: "min(8cqw, 36px)",
          height: "min(8cqw, 36px)",
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.08)",
          color: palette.dark,
        }}
      >
        <ArrowUpRight style={{ width: "min(4cqw, 20px)", height: "min(4cqw, 20px)" }} />
      </div>

      {/* Título topo */}
      <div className="absolute" style={{ top: "16cqw", left: "5cqw", right: "5cqw" }}>
        <h2
          className={anton.className}
          style={{
            color: palette.dark,
            fontSize: "min(11.5cqw, 3.1rem)",
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
                highlightColor={palette.accent}
              />
            </span>
          ))}
        </h2>
        {content.body && (
          <p
            className={`${inter.className} uppercase`}
            style={{
              color: palette.textSecondary,
              fontSize: "min(2.4cqw, 0.78rem)",
              fontWeight: 500,
              letterSpacing: "0.1em",
              marginTop: "min(2.5cqw, 12px)",
            }}
          >
            {content.body}
          </p>
        )}
      </div>

      {/* Mockup produto centralizado — começa abaixo do título */}
      <div
        className="absolute"
        style={{
          left: "12%",
          right: "12%",
          top: "48%",
          bottom: "16cqw",
        }}
      >
        {productPng ? (
          <img
            src={productPng}
            alt="produto"
            className="w-full h-full object-contain"
            style={{
              transform: "rotate(-3deg)",
              filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.18))",
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className={`${inter.className} w-full h-full flex items-center justify-center text-xs`}
            style={{
              color: palette.textSecondary,
              border: `1px dashed ${palette.textSecondary}`,
              borderRadius: 8,
            }}
          >
            mockup do produto (PNG)
          </div>
        )}
      </div>

      {/* Selo lateral direita */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center"
        style={{
          right: "8cqw",
          top: "55%",
          width: "min(13cqw, 56px)",
          height: "min(13cqw, 56px)",
          background: palette.accent,
          color: palette.dark,
        }}
      >
        <Star
          style={{
            width: "min(4cqw, 18px)",
            height: "min(4cqw, 18px)",
            fill: palette.dark,
          }}
        />
        <span
          className={inter.className}
          style={{
            fontSize: "min(1.6cqw, 0.55rem)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginTop: 2,
          }}
        >
          TOP
        </span>
      </div>

      {/* Footer apenas com website opcional (pill já está no topo) */}
      {content.contact_website && (
        <div
          className="absolute"
          style={{ left: "5cqw", right: "5cqw", bottom: "5cqw", textAlign: "right" }}
        >
          <span
            className={`${inter.className} uppercase`}
            style={{
              color: palette.textSecondary,
              fontSize: "min(2.2cqw, 0.7rem)",
              fontWeight: 500,
              letterSpacing: "0.15em",
            }}
          >
            {content.contact_website}
          </span>
        </div>
      )}
    </div>
  )
}
