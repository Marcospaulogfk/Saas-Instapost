import { BrandHeader } from "../../shared/BrandHeader"
import { HandlePill } from "../../shared/HandlePill"
import { OutlineText } from "../../shared/OutlineText"
import { anton, inter } from "../../fonts"
import { CheckCircle2 } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function FitnessDesafioComSelo({ brand, content, palette }: Props) {
  const photo = content.image_url
  const ghostWord = content.ghost_word || "DESAFIO"
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["DESAFIO DE 21 DIAS:", "EMAGREÇA E GANHE", "PRÊMIOS!"]
  )
  const outlineWord = content.outline_word
  const badgeLabel = content.badge_label || "GARANTIA"

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.accent }}>
      {/* Texto fantasma vertical no fundo (lateral esquerda) */}
      <div
        className={anton.className}
        style={{
          position: "absolute",
          left: "-8%",
          top: "55%",
          transform: "translateY(-50%) rotate(-90deg)",
          color: "rgba(0,0,0,0.08)",
          fontSize: "min(40cqw, 12rem)",
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

      {/* Foto direita 40% */}
      {photo ? (
        <img
          src={photo}
          alt=""
          className="absolute"
          style={{
            top: 0,
            right: 0,
            width: "42%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 2,
          }}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute"
          style={{
            top: 0,
            right: 0,
            width: "42%",
            height: "100%",
            background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
            zIndex: 2,
          }}
        />
      )}

      {/* Header marca */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <BrandHeader brand={brand} textColor={palette.dark} logoBg={palette.dark} logoFg={palette.accent} />
      </div>

      {/* @handle pill top-right (sobre a foto) */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Bloco esquerdo: título + descrição (com gap pra foto direita) */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "5cqw",
          width: "48%",
          top: "22cqw",
          gap: 15,
          zIndex: 4,
        }}
      >
        <h2
          className={anton.className}
          style={{
            color: palette.dark,
            fontSize: "min(8.5cqw, 2.3rem)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          {titleLines.map((line, i) => {
            const tokens = line.split(/\s+/)
            return (
              <span key={i} className="block">
                {tokens.map((tok, j) => {
                  const isOutline =
                    !!outlineWord &&
                    tok.replace(/[^A-Za-zÀ-ÿ]/g, "").toLowerCase() ===
                      outlineWord.replace(/[^A-Za-zÀ-ÿ]/g, "").toLowerCase()
                  return (
                    <span key={j}>
                      {j > 0 && " "}
                      {isOutline ? (
                        <OutlineText strokeColor={palette.dark} strokeWidth={1.5}>
                          {tok}
                        </OutlineText>
                      ) : (
                        tok
                      )}
                    </span>
                  )
                })}
              </span>
            )
          })}
        </h2>
        {content.body && (
          <p
            className={inter.className}
            style={{
              color: palette.dark,
              fontSize: "min(2.8cqw, 0.92rem)",
              fontWeight: 400,
              lineHeight: 1.5,
              marginRight: 6,
            }}
          >
            {content.body}
          </p>
        )}
      </div>

      {/* Selo circular de garantia — menor e mais baixo */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center"
        style={{
          left: "5cqw",
          bottom: "13cqw",
          width: "min(15cqw, 64px)",
          height: "min(15cqw, 64px)",
          background: palette.dark,
          border: `2px solid ${palette.accent}`,
          color: palette.accent,
          zIndex: 5,
        }}
      >
        <CheckCircle2
          style={{
            width: "min(5.5cqw, 24px)",
            height: "min(5.5cqw, 24px)",
            color: palette.accent,
          }}
        />
        <span
          className={inter.className}
          style={{
            fontSize: "min(1.4cqw, 0.48rem)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginTop: 1,
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Footer info contato — só se brand tiver */}
      {(brand.phone || brand.website || brand.tagline) && (
        <div
          className={`${inter.className} absolute flex items-end justify-between`}
          style={{
            left: "5cqw",
            right: "5cqw",
            bottom: "4cqw",
            color: palette.dark,
            fontSize: "min(1.9cqw, 0.6rem)",
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
