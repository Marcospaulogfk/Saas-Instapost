"use client"

// ============================================================================
// Peças pequenas compartilhadas pelos estilos novos (components/carousel/
// styles/*.tsx). Tudo aqui segue as regras do editor Canva-like:
//   - título = FitText (data-edit="title" automático)
//   - texto descritivo = <p> (vira "text" em runtime)
//   - tag = Pill (data-edit="badge"), foto = SmartSlideImage (data-edit="image")
//   - rodapé/marca/contador/seta = data-edit="meta"
//   - forma decorativa (círculo, faixa, post-it, palavra-fantasma, linha) =
//     {...shapeAttrs()} → o usuário clica, troca a cor, move, escala e apaga
// Sem backdrop-filter (vira mancha no export PNG).
// ============================================================================
import { useContext, type CSSProperties, type ReactNode } from "react"
import { fontClassById } from "../carousel-fonts"
import {
  HighlightStyleContext,
  ImagePlaceholder,
  SmartSlideImage,
  type SlideAttribution,
} from "../editorial-shared"
import type { ShapePaint } from "../editable-overrides"

/**
 * Marca um elemento decorativo como FORMA editável no editor. `paint` diz onde
 * a cor escolhida pinta: "bg" (preenchimento, padrão), "text" (letras ou SVG
 * com currentColor) ou "border" (contorno). Espalhe no elemento da forma:
 * `<div {...shapeAttrs()} className="absolute ..." style={{ backgroundColor }} />`
 */
export function shapeAttrs(paint: ShapePaint = "bg"): Record<string, string> {
  return paint === "bg"
    ? { "data-edit": "shape" }
    : { "data-edit": "shape", "data-edit-paint": paint }
}

/** Serifa itálica pras palavras de destaque "de revista" (Playfair, itálico). */
export const SERIF_ITALIC_CLASS = `${fontClassById("playfair")} italic`

/** Letra manuscrita pras palavras de destaque "de colagem". */
export const SCRIPT_CLASS = fontClassById("caveat")

/** Tamanho do título pelo comprimento do texto (3 degraus). */
export function titleSizeFor(title: string, big: string, mid: string, small: string): string {
  const n = (title ?? "").length
  return n > 46 ? small : n > 30 ? mid : big
}

function escapeRe(w: string): string {
  return w.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&")
}

/**
 * Destaca as palavras-chave trocando a FONTE (itálico serifado, manuscrita...)
 * e, opcionalmente, a cor. Respeita a cor escolhida pelo usuário na barrinha
 * de edição do título (HighlightStyleContext), igual ao HighlightedText.
 */
export function StyledWords({
  text,
  words,
  className,
  color,
  style,
}: {
  text: string
  words: string[]
  /** Classes aplicadas só nas palavras destacadas (ex.: SERIF_ITALIC_CLASS). */
  className: string
  color?: string
  style?: CSSProperties
}) {
  const hs = useContext(HighlightStyleContext)
  if (!words?.length) return <>{text}</>
  const re = new RegExp(`(${words.map(escapeRe).join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const hit = words.some((w) => w.toLowerCase() === part.toLowerCase())
        if (!hit) return <span key={i}>{part}</span>
        const s = hs?.[part.toLowerCase()]
        return (
          <span
            key={i}
            className={className}
            style={{
              ...style,
              color: s?.color ?? color,
              ...(s?.bg
                ? { backgroundColor: s.bg, padding: "0 0.12em", borderRadius: "0.12em" }
                : {}),
            }}
          >
            {part}
          </span>
        )
      })}
    </>
  )
}

/** Texto gigante e apagado atrás do layout (nome da marca, número, palavra). */
export function GhostWord({
  text,
  className = "",
  color = "rgba(0,0,0,0.06)",
  style,
}: {
  text: string
  className?: string
  color?: string
  style?: CSSProperties
}) {
  if (!text) return null
  return (
    <div
      aria-hidden
      {...shapeAttrs("text")}
      className={`absolute pointer-events-none select-none whitespace-nowrap leading-none ${className}`}
      style={{ color, fontWeight: 900, ...style }}
    >
      {text}
    </div>
  )
}

/** Etiqueta pequena em caixa alta (cantos do slide). Editável como rodapé. */
export function TinyLabel({
  children,
  color = "rgba(0,0,0,0.5)",
  className = "",
  style,
}: {
  children: ReactNode
  color?: string
  className?: string
  style?: CSSProperties
}) {
  if (children == null || children === "") return <span />
  return (
    <span
      data-edit="meta"
      className={`text-[9px] uppercase tracking-[0.2em] font-semibold ${className}`}
      style={{ color, ...style }}
    >
      {children}
    </span>
  )
}

/** Seta/chamada de rodapé ("arrasta →", "ver mais →"). Editável como rodapé. */
export function ArrowCta({
  label = "arrasta →",
  color = "#0A0A0F",
  bg,
  className = "",
}: {
  label?: string
  color?: string
  /** Com fundo vira pílula; sem fundo é texto puro. */
  bg?: string
  className?: string
}) {
  return (
    <span
      data-edit="meta"
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide ${
        bg ? "px-3 py-1.5 rounded-full" : ""
      } ${className}`}
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  )
}

/**
 * Caixa de foto que preenche o pai (fill) ou segue uma proporção. Aceita
 * preto e branco (grayscale) pros estilos de colagem/cartaz. Sem foto, mostra
 * o placeholder "IMAGEM" como os estilos originais.
 */
export function PhotoBox({
  image,
  className = "",
  rounded = "",
  grayscale = false,
  overlay,
}: {
  image:
    | { url: string | null; error?: string | null; attribution?: SlideAttribution | null }
    | undefined
  className?: string
  rounded?: string
  grayscale?: boolean
  /** CSS de véu por cima da foto (ex.: "linear-gradient(to top, #000 0%, transparent 60%)"). */
  overlay?: string
}) {
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <div
        className="absolute inset-0"
        style={grayscale ? { filter: "grayscale(1) contrast(1.05)" } : undefined}
      >
        {image?.url ? (
          <SmartSlideImage fill src={image.url} className="absolute inset-0 w-full h-full" />
        ) : (
          <ImagePlaceholder className="absolute inset-0" label={image?.error ?? null} />
        )}
      </div>
      {overlay && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: overlay }} />
      )}
    </div>
  )
}
