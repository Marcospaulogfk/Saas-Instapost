"use client"

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

// Transform da imagem de fundo (posição + zoom) editável pelo usuário. Fica num
// CONTEXT provido pelo SlidePreview (por slide), então o SmartSlideImage aplica
// sem precisar passar props por todos os ~17 templates de capa/split.
export interface ImageTransform {
  /** object-position horizontal 0–100 (%). */
  posX: number
  /** object-position vertical 0–100 (%). */
  posY: number
  /** zoom em % (100 = normal). */
  zoom: number
}
export const ImageTransformContext = createContext<ImageTransform | null>(null)
import { proxiedImageUrl } from "@/lib/proxy-image"
import { isLightColor } from "@/lib/color-contrast"

// ============================================================================
// splitTheme — paleta de contraste derivada de um FUNDO custom (slide.bg).
//
// Feature "Fundo do Slide": nos slides de TEXTO, o usuário pode trocar a cor de
// fundo. Cada estilo tem cores de texto fixas (casadas com seu bg padrão) — se
// só trocássemos o bg, o texto sumiria. Este helper devolve uma paleta legível
// pro fundo escolhido (texto/muted/faint/line adaptados à luminância).
//
// Retorna null quando não há override → o componente mantém seus literais
// padrão INTACTOS (render idêntico ao de antes da feature). Só quando o usuário
// escolhe uma cor é que a paleta derivada entra.
// ============================================================================
export interface SplitTheme {
  bg: string
  isDark: boolean
  text: string
  /** corpo / subtítulo. */
  muted: string
  /** headers, contadores, labels secundários. */
  faint: string
  /** hairlines / bordas. */
  line: string
}

export function splitTheme(bg: string | undefined | null): SplitTheme | null {
  if (!bg) return null
  const dark = !isLightColor(bg)
  return {
    bg,
    isDark: dark,
    text: dark ? "#FFFFFF" : "#0A0A0F",
    muted: dark ? "rgba(255,255,255,0.85)" : "rgba(10,10,15,0.78)",
    faint: dark ? "rgba(255,255,255,0.6)" : "rgba(10,10,15,0.5)",
    line: dark ? "rgba(255,255,255,0.2)" : "rgba(10,10,15,0.18)",
  }
}

// useLayoutEffect no cliente (mede antes de pintar, sem flicker); useEffect no
// SSR pra não gerar warning.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

// ============================================================================
// FitText — REGRA GLOBAL "enquadramento é a chave": o título NUNCA é cortado.
// Se não couber em `maxLines`, a fonte DIMINUI (até minScale do tamanho base)
// até caber. Substitui o line-clamp (que cortava a frase).
// ============================================================================

// Tipografia editável (peso + escala do título) via CONTEXT — o FitText aplica
// em TODOS os templates sem passar props. A FAMÍLIA da fonte vem pelo fontClass.
export interface TypographyOpts {
  /** peso do título (sobrepõe o do template). */
  weight?: number
  /** escala do tamanho do título (1 = padrão do template). */
  scale?: number
}
export const TypographyContext = createContext<TypographyOpts | null>(null)

export function FitText({
  children,
  className = "",
  style,
  maxLines = 4,
  minScale = 0.5,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Máximo de linhas antes de encolher a fonte. */
  maxLines?: number
  /** Fator mínimo do tamanho base (0.5 = metade). */
  minScale?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const typo = useContext(TypographyContext)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // peso do usuário sobrepõe o do template
    if (typo?.weight) el.style.fontWeight = String(typo.weight)
    el.style.fontSize = "" // volta pro tamanho base (da classe)
    const base = parseFloat(getComputedStyle(el).fontSize)
    if (!base) return
    const scale = typo?.scale ?? 1
    const start = base * scale
    const fits = () => {
      const cs = getComputedStyle(el)
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.1
      return Math.round(el.scrollHeight / lh) <= maxLines
    }
    let size = start
    el.style.fontSize = `${size}px`
    let guard = 0
    while (!fits() && size > start * minScale && guard < 40) {
      size -= Math.max(1, start * 0.04)
      el.style.fontSize = `${size}px`
      guard++
    }
  })
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}

// ============================================================================
// ShrinkToFit — REGRA GLOBAL "imagem nunca sobrepõe/corta o texto".
//
// Quando a imagem é de TAMANHO FIXO (uniforme entre slides), o texto pode não
// caber no espaço que sobra. Em vez de CORTAR (overflow-hidden) ou SOBREPOR, o
// bloco de texto inteiro é ESCALADO pra baixo até caber na altura disponível —
// exatamente "diminui a fonte pra imagem não invadir".
//
// Truque: `transform: scale()` NÃO afeta `scrollHeight` (é só visual), então
// medir a altura natural do conteúdo é estável e não gera loop.
// ============================================================================

export function ShrinkToFit({
  children,
  className = "",
  innerClassName = "",
  minScale = 0.55,
}: {
  children: ReactNode
  /** Classes da ZONA (flex sizing) — ex.: "flex-1 z-10". */
  className?: string
  /** Classes do CONTEÚDO (padding, etc.) — ex.: "px-6 pt-6". */
  innerClassName?: string
  minScale?: number
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useIsoLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const avail = outer.clientHeight
    const natural = inner.scrollHeight // não é afetado pelo transform
    if (!avail || !natural) return
    const next = natural > avail ? Math.max(minScale, (avail - 1) / natural) : 1
    setScale((prev) => (Math.abs(prev - next) < 0.005 ? prev : next))
  })
  return (
    <div
      ref={outerRef}
      className={`relative min-h-0 overflow-hidden ${className}`}
    >
      <div
        ref={innerRef}
        className={`absolute inset-x-0 top-0 origin-top-left ${innerClassName}`}
        style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
      >
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// REGRA GLOBAL — enquadramento da foto ("nunca corta a cabeça").
//
// Fotos de conteúdo em caixa (Revista/Gradiente/Minimal/MyPostFlow/Bolo…) são
// recortadas com object-cover. O padrão do CSS é object-position: center, que
// num container mais largo/baixo que a foto CORTA O TOPO — e retratos têm o
// rosto no terço SUPERIOR, então a cabeça some (bug do slide do Dario Amodei).
//
// A regra: todo object-cover de foto de CONTEÚDO usa PHOTO_FOCUS, deslocando o
// recorte pro alto (mostra a cabeça, sacrifica o rodapé da foto — que quase
// nunca importa). Estilos full-bleed 4:5 (Seamless / capas) NÃO usam isto —
// como a caixa já é retrato, o center enquadra certo (por isso o Seamless
// ficou bom). Avatares também não (são círculos pequenos).
//
// Heurística (não é detecção de rosto): assume sujeito no topo, o caso comum
// em editorial. Tunável num único lugar aqui.
// ============================================================================
export const PHOTO_FOCUS = "50% 20%"

// ============================================================================
// SmartSlideImage — imagem de slide com ENCAIXE inteligente pela proporção.
//
// Extensão da REGRA de enquadramento pra cobrir também LOGOS/WORDMARKS/banners
// (ex.: logo da Anthropic 1280×144). Numa caixa retrato com object-cover, uma
// imagem muito LARGA vira um borrão irreconhecível (bug da capa). A regra:
//   - imagem larga demais (proporção > LOGO_RATIO) → object-contain (mostra
//     inteira, centralizada, sobre um fundo sutil) — logo fica legível.
//   - retrato / foto normal → object-cover + PHOTO_FOCUS (viés pro topo,
//     nunca corta a cabeça).
//
// A decisão é feita ao carregar a imagem (naturalWidth/Height). Como o React
// aplica o style inline ANTES do export, o html-to-image copia o computed
// style — então a exportação sai igual ao preview.
// ============================================================================
// Proporção (w/h) a partir da qual a imagem é "larga demais" pra um quadro
// retrato. WORDMARK = logo/wordmark (jamais usar como imagem — some). WIDE =
// foto panorâmica (ainda é foto real → contain, aparece inteira).
const WIDE_RATIO = 1.7
const WORDMARK_RATIO = 2.4

type FitMode = "cover" | "contain" | "hidden"

export function SmartSlideImage({
  src,
  className = "",
  focus = PHOTO_FOCUS,
  containBg = "rgba(0,0,0,0.28)",
}: {
  /** URL da imagem (já garantida != null pelo caller). */
  src: string
  /** Classes de TAMANHO/posição (sem object-fit — ele é setado via style). */
  className?: string
  /** object-position quando entra no modo cover (retratos). */
  focus?: string
  /** Fundo atrás da imagem no modo contain. */
  containBg?: string
}) {
  const [mode, setMode] = useState<FitMode>("cover")
  // Transform editável (posição/zoom) do slide atual, se houver.
  const t = useContext(ImageTransformContext)
  const decide = (w: number, h: number) => {
    if (!w || !h) return
    const r = w / h
    // REGRA: JAMAIS usar wordmark/logo como imagem. Se a imagem for larga
    // demais (proporção de wordmark), ela é ESCONDIDA — o slide fica só com o
    // fundo (limpo) em vez de exibir a logo esticada/irreconhecível.
    setMode(r > WORDMARK_RATIO ? "hidden" : r > WIDE_RATIO ? "contain" : "cover")
  }
  const measure = (img: HTMLImageElement | null) => {
    if (img?.complete) decide(img.naturalWidth, img.naturalHeight)
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={measure}
        // Hosts externos (fal.media, Unsplash…) passam pelo /api/proxy-image:
        // mesma origem → o html-to-image consegue capturar no export PNG/ZIP.
        src={proxiedImageUrl(src)}
        alt=""
        className={className}
        onLoad={(e) => decide(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
        style={
          mode === "contain"
            ? { objectFit: "contain", objectPosition: "center", background: containBg }
            : mode === "hidden"
              ? { opacity: 0 } // wordmark: não mostra (mas carrega pra medir)
              : {
                  objectFit: "cover",
                  // posição/zoom do usuário (se setados) sobrepõem o PHOTO_FOCUS
                  objectPosition: t ? `${t.posX}% ${t.posY}%` : focus,
                  transform:
                    t && t.zoom !== 100 ? `scale(${t.zoom / 100})` : undefined,
                  transformOrigin: "center",
                }
        }
      />
      {mode === "hidden" && (
        <div
          className={className}
          style={{
            background:
              "radial-gradient(ellipse at 50% 25%, rgba(115,32,230,0.16), rgba(10,10,15,0.85))",
          }}
        />
      )}
    </>
  )
}

// ============================================================================
// ImagePlaceholder — caixa "IMAGEM" quando não há foto (wireframe).
//
// Substitui os antigos placeholders "sem imagem" por uma caixa slate sólida com
// o rótulo "IMAGEM" centralizado — usada quando o slide não tem foto (galeria de
// templates) ou quando a imagem real falha. Mesmo look em qualquer estilo.
// O caller define o TAMANHO/posição via className ("absolute inset-0" ou
// "w-full h-full"); aqui só entra a aparência.
// ============================================================================

export function ImagePlaceholder({
  className = "",
  label,
}: {
  className?: string
  label?: string | null
}) {
  return (
    <div
      className={`flex items-center justify-center text-center px-3 ${className}`}
      style={{ backgroundColor: "#2b303b" }}
    >
      <span
        className="text-[10px] font-semibold uppercase"
        style={{ color: "#656e7d", letterSpacing: "0.22em" }}
      >
        {label || "IMAGEM"}
      </span>
    </div>
  )
}

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
          <img
            src={proxiedImageUrl(avatar)}
            alt=""
            className="w-full h-full object-cover"
          />
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
    <FitText
      className={`text-[1.5rem] uppercase tracking-tight ${fontClass}`}
      style={{ color: textColor, fontWeight: 800, lineHeight: 1.05 }}
      maxLines={5}
    >
      {prefix && <span style={{ color: prefixColor }}>{prefix} </span>}
      {number && <span style={{ color: prefixColor }}>{number} </span>}
      <span>{suffix}</span>
    </FitText>
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
// HighlightedGlass — destaca palavras com um "chip de vidro" (marca-texto)
//
// Assinatura da capa MyPostFlow: sobre a foto, as palavras-chave ganham um bloco
// translúcido claro (frosted) atrás, texto branco. box-decoration-break: clone
// faz cada linha ganhar seu próprio bloco quando a palavra quebra.
// ============================================================================

export function HighlightedGlass({
  text,
  words,
}: {
  text: string
  words: string[]
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
          <span
            key={i}
            style={{
              // Bloco "vidro" com GRADIENTE (azul-lavanda claro → cinza
              // translúcido), texto branco — igual à capa do MyPostFlow.
              backgroundImage:
                "linear-gradient(115deg, rgba(206,213,230,0.62) 0%, rgba(150,156,172,0.30) 55%, rgba(120,126,142,0.16) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 18px rgba(0,0,0,0.22)",
              borderRadius: "0.12em",
              padding: "0 0.14em",
              // cada linha da palavra quebrada recebe seu próprio bloco
              WebkitBoxDecorationBreak: "clone",
              boxDecorationBreak: "clone",
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
// SeamlessProgressLine — linha que AVANÇA slide a slide (trilho full-bleed +
// preenchimento até o progresso + nó luminoso no ponto atual). Dá a sensação
// de jornada contínua: no slide 1 a bolinha está no começo, no último no fim.
// ============================================================================

export function SeamlessProgressLine({
  orderIndex,
  totalSlides,
  accent,
}: {
  orderIndex: number
  totalSlides: number
  accent: string
}) {
  // Progresso de 0..1. Deixa uma margem nas pontas pra bolinha não colar na borda.
  const raw = totalSlides > 1 ? orderIndex / (totalSlides - 1) : 0
  const pct = 6 + raw * 88 // 6%..94%
  return (
    <div className="relative h-3 w-full flex items-center flex-shrink-0 z-10">
      {/* trilho apagado, ponta a ponta */}
      <div
        className="absolute left-0 right-0 h-[2px]"
        style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
      />
      {/* preenchimento até o progresso */}
      <div
        className="absolute left-0 h-[3px] rounded-full"
        style={{
          width: `${pct}%`,
          backgroundImage: `linear-gradient(90deg, ${mixWithWhite(accent, 0.35)}, ${accent})`,
          boxShadow: `0 0 10px ${accent}80`,
        }}
      />
      {/* nó luminoso no ponto atual */}
      <div
        className="absolute w-3 h-3 rounded-full -translate-x-1/2"
        style={{
          left: `${pct}%`,
          backgroundColor: accent,
          boxShadow: `0 0 14px ${accent}, 0 0 0 4px ${accent}22`,
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
