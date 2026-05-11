import { HandlePill } from "../../shared/HandlePill"
import { inter } from "../../fonts"
import { ArrowDownRight } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

function HighlightInline({
  text,
  highlights,
}: {
  text: string
  highlights?: string[]
}) {
  if (!highlights || !highlights.length) return <>{text}</>
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const match = highlights.some((h) => h.toLowerCase() === part.toLowerCase())
        return (
          <span
            key={i}
            style={{
              fontWeight: match ? 700 : "inherit",
              color: match ? "#FFFFFF" : "inherit",
            }}
          >
            {part}
          </span>
        )
      })}
    </>
  )
}

export function EmpresaCtaSetaGrande({ brand, content, palette }: Props) {
  const photo = content.image_url
  const cardBg = palette.dark
  const ctaBg = "#0A0A0A" // botão sempre preto pra contraste forte

  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-900">
      {/* Foto top 50% */}
      {photo ? (
        <img
          src={photo}
          alt=""
          className="absolute"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            width: "100%",
            objectFit: "cover",
            filter: "saturate(0.95) contrast(1.05)",
          }}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            background: "linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)",
          }}
        />
      )}

      {/* Card cor primary bottom 50% */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: cardBg,
        }}
      />

      {/* Header tags duplas */}
      <div
        className={`${inter.className} absolute flex justify-between`}
        style={{
          top: "5cqw",
          left: "5cqw",
          right: "5cqw",
          fontSize: "min(2.4cqw, 0.78rem)",
          fontWeight: 500,
          letterSpacing: "0.1em",
          color: "#FFFFFF",
          zIndex: 5,
        }}
      >
        <span>
          /{(brand.instagram_handle ?? brand.name).toLowerCase().replace(/\s/g, "")}
        </span>
        <span>{(brand.profession || "serviços").toLowerCase()}</span>
      </div>

      {/* @handle pill top-left abaixo do header */}
      <div
        className="absolute"
        style={{ top: "11cqw", left: "5cqw", zIndex: 5 }}
      >
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Seta circular gigante na linha de divisão */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          right: "8cqw",
          top: "50%",
          transform: "translateY(-50%)",
          width: "min(20cqw, 84px)",
          height: "min(20cqw, 84px)",
          background: palette.accent,
          color: cardBg,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          zIndex: 6,
        }}
      >
        <ArrowDownRight
          style={{ width: "min(10cqw, 40px)", height: "min(10cqw, 40px)" }}
          strokeWidth={2.5}
        />
      </div>

      {/* Conteúdo do card — título + descrição + CTA, gap 15px */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "10cqw",
          gap: 15,
          zIndex: 5,
        }}
      >
        <h2
          className={inter.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(8.5cqw, 2.2rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            whiteSpace: "pre-line",
            maxWidth: "75%",
          }}
        >
          {content.title || "Formalize seu negócio\ncom segurança!"}
        </h2>

        {content.body && (
          <p
            className={inter.className}
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "min(2.8cqw, 0.92rem)",
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: "75%",
            }}
          >
            <HighlightInline
              text={content.body}
              highlights={content.highlight_words}
            />
          </p>
        )}

        {content.cta_text && (
          <span
            className={inter.className}
            style={{
              alignSelf: "flex-start",
              background: ctaBg,
              color: palette.accent,
              borderRadius: 999,
              padding: "min(2.5cqw, 12px) min(6cqw, 28px)",
              fontSize: "min(2.8cqw, 0.92rem)",
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {content.cta_text}
          </span>
        )}
      </div>
    </div>
  )
}
