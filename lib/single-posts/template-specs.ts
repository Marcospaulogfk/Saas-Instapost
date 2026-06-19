/**
 * Unificação dos templates curados no sistema de "spec livre" (FreePostSpec).
 *
 * Cada template ganha um builder que devolve um FreePostSpec — assim ele
 * renderiza pelo MESMO renderizador editável dos skeletons (FreePostRenderer),
 * e o usuário pode mover / trocar fonte / mudar tamanho de QUALQUER elemento.
 *
 * Templates ainda não convertidos retornam null → o /teste cai no PostPreview
 * (layout fixo) como fallback. Conversão feita em fases.
 */
import type { PostBrand, PostContent } from "./types"
import type { FreePostSpec, FreeBlock, FreeBackground } from "./free-spec"
import { handlePill, pickColors } from "./skeletons"
import { autoTitleSize } from "@/components/single-posts/shared/autofit"

type TemplateSpecBuilder = (
  content: PostContent,
  brand: PostBrand,
  photoUrl: string | null,
) => FreePostSpec

// ── beauty-01-closeup-serif-editorial ───────────────────────────────────────
// Foto fullbleed + título serif (linha do meio italic) na metade esquerda +
// divisor accent + body. Tudo vira bloco editável.
// Deriva as linhas do título de forma robusta: title_lines (sem vazios) →
// senão quebra o title em ~3 linhas balanceadas → senão vazio.
function deriveTitleLines(content: PostContent): string[] {
  const fromLines = (content.title_lines ?? []).map((l) => (l ?? "").trim()).filter(Boolean)
  if (fromLines.length) return fromLines
  const t = (content.title ?? "").trim()
  if (!t) return []
  const words = t.split(/\s+/)
  const per = Math.max(1, Math.ceil(words.length / 3))
  const out: string[] = []
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "))
  return out
}

const buildBeauty01: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const titleLines = deriveTitleLines(content)
  const photo = photoUrl ?? content.image_url ?? null

  const bg: FreeBackground = photo
    ? {
        kind: "photo",
        photo_url: photo,
        // Escurece o lado esquerdo (onde fica o texto) pra texto branco ficar
        // legível mesmo sobre foto clara.
        photo_overlay: {
          color: "#000000",
          opacity: 0.55,
          direction: "to right",
          start: 0.5,
        },
      }
    : {
        kind: "gradient",
        gradient_from: "#2a1f18",
        gradient_to: "#5c3a2c",
        gradient_angle: 135,
      }

  // ESTRUTURA PLANA (padrão dos skeletons): título = UM bloco de texto com \n.
  // Stack de nível único com filhos-folha → auto-detach solta cada bloco
  // individualmente e todos viram editáveis (mover/fonte/tamanho) no painel.
  const outerChildren: FreeBlock[] = []
  if (titleLines.length) {
    outerChildren.push({
      type: "text",
      position: {},
      text: titleLines.join("\n"),
      font: "playfair",
      font_size: autoTitleSize(titleLines, 15, 55),
      font_weight: 500,
      color: "#FFFFFF",
      line_height: 1.05,
      letter_spacing: "-0.02em",
      text_shadow: true,
    })
  }
  outerChildren.push({
    type: "divider",
    position: { width: "min(15cqw, 60px)" },
    color: c.accent,
    thickness: 1,
  })
  if (content.body) {
    outerChildren.push({
      type: "text",
      position: {},
      text: content.body,
      font: "inter",
      font_size: "min(3cqw, 0.92rem)",
      font_weight: 400,
      color: "rgba(255,255,255,0.95)",
      line_height: 1.45,
      highlights: content.highlight_words,
      text_shadow: true,
    })
  }

  const blocks: FreeBlock[] = [
    handlePill(brand, "dark"),
    {
      type: "stack",
      position: { left: "5cqw", top: "50%", center_y: true, width: "55cqw" },
      direction: "column",
      gap: "min(4cqw, 18px)",
      align: "start",
      z: 5,
      children: outerChildren,
    },
  ]

  return { version: 1, background: bg, blocks }
}

// ── beauty-03-instagram-ui-mockup ───────────────────────────────────────────
// Foto fullbleed + título serif lateral esquerda (kicker italic + main bold +
// ✦ accent + tagline italic) + UI estilo Instagram: "Aa" + dots à direita,
// botão de captura central, abas POST/STORY/LIVE e câmera no canto. Tudo vira
// bloco folha editável (shapes/pills/text/icon).
const buildBeauty03: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null

  const kicker = content.kicker || content.title_emphasis || "Glúteo"
  const titleMain = content.title || "Sculpt"
  const tagline = content.subtitle || "mais\ncurvas"

  const bg: FreeBackground = photo
    ? {
        kind: "photo",
        photo_url: photo,
        photo_overlay: { color: "#000000", opacity: 0.45, direction: "to right", start: 0.0 },
      }
    : { kind: "gradient", gradient_from: "#4a3a30", gradient_to: "#2a1f18", gradient_angle: 135 }

  const blocks: FreeBlock[] = [handlePill(brand, "dark")]

  // Tagline da marca top-right (só se existir)
  if (brand.tagline) {
    blocks.push({
      type: "text",
      position: { top: "5.5cqw", right: "5cqw" },
      text: brand.tagline,
      font: "inter",
      font_size: "min(2cqw, 0.65rem)",
      font_weight: 500,
      color: "rgba(255,255,255,0.7)",
      letter_spacing: "0.3em",
      text_transform: "uppercase",
      text_align: "right",
      z: 5,
    })
  }

  // Bloco de título lateral esquerda (stack folha)
  const titleChildren: FreeBlock[] = [
    {
      type: "text",
      position: {},
      text: kicker,
      font: "playfair_italic",
      font_size: "min(17cqw, 4.5rem)",
      font_weight: 500,
      color: "#FFFFFF",
      line_height: 1,
      font_style: "italic",
      text_shadow: true,
    },
    {
      type: "text",
      position: {},
      text: titleMain,
      font: "playfair",
      font_size: "min(17cqw, 4.5rem)",
      font_weight: 600,
      color: "#FFFFFF",
      line_height: 1,
      text_shadow: true,
    },
    {
      type: "text",
      position: {},
      text: "✦",
      font: "playfair",
      font_size: "min(3cqw, 0.95rem)",
      color: c.accent,
    },
    {
      type: "text",
      position: {},
      text: tagline,
      font: "playfair_italic",
      font_size: "min(13cqw, 3.5rem)",
      font_weight: 400,
      color: "#FFFFFF",
      line_height: 1,
      font_style: "italic",
      text_shadow: true,
    },
  ]
  blocks.push({
    type: "stack",
    position: { left: "5cqw", top: "50%", center_y: true, width: "55cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "start",
    z: 5,
    children: titleChildren,
  })

  // UI direita: "Aa" + 3 linhas de 2 dots
  blocks.push({
    type: "text",
    position: { right: "6cqw", top: "44%", center_y: true },
    text: "Aa",
    font: "inter",
    font_size: "min(5.5cqw, 1.5rem)",
    font_weight: 600,
    color: "#FFFFFF",
    text_shadow: true,
    z: 6,
  })
  // grid de 6 dots (2 col x 3 lin)
  const dotPositions: Array<[string, string]> = [
    ["0cqw", "0cqw"],
    ["2cqw", "0cqw"],
    ["0cqw", "2cqw"],
    ["2cqw", "2cqw"],
    ["0cqw", "4cqw"],
    ["2cqw", "4cqw"],
  ]
  dotPositions.forEach(([dx, dy]) => {
    blocks.push({
      type: "shape",
      position: {
        right: `calc(5.5cqw + ${dx})`,
        top: `calc(53% + ${dy})`,
        width: "min(1.2cqw, 4px)",
        height: "min(1.2cqw, 4px)",
      },
      shape: "circle",
      color: "rgba(255,255,255,0.7)",
      z: 6,
    })
  })

  // Botão de captura central (anel + miolo)
  blocks.push({
    type: "shape",
    position: {
      left: "50%",
      center_x: true,
      bottom: "16cqw",
      width: "min(13cqw, 60px)",
      height: "min(13cqw, 60px)",
    },
    shape: "circle",
    color: "rgba(255,255,255,0.18)",
    border: "3px solid rgba(255,255,255,0.92)",
    z: 6,
  })
  blocks.push({
    type: "shape",
    position: {
      left: "50%",
      center_x: true,
      bottom: "17.5cqw",
      width: "min(10cqw, 44px)",
      height: "min(10cqw, 44px)",
    },
    shape: "circle",
    color: "#FFFFFF",
    z: 7,
  })

  // Abas POST / STORY (ativa) / LIVE
  const tabs: Array<{ label: string; active: boolean; left: string }> = [
    { label: "POST", active: false, left: "32cqw" },
    { label: "STORY", active: true, left: "50%" },
    { label: "LIVE", active: false, left: "68cqw" },
  ]
  tabs.forEach((t) => {
    blocks.push({
      type: "text",
      position: t.label === "STORY" ? { left: "50%", center_x: true, bottom: "8cqw" } : { left: t.left, bottom: "8cqw" },
      text: t.label,
      font: "inter",
      font_size: "min(2.3cqw, 0.7rem)",
      font_weight: t.active ? 700 : 500,
      color: t.active ? "#FFFFFF" : "rgba(255,255,255,0.5)",
      letter_spacing: "0.2em",
      text_shadow: true,
      z: 6,
    })
  })

  // Câmera bottom-right
  blocks.push({
    type: "icon",
    position: { right: "8cqw", bottom: "7cqw" },
    name: "camera",
    color: "#FFFFFF",
    size: "min(4.5cqw, 22px)",
    z: 6,
  })

  return { version: 1, background: bg, blocks }
}

// ── beauty-04-produto-com-elemento ──────────────────────────────────────────
// Foto fullbleed + intro italic/bold top-right + palavra-chave gigante italic
// centralizada (com divisor accent simulando o sublinhado orgânico) + PNG do
// produto inclinado top-right + footer (@handle / tagline) embaixo.
const buildBeauty04: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const productPng = content.product_image_url ?? null

  const introA = content.intro || "Um hábito simples,"
  const introB = content.intro_2 || "um resultado incrível."
  const keyword = content.title || "Colágeno"

  const bg: FreeBackground = photo
    ? { kind: "photo", photo_url: photo }
    : { kind: "gradient", gradient_from: "#f5ede3", gradient_to: "#d4b899", gradient_angle: 180 }

  const blocks: FreeBlock[] = [handlePill(brand, "dark")]

  // Intro top-right (2 linhas)
  blocks.push({
    type: "text",
    position: { top: "5cqw", right: "5cqw" },
    text: `${introA}\n${introB}`,
    font: "inter",
    font_size: "min(2.6cqw, 0.82rem)",
    font_weight: 400,
    color: "rgba(255,255,255,0.95)",
    line_height: 1.35,
    text_align: "right",
    highlights: [introB],
    text_shadow: true,
    z: 5,
  })

  // Palavra-chave gigante centro-superior
  blocks.push({
    type: "text",
    position: { top: "20%", left: "5cqw", right: "5cqw" },
    text: keyword,
    font: "playfair_italic",
    font_size: "min(22cqw, 5.8rem)",
    font_weight: 600,
    color: "#FFFFFF",
    line_height: 1,
    letter_spacing: "-0.02em",
    font_style: "italic",
    text_align: "center",
    text_shadow: true,
    z: 4,
  })
  // Sublinhado orgânico → divisor accent centralizado sob a palavra
  blocks.push({
    type: "divider",
    position: { left: "50%", center_x: true, top: "33%", width: "min(40cqw, 200px)" },
    color: c.accent,
    thickness: 4,
    z: 4,
  })

  // PNG do produto inclinado top-right (só se existir)
  if (productPng) {
    blocks.push({
      type: "image",
      position: { top: "16%", right: "8%", width: "26cqw" },
      url: productPng,
      fit: "contain",
      rotation: -5,
      shadow: true,
      z: 5,
    })
  }

  // Footer: @handle + tagline (centralizado embaixo)
  const footerChildren: FreeBlock[] = [
    {
      type: "pill",
      position: {},
      text: `@${brand.instagram_handle ?? brand.name.toLowerCase().replace(/\s/g, "")}`,
      bg: "rgba(0,0,0,0.55)",
      fg: "#FFFFFF",
      border: "1px solid rgba(255,255,255,0.12)",
      with_avatar: true,
      avatar_text: brand.monogram,
      font_size: "min(2.7cqw, 0.82rem)",
    },
  ]
  if (brand.tagline) {
    footerChildren.push({
      type: "text",
      position: {},
      text: brand.tagline,
      font: "inter",
      font_size: "min(2cqw, 0.65rem)",
      font_weight: 500,
      color: "rgba(255,255,255,0.7)",
      letter_spacing: "0.3em",
      text_transform: "uppercase",
      text_align: "center",
      text_shadow: true,
    })
  }
  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", bottom: "5cqw" },
    direction: "column",
    gap: "min(2cqw, 8px)",
    align: "center",
    justify: "center",
    z: 5,
    children: footerChildren,
  })

  return { version: 1, background: bg, blocks }
}

// ── beauty-05-frase-conceitual-centered ──────────────────────────────────────
// Foto fullbleed + overlay escuro bottom + manifesto serif italic multi-linha +
// tagline italic + @handle pill, tudo agrupado e centralizado no bottom.
// Tagline da marca opcional vertical no canto inferior esquerdo.
const buildBeauty05: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const photo = photoUrl ?? content.image_url ?? null
  const titleLines = deriveTitleLines(content)
  const manifesto = titleLines.length ? titleLines : ["Beleza é", "equilíbrio!"]
  const tagline = content.body || "confiança é consequência."

  const bg: FreeBackground = photo
    ? {
        kind: "photo",
        photo_url: photo,
        photo_overlay: { color: "#000000", opacity: 0.5, direction: "to top", start: 0.0 },
      }
    : { kind: "gradient", gradient_from: "#f0e3d6", gradient_to: "#d6b89a", gradient_angle: 180 }

  const blocks: FreeBlock[] = []

  // Tagline da marca vertical bottom-left (opcional)
  if (brand.tagline) {
    blocks.push({
      type: "text",
      position: { left: "5cqw", bottom: "5cqw" },
      text: brand.tagline,
      font: "inter",
      font_size: "min(2cqw, 0.65rem)",
      font_weight: 500,
      color: "rgba(255,255,255,0.7)",
      letter_spacing: "0.3em",
      text_transform: "uppercase",
      text_shadow: true,
      z: 6,
    })
  }

  // Grupo central bottom: manifesto + tagline + @handle pill
  const groupChildren: FreeBlock[] = [
    {
      type: "text",
      position: {},
      text: manifesto.join("\n"),
      font: "playfair_italic",
      font_size: autoTitleSize(manifesto, 16, 90),
      font_weight: 500,
      color: "#FFFFFF",
      line_height: 0.95,
      letter_spacing: "-0.02em",
      font_style: "italic",
      text_align: "center",
      text_shadow: true,
    },
    {
      type: "text",
      position: {},
      text: tagline,
      font: "inter",
      font_size: "min(3.2cqw, 0.95rem)",
      font_weight: 400,
      color: "rgba(255,255,255,0.95)",
      letter_spacing: "0.02em",
      font_style: "italic",
      text_align: "center",
      text_shadow: true,
    },
    {
      type: "pill",
      position: {},
      text: `@${brand.instagram_handle ?? brand.name.toLowerCase().replace(/\s/g, "")}`,
      bg: "rgba(0,0,0,0.55)",
      fg: "#FFFFFF",
      border: "1px solid rgba(255,255,255,0.12)",
      with_avatar: true,
      avatar_text: brand.monogram,
      font_size: "min(2.7cqw, 0.82rem)",
    },
  ]
  blocks.push({
    type: "stack",
    position: { left: "5cqw", right: "5cqw", bottom: "8cqw" },
    direction: "column",
    gap: "min(3cqw, 14px)",
    align: "center",
    justify: "center",
    z: 5,
    children: groupChildren,
  })

  return { version: 1, background: bg, blocks }
}

// ── profissional-01-retrato-titulo-bottom ───────────────────────────────────
const buildProfissional01: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const titleLines = deriveTitleLines(content)
  const photo = photoUrl ?? content.image_url ?? null
  const bg: FreeBackground = photo
    ? { kind: "photo", photo_url: photo, photo_overlay: { color: "#000000", opacity: 0.85, direction: "to top", start: 0.5 } }
    : { kind: "gradient", gradient_from: "#1a1a1a", gradient_to: "#2a2a2a", gradient_angle: 135 }
  const intros = [content.intro, content.intro_2].filter(Boolean) as string[]
  const children: FreeBlock[] = []
  if (intros.length) {
    children.push({ type: "text", position: {}, text: intros.join("\n"), font: "playfair_italic", font_size: "min(3.6cqw, 1rem)", font_weight: 400, color: "rgba(255,255,255,0.9)", line_height: 1.35, font_style: "italic", text_align: "center", text_shadow: true })
  }
  if (titleLines.length) {
    children.push({ type: "text", position: {}, text: titleLines.join("\n"), font: "anton", font_size: autoTitleSize(titleLines, 11, 90), font_weight: 800, color: "#FFFFFF", line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", text_align: "center", text_shadow: true })
  }
  children.push({ type: "divider", position: { width: "min(20cqw, 80px)" }, color: c.accent, thickness: 2 })
  const blocks: FreeBlock[] = [
    handlePill(brand, "dark"),
    { type: "stack", position: { left: "5cqw", right: "5cqw", bottom: "10cqw" }, direction: "column", gap: "min(3.5cqw, 16px)", align: "center", z: 5, children },
  ]
  return { version: 1, background: bg, blocks }
}

// ── profissional-02-retrato-card-cta ────────────────────────────────────────
const buildProfissional02: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const phone = content.contact_phone ?? brand.phone
  const website = content.contact_website ?? brand.website
  const bg: FreeBackground = { kind: "solid", color: c.surface }
  const blocks: FreeBlock[] = [handlePill(brand, "light")]
  if (photo) {
    blocks.push({ type: "image", position: { top: 0, right: 0, bottom: 0, width: "42cqw" }, url: photo, fit: "cover", z: 0 })
  }
  const children: FreeBlock[] = []
  if (content.title) {
    children.push({ type: "text", position: {}, text: content.title, font: "playfair", font_size: "min(10cqw, 2.6rem)", font_weight: 600, color: c.dark, line_height: 1.05, letter_spacing: "-0.01em" })
  }
  if (content.body) {
    children.push({ type: "text", position: {}, text: content.body, font: "inter", font_size: "min(3.2cqw, 0.92rem)", font_weight: 400, color: "rgba(0,0,0,0.55)", line_height: 1.5 })
  }
  if (content.cta_text) {
    children.push({ type: "pill", position: {}, text: content.cta_text, bg: c.dark, fg: "#FFFFFF", font: "inter", font_size: "min(2.8cqw, 0.82rem)", font_weight: 500 })
  }
  blocks.push({ type: "stack", position: { left: "5cqw", top: "50%", center_y: true, width: "50cqw" }, direction: "column", gap: "min(3cqw, 14px)", align: "start", z: 5, children })
  const footerLines = [phone, website].filter(Boolean) as string[]
  if (footerLines.length) {
    blocks.push({ type: "text", position: { left: "5cqw", bottom: "5cqw", width: "50cqw" }, text: footerLines.join("\n"), font: "inter", font_size: "min(2.2cqw, 0.65rem)", font_weight: 400, color: "rgba(0,0,0,0.55)", line_height: 1.4, letter_spacing: "0.1em", text_transform: "uppercase", z: 5 })
  }
  return { version: 1, background: bg, blocks }
}

// ── profissional-03-pergunta-provocativa ────────────────────────────────────
const buildProfissional03: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const titleLines = deriveTitleLines(content)
  const photo = photoUrl ?? content.image_url ?? null
  const bg: FreeBackground = photo
    ? { kind: "photo", photo_url: photo, photo_overlay: { color: "#000000", opacity: 0.85, direction: "to top", start: 0.35 } }
    : { kind: "gradient", gradient_from: "#0a0a0a", gradient_to: "#3a3a3a", gradient_angle: 0 }
  const children: FreeBlock[] = [handlePill(brand, "dark")]
  if (titleLines.length) {
    children.push({ type: "text", position: {}, text: titleLines.join("\n"), font: "anton", font_size: autoTitleSize(titleLines, 13, 90), font_weight: 800, color: "#FFFFFF", line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", text_align: "center", highlights: content.strikethrough_word ? [content.strikethrough_word] : undefined, text_shadow: true })
  }
  const blocks: FreeBlock[] = [
    { type: "stack", position: { left: "5cqw", right: "5cqw", bottom: "10cqw" }, direction: "column", gap: "min(2.5cqw, 12px)", align: "center", z: 10, children },
  ]
  return { version: 1, background: bg, blocks }
}

// ── profissional-04-frase-educativa-moldura ─────────────────────────────────
const buildProfissional04: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const title = content.title ?? ""
  const bg: FreeBackground = { kind: "solid", color: c.dark }
  const blocks: FreeBlock[] = []
  if (photo) {
    blocks.push({ type: "image", position: { top: 0, right: 0, bottom: 0, width: "55cqw" }, url: photo, fit: "cover", mask_fade: "left", z: 0 })
  }
  const children: FreeBlock[] = []
  if (title) {
    children.push({ type: "text", position: {}, text: title, font: "playfair_italic", font_size: "min(7cqw, 1.85rem)", font_weight: 400, color: "#FFFFFF", line_height: 1.3, font_style: "italic", highlights: content.highlight_words, text_shadow: true })
  }
  if (content.framed_word) {
    children.push({ type: "pill", position: {}, text: content.framed_word, bg: "transparent", fg: "#FFFFFF", font: "playfair_italic", font_size: "min(7cqw, 1.85rem)", border: `1px solid ${c.accent}` })
  }
  blocks.push({ type: "stack", position: { left: "5cqw", top: "50%", center_y: true, width: "50cqw" }, direction: "column", gap: "min(2cqw, 10px)", align: "start", z: 5, children })
  blocks.push(handlePill(brand, "dark"))
  return { version: 1, background: bg, blocks }
}

// ── comercial-01-split-color-product ────────────────────────────────────────
const buildComercial01: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const titleLines = deriveTitleLines(content)
  const brandColor = c.dark === c.accent ? c.dark : c.accent
  const blocks: FreeBlock[] = [handlePill(brand, "dark")]
  if (photo) {
    blocks.push({ type: "image", position: { top: 0, left: 0, width: "100%", height: "60%" }, url: photo, fit: "cover", z: 0 })
  } else {
    blocks.push({ type: "shape", position: { top: 0, left: 0, width: "100%", height: "60%" }, shape: "rectangle", color: "#2a2a2a", z: 0 })
  }
  blocks.push({ type: "shape", position: { bottom: 0, left: 0, width: "100%", height: "40%" }, shape: "rectangle", color: brandColor, z: 1 })
  blocks.push({ type: "icon", position: { top: "5cqw", right: "5cqw" }, name: "arrow-up-right", color: "#FFFFFF", size: "min(4cqw,20px)", background: "rgba(0,0,0,0.4)", padding: "min(2cqw,8px)", z: 5 })
  if (titleLines.length) {
    blocks.push({ type: "text", position: { left: "5cqw", right: "5cqw", bottom: "20cqw" }, text: titleLines.join("\n"), font: "anton", font_size: "min(13cqw,3.5rem)", font_weight: 800, color: "#FFFFFF", line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", highlights: content.highlight_words, z: 5 })
  }
  if (content.subtitle) {
    blocks.push({ type: "text", position: { left: "5cqw", right: "5cqw", bottom: "11cqw" }, text: content.subtitle, font: "inter", font_size: "min(2.6cqw,0.82rem)", font_weight: 500, color: "rgba(255,255,255,0.85)", letter_spacing: "0.1em", text_transform: "uppercase", z: 5 })
  }
  return { version: 1, background: { kind: "solid", color: brandColor }, blocks }
}

// ── comercial-02-produto-isolado-clean ──────────────────────────────────────
const buildComercial02: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const titleLines = deriveTitleLines(content)
  const productPng = content.product_image_url ?? null
  const blocks: FreeBlock[] = [handlePill(brand, "light")]
  blocks.push({ type: "icon", position: { top: "5cqw", right: "5cqw" }, name: "arrow-up-right", color: c.dark, size: "min(4cqw,20px)", background: "rgba(0,0,0,0.04)", padding: "min(2cqw,8px)", z: 5 })
  if (titleLines.length) {
    blocks.push({ type: "text", position: { top: "16cqw", left: "5cqw", right: "5cqw" }, text: titleLines.join("\n"), font: "anton", font_size: "min(11.5cqw,3.1rem)", font_weight: 800, color: c.dark, line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", highlights: content.highlight_words, z: 5 })
  }
  if (content.body) {
    blocks.push({ type: "text", position: { top: "40cqw", left: "5cqw", right: "5cqw" }, text: content.body, font: "inter", font_size: "min(2.4cqw,0.78rem)", font_weight: 500, color: "rgba(0,0,0,0.5)", letter_spacing: "0.1em", text_transform: "uppercase", z: 5 })
  }
  if (productPng) {
    blocks.push({ type: "image", position: { left: "12%", right: "12%", top: "48%", bottom: "16cqw" }, url: productPng, fit: "contain", rotation: -3, shadow: true, z: 2 })
  }
  blocks.push({ type: "icon", position: { right: "8cqw", top: "55%", center_y: true }, name: "star", color: c.dark, size: "min(4cqw,18px)", background: c.accent, padding: "min(4.5cqw,19px)", z: 6 })
  if (content.contact_website) {
    blocks.push({ type: "text", position: { left: "5cqw", right: "5cqw", bottom: "5cqw" }, text: content.contact_website, font: "inter", font_size: "min(2.2cqw,0.7rem)", font_weight: 500, color: "rgba(0,0,0,0.5)", letter_spacing: "0.15em", text_transform: "uppercase", text_align: "right", z: 5 })
  }
  return { version: 1, background: { kind: "gradient", gradient_from: "#FFFFFF", gradient_to: c.surface, gradient_angle: 135 }, blocks }
}

// ── comercial-03-equipe-card-lateral ────────────────────────────────────────
const buildComercial03: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const titleLines = deriveTitleLines(content)
  const bgColor = c.accent === "#D4A574" || c.accent === "#C9A572" ? c.dark : c.accent
  const blocks: FreeBlock[] = [handlePill(brand, "dark")]
  if (photo) {
    blocks.push({ type: "image", position: { top: "10%", left: "30%", right: 0, width: "70%", height: "60%" }, url: photo, fit: "cover", z: 0 })
  }
  if (content.contact_website) {
    blocks.push({ type: "text", position: { top: "5cqw", left: "5cqw", right: "5cqw" }, text: content.contact_website, font: "inter", font_size: "min(2.6cqw,0.82rem)", font_weight: 500, color: "rgba(255,255,255,0.95)", letter_spacing: "0.15em", text_transform: "uppercase", text_align: "center", z: 5 })
  }
  const leftChildren: FreeBlock[] = []
  if (titleLines.length) {
    leftChildren.push({ type: "text", position: {}, text: titleLines.join("\n"), font: "anton", font_size: "min(9.5cqw,2.5rem)", font_weight: 800, color: "#FFFFFF", line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase" })
  }
  blocks.push({ type: "stack", position: { left: "5cqw", width: "55%", bottom: "13cqw" }, direction: "column", gap: "15px", align: "start", z: 6, children: leftChildren })
  const cardChildren: FreeBlock[] = []
  if (content.body) {
    cardChildren.push({ type: "text", position: {}, text: content.body, font: "inter", font_size: "min(2.6cqw,0.82rem)", font_weight: 500, color: c.dark, line_height: 1.45 })
  }
  if (content.cta_text) {
    cardChildren.push({ type: "pill", position: {}, text: content.cta_text + " →", bg: c.dark, fg: c.accent, font: "inter", font_size: "min(2.4cqw,0.78rem)", font_weight: 600 })
  }
  blocks.push({ type: "stack", position: { left: "5cqw", width: "55%", bottom: "5cqw" }, direction: "column", gap: "min(3cqw,14px)", align: "start", bg: c.surface, radius: "min(4cqw,16px)", padding: "min(4cqw,18px)", z: 6, children: cardChildren })
  return { version: 1, background: { kind: "solid", color: bgColor }, ghost: { text: content.ghost_word ?? "EQUIPE", color: "rgba(255,255,255,0.07)", font_size: "min(50cqw,14rem)", font: "anton", anchor: "top" }, blocks }
}

// ── comercial-04-numero-grande-retrato ──────────────────────────────────────
const buildComercial04: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const bg = c.accent === "#D4A574" || c.accent === "#C9A572" ? c.dark : c.accent
  const kicker = content.kicker ?? "VIGILÂNCIA"
  const stat = content.stat_value ?? "24H"
  const description = content.body ?? "Segurança sem\ninterrupções, 24/7"
  const ctaText = content.cta_text ?? "Fale conosco"
  const blocks: FreeBlock[] = [handlePill(brand, "dark")]
  if (photo) {
    blocks.push({ type: "image", position: { top: "20%", right: 0, width: "55%", height: "65%" }, url: photo, fit: "cover", mask_fade: "left", z: 2 })
  }
  if (content.contact_website) {
    blocks.push({ type: "text", position: { top: "5cqw", left: "5cqw", right: "5cqw" }, text: content.contact_website, font: "inter", font_size: "min(2.6cqw,0.82rem)", font_weight: 500, color: "rgba(255,255,255,0.95)", letter_spacing: "0.15em", text_transform: "uppercase", text_align: "center", z: 5 })
  }
  const mainChildren: FreeBlock[] = [
    { type: "text", position: {}, text: kicker, font: "anton", font_size: "min(8cqw,2.1rem)", font_weight: 800, color: "#FFFFFF", line_height: 1, letter_spacing: "-0.01em", text_transform: "uppercase" },
    { type: "text", position: {}, text: stat, font: "anton", font_size: "min(28cqw,7.5rem)", font_weight: 900, color: "#FFFFFF", line_height: 0.9, letter_spacing: "-0.04em", text_transform: "uppercase" },
    { type: "text", position: {}, text: description, font: "inter", font_size: "min(3cqw,0.95rem)", font_weight: 400, color: "rgba(255,255,255,0.92)", line_height: 1.4 },
    { type: "pill", position: {}, text: ctaText, bg: c.surface, fg: c.dark, font: "inter", font_size: "min(2.6cqw,0.85rem)", font_weight: 600 },
  ]
  blocks.push({ type: "stack", position: { top: "14cqw", left: "5cqw", width: "55%" }, direction: "column", gap: "15px", align: "start", z: 5, children: mainChildren })
  return { version: 1, background: { kind: "solid", color: bg }, blocks }
}

// ── fitness-01-resultados-grid ──────────────────────────────────────────────
const buildFitness01: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const titleLines = content.title_lines ?? deriveTitleLines(content)
  const photo1 = photoUrl ?? content.image_url ?? null
  const photo2 = content.image_2_url ?? null
  const photo3 = content.image_3_url ?? null
  const blocks: FreeBlock[] = [handlePill(brand, "light")]
  if (titleLines.length) {
    blocks.push({ type: "text", position: { left: "5cqw", right: "5cqw", top: "15cqw", width: "90cqw" }, text: titleLines.join("\n"), font: "anton", font_size: autoTitleSize(titleLines, 10, 90), font_weight: 800, color: c.dark, line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", outline_word: content.outline_word, z: 4 })
  }
  if (content.body) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "38cqw", width: "76cqw" }, text: content.body, font: "inter", font_size: "min(2.8cqw, 0.92rem)", font_weight: 400, color: c.dark, line_height: 1.45, z: 4 })
  }
  blocks.push({ type: "shape", position: { left: "5cqw", right: "5cqw", top: "52%", height: "26%" }, shape: "rounded", color: c.dark, radius: 18, z: 2 })
  const gridPhotos = [photo1, photo2, photo3]
  const lefts = ["7cqw", "36.35cqw", "65.7cqw"]
  gridPhotos.forEach((url, i) => {
    if (!url) return
    blocks.push({ type: "image", position: { left: lefts[i], top: "calc(52% + min(2cqw,10px))", width: "27.3cqw", height: "calc(26% - min(4cqw,20px))" }, url, fit: "cover", border_radius: 12, z: 3 })
  })
  blocks.push({ type: "stack", position: { left: "5cqw", right: "5cqw", bottom: "11cqw" }, direction: "column", gap: "min(0.5cqw,2px)", align: "start", bg: c.dark, radius: 999, padding: "min(2.5cqw,12px) min(5cqw,22px)", z: 4, children: [
    { type: "text", position: {}, text: content.cta_text ?? "Inicie seu programa hoje", font: "inter", font_size: "min(2cqw, 0.65rem)", font_weight: 400, color: "rgba(255,255,255,0.65)" },
    { type: "text", position: {}, text: "inscreva-se e veja a transformação", font: "inter", font_size: "min(2.6cqw, 0.85rem)", font_weight: 600, color: "#FFFFFF" },
  ] })
  return { version: 1, background: { kind: "solid", color: c.accent }, blocks }
}

// ── fitness-02-promocional-retrato ──────────────────────────────────────────
const buildFitness02: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const intro = content.intro ?? "Mês da\nTransformação:"
  const titleLines = content.title_lines ?? deriveTitleLines(content)
  const blocks: FreeBlock[] = [handlePill(brand, "light")]
  blocks.push({ type: "shape", position: { right: "-20%", top: "10%", width: "70%", height: "70%" }, shape: "blob", color: "#000000", opacity: 0.1, rotation: -15, z: 1 })
  if (photo) {
    blocks.push({ type: "image", position: { right: "0%", top: "16%", width: "48%", height: "76%" }, url: photo, fit: "cover", z: 3 })
  }
  if (intro) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "16cqw", width: "45%" }, text: intro, font: "inter", font_size: "min(4.5cqw, 1.3rem)", font_weight: 500, color: c.dark, line_height: 1.15, z: 4 })
  }
  if (titleLines.length) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "27cqw", width: "45%" }, text: titleLines.join("\n"), font: "anton", font_size: "min(10cqw, 2.7rem)", font_weight: 800, color: c.dark, line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", z: 4 })
  }
  if (content.body) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "55cqw", width: "43%" }, text: content.body, font: "inter", font_size: "min(2.6cqw, 0.85rem)", font_weight: 400, color: c.dark, line_height: 1.5, z: 4 })
  }
  return { version: 1, background: { kind: "solid", color: c.accent }, blocks }
}

// ── fitness-03-desafio-com-selo ─────────────────────────────────────────────
const buildFitness03: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const titleLines = content.title_lines ?? deriveTitleLines(content)
  const badgeLabel = content.badge_label ?? "GARANTIA"
  const blocks: FreeBlock[] = [handlePill(brand, "dark")]
  if (photo) {
    blocks.push({ type: "image", position: { right: "0%", top: "0%", width: "42%", height: "100%" }, url: photo, fit: "cover", z: 2 })
  }
  if (titleLines.length) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "22cqw", width: "48%" }, text: titleLines.join("\n"), font: "anton", font_size: "min(8.5cqw, 2.3rem)", font_weight: 800, color: c.dark, line_height: 0.95, letter_spacing: "-0.01em", text_transform: "uppercase", outline_word: content.outline_word, z: 4 })
  }
  if (content.body) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "48cqw", width: "46%" }, text: content.body, font: "inter", font_size: "min(2.8cqw, 0.92rem)", font_weight: 400, color: c.dark, line_height: 1.5, z: 4 })
  }
  blocks.push({ type: "stack", position: { left: "5cqw", bottom: "13cqw", width: "min(15cqw,64px)", height: "min(15cqw,64px)" }, direction: "column", gap: "min(0.3cqw,1px)", align: "center", justify: "center", bg: c.dark, radius: 999, z: 5, children: [
    { type: "icon", position: {}, name: "check-circle", color: c.accent, size: "min(5.5cqw, 24px)" },
    { type: "text", position: {}, text: badgeLabel, font: "inter", font_size: "min(1.4cqw, 0.48rem)", font_weight: 700, color: c.accent, letter_spacing: "0.1em" },
  ] })
  return { version: 1, background: { kind: "solid", color: c.accent }, ...(content.ghost_word ? { ghost: { text: content.ghost_word, color: "rgba(0,0,0,0.08)", font_size: "min(40cqw,12rem)", font: "anton" as const, anchor: "left-vertical" as const } } : {}), blocks }
}

// ── fitness-04-institucional-fotos-espaco ───────────────────────────────────
const buildFitness04: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const intro = content.kicker ?? "VEM SER"
  const headline = content.title_lines?.join("\n") ?? content.title ?? "ESPAÇO\nFITNESS"
  const ctaPrimary = content.cta_text ?? "Saiba mais"
  const ctaHighlight = content.title_emphasis ?? ""
  const photo1 = photoUrl ?? content.image_url ?? null
  const photo2 = content.image_2_url ?? null
  const blocks: FreeBlock[] = [handlePill(brand, "light")]
  blocks.push({ type: "text", position: { left: "5cqw", top: "16cqw", width: "48%" }, text: intro, font: "anton", font_size: "min(5.5cqw, 1.5rem)", font_weight: 700, color: c.dark, line_height: 1, letter_spacing: "0.02em", text_transform: "uppercase", z: 4 })
  blocks.push({ type: "text", position: { left: "5cqw", top: "24cqw", width: "48%" }, text: headline, font: "anton", font_size: "min(11cqw, 3rem)", font_weight: 800, color: c.dark, line_height: 0.92, letter_spacing: "-0.01em", text_transform: "uppercase", z: 4 })
  if (content.body) {
    blocks.push({ type: "text", position: { left: "5cqw", top: "48cqw", width: "44%" }, text: content.body, font: "inter", font_size: "min(2.6cqw, 0.85rem)", font_weight: 400, color: c.dark, line_height: 1.5, z: 4 })
  }
  if (photo1) {
    blocks.push({ type: "image", position: { right: "5cqw", top: "16cqw", width: "40%", height: "24%" }, url: photo1, fit: "cover", border_radius: 14, z: 3 })
    blocks.push({ type: "shape", position: { right: "5cqw", top: "16cqw", width: "40%", height: "24%" }, shape: "rounded", color: "#000000", opacity: 0.18, radius: 14, z: 3 })
  }
  if (photo2) {
    blocks.push({ type: "image", position: { right: "5cqw", top: "calc(16cqw + 24% + min(2.5cqw,12px))", width: "40%", height: "24%" }, url: photo2, fit: "cover", border_radius: 14, z: 3 })
  }
  blocks.push({ type: "stack", position: { left: "5cqw", bottom: "20cqw" }, direction: "row", gap: "min(2cqw,10px)", align: "center", justify: "start", bg: c.dark, radius: 999, padding: "min(2.5cqw,12px) min(5cqw,22px)", z: 5, children: [
    { type: "icon", position: {}, name: "arrow-down-right", color: c.accent, size: "min(4cqw, 18px)" },
    { type: "text", position: {}, text: ctaPrimary, font: "inter", font_size: "min(2.6cqw, 0.85rem)", font_weight: 600, color: "#FFFFFF" },
    ...(ctaHighlight ? [{ type: "text" as const, position: {}, text: ctaHighlight, font: "inter" as const, font_size: "min(2.6cqw, 0.85rem)", font_weight: 700, color: c.accent }] : []),
  ] })
  return { version: 1, background: { kind: "solid", color: c.accent }, blocks }
}

// ── informativo-01-alerta-card-buttons ──────────────────────────────────────
const buildInformativo01: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const ghostText = (content.ghost_word || content.title || "AVISO").toUpperCase()
  const title = content.title || "ATENÇÃO"
  const ctaPrimary = content.cta_text || "Saiba Mais"
  const bgColor = (c.accent === "#D4A574" || c.accent === "#C9A572") ? c.dark : c.accent
  const cardChildren: FreeBlock[] = []
  cardChildren.push({ type: "icon", position: {}, name: "alert-triangle", color: c.dark, size: "min(10cqw,44px)" })
  cardChildren.push({ type: "text", position: {}, text: title, font: "anton", font_size: "min(13cqw,3.5rem)", font_weight: 800, color: c.dark, line_height: 1, letter_spacing: "-0.01em", text_align: "center", text_transform: "uppercase" })
  if (content.body) cardChildren.push({ type: "text", position: {}, text: content.body, font: "inter", font_size: "min(2.6cqw,0.85rem)", font_weight: 400, color: c.dark, line_height: 1.5, text_align: "center" })
  if (content.cta_secondary) cardChildren.push({ type: "pill", position: {}, text: content.cta_secondary, bg: "transparent", fg: c.dark, font: "inter", font_size: "min(2.6cqw,0.85rem)", font_weight: 500, border: `1px solid ${c.dark}` })
  cardChildren.push({ type: "pill", position: {}, text: ctaPrimary, bg: bgColor, fg: "#FFFFFF", font: "inter", font_size: "min(2.6cqw,0.85rem)", font_weight: 600 })
  if (content.subtitle) cardChildren.push({ type: "text", position: {}, text: content.subtitle, font: "inter", font_size: "min(2.4cqw,0.78rem)", font_weight: 500, color: c.dark, line_height: 1.4, text_align: "center" })
  const blocks: FreeBlock[] = [
    handlePill(brand, "dark"),
    ...(content.contact_website ? [{ type: "text", position: { top: "5cqw", left: "5cqw" }, text: content.contact_website, font: "inter", font_size: "min(2.6cqw,0.82rem)", font_weight: 500, color: "rgba(255,255,255,0.95)", letter_spacing: "0.1em", z: 5 } as FreeBlock] : []),
    { type: "icon", position: { top: "5cqw", right: "5cqw" }, name: "arrow-up-right", color: "#FFFFFF", size: "min(3.5cqw,16px)", background: "rgba(255,255,255,0.15)", padding: "min(1.75cqw,8px)", z: 5 },
    { type: "stack", position: { left: "5cqw", right: "5cqw", top: "50%", center_y: true }, direction: "column", gap: "min(3cqw,14px)", align: "center", bg: c.surface, radius: "24px", padding: "min(6cqw,28px)", shadow: true, z: 4, children: cardChildren },
  ]
  return { version: 1, background: { kind: "solid", color: bgColor }, ghost: { text: ghostText, color: "rgba(255,255,255,0.06)", font_size: "min(50cqw,14rem)", font: "anton", anchor: "top" }, blocks }
}

// ── informativo-02-case-storytelling ────────────────────────────────────────
const buildInformativo02: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const ghostText = (content.ghost_word || "REAL").toUpperCase()
  const kicker = content.kicker || "TRANSFORMAÇÃO REAL:"
  const title = content.title || "Conheça a história"
  const cardChildren: FreeBlock[] = []
  cardChildren.push({ type: "text", position: {}, text: kicker, font: "anton", font_size: "min(8cqw,2.2rem)", font_weight: 800, color: c.accent, line_height: 1, letter_spacing: "0.02em", text_transform: "uppercase" })
  cardChildren.push({ type: "text", position: {}, text: title, font: "inter", font_size: "min(4.5cqw,1.3rem)", font_weight: 400, color: "#FFFFFF", line_height: 1.3, highlights: content.highlight_words })
  if (content.body) {
    cardChildren.push({ type: "divider", position: { width: "min(15cqw,60px)" }, color: "rgba(255,255,255,0.25)", thickness: 2 })
    cardChildren.push({ type: "text", position: {}, text: content.body, font: "inter", font_size: "min(2.8cqw,0.92rem)", font_weight: 400, color: "rgba(255,255,255,0.88)", line_height: 1.5 })
  }
  const blocks: FreeBlock[] = [
    handlePill(brand, "light"),
    { type: "text", position: { top: "5cqw", left: "5cqw" }, text: brand.name, font: "inter_bold", font_size: "min(3.2cqw,1rem)", font_weight: 700, color: c.dark, z: 5 },
    { type: "stack", position: { left: "5cqw", right: "5cqw", top: "50%", center_y: true }, direction: "column", gap: "min(2cqw,10px)", align: "start", bg: c.dark, radius: "24px", padding: "min(6cqw,28px)", z: 4, children: cardChildren },
    { type: "icon", position: { left: "5cqw", bottom: "13cqw" }, name: "star", color: c.accent, size: "min(5cqw,22px)", background: c.dark, padding: "min(3cqw,13px)", z: 5 },
  ]
  if (brand.tagline) blocks.push({ type: "text", position: { right: "5cqw", bottom: "4cqw" }, text: brand.tagline, font: "inter", font_size: "min(1.9cqw,0.62rem)", font_weight: 400, color: c.dark, text_transform: "uppercase", letter_spacing: "0.15em", z: 5 })
  return { version: 1, background: { kind: "solid", color: c.accent }, ghost: { text: ghostText, color: "rgba(0,0,0,0.08)", font_size: "min(45cqw,13rem)", font: "anton", anchor: "left-vertical" }, blocks }
}

// ── informativo-03-vagas-requisitos ─────────────────────────────────────────
const buildInformativo03: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const titleLines = content.title_lines || (content.title ? content.title.split("\n") : ["VAGAS", "ABERTAS"])
  const cargo = content.kicker || "Profissional"
  const checklist = content.checklist || content.pill_lines || ["Experiência comprovada", "Boa comunicação", "Disponibilidade horária"]
  const reqText = checklist.slice(0, 5).map((i) => `✓  ${i}`).join("\n")
  const leftChildren: FreeBlock[] = []
  leftChildren.push({ type: "text", position: {}, text: titleLines.join("\n"), font: "anton", font_size: autoTitleSize(titleLines, 15, 55), font_weight: 800, color: c.accent, line_height: 0.92, letter_spacing: "-0.01em", text_transform: "uppercase" })
  leftChildren.push({ type: "pill", position: {}, text: cargo, bg: "rgba(255,255,255,0.1)", fg: "#FFFFFF", font: "inter", font_size: "min(2.6cqw,0.85rem)", font_weight: 500, border: "1px solid rgba(255,255,255,0.15)" })
  leftChildren.push({ type: "text", position: {}, text: "REQUISITOS:", font: "inter", font_size: "min(2.4cqw,0.78rem)", font_weight: 700, color: c.accent, letter_spacing: "0.1em", text_transform: "uppercase" })
  leftChildren.push({ type: "text", position: {}, text: reqText, font: "inter", font_size: "min(2.6cqw,0.85rem)", font_weight: 400, color: "rgba(255,255,255,0.9)", line_height: 1.7 })
  const blocks: FreeBlock[] = [
    handlePill(brand, "dark"),
    { type: "text", position: { top: "5cqw", left: "5cqw" }, text: brand.name, font: "inter_bold", font_size: "min(3.2cqw,1rem)", font_weight: 700, color: "#FFFFFF", z: 5 },
  ]
  if (photo) blocks.push({ type: "image", position: { top: "12%", right: 0, width: "44%", height: "78%" }, url: photo, fit: "cover", z: 0 })
  blocks.push({ type: "stack", position: { left: "5cqw", top: "16cqw", width: "55%" }, direction: "column", gap: "min(3cqw,14px)", align: "start", z: 4, children: leftChildren })
  if (content.contact_email) {
    blocks.push({ type: "text", position: { left: "5cqw", bottom: "15cqw" }, text: "Envie seu currículo:", font: "inter", font_size: "min(2.4cqw,0.78rem)", font_weight: 500, color: "rgba(255,255,255,0.7)", z: 5 })
    blocks.push({ type: "pill", position: { left: "5cqw", bottom: "12cqw" }, text: content.contact_email, bg: "transparent", fg: c.accent, font: "inter", font_size: "min(3cqw,0.95rem)", font_weight: 600, z: 5 })
  }
  return { version: 1, background: { kind: "solid", color: c.dark }, blocks }
}

// ── empresa-03-cta-seta-grande ──────────────────────────────────────────────
const buildEmpresa03: TemplateSpecBuilder = (content, brand, photoUrl) => {
  const c = pickColors(brand)
  const photo = photoUrl ?? content.image_url ?? null
  const ctaBg = "#0A0A0A"
  const cardChildren: FreeBlock[] = []
  cardChildren.push({ type: "text", position: {}, text: content.title || "Formalize seu negócio\ncom segurança!", font: "inter_bold", font_size: "min(8.5cqw,2.2rem)", font_weight: 700, color: "#FFFFFF", line_height: 1.15 })
  if (content.body) cardChildren.push({ type: "text", position: {}, text: content.body, font: "inter", font_size: "min(2.8cqw,0.92rem)", font_weight: 400, color: "rgba(255,255,255,0.85)", line_height: 1.5, highlights: content.highlight_words })
  if (content.cta_text) cardChildren.push({ type: "pill", position: {}, text: content.cta_text, bg: ctaBg, fg: c.accent, font: "inter", font_size: "min(2.8cqw,0.92rem)", font_weight: 600 })
  const blocks: FreeBlock[] = [handlePill(brand, "dark")]
  if (photo) blocks.push({ type: "image", position: { top: "0", left: "0", right: "0", height: "50%", width: "100%" }, url: photo, fit: "cover", z: 0 })
  else blocks.push({ type: "shape", position: { top: "0", left: "0", right: "0", height: "50%" }, shape: "rectangle", color: "#2a2a2a", z: 0 })
  blocks.push({ type: "shape", position: { bottom: "0", left: "0", right: "0", height: "50%" }, shape: "rectangle", color: c.dark, z: 1 })
  blocks.push({ type: "text", position: { top: "5cqw", right: "5cqw" }, text: (brand.profession || "serviços").toLowerCase(), font: "inter", font_size: "min(2.4cqw,0.78rem)", font_weight: 500, color: "#FFFFFF", letter_spacing: "0.1em", z: 5 })
  blocks.push({ type: "icon", position: { right: "8cqw", top: "50%", center_y: true }, name: "arrow-down-right", color: c.dark, size: "min(10cqw,40px)", background: c.accent, padding: "min(5cqw,22px)", z: 6 })
  blocks.push({ type: "stack", position: { left: "5cqw", right: "5cqw", bottom: "10cqw" }, direction: "column", gap: "min(3.5cqw,15px)", align: "start", z: 5, children: cardChildren })
  return { version: 1, background: { kind: "solid", color: "#18181b" }, blocks }
}

// Registry: templateId → builder. Adicionar conforme converte cada template.
export const TEMPLATE_SPEC_BUILDERS: Record<string, TemplateSpecBuilder> = {
  "profissional-01-retrato-titulo-bottom": buildProfissional01,
  "profissional-02-retrato-card-cta": buildProfissional02,
  "profissional-03-pergunta-provocativa": buildProfissional03,
  "profissional-04-frase-educativa-moldura": buildProfissional04,
  "beauty-01-closeup-serif-editorial": buildBeauty01,
  "beauty-03-instagram-ui-mockup": buildBeauty03,
  "beauty-04-produto-com-elemento": buildBeauty04,
  "beauty-05-frase-conceitual-centered": buildBeauty05,
  "comercial-01-split-color-product": buildComercial01,
  "comercial-02-produto-isolado-clean": buildComercial02,
  "comercial-03-equipe-card-lateral": buildComercial03,
  "comercial-04-numero-grande-retrato": buildComercial04,
  "empresa-03-cta-seta-grande": buildEmpresa03,
  "fitness-01-resultados-grid": buildFitness01,
  "fitness-02-promocional-retrato": buildFitness02,
  "fitness-03-desafio-com-selo": buildFitness03,
  "fitness-04-institucional-fotos-espaco": buildFitness04,
  "informativo-01-alerta-card-buttons": buildInformativo01,
  "informativo-02-case-storytelling": buildInformativo02,
  "informativo-03-vagas-requisitos": buildInformativo03,
}

/** Devolve um FreePostSpec editável pro template, ou null se ainda não convertido. */
export function buildTemplateSpec(
  templateId: string,
  content: PostContent,
  brand: PostBrand,
  photoUrl: string | null,
): FreePostSpec | null {
  const builder = TEMPLATE_SPEC_BUILDERS[templateId]
  return builder ? builder(content, brand, photoUrl) : null
}
