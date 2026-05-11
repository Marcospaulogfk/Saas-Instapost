import { HandlePill } from "../../shared/HandlePill"
import { playfair, anton } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function ProfissionalRetratoTituloBottom({
  brand,
  content,
  palette,
}: Props) {
  const photo = content.image_url
  const titleLines = content.title_lines && content.title_lines.length
    ? content.title_lines
    : ["TÍTULO"]

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: palette.dark }}
    >
      {/* Foto fullbleed */}
      {photo ? (
        <img
          src={photo}
          alt={brand.name}
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${palette.dark} 0%, #2a2a2a 100%)` }}
        >
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            retrato profissional
          </span>
        </div>
      )}

      {/* Overlay gradient escuro bottom-up */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Handle pill top-right */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw" }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Bloco bottom centralizado: título → descrição → divisor */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "10cqw",
          textAlign: "center",
        }}
      >
        <h1
          className={anton.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(11cqw, 2.9rem)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>

        {(content.intro || content.intro_2) && (
          <div
            className={playfair.className}
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "min(3.6cqw, 1rem)",
              fontStyle: "italic",
              fontWeight: 400,
              lineHeight: 1.35,
              marginTop: "3cqw",
            }}
          >
            {content.intro && <p>{content.intro}</p>}
            {content.intro_2 && <p>{content.intro_2}</p>}
          </div>
        )}

        {/* Divisor accent */}
        <div
          style={{
            width: "20cqw",
            maxWidth: 80,
            height: 2,
            background: palette.accent,
            margin: "3.5cqw auto 0",
          }}
        />
      </div>
    </div>
  )
}
