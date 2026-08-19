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
import { proxiedImageUrl } from "@/lib/proxy-image"
import { POST_FORMATS, type PostFormat } from "@/lib/single-posts/formats"
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

function positionToStyle(
  position: FreeBlock["position"] | undefined,
): React.CSSProperties {
  // `position` ausente é caso real, não defeito: blocos que fluem dentro de um
  // stack não têm âncora, e a IA também omite a do próprio stack quando ele já
  // está dentro de outro. Tratar como objeto vazio evita derrubar o render
  // inteiro por causa de um bloco — o resultado é o mesmo do flow natural.
  const p = position ?? {}
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

function highlightText(
  text: string,
  highlights?: string[],
  outlineWord?: string,
  outlineColor?: string,
  highlightColor?: string,
) {
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
        <strong key={i} style={{ fontWeight: 700, color: highlightColor }}>
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
  // A rotação entra DEPOIS do transform de centragem (translate) que
  // positionToStyle já pode ter montado — sobrescrever perderia o translate e
  // jogaria o bloco pra fora do eixo.
  const posStyle = positionToStyle(b.position)
  // Texto vertical de margem (±90) usa writing-mode, não rotate: `rotate` gira
  // em torno do centro de uma caixa que continua larga, então metade do texto
  // sai do canvas. Com writing-mode a caixa já nasce estreita e alta, e a
  // âncora que a IA deu vale de verdade. Ângulos livres seguem no rotate.
  const isVertical = b.rotation === -90 || b.rotation === 90
  const transform =
    b.rotation && !isVertical
      ? `${posStyle.transform ? `${posStyle.transform} ` : ""}rotate(${b.rotation}deg)`
      : posStyle.transform
  return (
    <div
      key={`text-${JSON.stringify(b.position)}-${b.text.slice(0, 20)}`}
      className={FONT_CLASSES[b.font]}
      style={{
        ...posStyle,
        transform,
        writingMode: isVertical ? "vertical-rl" : undefined,
        // vertical-rl corre de cima pra baixo; -90 é a leitura de baixo pra
        // cima, que é a convenção da lombada/margem editorial.
        rotate: b.rotation === -90 ? "180deg" : undefined,
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
          {highlightText(
            line,
            b.highlights,
            b.outline_word,
            b.color,
            b.highlight_color,
          )}
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
      src={proxiedImageUrl(b.url)}
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
  // A pílula em si — sempre abraça o conteúdo (inline-flex), nunca estica.
  const pill = (
    <span
      className={`inline-flex items-center font-medium leading-none ${
        b.font ? FONT_CLASSES[b.font] : inter.className
      }`}
      style={{
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
        backdropFilter: "blur(8px)",
        maxWidth: "100%",
        whiteSpace: "nowrap",
      }}
    >
      {b.with_avatar && (
        <span
          className="rounded-full flex items-center justify-center font-bold leading-none shrink-0"
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
  // Caixa de posição: quando o bloco tem largura explícita (ex: pílula detachada
  // do stack, que herda 100% do wrapper), a pílula fica CENTRALIZADA dentro da
  // caixa e abraça o conteúdo — em vez de o fundo esticar até as laterais.
  return (
    <span
      key={`pill-${b.text}-${JSON.stringify(b.position)}`}
      style={{
        ...positionToStyle(b.position),
        zIndex: b.z ?? 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {pill}
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
        height: isVertical
          ? b.position?.height ?? "min(20cqw, 80px)"
          : thickness,
        width: isVertical
          ? thickness
          : b.position?.width ?? "min(20cqw, 80px)",
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
          // O disco atrás do ícone tem que ser um círculo do tamanho do ícone,
          // não uma cápsula esticada pelo container flex que o hospeda.
          width: "fit-content",
          flexShrink: 0,
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
        // Em coluna, o filho ocupa a linha inteira. Em LINHA, não: `width:100%`
        // fazia cada filho reivindicar a largura toda do stack — o ícone virava
        // uma barra e o texto ao lado era empurrado pra fora do canvas. Numa
        // linha, ícone/imagem/forma mantêm o tamanho natural e o resto divide o
        // espaço que sobra (minWidth:0 é o que autoriza o texto a quebrar).
        const isRow = direction === "row"
        const atomic =
          child.type === "icon" ||
          child.type === "image" ||
          child.type === "shape" ||
          child.type === "pill"
        return (
          <div
            key={i}
            data-flow-path={childPath}
            style={{
              position: "relative",
              ...(isRow
                ? {
                    flex: atomic ? "0 0 auto" : "1 1 0",
                    minWidth: 0,
                  }
                : { width: "100%", flexShrink: 0 }),
            }}
          >
            {renderBlock(flowChild)}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Converte a cor do photo_overlay ("black" | "white" | "#hex") + alpha num
 * rgba() válido. Nomes CSS não aceitam sufixo de alpha-hex, e hex de 3 dígitos
 * também quebraria — normaliza tudo pra canal numérico.
 */
function overlayRgba(color: string, alpha: number): string {
  const a = Math.min(1, Math.max(0, alpha))
  const named: Record<string, [number, number, number]> = {
    black: [0, 0, 0],
    white: [255, 255, 255],
  }
  let rgb = named[color.toLowerCase()]
  if (!rgb && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
    let hex = color.slice(1)
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
    rgb = [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }
  if (!rgb) rgb = [0, 0, 0]
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`
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
      {b.children.map((child, i) => {
        // Filho COM âncora fica absoluto direto no retângulo do card (o
        // schema promete "relativo ao card") — o card já é positioned, então
        // basta NÃO envolver num wrapper: o wrapper relative de altura
        // colapsada era o que quebrava a âncora. Filho sem âncora segue no
        // fluxo normal, embrulhado pra ganhar key.
        const anchored =
          child.position &&
          (child.position.top !== undefined ||
            child.position.bottom !== undefined ||
            child.position.left !== undefined ||
            child.position.right !== undefined ||
            child.position.center_x ||
            child.position.center_y)
        if (anchored) {
          return <React.Fragment key={i}>{renderBlock(child)}</React.Fragment>
        }
        return (
          <div key={i} style={{ position: "relative" }}>
            {renderBlock(child)}
          </div>
        )
      })}
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
  /** "post" = 4:5 · "story" = 9:16 · "square" = 1:1 (sempre 1080 de largura) */
  format?: PostFormat
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

  const aspectClass = (POST_FORMATS[format] ?? POST_FORMATS.post).aspectClass
  const fontVars = `${playfair.variable} ${inter.variable} ${anton.variable} ${allura.variable} ${bebas.variable} ${montserrat.variable} ${archivo.variable} ${grotesk.variable}`

  return (
    <div
      ref={containerRef}
      /* `data-post-canvas` é o gancho estável pra quem precisa do NÓ DA ARTE:
         export PNG, medição de camadas na adaptação de formato, auto-detach.
         Antes cada um procurava pela classe de aspect-ratio — o que quebrava
         calado a cada formato novo. */
      data-post-canvas={format}
      className={`${fontVars} relative ${aspectClass} w-full overflow-hidden rounded-xl ${className ?? ""}`}
      style={{ ...bgStyle, containerType: "inline-size" }}
      onClick={editable ? () => onSelectBlock?.(null) : undefined}
    >
      {bg.kind === "photo" && bg.photo_url && (
        // Proxy mesma-origem (lib/proxy-image): hosts sem CORS (fal.media)
        // quebravam com crossOrigin="anonymous" e sujavam o canvas no export.
        <img
          src={proxiedImageUrl(bg.photo_url)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {bg.kind === "photo" && bg.photo_overlay && (
        <div
          className="absolute inset-0"
          style={{
            // overlayRgba: "black"/"white"/#hex viram rgba() de verdade.
            // Concatenar alpha-hex na string crua gerava "blackcc" — CSS
            // inválido, o browser descartava a declaração e o overlay sumia
            // (matando o contraste exatamente nas direções full-bleed).
            background: bg.photo_overlay.direction
              ? `linear-gradient(${bg.photo_overlay.direction}, ${overlayRgba(
                  bg.photo_overlay.color,
                  bg.photo_overlay.start ?? 0.4,
                )} 0%, ${overlayRgba(
                  bg.photo_overlay.color,
                  bg.photo_overlay.opacity,
                )} 100%)`
              : overlayRgba(bg.photo_overlay.color, bg.photo_overlay.opacity),
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
                ? "2px solid #12A5F5"
                : "1px dashed rgba(18, 165, 245,0.45)",
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
                // Imagem/shape preenchem o wrapper (o wrapper já tem o tamanho
                // certo). Sem isso, height em % vira % do wrapper e a imagem
                // encolhe pra um cantinho. Texto/pill mantêm width natural.
                width:
                  b.type === "image" || b.type === "shape"
                    ? "100%"
                    : (((rendered.props as { style?: React.CSSProperties }).style as
                        | React.CSSProperties
                        | undefined)?.width ?? "auto"),
                height:
                  b.type === "image" || b.type === "shape"
                    ? "100%"
                    : ((rendered.props as { style?: React.CSSProperties }).style as
                        | React.CSSProperties
                        | undefined)?.height,
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
