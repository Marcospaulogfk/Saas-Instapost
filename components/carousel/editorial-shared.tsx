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

// "Cromo" do slide — os enfeites fixos que o usuário agora pode ligar/desligar
// (dots de paginação e selo verificado). Vai por CONTEXT pelo mesmo motivo do
// ImageTransform: esses elementos são desenhados em ~10 pontos espalhados pelos
// templates de capa/split e pelo render legado, e passar prop por todos eles
// significaria tocar cada template a cada enfeite novo.
export interface SlideChrome {
  showDots: boolean
  showVerified: boolean
  /** Rodapé "linha + 1/5" dos estilos Revista/Minimal. */
  showFooter: boolean
}
export const SlideChromeContext = createContext<SlideChrome>({
  showDots: true,
  showVerified: true,
  showFooter: true,
})

// Estilo por trecho destacado do título (barrinha da edição direta): cor própria
// e/ou marca-texto em degradê. Chave = trecho em minúsculas (o mesmo texto de
// highlight_words). Vai por CONTEXT (provido pelo SlidePreview) pelo mesmo motivo
// dos outros: os Highlighted* são usados em dezenas de pontos dos templates.
export interface HighlightStyle {
  color?: string
  bg?: string
}
export const HighlightStyleContext = createContext<Record<string, HighlightStyle> | null>(null)

// Colagem no espaço da foto principal (2–4 fotos em grade). Vai por CONTEXT
// pelo mesmo motivo do ImageTransform: o SmartSlideImage da foto principal é
// chamado de ~19 pontos dos templates de capa/split, e a colagem só troca o
// QUE aparece ali (nunca muda a assinatura desses ~19 call sites). Só afeta a
// chamada cujo `src` é a foto principal (`mainUrl`) — outras fotos do slide
// (extra_images, splits de comparação) passam direto, sem colagem.
export interface SlideImageCollage {
  mainUrl: string | null
  images: string[]
  layout: CollageLayout
}
export const SlideImageCollageContext = createContext<SlideImageCollage | null>(null)

/** Layout padrão pela contagem de fotos (usuário pode escolher outro depois). */
export function defaultCollageLayout(count: number): CollageLayout {
  return count >= 4 ? "4" : count === 3 ? "3" : "2h"
}

/** O layout escolhido ainda faz sentido pra essa contagem? (ex.: usuário
 *  escolheu "2v" com 2 fotos, depois ACRESCENTOU uma 3ª — "2v" tem só 2
 *  células, a 3ª foto cairia numa linha implícita de 0px e "sumiria"). */
export function isValidCollageLayout(layout: CollageLayout, count: number): boolean {
  if (count >= 4) return layout === "4"
  if (count === 3) return layout === "3"
  return layout === "2h" || layout === "2v"
}

/** Marca-texto em degradê atrás do trecho (vazio se o trecho não tem fundo). */
function highlightBg(s: HighlightStyle | undefined): CSSProperties {
  if (!s?.bg) return {}
  // `bg` é uma cor sólida (mistura com branco pra virar um degradê sutil,
  // comportamento de sempre) OU já um `linear-gradient(...)` pronto, escolhido
  // na barrinha (2-3 degradês prontos) — usado direto, sem mistura.
  const isGradient = s.bg.startsWith("linear-gradient(")
  return {
    backgroundImage: isGradient
      ? s.bg
      : `linear-gradient(100deg, ${s.bg} 0%, ${mixWithWhite(s.bg, 0.45)} 100%)`,
    borderRadius: "0.12em",
    padding: "0 0.14em",
    WebkitBoxDecorationBreak: "clone",
    boxDecorationBreak: "clone",
  }
}
import { proxiedImageUrl } from "@/lib/proxy-image"
import { isLightColor } from "@/lib/color-contrast"
import type { CollageLayout } from "./editable-overrides"

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
    // data-edit: marca o título pro editor Canva-like (seleção/drag). Inerte
    // fora do editor — nenhum estilo/comportamento muda sem override.
    <div ref={ref} className={className} style={style} data-edit="title">
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
// Proporção (w/h) a partir da qual a imagem é "extremamente larga" → contain,
// aparece inteira com faixa. Até isso (paisagem comum 16:9, 1800×800…) COBRE o
// espaço da foto. Imagem de slide é sempre do usuário (ou escolhida pra ele):
// NUNCA some, por mais larga que seja (ex.: PNG 503×101).
const WIDE_RATIO = 2.4

type FitMode = "cover" | "contain"

export function SmartSlideImage({
  src,
  className = "",
  focus = PHOTO_FOCUS,
  containBg = "rgba(0,0,0,0.28)",
  fill = false,
}: {
  /** URL da imagem (já garantida != null pelo caller). */
  src: string
  /** Classes de TAMANHO/posição (sem object-fit — ele é setado via style). */
  className?: string
  /** object-position quando entra no modo cover (retratos). */
  focus?: string
  /** Fundo atrás da imagem no modo contain. */
  containBg?: string
  /** Área full-bleed (capa): foto larga PREENCHE (cover), nunca sobra faixa. */
  fill?: boolean
}) {
  const [mode, setMode] = useState<FitMode>("cover")
  // Transform editável (posição/zoom) do slide atual, se houver.
  const t = useContext(ImageTransformContext)
  // Colagem (2–4 fotos) na foto PRINCIPAL do slide: troca o <img> único por
  // uma grade. Só entra quando este é o SmartSlideImage da foto principal
  // (src === mainUrl) — as outras chamadas (extra_images, comparação) não
  // têm colagem e continuam mostrando sua própria foto normalmente.
  const collage = useContext(SlideImageCollageContext)
  if (collage && collage.images.length >= 2 && src === collage.mainUrl) {
    return <CollageGrid images={collage.images} layout={collage.layout} className={className} />
  }
  // Capa (fill) ou enquadramento manual do usuário → sempre cover: no contain
  // o zoom/posição não têm efeito e a foto "voltava" ao tamanho original.
  // Na capa isso vale até pra imagem muito larga (ex.: PNG 503×101): escala
  // pra cobrir.
  const fit: FitMode = mode === "contain" && (fill || t) ? "cover" : mode
  const decide = (w: number, h: number) => {
    if (!w || !h) return
    // Antes, proporção > 2,4 era tratada como logo e ESCONDIDA — o slide de
    // conteúdo ficava com um bloco cinza. Agora ela = contain (inteira);
    // abaixo disso, cover.
    setMode(w / h > WIDE_RATIO ? "contain" : "cover")
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
        data-edit="image"
        onLoad={(e) => decide(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
        style={
          fit === "contain"
            ? { objectFit: "contain", objectPosition: "center", background: containBg }
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
    </>
  )
}

// ============================================================================
// CollageGrid — grade de 2 a 4 fotos no MESMO espaço da foto principal.
// `className` é o mesmo tamanho/posição que a foto única receberia (ex.:
// "absolute inset-0 w-full h-full") — a grade PREENCHE esse espaço; cada
// célula cobre a própria foto (sem letterbox). Gap mínimo (3px) só pra
// separar visualmente as fotos, sem parecer 4 cartões soltos.
// ============================================================================
const COLLAGE_GRID_CLASS: Record<CollageLayout, string> = {
  "2h": "grid-cols-2 grid-rows-1",
  "2v": "grid-cols-1 grid-rows-2",
  "3": "grid-cols-2 grid-rows-2",
  "4": "grid-cols-2 grid-rows-2",
}

function collageTileClass(layout: CollageLayout, i: number): string {
  // Layout "3": a primeira foto ocupa as duas linhas (grande + 2 pequenas).
  return layout === "3" && i === 0 ? "row-span-2" : ""
}

function CollageGrid({
  images,
  layout,
  className,
}: {
  images: string[]
  layout: CollageLayout
  className: string
}) {
  const shown = images.slice(0, 4)
  // `layout` pode ser (a) um valor persistido antigo/inválido (JSONB, sem
  // checagem de tipo em runtime) ou (b) uma escolha válida mas pra OUTRA
  // contagem (usuário escolheu "2v" com 2 fotos, depois acrescentou uma 3ª —
  // "2v" só define 2 células). Nos dois casos, sem grid-cols/rows certos pra
  // contagem ATUAL, a célula extra cai numa linha implícita de 0px (só um
  // <img> absoluto dentro, sem altura própria) e a foto "some" (fica preta).
  const safeLayout: CollageLayout = isValidCollageLayout(layout, shown.length)
    ? layout
    : defaultCollageLayout(shown.length)
  return (
    <div className={`grid gap-[3px] ${COLLAGE_GRID_CLASS[safeLayout]} ${className}`}>
      {shown.map((url, i) => (
        <div key={i} className={`relative overflow-hidden ${collageTileClass(safeLayout, i)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxiedImageUrl(url)}
            alt=""
            data-edit="image"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
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
      data-edit="image"
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
      data-edit="badge"
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
// AvatarPill — pill só com o @handle. O círculo do avatar (foto ou 2 letras do
// @) saiu do post inteiro por decisão do Marcos; avatar/initials seguem
// aceitos só pra não quebrar quem chama.
// ============================================================================

export function AvatarPill({
  handle,
  variant = "dark",
  className = "",
}: {
  avatar?: string
  handle: string
  /** Iniciais escritas à mão. Vazio = deriva das 2 primeiras letras do handle. */
  initials?: string
  variant?: "dark" | "light" | "transparent"
  className?: string
}) {
  const styles =
    variant === "dark"
      ? { bg: "rgba(0,0,0,0.5)", text: "#FFFFFF" }
      : variant === "light"
        ? { bg: "#FFFFFF", text: "#0A0A0F" }
        : { bg: "transparent", text: "#FFFFFF" }

  if (!handle) return null

  const border =
    variant === "dark"
      ? "1px solid rgba(255,255,255,0.16)"
      : variant === "light"
        ? "1px solid rgba(0,0,0,0.12)"
        : undefined
  return (
    <span
      className={`inline-flex items-center rounded-full ${variant === "transparent" ? "py-1.5" : "px-3 py-1.5"} ${className}`}
      style={{
        backgroundColor: variant === "dark" ? "#0A0A0F" : styles.bg,
        border,
        color: styles.text,
      }}
    >
      <span className="text-sm font-medium">{handle}</span>
    </span>
  )
}

// ============================================================================
// PaginationDots — dots de paginação. DESLIGADOS em todos os estilos (decisão
// do Marcos: o Instagram já mostra a paginação). Não renderiza nada; os
// rodapés são justify-between, então tag e "arrasta" ficam nos cantos sem
// buraco. Props mantidas pra não mexer em cada layout.
// ============================================================================

export function PaginationDots(_props: {
  total: number
  active: number
  color: string
}) {
  return null
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
  const { showFooter } = useContext(SlideChromeContext)
  if (!showFooter) return null
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
  const hs = useContext(HighlightStyleContext)
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
        const s = hs?.[part.toLowerCase()]
        return isHighlight ? (
          <span key={i} style={{ color: s?.color ?? color, ...highlightBg(s) }}>
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
  const hs = useContext(HighlightStyleContext)
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
        const s = hs?.[part.toLowerCase()]
        return isHighlight ? (
          <span
            key={i}
            style={
              // trecho com cor/fundo escolhidos na barrinha → cor sólida (o
              // texto em degradê não combina com marca-texto atrás)
              s && (s.color || s.bg)
                ? { color: s.color ?? color, ...highlightBg(s) }
                : {
                    backgroundImage: gradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
            }
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
  const hs = useContext(HighlightStyleContext)
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
              // cor/fundo escolhidos na barrinha do título sobrepõem o vidro
              ...(hs?.[part.toLowerCase()]?.color ? { color: hs[part.toLowerCase()].color } : {}),
              ...highlightBg(hs?.[part.toLowerCase()]),
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
