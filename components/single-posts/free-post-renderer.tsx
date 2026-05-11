"use client"

import React, { useRef } from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Star,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Mail,
  Phone,
  Instagram,
  User,
  FileText,
  Camera,
} from "lucide-react"
import { anton, playfair, inter, allura, bebas, montserrat, archivo, grotesk } from "./fonts"
import type {
  FreeBlock,
  FreeFontKey,
  FreePostSpec,
  FreeTextBlock,
  FreeImageBlock,
  FreePillBlock,
  FreeShapeBlock,
  FreeDividerBlock,
  FreeIconBlock,
  FreeCardBlock,
  FreeStackBlock,
} from "@/lib/single-posts/free-spec"

const FONT_CLASSES: Record<FreeFontKey, string> = {
  anton: anton.className,
  playfair: playfair.className,
  playfair_italic: playfair.className,
  inter: inter.className,
  inter_bold: inter.className,
  allura: allura.className,
  bebas: bebas.className,
  montserrat: montserrat.className,
  archivo: archivo.className,
  grotesk: grotesk.className,
}

const FONT_DEFAULT_STYLE: Partial<Record<FreeFontKey, React.CSSProperties>> = {
  playfair_italic: { fontStyle: "italic" },
  inter_bold: { fontWeight: 700 },
}

const ICONS = {
  "alert-triangle": AlertTriangle,
  check: Check,
  "check-circle": CheckCircle2,
  star: Star,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "arrow-down-right": ArrowDownRight,
  calendar: Calendar,
  mail: Mail,
  phone: Phone,
  instagram: Instagram,
  user: User,
  "file-text": FileText,
  camera: Camera,
} as const

function positionToStyle(p: FreeBlock["position"]): React.CSSProperties {
  // Se position está vazia, não força absolute (flow natural dentro de stack)
  const hasAnchor =
    p.top !== undefined ||
    p.bottom !== undefined ||
    p.left !== undefined ||
    p.right !== undefined ||
    p.center_x ||
    p.center_y
  const s: React.CSSProperties = hasAnchor ? { position: "absolute" } : {}
  if (p.top !== undefined) s.top = p.top
  if (p.bottom !== undefined) s.bottom = p.bottom
  if (p.left !== undefined) s.left = p.left
  if (p.right !== undefined) s.right = p.right
  if (p.width !== undefined) s.width = p.width
  if (p.height !== undefined) s.height = p.height
  const transforms: string[] = []
  if (p.center_x) {
    s.left = "50%"
    transforms.push("translateX(-50%)")
  }
  if (p.center_y) {
    s.top = "50%"
    transforms.push("translateY(-50%)")
  }
  if (transforms.length) s.transform = transforms.join(" ")
  return s
}

function highlightText(text: string, highlights?: string[], outlineWord?: string, outlineColor?: string) {
  if (!highlights?.length && !outlineWord) return text
  const words = text.split(/(\s+)/)
  return words.map((part, i) => {
    if (/^\s+$/.test(part)) return <span key={i}>{part}</span>
    const cleaned = part.replace(/[^A-Za-zÀ-ÿ0-9]/g, "")
    const isOutline =
      outlineWord &&
      cleaned.toLowerCase() === outlineWord.replace(/[^A-Za-zÀ-ÿ0-9]/g, "").toLowerCase()
    const isHighlight = highlights?.some(
      (h) => cleaned.toLowerCase() === h.replace(/[^A-Za-zÀ-ÿ0-9]/g, "").toLowerCase(),
    )
    if (isOutline && outlineColor) {
      return (
        <span
          key={i}
          style={{
            color: "transparent",
            WebkitTextStroke: `1.5px ${outlineColor}`,
          }}
        >
          {part}
        </span>
      )
    }
    if (isHighlight) {
      return (
        <strong key={i} style={{ fontWeight: 700 }}>
          {part}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function renderText(b: FreeTextBlock) {
  const lines = b.text.split("\n")
  const fontStyle = FONT_DEFAULT_STYLE[b.font] ?? {}
  const scaledSize =
    b.font_size_scale && b.font_size_scale !== 1
      ? `calc(${b.font_size} * ${b.font_size_scale})`
      : b.font_size
  return (
    <div
      key={`text-${JSON.stringify(b.position)}-${b.text.slice(0, 20)}`}
      className={FONT_CLASSES[b.font]}
      style={{
        ...positionToStyle(b.position),
        color: b.color,
        fontSize: scaledSize,
        fontWeight: b.font_weight,
        letterSpacing: b.letter_spacing,
        lineHeight: b.line_height ?? 1.1,
        textAlign: b.text_align ?? "left",
        textTransform: b.text_transform ?? "none",
        zIndex: b.z ?? 1,
        textShadow: b.text_shadow ? "0 2px 12px rgba(0,0,0,0.35)" : undefined,
        ...fontStyle,
        fontStyle: b.font_style ?? fontStyle.fontStyle,
      }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block">
          {highlightText(line, b.highlights, b.outline_word, b.color)}
        </span>
      ))}
    </div>
  )
}

function renderImage(b: FreeImageBlock) {
  let mask: string | undefined
  if (b.mask_fade) {
    const dir =
      b.mask_fade === "left"
        ? "to right"
        : b.mask_fade === "right"
          ? "to left"
          : b.mask_fade === "top"
            ? "to bottom"
            : "to top"
    mask = `linear-gradient(${dir}, transparent 0%, black 25%, black 100%)`
  }
  return (
    <img
      key={`img-${b.url.slice(-30)}-${JSON.stringify(b.position)}`}
      src={b.url}
      alt=""
      style={{
        ...positionToStyle(b.position),
        objectFit: b.fit ?? "cover",
        borderRadius: b.border_radius,
        transform: `${positionToStyle(b.position).transform ?? ""} ${
          b.rotation ? `rotate(${b.rotation}deg)` : ""
        }`.trim() || undefined,
        filter: b.shadow ? "drop-shadow(0 16px 32px rgba(0,0,0,0.35))" : undefined,
        zIndex: b.z ?? 1,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
      crossOrigin="anonymous"
    />
  )
}

function renderPill(b: FreePillBlock) {
  return (
    <span
      key={`pill-${b.text}-${JSON.stringify(b.position)}`}
      className={`inline-flex items-center font-medium leading-none ${
        b.font ? FONT_CLASSES[b.font] : inter.className
      }`}
      style={{
        ...positionToStyle(b.position),
        background: b.bg,
        color: b.fg,
        padding: b.with_avatar ? "0.7cqw 2cqw 0.7cqw 0.7cqw" : "0.9cqw 2.4cqw",
        gap: "1.2cqw",
        borderRadius: 9999,
        border: b.border,
        fontSize:
          b.font_size_scale && b.font_size_scale !== 1
            ? `calc(${b.font_size ?? "min(2.7cqw, 0.82rem)"} * ${b.font_size_scale})`
            : (b.font_size ?? "min(2.7cqw, 0.82rem)"),
        fontWeight: b.font_weight ?? 500,
        textTransform: b.text_transform ?? "none",
        letterSpacing: b.letter_spacing,
        zIndex: b.z ?? 2,
        backdropFilter: "blur(8px)",
      }}
    >
      {b.with_avatar && (
        <span
          className="rounded-full flex items-center justify-center font-bold leading-none"
          style={{
            width: "min(5.5cqw, 26px)",
            height: "min(5.5cqw, 26px)",
            background: "rgba(255,255,255,0.18)",
            color: "#FFFFFF",
            fontSize: "min(2.2cqw, 10px)",
          }}
        >
          {(b.avatar_text ?? b.text.slice(0, 2)).toUpperCase()}
        </span>
      )}
      {b.text}
    </span>
  )
}

/** Aceita number (interpreta px) ou string ("3cqw", "16px"), com fallback */
function toCssLen(v: unknown, fallback: string): string {
  if (v === undefined || v === null) return fallback
  if (typeof v === "number") return `${v}px`
  return String(v)
}

/** Aceita number (px) ou string com unidade */
function toBlurFilter(v: unknown): string | undefined {
  if (v === undefined || v === null || v === 0 || v === "0") return undefined
  if (typeof v === "number") return `blur(${v}px)`
  const str = String(v)
  // se já tem unidade (px, cqw, em), usa direto; senão assume px
  return str.match(/[a-z%]+$/i) ? `blur(${str})` : `blur(${str}px)`
}

function renderShape(b: FreeShapeBlock) {
  const radius =
    b.shape === "circle"
      ? "50%"
      : b.shape === "rounded"
        ? toCssLen(b.radius, "16px")
        : b.shape === "blob"
          ? "50% 38% 60% 42%"
          : 0
  return (
    <div
      key={`shape-${b.shape}-${JSON.stringify(b.position)}`}
      style={{
        ...positionToStyle(b.position),
        background: b.color,
        borderRadius: radius,
        border: b.border,
        opacity: b.opacity ?? 1,
        filter: toBlurFilter(b.blur),
        transform: `${positionToStyle(b.position).transform ?? ""} ${
          b.rotation ? `rotate(${b.rotation}deg)` : ""
        }`.trim() || undefined,
        zIndex: b.z ?? 0,
      }}
    />
  )
}

function renderDivider(b: FreeDividerBlock) {
  const isVertical = b.vertical ?? false
  const thickness = toCssLen(b.thickness, "2px")
  return (
    <div
      key={`div-${JSON.stringify(b.position)}`}
      style={{
        ...positionToStyle(b.position),
        background: b.color,
        height: isVertical ? b.position.height ?? "min(20cqw, 80px)" : thickness,
        width: isVertical ? thickness : b.position.width ?? "min(20cqw, 80px)",
        zIndex: b.z ?? 1,
      }}
    />
  )
}

function renderIcon(b: FreeIconBlock) {
  const Icon = ICONS[b.name] ?? Star
  if (b.background) {
    return (
      <div
        key={`icon-${b.name}-${JSON.stringify(b.position)}`}
        className="rounded-full flex items-center justify-center"
        style={{
          ...positionToStyle(b.position),
          background: b.background,
          color: b.color,
          padding: b.padding ?? "min(2cqw, 10px)",
          zIndex: b.z ?? 2,
        }}
      >
        <Icon style={{ width: b.size, height: b.size, color: b.color }} />
      </div>
    )
  }
  return (
    <div
      key={`icon-${b.name}-${JSON.stringify(b.position)}`}
      style={{
        ...positionToStyle(b.position),
        color: b.color,
        zIndex: b.z ?? 2,
      }}
    >
      <Icon style={{ width: b.size, height: b.size }} />
    </div>
  )
}

function renderStack(b: FreeStackBlock, pathPrefix?: string) {
  const direction = b.direction ?? "column"
  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
  } as const
  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  } as const
  return (
    <div
      key={`stack-${JSON.stringify(b.position)}`}
      style={{
        ...positionToStyle(b.position),
        display: "flex",
        flexDirection: direction,
        gap: b.gap ?? "min(2.5cqw, 12px)",
        alignItems: b.align ? alignMap[b.align] : "flex-start",
        justifyContent: b.justify ? justifyMap[b.justify] : "flex-start",
        background: b.bg,
        borderRadius: toCssLen(b.radius, "0"),
        padding: b.padding,
        boxShadow: b.shadow ? "0 24px 60px rgba(0,0,0,0.25)" : undefined,
        zIndex: b.z ?? 3,
      }}
    >
      {b.children.map((child, i) => {
        const flowChild: FreeBlock = { ...child, position: {} }
        const childPath = pathPrefix ? `${pathPrefix}.${i}` : undefined
        return (
          <div
            key={i}
            data-flow-path={childPath}
            style={{ position: "relative", flexShrink: 0, width: "100%" }}
          >
            {renderBlock(flowChild)}
          </div>
        )
      })}
    </div>
  )
}

function renderCard(b: FreeCardBlock) {
  // shadow pode vir como boolean true ou string CSS completa
  const shadowValue =
    typeof b.shadow === "string"
      ? b.shadow
      : b.shadow === true
        ? "0 24px 60px rgba(0,0,0,0.25)"
        : undefined
  return (
    <div
      key={`card-${JSON.stringify(b.position)}`}
      style={{
        ...positionToStyle(b.position),
        background: b.bg,
        borderRadius: toCssLen(b.radius, "16px"),
        padding: b.padding ?? "min(5cqw, 24px)",
        boxShadow: shadowValue,
        zIndex: b.z ?? 3,
      }}
    >
      {b.children.map((child, i) => (
        <div key={i} style={{ position: "relative" }}>
          {renderBlock(child)}
        </div>
      ))}
    </div>
  )
}

function renderBlock(b: FreeBlock, pathPrefix?: string): React.ReactElement | null {
  switch (b.type) {
    case "text":
      return renderText(b)
    case "image":
      return renderImage(b)
    case "pill":
      return renderPill(b)
    case "shape":
      return renderShape(b)
    case "divider":
      return renderDivider(b)
    case "icon":
      return renderIcon(b)
    case "card":
      return renderCard(b)
    case "stack":
      return renderStack(b, pathPrefix)
    default:
      return null
  }
}

interface Props {
  spec: FreePostSpec
  className?: string
  /** "post" = 4:5 (1080×1350) · "story" = 9:16 (1080×1920) */
  format?: "post" | "story"
  /** Quando true, blocos top-level ficam draggable */
  editable?: boolean
  /** Callback chamado ao soltar drag — recebe path e nova position */
  onPositionChange?: (
    path: string,
    position: { left: string; top: string; width: string },
  ) => void
  /** Path do bloco atualmente selecionado (pra destaque visual) */
  selectedPath?: string | null
  /** Click num bloco — seleciona */
  onSelectBlock?: (path: string | null) => void
}

function makeDragHandler(
  path: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onPositionChange: (
    path: string,
    position: { left: string; top: string; width: string },
  ) => void,
  onSelect: () => void,
) {
  return (e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    e.stopPropagation()
    e.preventDefault()
    onSelect()
    const containerRect = container.getBoundingClientRect()
    const blockEl = e.currentTarget as HTMLElement
    const blockRect = blockEl.getBoundingClientRect()
    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startLeftPx = blockRect.left - containerRect.left
    const startTopPx = blockRect.top - containerRect.top
    const widthPx = blockRect.width
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startMouseX
      const dy = ev.clientY - startMouseY
      const newLeftPx = Math.max(0, Math.min(containerWidth - widthPx, startLeftPx + dx))
      const newTopPx = Math.max(0, Math.min(containerHeight - 20, startTopPx + dy))
      onPositionChange(path, {
        left: `${((newLeftPx / containerWidth) * 100).toFixed(1)}cqw`,
        top: `${((newTopPx / containerWidth) * 100).toFixed(1)}cqw`,
        width: `${((widthPx / containerWidth) * 100).toFixed(1)}cqw`,
      })
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }
}

export function FreePostRenderer({
  spec,
  className,
  format = "post",
  editable = false,
  onPositionChange,
  selectedPath = null,
  onSelectBlock,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const bg = spec.background
  const bgStyle: React.CSSProperties = {}
  if (bg.kind === "solid") {
    bgStyle.background = bg.color ?? "#1A1A1A"
  } else if (bg.kind === "gradient") {
    const angle = bg.gradient_angle ?? 135
    bgStyle.background = `linear-gradient(${angle}deg, ${bg.gradient_from ?? "#1A1A1A"} 0%, ${bg.gradient_to ?? "#3A3A3A"} 100%)`
  }

  const ghost = spec.ghost
  const ghostStyle: React.CSSProperties | null = ghost
    ? {
        position: "absolute",
        color: ghost.color,
        fontSize: ghost.font_size,
        fontWeight: 900,
        lineHeight: 0.9,
        letterSpacing: "-0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 0,
        ...(ghost.anchor === "top" && { top: "8%", left: "50%", transform: "translateX(-50%)" }),
        ...(ghost.anchor === "center" && {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }),
        ...(ghost.anchor === "left-vertical" && {
          left: "-5%",
          top: "50%",
          transform: `translateY(-50%) rotate(${ghost.rotation ?? -90}deg)`,
        }),
        ...(ghost.anchor === "right-vertical" && {
          right: "-5%",
          top: "50%",
          transform: `translateY(-50%) rotate(${ghost.rotation ?? 90}deg)`,
        }),
      }
    : null

  const aspectClass = format === "story" ? "aspect-[9/16]" : "aspect-[4/5]"
  const fontVars = `${playfair.variable} ${inter.variable} ${anton.variable} ${allura.variable} ${bebas.variable} ${montserrat.variable} ${archivo.variable} ${grotesk.variable}`

  return (
    <div
      ref={containerRef}
      className={`${fontVars} relative ${aspectClass} w-full overflow-hidden rounded-xl ${className ?? ""}`}
      style={{ ...bgStyle, containerType: "inline-size" }}
      onClick={editable ? () => onSelectBlock?.(null) : undefined}
    >
      {bg.kind === "photo" && bg.photo_url && (
        <img
          src={bg.photo_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      )}
      {bg.kind === "photo" && bg.photo_overlay && (
        <div
          className="absolute inset-0"
          style={{
            background: bg.photo_overlay.direction
              ? `linear-gradient(${bg.photo_overlay.direction}, ${bg.photo_overlay.color}${Math.round(
                  (bg.photo_overlay.start ?? 0) * 255,
                )
                  .toString(16)
                  .padStart(2, "0")} 0%, ${bg.photo_overlay.color}${Math.round(
                  bg.photo_overlay.opacity * 255,
                )
                  .toString(16)
                  .padStart(2, "0")} 100%)`
              : `${bg.photo_overlay.color}`,
            opacity: bg.photo_overlay.direction ? 1 : bg.photo_overlay.opacity,
          }}
        />
      )}
      {ghost && ghostStyle && (
        <div className={FONT_CLASSES[ghost.font]} style={ghostStyle}>
          {ghost.text}
        </div>
      )}
      {spec.blocks.map((b, i) => {
        const path = String(i)
        const rendered = renderBlock(b, path)
        if (!rendered) return null
        // Pula blocos não-interativos (image bg, shape overlay fullbleed)
        const isFullCanvas =
          (b.type === "image" || b.type === "shape") &&
          b.position.top === 0 &&
          b.position.left === 0 &&
          b.position.right === 0 &&
          b.position.bottom === 0
        // Sem editable OU full-canvas → render direto, não atrapalha
        if (!editable || isFullCanvas) {
          return <React.Fragment key={i}>{rendered}</React.Fragment>
        }
        // Wrapper absolute que cobre o block — aceita drag sem brigar com cloneElement
        const wrapperStyle = positionToStyle(b.position)
        const isSelected = selectedPath === path
        const dragHandler = onPositionChange
          ? makeDragHandler(
              path,
              containerRef,
              onPositionChange,
              () => onSelectBlock?.(path),
            )
          : undefined
        return (
          <div
            key={i}
            data-drag-path={path}
            style={{
              ...wrapperStyle,
              cursor: dragHandler ? "grab" : "pointer",
              outline: isSelected
                ? "2px solid #a855f7"
                : "1px dashed rgba(168,85,247,0.45)",
              outlineOffset: 2,
              zIndex: b.z ?? 5,
            }}
            onMouseDown={dragHandler}
            onClick={(ev) => {
              ev.stopPropagation()
              onSelectBlock?.(path)
            }}
          >
            {/* Renderiza o block sem position absoluta (vira inline dentro do wrapper) */}
            {React.cloneElement(rendered, {
              style: {
                ...((rendered.props as { style?: React.CSSProperties }).style ?? {}),
                position: "static",
                top: undefined,
                left: undefined,
                right: undefined,
                bottom: undefined,
                width:
                  ((rendered.props as { style?: React.CSSProperties }).style as
                    | React.CSSProperties
                    | undefined)?.width ?? "auto",
                transform: undefined,
                zIndex: undefined,
                cursor: "inherit",
                pointerEvents: "none",
              },
            } as Partial<React.HTMLAttributes<HTMLElement>> & { style: React.CSSProperties })}
          </div>
        )
      })}
    </div>
  )
}
