import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function ComercialNumeroGrandeRetrato({ brand, content, palette }: Props) {
  const photo = content.image_url
  const kicker = content.kicker || "VIGILÂNCIA"
  const stat = content.stat_value || "24H"
  const description = content.body || "Segurança sem\ninterrupções, 24/7"
  const ctaText = content.cta_text || "Fale conosco"
  const bg =
    palette.accent === "#D4A574" || palette.accent === "#C9A572"
      ? palette.dark
      : palette.accent

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bg }}>
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
            zIndex: 5,
          }}
        >
          {content.contact_website}
        </div>
      )}

      {/* Foto retrato lateral direita (com sangria) */}
      {photo && (
        <div
          className="absolute"
          style={{
            top: "20%",
            right: 0,
            width: "55%",
            height: "65%",
            zIndex: 2,
          }}
        >
          <img
            src={photo}
            alt={brand.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: "center top",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
            }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Bloco principal — kicker + stat + descrição + CTA, todos com gap 15px */}
      <div
        className="absolute flex flex-col"
        style={{
          top: "14cqw",
          left: "5cqw",
          maxWidth: "55%",
          gap: 15,
          zIndex: 5,
        }}
      >
        <span
          className={anton.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(8cqw, 2.1rem)",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </span>
        <span
          className={anton.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(28cqw, 7.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            textTransform: "uppercase",
          }}
        >
          {stat}
        </span>
        <p
          className={inter.className}
          style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: "min(3cqw, 0.95rem)",
            fontWeight: 400,
            lineHeight: 1.4,
            whiteSpace: "pre-line",
          }}
        >
          {description}
        </p>
        <span
          className={inter.className}
          style={{
            display: "inline-block",
            alignSelf: "flex-start",
            background: palette.surface,
            color: palette.dark,
            borderRadius: 999,
            padding: "min(2cqw, 10px) min(5cqw, 22px)",
            fontSize: "min(2.6cqw, 0.85rem)",
            fontWeight: 600,
          }}
        >
          {ctaText}
        </span>
      </div>

      {/* Footer: tagline opcional + @handle pill */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: "5cqw", right: "5cqw", bottom: "5cqw", zIndex: 5 }}
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
