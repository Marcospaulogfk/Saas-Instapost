import { BrandHeader } from "../../shared/BrandHeader"
import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import { ChevronDown } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function FitnessInstitucionalFotosEspaco({ brand, content, palette }: Props) {
  const intro = content.kicker || "VEM SER"
  const isDemoBrand = brand.name === "Marca Demo"
  // Quando não tem brand real, usa título do briefing (title_lines/title) em vez do nome
  const headlineText = isDemoBrand
    ? (content.title_lines?.join("\n") ?? content.title ?? "ESPAÇO\nFITNESS")
    : brand.name
  const body = content.body
  const ctaPrimary = content.cta_text || "Saiba mais"
  const ctaHighlight = content.title_emphasis || ""
  const photo1 = content.image_url
  const photo2 = content.image_2_url

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.accent }}>
      {/* Header marca — oculta se não tiver brand real (evita "Marca Demo" duplicado) */}
      {!isDemoBrand && (
        <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
          <BrandHeader brand={brand} textColor={palette.dark} logoBg={palette.dark} logoFg={palette.accent} />
        </div>
      )}

      {/* @handle pill top-right */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="light" size="sm" />
      </div>

      {/* Lado esquerdo: convite */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "5cqw",
          top: "16cqw",
          width: "48%",
          gap: 12,
          zIndex: 4,
        }}
      >
        <span
          className={anton.className}
          style={{
            color: palette.dark,
            fontSize: "min(5.5cqw, 1.5rem)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {intro}
        </span>

        <h2
          className={anton.className}
          style={{
            color: palette.dark,
            fontSize: "min(11cqw, 3rem)",
            fontWeight: 800,
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            whiteSpace: "pre-line",
            wordBreak: "break-word",
          }}
        >
          {headlineText}
        </h2>

        {body && (
          <p
            className={inter.className}
            style={{
              color: palette.dark,
              fontSize: "min(2.6cqw, 0.85rem)",
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: "92%",
            }}
          >
            {body}
          </p>
        )}
      </div>

      {/* Lado direito: 2 fotos empilhadas */}
      <div
        className="absolute flex flex-col"
        style={{
          right: "5cqw",
          top: "16cqw",
          width: "40%",
          height: "50%",
          gap: "min(2.5cqw, 12px)",
          zIndex: 3,
        }}
      >
        {[photo1, photo2].map((url, i) => (
          <div
            key={i}
            className="overflow-hidden relative"
            style={{
              flex: 1,
              borderRadius: 14,
              background: "rgba(0,0,0,0.05)",
            }}
          >
            {url ? (
              <>
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                {/* Leve overlay escuro só na 1ª foto pra destacar conteúdo do lado esquerdo */}
                {i === 0 && (
                  <div
                    className="absolute inset-0"
                    style={{ background: "rgba(0,0,0,0.18)" }}
                  />
                )}
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  color: "rgba(0,0,0,0.3)",
                  fontSize: "min(2cqw, 0.65rem)",
                }}
              >
                foto {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA pill principal */}
      <div
        className="absolute flex items-center"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "20cqw",
          background: palette.dark,
          color: "#FFFFFF",
          borderRadius: 999,
          padding: "min(2.5cqw, 12px) min(5cqw, 22px)",
          gap: "min(2cqw, 10px)",
          zIndex: 5,
        }}
      >
        <ChevronDown
          style={{
            color: palette.accent,
            width: "min(4cqw, 18px)",
            height: "min(4cqw, 18px)",
            flexShrink: 0,
          }}
        />
        <span
          className={inter.className}
          style={{
            fontSize: "min(2.6cqw, 0.85rem)",
            fontWeight: 600,
          }}
        >
          {ctaPrimary}
        </span>
        <span
          className={inter.className}
          style={{
            color: palette.accent,
            fontSize: "min(2.6cqw, 0.85rem)",
            fontWeight: 700,
            marginLeft: 2,
          }}
        >
          {ctaHighlight}
        </span>
      </div>

      {/* CTA secundário "Agende agora" — só se brand tem phone */}
      {brand.phone && (
        <div
          className={`${inter.className} absolute`}
          style={{
            left: "5cqw",
            bottom: "12cqw",
            color: palette.dark,
            zIndex: 5,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "min(3.4cqw, 1.05rem)" }}>
            Agende agora{" "}
          </span>
          <span style={{ fontWeight: 400, fontSize: "min(3cqw, 0.95rem)" }}>
            {brand.phone}
          </span>
        </div>
      )}

      {/* Footer info contato — só se brand tem alguma info */}
      {(brand.website || brand.tagline) && (
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
          {brand.website ? <span>{brand.website}</span> : <span />}
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
