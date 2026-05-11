/**
 * Skeletons — layouts pré-compostos que a IA "preenche".
 *
 * A IA escolhe um skeleton + provê slots de conteúdo + (opcional) foto via Fal.ai.
 * Cada skeleton é uma função `build(ctx)` que retorna um FreePostSpec
 * com posicionamento já calculado (sem math pra IA errar).
 */

import { isLight } from "./palette"
import type {
  FreePostSpec,
  FreeBlock,
  FreeBackground,
  FreeFontKey,
} from "./free-spec"
import type { PostBrand } from "./types"

export interface SkeletonContent {
  /** Texto curto destacado (uppercase, kicker) — ex: "VAGAS ABERTAS" */
  kicker?: string
  /** Título principal — pode ser frase ou 1 palavra */
  title?: string
  /** Linhas de título quando precisa quebrar (ex: ["VEM SER", "POWER ACADEMY"]) */
  title_lines?: string[]
  /** Subtítulo/tagline complementar */
  subtitle?: string
  /** Texto corrido descritivo */
  body?: string
  /** Palavras pra bold inline no body/title */
  highlight_words?: string[]
  /** Palavra pra renderizar com text-stroke (vazada) */
  outline_word?: string
  /** Texto fantasma gigante de fundo */
  ghost_word?: string
  /** Botão CTA */
  cta_text?: string
  /** Número grande (24H, 50%, 365) */
  stat_value?: string
  /** Label do número (OFF, /mês, "DIAS") */
  stat_label?: string
  /** Pergunta-chave em uppercase pra destaque (modo pergunta) */
  question_keyword?: string
}

export interface SkeletonContext {
  brand: PostBrand
  content: SkeletonContent
  /** URL de foto fornecida (Fal.ai gerou ou Unsplash) */
  photo_url?: string | null
}

export interface SkeletonMeta {
  id: string
  name: string
  description: string
  vibe: string
  needs_photo: boolean
  required_slots: Array<keyof SkeletonContent>
  optional_slots: Array<keyof SkeletonContent>
}

export interface SkeletonImpl {
  meta: SkeletonMeta
  build: (ctx: SkeletonContext) => FreePostSpec
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Auto-shrink de fonte baseado no comprimento do texto.
 * Pra textos curtos, fonte grande. Pra textos longos, fonte menor.
 *
 * @param text texto que vai dentro do bloco
 * @param tiers array de [maxChars, fontSize] em ordem ascendente de comprimento
 * @param fallback fonte pra textos acima do último tier
 */
function autoFont(
  text: string,
  tiers: Array<[number, string]>,
  fallback: string,
): string {
  const len = (text ?? "").length
  for (const [maxChars, size] of tiers) {
    if (len <= maxChars) return size
  }
  return fallback
}

function pickColors(brand: PostBrand): {
  primary: string
  dark: string
  accent: string
  surface: string
} {
  const cs = brand.brand_colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c))
  // Sort by luminance to identify dark/light/mid
  const byLum = [...cs].sort((a, b) => {
    const lum = (h: string) => {
      const r = parseInt(h.slice(1, 3), 16) / 255
      const g = parseInt(h.slice(3, 5), 16) / 255
      const b = parseInt(h.slice(5, 7), 16) / 255
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    return lum(a) - lum(b)
  })
  return {
    dark: byLum[0] ?? "#1A1A1A",
    surface: byLum[byLum.length - 1] ?? "#F5F5F5",
    accent: byLum[1] ?? byLum[byLum.length - 1] ?? "#C9F031",
    primary: cs[0] ?? "#1A1A1A",
  }
}

function handlePill(brand: PostBrand, variant: "dark" | "light"): FreeBlock {
  const isDark = variant === "dark"
  return {
    type: "pill",
    position: { top: "5cqw", left: "5cqw" },
    text: `@${brand.instagram_handle ?? brand.name.toLowerCase().replace(/\s/g, "")}`,
    bg: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.92)",
    fg: isDark ? "#FFFFFF" : "#0A0A0F",
    border: isDark
      ? "1px solid rgba(255,255,255,0.12)"
      : "1px solid rgba(0,0,0,0.08)",
    with_avatar: true,
    avatar_text: brand.monogram,
    font_size: "min(2.7cqw, 0.82rem)",
    z: 10,
  }
}

// =============================================================================
// 1. HERO FULLBLEED + OVERLAY BOTTOM
// =============================================================================

const heroFullbleedBottom: SkeletonImpl = {
  meta: {
    id: "hero-fullbleed-bottom",
    name: "Hero Fullbleed (foto + título grande)",
    description:
      "Foto ocupando toda a tela com gradiente escuro embaixo. Kicker pequeno + título grande no rodapé. Bom pra notícias, lançamentos, manchetes.",
    vibe: "editorial, dramático, jornalístico",
    needs_photo: true,
    required_slots: ["title"],
    optional_slots: ["kicker", "subtitle", "outline_word"],
  } as SkeletonMeta,
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const bg: FreeBackground = photo_url
      ? {
          kind: "photo",
          photo_url,
          photo_overlay: {
            // Bottom escuro pra apoiar texto, top transparente pra ver foto crua
            color: "#000000",
            opacity: 0,
            direction: "to top",
            start: 0.45,
          },
        }
      : { kind: "gradient", gradient_from: c.dark, gradient_to: "#000000" }
    const blocks: FreeBlock[] = [handlePill(brand, "dark")]

    // Stack vertical no rodapé: kicker + título + subtitle
    const titleText = content.title_lines?.join("\n") ?? content.title ?? "TÍTULO"
    const stackChildren: FreeBlock[] = []
    if (content.kicker) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.kicker,
        font: "inter",
        font_size: autoFont(content.kicker, [
          [25, "min(2.8cqw, 0.85rem)"],
        ], "min(2.4cqw, 0.75rem)"),
        font_weight: 600,
        color: c.accent,
        letter_spacing: "0.2em",
        text_transform: "uppercase",
        text_align: "left",
      })
    }
    stackChildren.push({
      type: "text",
      position: {},
      text: titleText,
      font: "playfair_italic",
      font_size: autoFont(titleText, [
        [30, "min(13cqw, 3.6rem)"],
        [60, "min(10cqw, 2.7rem)"],
        [100, "min(8cqw, 2.1rem)"],
      ], "min(6cqw, 1.6rem)"),
      font_weight: 600,
      color: "#FFFFFF",
      line_height: 1.05,
      letter_spacing: "-0.02em",
      font_style: "italic",
      outline_word: content.outline_word,
      text_shadow: true,
    })
    if (content.subtitle) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.subtitle,
        font: "inter",
        font_size: autoFont(content.subtitle, [
          [80, "min(2.6cqw, 0.85rem)"],
          [150, "min(2.3cqw, 0.75rem)"],
        ], "min(2cqw, 0.7rem)"),
        font_weight: 400,
        color: "rgba(255,255,255,0.85)",
        line_height: 1.4,
      })
    }
    blocks.push({
      type: "stack",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(2.5cqw, 12px)",
      align: "start",
      z: 5,
      children: stackChildren,
    })
    return { version: 1, background: bg, blocks }
  },
}

// =============================================================================
// 2. CARD CENTER ON COLOR (alerta/comunicado)
// =============================================================================

const cardCenterOnColor: SkeletonImpl = {
  meta: {
    id: "card-center-on-color",
    name: "Card centralizado (comunicado)",
    description:
      "Fundo cor primary (com foto sutil opcional) + ghost word + card branco centralizado contendo título Anton uppercase + body + CTA.",
    vibe: "alerta, urgência, comunicado",
    needs_photo: true, // foto vai como bg sutil
    required_slots: ["title", "body"],
    optional_slots: ["ghost_word", "cta_text", "subtitle"],
  },
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const bgColor = c.primary === c.dark ? c.primary : c.dark
    const blocks: FreeBlock[] = [handlePill(brand, "dark")]
    // Foto como bg sutil escurecido
    if (photo_url) {
      blocks.push({
        type: "image",
        position: { top: 0, left: 0, right: 0, bottom: 0 },
        url: photo_url,
        fit: "cover",
        z: 0,
      })
      blocks.push({
        type: "shape",
        position: { top: 0, left: 0, right: 0, bottom: 0 },
        shape: "rectangle",
        color: bgColor,
        opacity: 0.5,
        z: 0,
      })
    }

    // Stack vertical centralizado dentro do card — flow natural, sem sobrepor
    const stackChildren: FreeBlock[] = [
      {
        type: "icon",
        position: {},
        name: "alert-triangle",
        color: bgColor,
        size: "min(10cqw, 44px)",
      },
      {
        type: "text",
        position: {},
        text: content.title ?? "ATENÇÃO",
        font: "anton",
        font_size: autoFont(content.title ?? "", [
          [12, "min(9cqw, 2.4rem)"],
          [25, "min(7cqw, 1.9rem)"],
        ], "min(5.5cqw, 1.5rem)"),
        font_weight: 800,
        color: bgColor,
        line_height: 1,
        letter_spacing: "-0.01em",
        text_transform: "uppercase",
        text_align: "center",
      },
    ]
    if (content.body) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.body,
        font: "inter",
        font_size: autoFont(content.body, [
          [80, "min(2.6cqw, 0.85rem)"],
          [180, "min(2.3cqw, 0.75rem)"],
        ], "min(2cqw, 0.7rem)"),
        font_weight: 400,
        color: "#6B7280",
        line_height: 1.5,
        text_align: "center",
      })
    }
    if (content.cta_text) {
      stackChildren.push({
        type: "pill",
        position: {},
        text: content.cta_text,
        bg: bgColor,
        fg: "#FFFFFF",
        font: "inter",
        font_size: "min(2.7cqw, 0.85rem)",
        font_weight: 600,
      })
    }
    if (content.subtitle) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.subtitle,
        font: "inter",
        font_size: "min(2.4cqw, 0.78rem)",
        font_weight: 500,
        color: "#6B7280",
        text_align: "center",
      })
    }
    blocks.push({
      type: "stack",
      // Container menor + posicionado no bottom (com margem)
      position: { left: "10cqw", right: "10cqw", bottom: "10cqw" },
      direction: "column",
      gap: "min(2.5cqw, 12px)",
      align: "center",
      justify: "center",
      bg: c.surface,
      radius: 20,
      padding: "min(5.5cqw, 24px)",
      shadow: true,
      children: stackChildren,
      z: 4,
    })
    return {
      version: 1,
      background: { kind: "solid", color: bgColor },
      ghost: content.ghost_word
        ? {
            text: content.ghost_word,
            color: "rgba(255,255,255,0.06)",
            font_size: "min(55cqw, 15rem)",
            font: "anton",
            anchor: "top",
          }
        : undefined,
      blocks,
    }
  },
}

// =============================================================================
// 3. SPLIT TEXT-PHOTO (serviço/captação)
// =============================================================================

const splitTextPhoto: SkeletonImpl = {
  meta: {
    id: "split-text-photo",
    name: "Split texto-foto (captação)",
    description:
      "Lado esquerdo cor primary com handle + título + body + CTA. Lado direito foto. Bom pra captar cliente / divulgar serviço.",
    vibe: "captação, serviço, profissional",
    needs_photo: true,
    required_slots: ["title", "body"],
    optional_slots: ["cta_text", "kicker"],
  },
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const bgColor = c.dark
    const bg: FreeBackground = photo_url
      ? {
          kind: "photo",
          photo_url,
          photo_overlay: {
            // Bottom escuro (apoia texto) → transparente em cima (foto livre)
            color: "#000000",
            opacity: 0,
            direction: "to top",
            start: 0.45,
          },
        }
      : { kind: "solid", color: bgColor }
    const blocks: FreeBlock[] = [handlePill(brand, "dark")]

    // Stack centralizado bottom: kicker + título + body + CTA
    const stackChildren: FreeBlock[] = []
    if (content.kicker) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.kicker,
        font: "inter",
        font_size: autoFont(content.kicker, [
          [25, "min(2.6cqw, 0.85rem)"],
        ], "min(2.2cqw, 0.72rem)"),
        font_weight: 600,
        color: c.accent,
        letter_spacing: "0.2em",
        text_transform: "uppercase",
        text_align: "center",
        text_shadow: true,
      })
    }
    stackChildren.push({
      type: "text",
      position: {},
      text: content.title ?? "Título",
      font: "playfair_italic",
      font_size: autoFont(content.title ?? "", [
        [25, "min(9cqw, 2.4rem)"],
        [60, "min(7cqw, 1.9rem)"],
      ], "min(5.5cqw, 1.5rem)"),
      font_weight: 600,
      color: "#FFFFFF",
      line_height: 1.1,
      letter_spacing: "-0.02em",
      font_style: "italic",
      highlights: content.highlight_words,
      text_align: "center",
      text_shadow: true,
    })
    if (content.body) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.body,
        font: "inter",
        font_size: autoFont(content.body, [
          [100, "min(2.6cqw, 0.85rem)"],
          [200, "min(2.3cqw, 0.75rem)"],
        ], "min(2cqw, 0.7rem)"),
        font_weight: 400,
        color: "rgba(255,255,255,0.92)",
        line_height: 1.5,
        text_align: "center",
        text_shadow: true,
      })
    }
    if (content.cta_text) {
      stackChildren.push({
        type: "pill",
        position: {},
        text: content.cta_text,
        bg: c.accent,
        fg: bgColor,
        font: "inter",
        font_size: "min(2.7cqw, 0.85rem)",
        font_weight: 600,
      })
    }
    blocks.push({
      type: "stack",
      // Centralizado horizontal + posicionado no bottom
      position: { left: "6cqw", right: "6cqw", bottom: "9cqw" },
      direction: "column",
      gap: "min(2.5cqw, 12px)",
      align: "center",
      z: 5,
      children: stackChildren,
    })
    return { version: 1, background: bg, blocks }
  },
}

// =============================================================================
// 4. STAT HERO (número gigante)
// =============================================================================

const statHero: SkeletonImpl = {
  meta: {
    id: "stat-hero",
    name: "Hero impacto",
    description:
      "Foto fullbleed + kicker + label/título Anton uppercase + body + CTA. Vibe direta de oferta/garantia, sem número gigante.",
    vibe: "impacto, oferta, varejo",
    needs_photo: true,
    required_slots: ["stat_label"],
    optional_slots: ["kicker", "body", "cta_text"],
  },
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const bgColor =
      c.accent !== c.dark && !isLight(c.accent) ? c.accent : c.dark
    const blocks: FreeBlock[] = [handlePill(brand, "dark")]
    if (photo_url) {
      blocks.push({
        type: "image",
        position: { top: 0, left: 0, right: 0, bottom: 0 },
        url: photo_url,
        fit: "cover",
        z: 0,
      })
      // Overlay SEMPRE escuro (não tinge a foto com cor da marca)
      blocks.push({
        type: "shape",
        position: { top: 0, left: 0, right: 0, bottom: 0 },
        shape: "rectangle",
        color: "#0A0A0A",
        opacity: 0.25,
        z: 0,
      })
    }

    // Stack vertical com tudo: kicker + stat + label + body + CTA — flow natural sem sobrepor
    const stackChildren: FreeBlock[] = []
    if (content.kicker) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.kicker,
        font: "anton",
        font_size: autoFont(content.kicker, [
          [12, "min(8cqw, 2.1rem)"],
          [20, "min(6.5cqw, 1.8rem)"],
        ], "min(5cqw, 1.4rem)"),
        font_weight: 800,
        color: "#FFFFFF",
        letter_spacing: "-0.01em",
        line_height: 1,
        text_transform: "uppercase",
      })
    }
    if (content.stat_label) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.stat_label,
        font: "anton",
        font_size: autoFont(content.stat_label, [
          [20, "min(13cqw, 3.5rem)"],
          [40, "min(10cqw, 2.7rem)"],
          [70, "min(7.5cqw, 2.1rem)"],
        ], "min(6cqw, 1.6rem)"),
        font_weight: 800,
        color: "#FFFFFF",
        letter_spacing: "-0.01em",
        line_height: 1,
        text_transform: "uppercase",
        text_shadow: true,
      })
    }
    if (content.body) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.body,
        font: "inter",
        font_size: autoFont(content.body, [
          [80, "min(3cqw, 0.95rem)"],
          [150, "min(2.6cqw, 0.85rem)"],
        ], "min(2.3cqw, 0.75rem)"),
        font_weight: 400,
        color: "rgba(255,255,255,0.92)",
        line_height: 1.4,
      })
    }
    if (content.cta_text) {
      stackChildren.push({
        type: "pill",
        position: {},
        text: content.cta_text,
        bg: "#FFFFFF",
        fg: bgColor,
        font: "inter",
        font_size: "min(2.7cqw, 0.85rem)",
        font_weight: 600,
      })
    }
    blocks.push({
      type: "stack",
      position: { left: "5cqw", right: "5cqw", top: "16cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(3cqw, 14px)",
      align: "start",
      justify: "start",
      z: 5,
      children: stackChildren,
    })
    return { version: 1, background: { kind: "solid", color: bgColor }, blocks }
  },
}

// =============================================================================
// 6. HEADLINE UPPERCASE (manchete agressiva)
// =============================================================================

const headlineUppercase: SkeletonImpl = {
  meta: {
    id: "headline-uppercase",
    name: "Manchete uppercase",
    description:
      "Cor primary (com foto sutil opcional) + ghost word + título Anton uppercase em 2-3 linhas (com palavra outline opcional) + body + handle.",
    vibe: "manchete, agressivo, fitness/varejo",
    needs_photo: true,
    required_slots: ["title_lines"],
    optional_slots: ["kicker", "ghost_word", "outline_word", "body", "cta_text"],
  },
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const isAccentBg = !isLight(c.accent) && c.accent !== c.dark
    const bgColor = isAccentBg ? c.accent : c.dark
    // Quando tem foto, força branco (foto pode ter qualquer cor — preto não enxerga)
    const fgColor = photo_url ? "#FFFFFF" : isAccentBg ? "#0A0A0A" : "#FFFFFF"
    const bodyColor = photo_url
      ? "rgba(255,255,255,0.92)"
      : isAccentBg
        ? "rgba(0,0,0,0.78)"
        : "rgba(255,255,255,0.92)"
    const useShadow = !!photo_url
    const blocks: FreeBlock[] = [handlePill(brand, photo_url || !isAccentBg ? "dark" : "light")]
    if (photo_url) {
      blocks.push({
        type: "image",
        position: { top: 0, left: 0, right: 0, bottom: 0 },
        url: photo_url,
        fit: "cover",
        z: 0,
      })
    }

    // Stack vertical com tudo: kicker + título + body + CTA — flow natural
    const titleText = content.title_lines?.join("\n") ?? content.title ?? "TÍTULO\nGRANDE"
    const stackChildren: FreeBlock[] = []
    if (content.kicker) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.kicker,
        font: "inter",
        font_size: autoFont(content.kicker, [
          [25, "min(2.6cqw, 0.82rem)"],
        ], "min(2.2cqw, 0.72rem)"),
        font_weight: 600,
        color: fgColor,
        letter_spacing: "0.2em",
        text_transform: "uppercase",
        text_shadow: useShadow,
      })
    }
    stackChildren.push({
      type: "text",
      position: {},
      text: titleText,
      font: "anton",
      font_size: autoFont(titleText, [
        [25, "min(15cqw, 4rem)"],
        [50, "min(11cqw, 3rem)"],
        [80, "min(8.5cqw, 2.3rem)"],
      ], "min(6.5cqw, 1.8rem)"),
      font_weight: 800,
      color: fgColor,
      line_height: 0.95,
      letter_spacing: "-0.01em",
      text_transform: "uppercase",
      outline_word: content.outline_word,
      text_shadow: useShadow,
    })
    if (content.body) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.body,
        font: "inter",
        font_size: autoFont(content.body, [
          [80, "min(3cqw, 0.95rem)"],
          [180, "min(2.5cqw, 0.82rem)"],
        ], "min(2.2cqw, 0.72rem)"),
        font_weight: 400,
        color: bodyColor,
        line_height: 1.5,
        text_shadow: useShadow,
      })
    }
    if (content.cta_text) {
      stackChildren.push({
        type: "pill",
        position: {},
        text: content.cta_text,
        bg: isAccentBg ? "#0A0A0A" : c.accent,
        fg: isAccentBg ? c.accent : "#0A0A0A",
        font: "inter",
        font_size: "min(2.7cqw, 0.85rem)",
        font_weight: 600,
      })
    }
    blocks.push({
      type: "stack",
      // 5cqw esquerda, 8cqw direita (~ 40px num canvas de 500px) → user pediu margem 40 dir
      position: { left: "5cqw", right: "8cqw", top: "16cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(3cqw, 14px)",
      align: "start",
      justify: "start",
      z: 5,
      children: stackChildren,
    })
    return {
      version: 1,
      background: { kind: "solid", color: bgColor },
      ghost: content.ghost_word
        ? {
            text: content.ghost_word,
            color: isAccentBg ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)",
            font_size: "min(50cqw, 14rem)",
            font: "anton",
            anchor: "center",
          }
        : undefined,
      blocks,
    }
  },
}

// =============================================================================
// 7. QUESTION PHOTO (pergunta provocativa)
// =============================================================================

const questionPhoto: SkeletonImpl = {
  meta: {
    id: "question-photo",
    name: "Pergunta provocativa",
    description:
      "Foto fullbleed escurecida + pergunta sans-serif média + palavra-chave Playfair italic gigante + CTA pill.",
    vibe: "engajamento, pergunta, autoridade",
    needs_photo: true,
    required_slots: ["title", "question_keyword"],
    optional_slots: ["cta_text"],
  },
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const bg: FreeBackground = photo_url
      ? {
          kind: "photo",
          photo_url,
          photo_overlay: {
            // Bottom escuro (apoia texto) → transparente em cima
            color: "#000000",
            opacity: 0,
            direction: "to top",
            start: 0.5,
          },
        }
      : { kind: "solid", color: c.dark }
    const blocks: FreeBlock[] = [handlePill(brand, "dark")]

    // Stack centralizado bottom — TÍTULO (principal, editorial) + question_keyword (complemento destacado) + CTA
    const stackChildren: FreeBlock[] = []
    stackChildren.push({
      type: "text",
      position: {},
      text: content.title ?? "Pergunta",
      font: "playfair",
      font_size: autoFont(content.title ?? "", [
        [40, "min(9cqw, 2.5rem)"],
        [80, "min(7cqw, 1.9rem)"],
      ], "min(5.5cqw, 1.5rem)"),
      font_weight: 600,
      color: "#FFFFFF",
      line_height: 1.1,
      letter_spacing: "-0.02em",
      text_align: "center",
      highlights: content.highlight_words,
      text_shadow: true,
    })
    // Complemento — palavra-chave destacada com cor accent, menor que o título
    stackChildren.push({
      type: "text",
      position: {},
      text: content.question_keyword ?? "PALAVRA?",
      font: "playfair_italic",
      font_size: autoFont(content.question_keyword ?? "", [
        [12, "min(7cqw, 1.9rem)"],
        [25, "min(5.5cqw, 1.5rem)"],
      ], "min(4.5cqw, 1.2rem)"),
      font_weight: 500,
      color: c.accent,
      letter_spacing: "-0.01em",
      line_height: 1.1,
      text_align: "center",
      font_style: "italic",
      text_shadow: true,
    })
    if (content.cta_text) {
      stackChildren.push({
        type: "pill",
        position: {},
        text: content.cta_text,
        bg: "rgba(255,255,255,0.15)",
        fg: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.4)",
        font: "inter",
        font_size: "min(2.6cqw, 0.82rem)",
        font_weight: 500,
        text_transform: "uppercase",
        letter_spacing: "0.2em",
      })
    }
    blocks.push({
      type: "stack",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(3cqw, 14px)",
      align: "center",
      z: 5,
      children: stackChildren,
    })
    return { version: 1, background: bg, blocks }
  },
}

// =============================================================================
// 8. SPLIT HALF HORIZONTAL (foto top + card bottom)
// =============================================================================

const splitHalfHorizontal: SkeletonImpl = {
  meta: {
    id: "split-half-horizontal",
    name: "Foto fullbleed + card bottom",
    description:
      "Foto fullbleed com overlay escuro sutil + título sans-serif bold + body + CTA stack no rodapé.",
    vibe: "corporativo, B2B, conversão",
    needs_photo: true,
    required_slots: ["title", "body"],
    optional_slots: ["cta_text", "highlight_words"],
  },
  build: ({ brand, content, photo_url }) => {
    const c = pickColors(brand)
    const bg: FreeBackground = photo_url
      ? {
          kind: "photo",
          photo_url,
          // Gradient escuro no bottom indo a transparente no top — integra suave
          photo_overlay: {
            color: "#000000",
            opacity: 0,
            direction: "to top",
            start: 0.55,
          },
        }
      : { kind: "solid", color: c.dark }
    const blocks: FreeBlock[] = [{ ...handlePill(brand, "dark"), z: 10 }]

    // Seta menor no canto superior direito (não mais na divisão)
    blocks.push({
      type: "icon",
      position: { right: "5cqw", top: "5cqw" },
      name: "arrow-up-right",
      color: c.dark,
      size: "min(4.5cqw, 20px)",
      background: c.accent,
      padding: "min(2cqw, 10px)",
      z: 10,
    })

    // Stack: título + body + CTA no bottom — flow natural, sem sobrepor
    const stackChildren: FreeBlock[] = []
    stackChildren.push({
      type: "text",
      position: {},
      text: content.title ?? "Título",
      font: "inter_bold",
      font_size: autoFont(content.title ?? "", [
        [40, "min(8cqw, 2.2rem)"],
        [80, "min(6cqw, 1.6rem)"],
      ], "min(5cqw, 1.4rem)"),
      font_weight: 700,
      color: "#FFFFFF",
      line_height: 1.15,
      text_shadow: true,
    })
    if (content.body) {
      stackChildren.push({
        type: "text",
        position: {},
        text: content.body,
        font: "inter",
        font_size: autoFont(content.body, [
          [80, "min(2.8cqw, 0.92rem)"],
          [180, "min(2.4cqw, 0.78rem)"],
        ], "min(2.1cqw, 0.7rem)"),
        font_weight: 400,
        color: "rgba(255,255,255,0.92)",
        line_height: 1.5,
        highlights: content.highlight_words,
        text_shadow: true,
      })
    }
    if (content.cta_text) {
      stackChildren.push({
        type: "pill",
        position: {},
        text: content.cta_text,
        bg: c.accent,
        fg: c.dark,
        font: "inter",
        font_size: "min(2.7cqw, 0.85rem)",
        font_weight: 600,
      })
    }
    blocks.push({
      type: "stack",
      position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
      direction: "column",
      gap: "min(3cqw, 14px)",
      align: "start",
      z: 5,
      children: stackChildren,
    })

    return { version: 1, background: bg, blocks }
  },
}

// =============================================================================
// REGISTRY
// =============================================================================

export const SKELETONS: SkeletonImpl[] = [
  heroFullbleedBottom,
  cardCenterOnColor,
  splitTextPhoto,
  statHero,
  headlineUppercase,
  questionPhoto,
  splitHalfHorizontal,
]

export function getSkeleton(id: string): SkeletonImpl | null {
  return SKELETONS.find((s) => s.meta.id === id) ?? null
}

export function listSkeletonsForPrompt(): string {
  return SKELETONS.map(
    (s, i) =>
      `${i + 1}. id: "${s.meta.id}" | ${s.meta.name}\n   vibe: ${s.meta.vibe}\n   precisa foto: ${s.meta.needs_photo ? "sim" : "não"}\n   slots obrigatórios: ${s.meta.required_slots.join(", ")}\n   slots opcionais: ${s.meta.optional_slots.join(", ")}\n   uso: ${s.meta.description}`,
  ).join("\n\n")
}
