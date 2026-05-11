import { HandlePill } from "../../shared/HandlePill"
import { playfair } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

/** Renderiza texto + sublinhados sutis em palavras destacadas */
function HighlightInline({
  text,
  highlights,
  underlineColor,
}: {
  text: string
  highlights?: string[]
  underlineColor: string
}) {
  if (!highlights || !highlights.length) return <>{text}</>
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = highlights.some((h) => h.toLowerCase() === part.toLowerCase())
        if (!isMatch) return <span key={i}>{part}</span>
        return (
          <span
            key={i}
            style={{
              borderBottom: `1px solid ${underlineColor}`,
              paddingBottom: 2,
            }}
          >
            {part}
          </span>
        )
      })}
    </>
  )
}

export function ProfissionalFraseEducativaMoldura({
  brand,
  content,
  palette,
}: Props) {
  const photo = content.image_url
  const title = content.title || "Texto educativo do post"
  const framedWord = content.framed_word

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.dark }}>
      {/* Foto direita 60% (preferível PNG sem fundo) */}
      <div
        className="absolute"
        style={{
          right: 0,
          top: 0,
          bottom: 0,
          width: "55%",
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={brand.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: "right center" }}
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(to left, rgba(255,255,255,0.04) 0%, transparent 100%)",
              color: "rgba(255,255,255,0.25)",
              fontSize: "0.8rem",
            }}
          >
            retrato (PNG sem fundo)
          </div>
        )}
        {/* fade gradient overlap pra esquerda */}
        <div
          className="absolute inset-y-0"
          style={{
            left: 0,
            width: "30%",
            background: `linear-gradient(to right, ${palette.dark} 0%, transparent 100%)`,
          }}
        />
      </div>

      {/* Frase esquerda */}
      <div
        className="absolute"
        style={{
          left: "5cqw",
          right: "45%",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <p
          className={playfair.className}
          style={{
            color: "#FFFFFF",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "min(7cqw, 1.85rem)",
            lineHeight: 1.3,
          }}
        >
          <HighlightInline
            text={title}
            highlights={content.highlight_words}
            underlineColor={palette.accent}
          />
          {framedWord && (
            <>
              {" "}
              <span
                style={{
                  display: "inline-block",
                  border: `1px solid ${palette.accent}`,
                  padding: "2px 10px",
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                {framedWord}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Handle pill bottom-left */}
      <div className="absolute" style={{ left: "5cqw", bottom: "8cqw" }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>
    </div>
  )
}
