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
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium ${className}`}
      style={{
        backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        color: isDark ? "#FFFFFF" : "#0A0A0F",
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

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${className}`}
      style={{
        backgroundColor: styles.bg,
        backdropFilter: variant !== "transparent" ? "blur(8px)" : undefined,
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
