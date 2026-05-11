import { BrandHeader } from "../../shared/BrandHeader"
import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function FitnessPromocionalRetrato({ brand, content, palette }: Props) {
  const photo = content.image_url
  const intro = content.intro || "Mês da\nTransformação:"
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["30% DE", "DESCONTO", "EM TODOS", "OS PLANOS!"]
  )
  const body = content.body

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.accent }}>
      {/* Blob orgânico decorativo atrás */}
      <div
        className="absolute"
        style={{
          right: "-20%",
          top: "10%",
          width: "70%",
          height: "70%",
          background: "rgba(0,0,0,0.10)",
          borderRadius: "50% 38% 60% 42%",
          transform: "rotate(-15deg)",
          zIndex: 1,
        }}
      />

      {/* Header marca */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <BrandHeader brand={brand} textColor={palette.dark} logoBg={palette.dark} logoFg={palette.accent} />
      </div>

      {/* @handle pill top-right */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="light" size="sm" />
      </div>

      {/* Foto pessoa direita — limitada a ~50% da largura */}
      {photo && (
        <div
          className="absolute"
          style={{
            top: "16%",
            right: 0,
            width: "48%",
            height: "76%",
            zIndex: 3,
            overflow: "hidden",
          }}
        >
          <img
            src={photo}
            alt={brand.name}
            className="w-full h-full"
            style={{
              objectFit: "cover",
              objectPosition: "right center",
            }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Bloco esquerdo: intro + oferta + descrição agrupados, gap 15px */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "5cqw",
          top: "16cqw",
          width: "45%",
          gap: 15,
          zIndex: 4,
        }}
      >
        <p
          className={inter.className}
          style={{
            color: palette.dark,
            fontSize: "min(4.5cqw, 1.3rem)",
            fontWeight: 500,
            lineHeight: 1.15,
            whiteSpace: "pre-line",
          }}
        >
          {intro}
        </p>

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
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>

        {body && (
          <p
            className={inter.className}
            style={{
              color: palette.dark,
              fontSize: "min(2.6cqw, 0.85rem)",
              fontWeight: 400,
              lineHeight: 1.5,
              marginRight: 6,
            }}
          >
            {body}
          </p>
        )}
      </div>

      {/* Footer 3 colunas — só se brand tem alguma info */}
      {(brand.phone || brand.website || brand.tagline) && (
        <div
          className={`${inter.className} absolute flex justify-between items-end`}
          style={{
            left: "5cqw",
            right: "5cqw",
            bottom: "5cqw",
            color: palette.dark,
            fontSize: "min(1.9cqw, 0.6rem)",
            opacity: 0.75,
            letterSpacing: "0.05em",
            zIndex: 6,
            gap: "min(2cqw, 10px)",
          }}
        >
          {brand.phone ? (
            <span style={{ fontWeight: 600 }}>{brand.phone}</span>
          ) : <span />}
          {brand.website ? <span>{brand.website}</span> : <span />}
          {brand.tagline ? (
            <span style={{ textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {brand.tagline}
            </span>
          ) : <span />}
        </div>
      )}
    </div>
  )
}
