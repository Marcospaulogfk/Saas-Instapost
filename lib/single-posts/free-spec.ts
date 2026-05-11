/**
 * DSL pra layouts livres (sem template fixo).
 *
 * A IA produz um FreePostSpec descrevendo blocos com posicionamento absoluto
 * em unidades cqw (container query width — escala com o canvas).
 *
 * Princípio: vocabulário pequeno mas expressivo o bastante pra cobrir os
 * padrões visuais dos 20 templates curados. Cada bloco é renderizado num
 * <div absolute> com props inline.
 */

export type FreeFontKey =
  | "anton" // bold uppercase condensed
  | "playfair" // serif elegante
  | "playfair_italic" // serif italic
  | "inter" // sans neutro
  | "inter_bold"
  | "allura" // script handwriting
  | "bebas" // sans condensed leve (Bebas Neue)
  | "montserrat" // sans geométrica
  | "archivo" // sans pesada (Archivo Black)
  | "grotesk" // grotesk moderna (Space Grotesk)

export interface FreeBackground {
  /** "solid", "gradient" (linear), ou "photo" fullbleed */
  kind: "solid" | "gradient" | "photo"
  color?: string
  gradient_from?: string
  gradient_to?: string
  /** ângulo em graus (0 = top→bottom). default 135 */
  gradient_angle?: number
  photo_url?: string
  /** Overlay sobre a foto (cor + opacidade) */
  photo_overlay?: {
    /** "black" | "white" | hex */
    color: string
    /** 0–1 */
    opacity: number
    /** opcional: gradient direction. ex: "to bottom", "to top right" */
    direction?: string
    /** se gradient, ponto inicial 0–1 (default 0.4) */
    start?: number
  }
}

export interface FreeBlockBase {
  /** Posição (em cqw, %, px ou number=px). Pelo menos 1 par horizontal e 1 vertical. */
  position: {
    top?: string | number
    bottom?: string | number
    left?: string | number
    right?: string | number
    width?: string | number
    height?: string | number
    /** se true, transformX(-50%) com left:50% */
    center_x?: boolean
    /** se true, transformY(-50%) com top:50% */
    center_y?: boolean
  }
  /** ordem de empilhamento (default 1) */
  z?: number
}

export interface FreeTextBlock extends FreeBlockBase {
  type: "text"
  text: string // pode ter \n pra quebra de linha
  font: FreeFontKey
  /** ex: "min(13cqw, 3.5rem)". Usar SEMPRE min() pra escalar com cqw */
  font_size: string
  font_weight?: number // 400-900
  color: string
  letter_spacing?: string
  line_height?: number
  text_align?: "left" | "center" | "right"
  text_transform?: "uppercase" | "lowercase" | "none"
  font_style?: "italic" | "normal"
  /** palavras pra renderizar em bold inline dentro do text */
  highlights?: string[]
  /** palavra pra renderizar com text-stroke + transparente (efeito vazado) */
  outline_word?: string
  /** sombra de texto sutil (só pra texto sobre foto) */
  text_shadow?: boolean
  /** Multiplier aplicado pelo edit panel (1 = original). Renderer usa via calc(). */
  font_size_scale?: number
}

export interface FreeImageBlock extends FreeBlockBase {
  type: "image"
  url: string
  fit?: "cover" | "contain"
  border_radius?: number
  rotation?: number
  /** drop-shadow forte (pra mockups flutuantes) */
  shadow?: boolean
  /** mask gradient no canto (pra fade de borda). ex: "left", "right" */
  mask_fade?: "left" | "right" | "top" | "bottom"
}

export interface FreePillBlock extends FreeBlockBase {
  type: "pill"
  text: string
  bg: string
  fg: string
  font?: FreeFontKey
  font_size?: string
  font_weight?: number
  border?: string // ex: "1px solid rgba(255,255,255,0.4)"
  /** se true, mostra avatar circular à esquerda com 2 letras */
  with_avatar?: boolean
  avatar_text?: string
  text_transform?: "uppercase" | "none"
  letter_spacing?: string
  /** Multiplier aplicado pelo edit panel (1 = original). */
  font_size_scale?: number
}

export interface FreeShapeBlock extends FreeBlockBase {
  type: "shape"
  shape: "circle" | "rectangle" | "rounded" | "blob"
  color: string
  border?: string
  opacity?: number
  blur?: number // px
  rotation?: number
  /** border-radius pra rectangle/rounded (default 16 pra rounded) */
  radius?: number
}

export interface FreeDividerBlock extends FreeBlockBase {
  type: "divider"
  color: string
  /** width em cqw, %, ou px. height é fixo (default 2) */
  thickness?: number
  vertical?: boolean
}

export interface FreeIconBlock extends FreeBlockBase {
  type: "icon"
  /** lucide-react icon name */
  name:
    | "alert-triangle"
    | "check"
    | "check-circle"
    | "star"
    | "arrow-right"
    | "arrow-up-right"
    | "arrow-down-right"
    | "calendar"
    | "mail"
    | "phone"
    | "instagram"
    | "user"
    | "file-text"
    | "camera"
  color: string
  /** size em cqw, ex: "min(8cqw, 36px)" */
  size: string
  /** bg circular opcional */
  background?: string
  /** padding interno se tem background */
  padding?: string
}

export interface FreeCardBlock extends FreeBlockBase {
  type: "card"
  bg: string
  /** border-radius (default 16) */
  radius?: number
  /** padding interno (default "min(5cqw, 24px)") */
  padding?: string
  /** sombra forte (pra cards flutuantes sobre fundo colorido) */
  shadow?: boolean
  /** blocos filhos posicionados RELATIVO ao card */
  children: FreeBlock[]
}

/**
 * Stack block — flex column/row com gap, IMPOSSÍVEL sobrepor filhos.
 * Filhos fluem naturalmente. Position dos filhos é IGNORADA.
 * Use sempre que tiver múltiplos textos sequenciais.
 */
export interface FreeStackBlock extends FreeBlockBase {
  type: "stack"
  direction?: "column" | "row"
  /** ex: "min(3cqw, 14px)". default: "min(2.5cqw, 12px)" */
  gap?: string
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between"
  bg?: string
  radius?: number | string
  padding?: string
  shadow?: boolean
  children: FreeBlock[]
}

export type FreeBlock =
  | FreeTextBlock
  | FreeImageBlock
  | FreePillBlock
  | FreeShapeBlock
  | FreeDividerBlock
  | FreeIconBlock
  | FreeCardBlock
  | FreeStackBlock

export interface FreePostSpec {
  /** Versão do schema pra evolução futura */
  version: 1
  background: FreeBackground
  /** Texto fantasma gigante de fundo (decoração sutil opcional) */
  ghost?: {
    text: string
    color: string // ex: "rgba(255,255,255,0.07)"
    font_size: string // ex: "min(50cqw, 14rem)"
    font: FreeFontKey
    /** posicionamento simples */
    anchor?: "top" | "center" | "left-vertical" | "right-vertical"
    rotation?: number
  }
  blocks: FreeBlock[]
  /** Notas da IA explicando as escolhas — útil pra debug/aprendizado */
  rationale?: string
}
