import { BrandHeader } from "../../shared/BrandHeader"
import { HandlePill } from "../../shared/HandlePill"
import { OutlineText } from "../../shared/OutlineText"
import { anton, inter } from "../../fonts"
import { ArrowRight } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function FitnessResultadosGrid({ brand, content, palette }: Props) {
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["VEJA OS", "RESULTADOS", "VISÍVEIS EM 30 DIAS"]
  )
  const outlineWord = content.outline_word
  const ctaPrimary = content.cta_text || "Inicie seu programa hoje"
  const photos = [content.image_url, content.image_2_url, content.image_3_url].filter(Boolean) as string[]

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.accent }}>
      {/* Header marca */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <BrandHeader brand={brand} textColor={palette.dark} logoBg={palette.dark} logoFg={palette.accent} />
      </div>

      {/* @handle pill top-right */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="light" size="sm" />
      </div>

      {/* Título uppercase 3 linhas */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "5cqw",
          top: "15cqw",
          zIndex: 4,
        }}
      >
        <h2
          className={anton.className}
          style={{
            color: palette.dark,
            fontSize: "min(10cqw, 2.7rem)",
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
              lineHeight: 1.45,
              marginTop: "min(3cqw, 14px)",
              maxWidth: "85%",
            }}
          >
            {content.body}
          </p>
        )}
      </div>

      {/* Card preto com grid 3 fotos */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "5cqw",
          top: "52%",
          height: "26%",
          background: palette.dark,
          borderRadius: 18,
          padding: "min(2cqw, 10px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "min(2cqw, 10px)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden"
            style={{
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {photos[i] ? (
              <img
                src={photos[i]}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "min(2cqw, 0.65rem)",
                }}
              >
                foto {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA preto pill */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "11cqw",
          background: palette.dark,
          borderRadius: 999,
          padding: "min(2.5cqw, 12px) min(5cqw, 22px)",
          gap: "min(2cqw, 10px)",
        }}
      >
        <div className="flex flex-col">
          <span
            className={inter.className}
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "min(2cqw, 0.65rem)",
              fontWeight: 400,
            }}
          >
            {ctaPrimary}
          </span>
          <span
            className={inter.className}
            style={{
              color: "#FFFFFF",
              fontSize: "min(2.6cqw, 0.85rem)",
              fontWeight: 600,
            }}
          >
            inscreva-se e veja a transformação
          </span>
        </div>
        <ArrowRight
          style={{
            color: palette.accent,
            width: "min(4cqw, 18px)",
            height: "min(4cqw, 18px)",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Footer info contato — só se brand tiver alguma info */}
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
