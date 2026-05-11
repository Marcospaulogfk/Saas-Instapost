import { HandlePill } from "../../shared/HandlePill"
import { anton } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

/** Renderiza linha com strikethrough numa palavra específica */
function LineWithStrike({
  text,
  strikeWord,
  strikeColor,
}: {
  text: string
  strikeWord?: string
  strikeColor: string
}) {
  if (!strikeWord) {
    return <span>{text}</span>
  }
  const re = new RegExp(`\\b(${strikeWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i")
  const match = text.match(re)
  if (!match || match.index === undefined) return <span>{text}</span>
  const before = text.slice(0, match.index)
  const word = match[1]
  const after = text.slice(match.index + word.length)
  return (
    <span>
      {before}
      <span
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        {word}
        <span
          style={{
            position: "absolute",
            left: -4,
            right: -4,
            top: "50%",
            height: 4,
            background: strikeColor,
            transform: "rotate(-3deg)",
          }}
        />
      </span>
      {after}
    </span>
  )
}

export function ProfissionalPerguntaProvocativa({
  brand,
  content,
  palette,
}: Props) {
  const photo = content.image_url
  const titleLines = content.title_lines && content.title_lines.length
    ? content.title_lines
    : ["O QUE NINGUÉM TE", "CONTA SOBRE ISSO?"]

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: palette.dark }}
    >
      {photo ? (
        <img
          src={photo}
          alt={brand.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(0.85) contrast(1.1)" }}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, #3a3a3a 0%, ${palette.dark} 70%, #0a0a0a 100%)`,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>
            retrato sério
          </span>
        </div>
      )}

      {/* Overlay radial — escuro forte na borda + bottom pra legibilidade da pergunta */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      {/* Banda escura extra no bottom pra apagar qualquer artefato da foto atrás da pergunta */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "45%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Bloco bottom: pill + título com 12px de distância */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: "5cqw",
          right: "5cqw",
          bottom: "10cqw",
          textAlign: "center",
          gap: 12,
          zIndex: 10,
        }}
      >
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
        <h1
          className={anton.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(13cqw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              <LineWithStrike
                text={line}
                strikeWord={content.strikethrough_word}
                strikeColor={palette.accent}
              />
            </span>
          ))}
        </h1>
      </div>
    </div>
  )
}
