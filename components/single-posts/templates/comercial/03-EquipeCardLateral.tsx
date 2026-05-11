import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function ComercialEquipeCardLateral({ brand, content, palette }: Props) {
  const photo = content.image_url
  const ghostWord = content.ghost_word || "EQUIPE"
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["SOLUÇÕES", "COMPLETAS EM", "SEGURANÇA!"]
  )
  const bgColor =
    palette.accent === "#D4A574" || palette.accent === "#C9A572"
      ? palette.dark
      : palette.accent
  const ctaTextColor = palette.accent

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bgColor }}>
      {/* Texto fantasma gigante de fundo */}
      <div
        className={anton.className}
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.07)",
          fontSize: "min(50cqw, 14rem)",
          fontWeight: 900,
          lineHeight: 0.9,
          letterSpacing: "-0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {ghostWord}
      </div>

      {/* Header website centralizado */}
      {content.contact_website && (
        <div
          className={`${inter.className} absolute uppercase`}
          style={{
            top: "5cqw",
            left: "5cqw",
            right: "5cqw",
            textAlign: "center",
            color: "rgba(255,255,255,0.95)",
            fontSize: "min(2.6cqw, 0.82rem)",
            fontWeight: 500,
            letterSpacing: "0.15em",
          }}
        >
          {content.contact_website}
        </div>
      )}

      {/* Composição equipe — direita */}
      {photo && (
        <img
          src={photo}
          alt="equipe"
          className="absolute"
          style={{
            top: "10%",
            left: "30%",
            right: 0,
            height: "60%",
            width: "70%",
            objectFit: "cover",
            objectPosition: "center bottom",
          }}
          crossOrigin="anonymous"
        />
      )}

      {/* Bloco esquerdo: título + card juntos no bottom, gap 15px */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "5cqw",
          width: "55%",
          bottom: "13cqw",
          gap: 15,
          zIndex: 6,
        }}
      >
        <h2
          className={anton.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(9.5cqw, 2.5rem)",
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
        </h2>

        <div
          className="rounded-2xl"
          style={{
            background: palette.surface,
            padding: "min(4cqw, 18px)",
          }}
        >
          {content.body && (
            <p
              className={inter.className}
              style={{
                color: palette.dark,
                fontSize: "min(2.6cqw, 0.82rem)",
                fontWeight: 500,
                lineHeight: 1.45,
                marginBottom: "min(3cqw, 14px)",
              }}
            >
              {content.body}
            </p>
          )}
          {content.cta_text && (
            <span
              className={`${inter.className} inline-flex items-center`}
              style={{
                background: palette.dark,
                color: ctaTextColor,
                borderRadius: 999,
                padding: "min(2cqw, 10px) min(4cqw, 18px)",
                fontSize: "min(2.4cqw, 0.78rem)",
                fontWeight: 600,
                gap: 6,
              }}
            >
              {content.cta_text} →
            </span>
          )}
        </div>
      </div>

      {/* Footer: tagline opcional + @handle pill */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: "5cqw", right: "5cqw", bottom: "5cqw" }}
      >
        {brand.tagline ? (
          <span
            className={`${inter.className} uppercase`}
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "min(1.8cqw, 0.6rem)",
              fontWeight: 500,
              letterSpacing: "0.2em",
            }}
          >
            {brand.tagline}
          </span>
        ) : (
          <span />
        )}
        <HandlePill
          handle={brand.instagram_handle ?? brand.name}
          variant="dark"
          size="sm"
        />
      </div>
    </div>
  )
}
