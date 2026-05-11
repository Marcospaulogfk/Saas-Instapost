export type PostCategory =
  | "profissional"
  | "beauty"
  | "comercial"
  | "empresa"
  | "fitness"
  | "informativo"

export interface PostBrand {
  id: string
  name: string
  monogram: string
  profession: string
  brand_colors: string[]
  logo_url: string | null
  phone: string | null
  website: string | null
  instagram_handle: string | null
  /** Tagline opcional da marca (ex: "MADE IN REAL ESTÉTICA"). Só renderiza se preenchido. */
  tagline: string | null
}

/** Slots genéricos. Cada template renderiza só os que precisa. */
export interface PostContent {
  kicker?: string
  intro?: string
  intro_2?: string
  title?: string
  title_lines?: string[]
  title_emphasis?: string
  subtitle?: string
  body?: string
  highlight_words?: string[]
  framed_word?: string
  strikethrough_word?: string
  /** Palavra-chave fantasma de fundo (texto translúcido gigante atrás do conteúdo) */
  ghost_word?: string
  cta_text?: string
  contact_phone?: string
  contact_website?: string
  date_full?: string
  stat_value?: string
  stat_label?: string
  question_keyword?: string
  image_url?: string | null
  /** PNG do produto sem fundo (sobreposto/floating) */
  product_image_url?: string | null
  /** Foto profissional/retrato (templates de profissional/data-comemorativa) */
  photo_image_url?: string | null
  /** Foto de fundo ambiente (template frase-motivacional) */
  background_image_url?: string | null
  /** Imagens secundárias pra grids/empilhamento (templates fitness 01, 04) */
  image_2_url?: string | null
  image_3_url?: string | null
  /** Palavra renderizada com fill transparent + stroke (efeito de texto vazado) */
  outline_word?: string
  /** Selo circular: linha 1 (ícone) e label */
  badge_label?: string
  /** Botão secundário (outline) usado em templates com decisão dupla */
  cta_secondary?: string
  /** Email de contato (usado em templates de vaga, "envie currículo") */
  contact_email?: string
  /** Lista de itens com checkmark (requisitos, features) */
  checklist?: string[]
  image_prompt?: string
  pill_lines?: string[]
}

export interface PostTemplateMeta {
  id: string
  category: PostCategory
  label: string
  description: string
  reference_image: string
  required_fields: Array<keyof PostContent>
  optional_fields: Array<keyof PostContent>
  needs_photo: boolean
  use_when: string[]
  fonts: string[]
}

export interface PostPalette {
  /** cor escura — bg dark + textos primários */
  dark: string
  /** cor accent — monograma, sublinhados, ícones, decorações */
  accent: string
  /** cor neutra clara — bg light, fundos */
  surface: string
  /** cor texto secundário — descrições, body */
  textSecondary: string
  /** texto primário em bg dark — geralmente branco */
  textOnDark: string
  /** texto primário em bg light — geralmente dark */
  textOnLight: string
}
