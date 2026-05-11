import { HandlePill } from "../../shared/HandlePill"
import { playfair, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function BeautyFraseConceitualCentered({ brand, content, palette }: Props) {
  const photo = content.image_url
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["Beleza é", "equilíbrio!"]
  )
  const tagline = content.body || "confiança é consequência."

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.surface }}>
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
          style={{ background: "linear-gradient(180deg, #f0e3d6 0%, #d6b89a 100%)" }}
        />
      )}

      {/* Sombra sutil no bottom pra legibilidade do manifesto */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "55%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Tagline vertical bottom-left (opcional) */}
      {brand.tagline && (
        <div
          className={inter.className}
          style={{
            position: "absolute",
            bottom: "5cqw",
            left: "5cqw",
            color: "rgba(255,255,255,0.7)",
            fontSize: "min(2cqw, 0.65rem)",
            fontWeight: 500,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            zIndex: 6,
          }}
        >
          {brand.tagline}
        </div>
      )}

      {/* Manifesto + tagline + @handle pill — agrupado no bottom centralizado */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "8cqw",
          textAlign: "center",
          zIndex: 5,
          gap: "min(3cqw, 14px)",
        }}
      >
        <div
          className={playfair.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(16cqw, 4.4rem)",
            fontStyle: "italic",
            fontWeight: 500,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 16px rgba(0,0,0,0.25)",
          }}
        >
          {titleLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <p
          className={inter.className}
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: "min(3.2cqw, 0.95rem)",
            fontStyle: "italic",
            fontWeight: 400,
            letterSpacing: "0.02em",
            textShadow: "0 1px 6px rgba(0,0,0,0.4)",
          }}
        >
          {tagline}
        </p>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>
    </div>
  )
}
