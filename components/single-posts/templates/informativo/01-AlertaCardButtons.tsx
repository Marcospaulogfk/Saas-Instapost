import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import { AlertTriangle, ArrowUpRight } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function InformativoAlertaCardButtons({ brand, content, palette }: Props) {
  const ghostWord = content.ghost_word || (content.title || "AVISO").toUpperCase()
  const title = content.title || "ATENÇÃO"
  const body = content.body
  const ctaPrimary = content.cta_text || "Saiba Mais"
  const ctaSecondary = content.cta_secondary
  const taglineFinal = content.subtitle
  const bgColor =
    palette.accent === "#D4A574" || palette.accent === "#C9A572"
      ? palette.dark
      : palette.accent

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bgColor }}>
      {/* Texto fantasma gigante de fundo */}
      <div
        className={anton.className}
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.06)",
          fontSize: "min(60cqw, 16rem)",
          fontWeight: 900,
          lineHeight: 0.85,
          letterSpacing: "-0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {ghostWord}
      </div>

      {/* Header website + seta */}
      <div
        className={`${inter.className} absolute flex justify-between items-center`}
        style={{
          top: "5cqw",
          left: "5cqw",
          right: "5cqw",
          color: "rgba(255,255,255,0.95)",
          fontSize: "min(2.6cqw, 0.82rem)",
          fontWeight: 500,
          letterSpacing: "0.1em",
          zIndex: 5,
        }}
      >
        <span>{content.contact_website || ""}</span>
        <span
          className="rounded-full flex items-center justify-center"
          style={{
            width: "min(7cqw, 32px)",
            height: "min(7cqw, 32px)",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <ArrowUpRight style={{ width: "min(3.5cqw, 16px)", height: "min(3.5cqw, 16px)" }} />
        </span>
      </div>

      {/* Card central branco */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "5cqw",
          top: "50%",
          transform: "translateY(-50%)",
          background: palette.surface,
          borderRadius: 24,
          padding: "min(6cqw, 28px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          zIndex: 4,
        }}
      >
        <AlertTriangle
          style={{
            width: "min(10cqw, 44px)",
            height: "min(10cqw, 44px)",
            color: palette.dark,
            display: "block",
            margin: "0 auto",
          }}
        />
        <h2
          className={anton.className}
          style={{
            color: palette.dark,
            fontSize: "min(13cqw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: "min(3cqw, 14px)",
          }}
        >
          {title}
        </h2>
        {body && (
          <p
            className={inter.className}
            style={{
              color: palette.textSecondary,
              fontSize: "min(2.6cqw, 0.85rem)",
              fontWeight: 400,
              lineHeight: 1.5,
              textAlign: "center",
              marginTop: "min(3cqw, 14px)",
            }}
          >
            {body}
          </p>
        )}
        {/* Botões duplos */}
        <div
          className="flex"
          style={{
            gap: "min(2cqw, 10px)",
            marginTop: "min(5cqw, 22px)",
          }}
        >
          {ctaSecondary && (
            <span
              className={inter.className}
              style={{
                flex: 1,
                textAlign: "center",
                background: "transparent",
                color: palette.dark,
                border: `1px solid ${palette.dark}`,
                borderRadius: 999,
                padding: "min(2.5cqw, 12px) min(4cqw, 18px)",
                fontSize: "min(2.6cqw, 0.85rem)",
                fontWeight: 500,
              }}
            >
              {ctaSecondary}
            </span>
          )}
          <span
            className={inter.className}
            style={{
              flex: 1,
              textAlign: "center",
              background: bgColor,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "min(2.5cqw, 12px) min(4cqw, 18px)",
              fontSize: "min(2.6cqw, 0.85rem)",
              fontWeight: 600,
            }}
          >
            {ctaPrimary}
          </span>
        </div>
        {taglineFinal && (
          <p
            className={inter.className}
            style={{
              color: palette.textSecondary,
              fontSize: "min(2.4cqw, 0.78rem)",
              fontWeight: 500,
              textAlign: "center",
              marginTop: "min(3.5cqw, 16px)",
            }}
          >
            {taglineFinal}
          </p>
        )}
      </div>

      {/* Footer marca + handle */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: "5cqw", right: "5cqw", bottom: "5cqw", zIndex: 5 }}
      >
        {brand.tagline ? (
          <span
            className={`${inter.className} uppercase`}
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "min(1.9cqw, 0.6rem)",
              fontWeight: 500,
              letterSpacing: "0.2em",
            }}
          >
            {brand.tagline}
          </span>
        ) : (
          <span />
        )}
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>
    </div>
  )
}
