/**
 * Converte um slide de carrossel num FreePostSpec EDITÁVEL.
 *
 * Espelha o sistema de single-post specs (lib/single-posts/template-specs.ts):
 * cada slide vira um FreePostSpec renderizado pelo MESMO FreePostRenderer, então
 * o usuário pode mover / trocar fonte / mudar tamanho de QUALQUER bloco folha.
 *
 * REGRAS (iguais às dos single-post specs):
 *  - Estrutura PLANA: só stacks de nível único com filhos-folha + blocos top-level.
 *    Nunca card, nunca stack aninhado.
 *  - Título multi-linha = UM bloco text com "\n" (autoTitleSize pro tamanho).
 *  - highlight_words → propriedade `highlights` do bloco text.
 *  - Estilos ESCUROS usam a foto como background {kind:"photo"} + texto branco.
 *    Estilos CLAROS usam fundo cream/solid + foto como bloco `image` (card).
 *  - SEMPRE handlePill(brand, variant) coerente com o fundo.
 */
import type { FreePostSpec, FreeBlock, FreeBackground } from "@/lib/single-posts/free-spec"
import type { PostBrand } from "@/lib/single-posts/types"
import { handlePill, pickColors } from "@/lib/single-posts/skeletons"
import { autoTitleSize } from "@/components/single-posts/shared/autofit"

// ── Tipos públicos ──────────────────────────────────────────────────────────

export type CarouselSlideInput = {
  title: string
  subtitle?: string
  body?: string
  highlight_words?: string[]
  cta_badge?: string
  image: { url: string | null }
  extra_images?: Array<{ url: string | null }>
}

export type CarouselSpecOpts = {
  /** estilo visual do carrossel */
  style: "auto" | "wesley" | "brandsdecoded" | "bolo" | "mypostflow"
  /** order_index (0 = capa) */
  index: number
  /** total de slides */
  total: number
  /** [accent/primary, dark, light] */
  brandColors: string[]
  /** ex "@marca" */
  handle: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Monta um PostBrand mínimo pra alimentar pickColors/handlePill. */
function brandFrom(opts: CarouselSpecOpts): PostBrand {
  const handleClean = opts.handle.replace(/^@/, "").trim()
  const name = handleClean || "marca"
  const monogram = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "MP"
  return {
    id: "carousel",
    name,
    monogram,
    profession: "",
    brand_colors: opts.brandColors,
    logo_url: null,
    phone: null,
    website: null,
    instagram_handle: handleClean || null,
    tagline: null,
  }
}

/**
 * Quebra um título em linhas balanceadas (pro autoTitleSize). Respeita quebras
 * "\n" já presentes; senão divide em ~targetLines linhas equilibradas.
 */
function titleLines(title: string, targetLines = 3): string[] {
  const t = (title ?? "").trim()
  if (!t) return []
  if (t.includes("\n")) return t.split("\n").map((l) => l.trim()).filter(Boolean)
  const words = t.split(/\s+/)
  if (words.length <= 1) return [t]
  const per = Math.max(1, Math.ceil(words.length / targetLines))
  const out: string[] = []
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "))
  return out
}

/** Foto principal do slide (ou null). */
function mainPhoto(slide: CarouselSlideInput): string | null {
  return slide.image?.url ?? null
}

// ── Builders por estilo ──────────────────────────────────────────────────────

/**
 * WESLEY — dark/impacto. Foto fullbleed (background photo) com overlay escuro
 * embaixo, título Anton uppercase branco grande no rodapé. Sem foto → gradiente
 * escuro. Capa = título maior.
 */
function buildWesley(slide: CarouselSlideInput, opts: CarouselSpecOpts): FreePostSpec {
  const brand = brandFrom(opts)
  const c = pickColors(brand)
  const isCover = opts.index === 0
  const isLast = opts.index === opts.total - 1
  const photo = mainPhoto(slide)
  const lines = titleLines(slide.title, isCover ? 3 : 2)

  const bg: FreeBackground = photo
    ? {
        kind: "photo",
        photo_url: photo,
        photo_overlay: { color: "#000000", opacity: 0, direction: "to top", start: 0.35 },
      }
    : { kind: "gradient", gradient_from: "#000000", gradient_to: c.dark, gradient_angle: 0 }

  const blocks: FreeBlock[] = [handlePill(brand, "dark")]

  if (slide.cta_badge) {
    blocks.push({
      type: "pill",
      position: { top: "5cqw", right: "5cqw" },
      text: slide.cta_badge,
      bg: c.accent,
      fg: "#0A0A0F",
      font: "inter",
      font_size: "min(2.4cqw, 0.75rem)",
      font_weight: 700,
      text_transform: "uppercase",
      letter_spacing: "0.08em",
      z: 10,
    })
  }

  const children: FreeBlock[] = []
  if (lines.length) {
    children.push({
      type: "text",
      position: {},
      text: lines.join("\n"),
      font: "anton",
      font_size: autoTitleSize(lines, isCover ? 15 : 12, 90),
      font_weight: isCover ? 900 : 800,
      color: "#FFFFFF",
      line_height: 0.95,
      letter_spacing: "-0.01em",
      text_transform: "uppercase",
      highlights: slide.highlight_words,
      text_shadow: true,
    })
  }
  if (slide.subtitle) {
    children.push({
      type: "text",
      position: {},
      text: slide.subtitle,
      font: "inter",
      font_size: "min(2.8cqw, 0.9rem)",
      font_weight: 500,
      color: "rgba(255,255,255,0.82)",
      line_height: 1.4,
      text_shadow: true,
    })
  }
  if (slide.body && !isCover) {
    children.push({
      type: "text",
      position: {},
      text: slide.body,
      font: "inter",
      font_size: "min(3cqw, 0.95rem)",
      font_weight: 400,
      color: "rgba(255,255,255,0.92)",
      line_height: 1.5,
      highlights: slide.highlight_words,
      text_shadow: true,
    })
  }
  if (isLast && slide.cta_badge) {
    children.push({
      type: "pill",
      position: {},
      text: slide.cta_badge,
      bg: c.accent,
      fg: "#0A0A0F",
      font: "inter",
      font_size: "min(2.8cqw, 0.88rem)",
      font_weight: 700,
    })
  }

  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "start",
    z: 5,
    children,
  })

  return { version: 1, background: bg, blocks }
}

/**
 * BRANDSDECODED — editorial serif. Capa escura (foto fullbleed) com título
 * Playfair gigante embaixo. Demais slides: fundo cream claro + título serif
 * preto + body + foto como bloco image (card). Dois modos (claro/escuro)
 * conforme capa vs interno.
 */
function buildBrandsdecoded(slide: CarouselSlideInput, opts: CarouselSpecOpts): FreePostSpec {
  const brand = brandFrom(opts)
  const c = pickColors(brand)
  const isCover = opts.index === 0
  const isLast = opts.index === opts.total - 1
  const photo = mainPhoto(slide)
  const lines = titleLines(slide.title, isCover ? 3 : 2)

  // ── Capa: escura, foto fullbleed, serif gigante embaixo ──
  if (isCover) {
    const bg: FreeBackground = photo
      ? {
          kind: "photo",
          photo_url: photo,
          photo_overlay: { color: "#000000", opacity: 0, direction: "to top", start: 0.3 },
        }
      : { kind: "gradient", gradient_from: "#0F0F1F", gradient_to: "#000000", gradient_angle: 0 }

    const blocks: FreeBlock[] = [
      {
        type: "text",
        position: { top: "5cqw", left: "5cqw" },
        text: brand.name,
        font: "inter",
        font_size: "min(2.2cqw, 0.68rem)",
        font_weight: 500,
        color: "rgba(255,255,255,0.55)",
        letter_spacing: "0.18em",
        text_transform: "uppercase",
        z: 10,
      },
      {
        type: "text",
        position: { top: "5cqw", right: "5cqw" },
        text: "2026 //",
        font: "inter",
        font_size: "min(2.2cqw, 0.68rem)",
        font_weight: 500,
        color: "rgba(255,255,255,0.55)",
        letter_spacing: "0.18em",
        text_align: "right",
        z: 10,
      },
      handlePill(brand, "light"),
    ]

    const children: FreeBlock[] = []
    if (lines.length) {
      children.push({
        type: "text",
        position: {},
        text: lines.join("\n"),
        font: "playfair",
        font_size: autoTitleSize(lines, 14, 90),
        font_weight: 700,
        color: "#FFFFFF",
        line_height: 0.95,
        letter_spacing: "-0.01em",
        highlights: slide.highlight_words,
        text_shadow: true,
      })
    }
    if (slide.subtitle) {
      children.push({
        type: "text",
        position: {},
        text: slide.subtitle,
        font: "playfair_italic",
        font_size: "min(3.4cqw, 1.05rem)",
        font_weight: 400,
        color: "rgba(255,255,255,0.78)",
        line_height: 1.35,
        font_style: "italic",
        text_shadow: true,
      })
    }
    blocks.push({
      type: "stack",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(3cqw, 14px)",
      align: "start",
      z: 5,
      children,
    })
    return { version: 1, background: bg, blocks }
  }

  // ── Interno: cream claro, serif preto, foto como card ──
  const bg: FreeBackground = { kind: "solid", color: "#F5F2EC" }
  const blocks: FreeBlock[] = [
    {
      type: "text",
      position: { top: "5cqw", left: "5cqw" },
      text: brand.name,
      font: "inter",
      font_size: "min(2.2cqw, 0.68rem)",
      font_weight: 500,
      color: "rgba(0,0,0,0.5)",
      letter_spacing: "0.18em",
      text_transform: "uppercase",
      z: 10,
    },
    {
      type: "text",
      position: { top: "5cqw", right: "5cqw" },
      text: `${String(opts.index + 1).padStart(2, "0")} / ${String(opts.total).padStart(2, "0")}`,
      font: "inter",
      font_size: "min(2.2cqw, 0.68rem)",
      font_weight: 500,
      color: "rgba(0,0,0,0.5)",
      letter_spacing: "0.12em",
      text_align: "right",
      z: 10,
    },
  ]

  const children: FreeBlock[] = []
  if (lines.length) {
    children.push({
      type: "text",
      position: {},
      text: lines.join("\n"),
      font: "playfair",
      font_size: autoTitleSize(lines, 11, 90),
      font_weight: 700,
      color: "#0A0A0F",
      line_height: 1.0,
      letter_spacing: "-0.01em",
      highlights: slide.highlight_words,
    })
  }
  if (slide.subtitle) {
    children.push({
      type: "text",
      position: {},
      text: slide.subtitle,
      font: "playfair_italic",
      font_size: "min(3.2cqw, 1rem)",
      font_weight: 400,
      color: c.accent,
      line_height: 1.35,
      font_style: "italic",
    })
  }
  if (slide.body) {
    children.push({
      type: "text",
      position: {},
      text: slide.body,
      font: "inter",
      font_size: "min(2.8cqw, 0.9rem)",
      font_weight: 400,
      color: "rgba(0,0,0,0.78)",
      line_height: 1.5,
      highlights: slide.highlight_words,
    })
  }
  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", top: "14cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "start",
    z: 5,
    children,
  })

  if (photo) {
    blocks.push({
      type: "image",
      position: { left: "5cqw", right: "5cqw", bottom: "9cqw", height: "34%" },
      url: photo,
      fit: "cover",
      border_radius: 18,
      z: 4,
    })
  }
  if (isLast && slide.cta_badge) {
    blocks.push({
      type: "pill",
      position: { left: "5cqw", bottom: "4cqw" },
      text: slide.cta_badge,
      bg: "#0A0A0F",
      fg: c.accent,
      font: "inter",
      font_size: "min(2.6cqw, 0.82rem)",
      font_weight: 600,
      z: 6,
    })
  }

  return { version: 1, background: bg, blocks }
}

/**
 * BOLO — lista cream/clara. Fundo cream, tag de seção (IDEIA 01:) + título
 * inter_bold preto, body em lista, foto como card embaixo. Texto preto.
 */
function buildBolo(slide: CarouselSlideInput, opts: CarouselSpecOpts): FreePostSpec {
  const brand = brandFrom(opts)
  const c = pickColors(brand)
  const isCover = opts.index === 0
  const isLast = opts.index === opts.total - 1
  const photo = mainPhoto(slide)
  const lines = titleLines(slide.title, isCover ? 3 : 2)

  const bg: FreeBackground = { kind: "solid", color: "#F5F2EC" }
  const blocks: FreeBlock[] = [handlePill(brand, "light")]

  if (slide.cta_badge) {
    blocks.push({
      type: "pill",
      position: { top: "5cqw", right: "5cqw" },
      text: slide.cta_badge,
      bg: c.accent,
      fg: "#0A0A0F",
      font: "inter",
      font_size: "min(2.4cqw, 0.75rem)",
      font_weight: 700,
      text_transform: "uppercase",
      letter_spacing: "0.06em",
      z: 10,
    })
  }

  const children: FreeBlock[] = []
  // Tag de seção (prefixo accent + número) como bloco próprio
  children.push({
    type: "text",
    position: {},
    text: `IDEIA ${String(opts.index + 1).padStart(2, "0")}:`,
    font: "inter_bold",
    font_size: "min(3cqw, 0.95rem)",
    font_weight: 700,
    color: c.accent,
    letter_spacing: "0.08em",
    text_transform: "uppercase",
  })
  if (lines.length) {
    children.push({
      type: "text",
      position: {},
      text: lines.join("\n"),
      font: "inter_bold",
      font_size: autoTitleSize(lines, isCover ? 12 : 10, 90),
      font_weight: 800,
      color: "#0A0A0F",
      line_height: 1.0,
      letter_spacing: "-0.01em",
      highlights: slide.highlight_words,
    })
  }
  if (slide.subtitle) {
    children.push({
      type: "text",
      position: {},
      text: slide.subtitle,
      font: "inter",
      font_size: "min(3cqw, 0.92rem)",
      font_weight: 600,
      color: "rgba(0,0,0,0.6)",
      line_height: 1.4,
    })
  }
  if (slide.body) {
    children.push({
      type: "text",
      position: {},
      text: slide.body,
      font: "inter",
      font_size: "min(2.8cqw, 0.9rem)",
      font_weight: 400,
      color: "rgba(0,0,0,0.8)",
      line_height: 1.55,
      highlights: slide.highlight_words,
    })
  }
  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", top: "16cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "start",
    z: 5,
    children,
  })

  if (photo) {
    blocks.push({
      type: "image",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw", height: "32%" },
      url: photo,
      fit: "cover",
      border_radius: 24,
      z: 4,
    })
  }
  if (isLast && slide.cta_badge && !photo) {
    blocks.push({
      type: "pill",
      position: { left: "5cqw", bottom: "8cqw" },
      text: slide.cta_badge,
      bg: "#0A0A0F",
      fg: c.accent,
      font: "inter",
      font_size: "min(2.8cqw, 0.88rem)",
      font_weight: 600,
      z: 6,
    })
  }

  return { version: 1, background: bg, blocks }
}

/**
 * MYPOSTFLOW — cream + título limpo. Fundo cream, avatar quadrado (handlePill),
 * título Archivo uppercase preto limpo, body, foto grande embaixo. Texto preto.
 */
function buildMyPostFlow(slide: CarouselSlideInput, opts: CarouselSpecOpts): FreePostSpec {
  const brand = brandFrom(opts)
  const c = pickColors(brand)
  const isCover = opts.index === 0
  const isLast = opts.index === opts.total - 1
  const photo = mainPhoto(slide)
  const lines = titleLines(slide.title, isCover ? 3 : 2)

  const bg: FreeBackground = { kind: "solid", color: "#F5F2EC" }
  const blocks: FreeBlock[] = [handlePill(brand, "light")]

  if (slide.cta_badge) {
    blocks.push({
      type: "pill",
      position: { top: "5cqw", right: "5cqw" },
      text: slide.cta_badge,
      bg: "#0A0A0F",
      fg: c.accent,
      font: "inter",
      font_size: "min(2.4cqw, 0.75rem)",
      font_weight: 700,
      text_transform: "uppercase",
      letter_spacing: "0.06em",
      z: 10,
    })
  }

  const children: FreeBlock[] = []
  if (lines.length) {
    children.push({
      type: "text",
      position: {},
      text: lines.join("\n"),
      font: "archivo",
      font_size: autoTitleSize(lines, isCover ? 13 : 11, 90),
      font_weight: 800,
      color: "#0A0A0F",
      line_height: 1.0,
      letter_spacing: "-0.01em",
      text_transform: "uppercase",
      highlights: slide.highlight_words,
    })
  }
  if (slide.subtitle) {
    children.push({
      type: "text",
      position: {},
      text: slide.subtitle,
      font: "inter",
      font_size: "min(3cqw, 0.92rem)",
      font_weight: 600,
      color: "rgba(0,0,0,0.55)",
      line_height: 1.4,
    })
  }
  if (slide.body) {
    children.push({
      type: "text",
      position: {},
      text: slide.body,
      font: "inter",
      font_size: "min(2.8cqw, 0.9rem)",
      font_weight: 400,
      color: "rgba(0,0,0,0.75)",
      line_height: 1.55,
      highlights: slide.highlight_words,
    })
  }
  if (isLast && slide.cta_badge) {
    children.push({
      type: "pill",
      position: {},
      text: slide.cta_badge,
      bg: "#7C3AED",
      fg: "#FFFFFF",
      font: "inter",
      font_size: "min(2.8cqw, 0.88rem)",
      font_weight: 600,
    })
  }
  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", top: "16cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "start",
    z: 5,
    children,
  })

  if (photo) {
    blocks.push({
      type: "image",
      position: { left: "5cqw", right: "5cqw", bottom: "6cqw", height: "34%" },
      url: photo,
      fit: "cover",
      border_radius: 20,
      shadow: true,
      z: 4,
    })
  }

  return { version: 1, background: bg, blocks }
}

/**
 * AUTO — alternado dark/light. Slides pares (incl. capa) usam o estilo escuro
 * (foto fullbleed + texto branco, mistura de fontes). Ímpares usam o claro
 * (cream + foto card + texto preto).
 */
function buildAuto(slide: CarouselSlideInput, opts: CarouselSpecOpts): FreePostSpec {
  const brand = brandFrom(opts)
  const c = pickColors(brand)
  const isCover = opts.index === 0
  const isLast = opts.index === opts.total - 1
  const dark = opts.index % 2 === 0
  const photo = mainPhoto(slide)
  const lines = titleLines(slide.title, isCover ? 3 : 2)

  // ── Variante escura (par) — foto fullbleed, texto branco ──
  if (dark) {
    const bg: FreeBackground = photo
      ? {
          kind: "photo",
          photo_url: photo,
          photo_overlay: { color: "#000000", opacity: 0, direction: "to top", start: 0.35 },
        }
      : { kind: "gradient", gradient_from: c.dark, gradient_to: "#000000", gradient_angle: 135 }

    const blocks: FreeBlock[] = [handlePill(brand, "dark")]
    if (slide.cta_badge) {
      blocks.push({
        type: "pill",
        position: { top: "5cqw", right: "5cqw" },
        text: slide.cta_badge,
        bg: c.accent,
        fg: "#0A0A0F",
        font: "inter",
        font_size: "min(2.4cqw, 0.75rem)",
        font_weight: 700,
        text_transform: "uppercase",
        letter_spacing: "0.06em",
        z: 10,
      })
    }

    const children: FreeBlock[] = []
    if (lines.length) {
      children.push({
        type: "text",
        position: {},
        text: lines.join("\n"),
        // mistura: capa em serif, internos em anton
        font: isCover ? "playfair" : "anton",
        font_size: autoTitleSize(lines, isCover ? 14 : 12, 90),
        font_weight: isCover ? 700 : 800,
        color: "#FFFFFF",
        line_height: isCover ? 1.0 : 0.95,
        letter_spacing: "-0.01em",
        text_transform: isCover ? "none" : "uppercase",
        highlights: slide.highlight_words,
        text_shadow: true,
      })
    }
    if (slide.subtitle) {
      children.push({
        type: "text",
        position: {},
        text: slide.subtitle,
        font: "playfair_italic",
        font_size: "min(3.2cqw, 1rem)",
        font_weight: 400,
        color: "rgba(255,255,255,0.8)",
        line_height: 1.4,
        font_style: "italic",
        text_shadow: true,
      })
    }
    if (slide.body && !isCover) {
      children.push({
        type: "text",
        position: {},
        text: slide.body,
        font: "inter",
        font_size: "min(2.9cqw, 0.92rem)",
        font_weight: 400,
        color: "rgba(255,255,255,0.92)",
        line_height: 1.5,
        highlights: slide.highlight_words,
        text_shadow: true,
      })
    }
    if (isLast && slide.cta_badge) {
      children.push({
        type: "pill",
        position: {},
        text: slide.cta_badge,
        bg: c.accent,
        fg: "#0A0A0F",
        font: "inter",
        font_size: "min(2.8cqw, 0.88rem)",
        font_weight: 700,
      })
    }
    blocks.push({
      type: "stack",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(3cqw, 14px)",
      align: "start",
      z: 5,
      children,
    })
    return { version: 1, background: bg, blocks }
  }

  // ── Variante clara (ímpar) — cream + foto card + texto preto ──
  const bg: FreeBackground = { kind: "solid", color: "#F5F2EC" }
  const blocks: FreeBlock[] = [handlePill(brand, "light")]
  if (slide.cta_badge) {
    blocks.push({
      type: "pill",
      position: { top: "5cqw", right: "5cqw" },
      text: slide.cta_badge,
      bg: "#0A0A0F",
      fg: c.accent,
      font: "inter",
      font_size: "min(2.4cqw, 0.75rem)",
      font_weight: 700,
      text_transform: "uppercase",
      letter_spacing: "0.06em",
      z: 10,
    })
  }

  const children: FreeBlock[] = []
  if (lines.length) {
    children.push({
      type: "text",
      position: {},
      text: lines.join("\n"),
      font: "anton",
      font_size: autoTitleSize(lines, 11, 90),
      font_weight: 800,
      color: "#0A0A0F",
      line_height: 1.0,
      letter_spacing: "-0.01em",
      text_transform: "uppercase",
      highlights: slide.highlight_words,
    })
  }
  if (slide.subtitle) {
    children.push({
      type: "text",
      position: {},
      text: slide.subtitle,
      font: "inter",
      font_size: "min(3cqw, 0.92rem)",
      font_weight: 600,
      color: "rgba(0,0,0,0.58)",
      line_height: 1.4,
    })
  }
  if (slide.body) {
    children.push({
      type: "text",
      position: {},
      text: slide.body,
      font: "inter",
      font_size: "min(2.8cqw, 0.9rem)",
      font_weight: 400,
      color: "rgba(0,0,0,0.78)",
      line_height: 1.55,
      highlights: slide.highlight_words,
    })
  }
  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", top: "16cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "start",
    z: 5,
    children,
  })

  if (photo) {
    blocks.push({
      type: "image",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw", height: "32%" },
      url: photo,
      fit: "cover",
      border_radius: 20,
      z: 4,
    })
  }

  return { version: 1, background: bg, blocks }
}

// ── Entry point ──────────────────────────────────────────────────────────────

/** Converte um slide de carrossel num FreePostSpec editável conforme o estilo. */
export function buildSlideSpec(slide: CarouselSlideInput, opts: CarouselSpecOpts): FreePostSpec {
  switch (opts.style) {
    case "wesley":
      return buildWesley(slide, opts)
    case "brandsdecoded":
      return buildBrandsdecoded(slide, opts)
    case "bolo":
      return buildBolo(slide, opts)
    case "mypostflow":
      return buildMyPostFlow(slide, opts)
    case "auto":
    default:
      return buildAuto(slide, opts)
  }
}
