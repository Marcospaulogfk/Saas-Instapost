"use client"

import type { ReactNode } from "react"

// ============================================================================
// Pill — bolha arredondada com bg translúcido
// ============================================================================

export function Pill({
  children,
  variant = "dark",
  className = "",
}: {
  children: ReactNode
  variant?: "dark" | "light"
  className?: string
}) {
  const isDark = variant === "dark"
  // Fill SÓLIDO + borda fina (destaque limpo que aparece no fundo claro e escuro).
  // Sem backdrop-filter: o blur virava uma "sombra" borrada no export PNG.
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${className}`}
      style={{
        backgroundColor: isDark ? "#0A0A0F" : "#FFFFFF",
        color: isDark ? "#FFFFFF" : "#0A0A0F",
        border: isDark
          ? "1px solid rgba(255,255,255,0.16)"
          : "1px solid rgba(0,0,0,0.12)",
      }}
    >
      {children}
    </span>
  )
}

// ============================================================================
// AvatarPill — pill com avatar circular à esquerda + handle
// ============================================================================

export function AvatarPill({
  avatar,
  handle,
  variant = "dark",
  className = "",
}: {
  avatar?: string
  handle: string
  variant?: "dark" | "light" | "transparent"
  className?: string
}) {
  const styles =
    variant === "dark"
      ? { bg: "rgba(0,0,0,0.5)", text: "#FFFFFF" }
      : variant === "light"
        ? { bg: "#FFFFFF", text: "#0A0A0F" }
        : { bg: "transparent", text: "#FFFFFF" }

  const initials = handle.replace(/^@/, "").slice(0, 2).toUpperCase()

  const border =
    variant === "dark"
      ? "1px solid rgba(255,255,255,0.16)"
      : variant === "light"
        ? "1px solid rgba(0,0,0,0.12)"
        : undefined
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${className}`}
      style={{
        backgroundColor: variant === "dark" ? "#0A0A0F" : styles.bg,
        border,
        color: styles.text,
      }}
    >
      <span
        className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
        style={{
          backgroundColor: variant === "light" ? "#0A0A0F" : "rgba(255,255,255,0.15)",
          color: variant === "light" ? "#FFFFFF" : "#FFFFFF",
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="text-sm font-medium">{handle}</span>
    </span>
  )
}

// ============================================================================
// PaginationDots — dots de paginação
// ============================================================================

export function PaginationDots({
  total,
  active,
  color,
}: {
  total: number
  active: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full transition-all"
          style={{
            backgroundColor: color,
            opacity: i === active ? 0.95 : 0.35,
            transform: i === active ? "scale(1.4)" : "scale(1)",
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SectionTag — "IDEIA 01: TEXTO" com prefix colorido
// ============================================================================

export function SectionTag({
  prefix,
  number,
  suffix,
  prefixColor,
  textColor = "#0A0A0F",
  fontClass = "",
}: {
  prefix?: string
  number?: string
  suffix: string
  prefixColor: string
  textColor?: string
  fontClass?: string
}) {
  return (
    <h2
      className={`text-[1.5rem] uppercase tracking-tight ${fontClass}`}
      style={{ color: textColor, fontWeight: 800, lineHeight: 1.05 }}
    >
      {prefix && <span style={{ color: prefixColor }}>{prefix} </span>}
      {number && <span style={{ color: prefixColor }}>{number} </span>}
      <span>{suffix}</span>
    </h2>
  )
}

// ============================================================================
// BrandsdecodedHeader — header texto puro (3 colunas opcional)
// ============================================================================

export function BrandsdecodedHeader({
  left,
  center,
  right,
  textColor = "rgba(255,255,255,0.6)",
}: {
  left: string
  center?: string
  right: string
  textColor?: string
}) {
  return (
    <div
      className="flex items-center justify-between px-5 pt-4 text-[10px] uppercase tracking-wider"
      style={{ color: textColor }}
    >
      <span>{left}</span>
      {center && <span className="opacity-90">{center}</span>}
      <span>{right}</span>
    </div>
  )
}

// ============================================================================
// BrandsdecodedFooter — footer linha + paginação
// ============================================================================

export function BrandsdecodedFooter({
  pageNumber,
  totalPages,
  textColor = "rgba(255,255,255,0.5)",
  lineColor = "rgba(255,255,255,0.2)",
}: {
  pageNumber: number
  totalPages: number
  textColor?: string
  lineColor?: string
}) {
  return (
    <div className="flex items-center gap-3 px-5 pb-4">
      <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
      <span className="text-[10px] tabular-nums" style={{ color: textColor }}>
        {pageNumber}/{totalPages}
      </span>
    </div>
  )
}

// ============================================================================
// HighlightedText — destaca palavras inline com cor accent
// ============================================================================

export function HighlightedText({
  text,
  words,
  color,
}: {
  text: string
  words: string[]
  color: string
}) {
  if (!words?.length) return <>{text}</>
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const isHighlight = words.some(
          (w) => w.toLowerCase() === part.toLowerCase(),
        )
        return isHighlight ? (
          <span key={i} style={{ color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

// ============================================================================
// mixWithWhite — clareia um hex misturando com branco (ratio 0..1)
// ============================================================================

export function mixWithWhite(hex: string, ratio: number): string {
  const m = hex.replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  const num = parseInt(full, 16)
  if (Number.isNaN(num) || full.length !== 6) return hex
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const mix = (c: number) => Math.round(c + (255 - c) * ratio)
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`
}

// ============================================================================
// HighlightedGradientText — destaca palavras com gradiente (accent → claro)
// ============================================================================

export function HighlightedGradientText({
  text,
  words,
  color,
}: {
  text: string
  words: string[]
  color: string
}) {
  if (!words?.length) return <>{text}</>
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const re = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(re)
  const gradient = `linear-gradient(100deg, ${color} 0%, ${mixWithWhite(color, 0.55)} 100%)`
  return (
    <>
      {parts.map((part, i) => {
        const isHighlight = words.some(
          (w) => w.toLowerCase() === part.toLowerCase(),
        )
        return isHighlight ? (
          <span
            key={i}
            style={{
              backgroundImage: gradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

// ============================================================================
// GradientProgressBar — barra de progresso do carrossel (substitui dots)
// ============================================================================

export function GradientProgressBar({
  total,
  active,
  color,
  trackColor = "rgba(255,255,255,0.12)",
}: {
  total: number
  active: number
  color: string
  trackColor?: string
}) {
  const pct = total > 0 ? ((active + 1) / total) * 100 : 0
  return (
    <div
      className="h-1 w-full rounded-full overflow-hidden"
      style={{ backgroundColor: trackColor }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          backgroundImage: `linear-gradient(90deg, ${color}, ${mixWithWhite(color, 0.45)})`,
        }}
      />
    </div>
  )
}

// ============================================================================
// parseBoldInline — converte **texto** em <strong>
// ============================================================================

export function parseBoldInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ============================================================================
// Attribution — créditos do Unsplash (usado nos slides com foto)
// ============================================================================

export interface SlideAttribution {
  photographerName: string
  photographerUrl: string
}

export function Attribution({
  attribution,
  textColor,
}: {
  attribution: SlideAttribution | null
  textColor: string
}) {
  if (!attribution) return null
  return (
    <div
      className="absolute bottom-1.5 left-2 right-2 text-[8px] flex items-center gap-1 z-10"
      style={{ color: textColor, opacity: 0.6 }}
    >
      <span>Foto: </span>
      <a
        href={attribution.photographerUrl}
        target="_blank"
        rel="noreferrer"
        className="underline hover:opacity-100 truncate"
      >
        {attribution.photographerName}
      </a>
      <span>/ Unsplash</span>
    </div>
  )
}
