/**
 * Criação de blocos novos no canvas do post único.
 *
 * O vocabulário do FreePostSpec (text / image / shape / …) e o renderizador já
 * suportavam esses blocos — o que faltava era o usuário conseguir ADICIONAR um.
 * Equivalente ao "Adicionar ao canvas" do concorrente, com uma diferença: aqui
 * o texto gerado também é editável, então adicionar é complemento e não a
 * única forma de mexer no post.
 *
 * Todo bloco novo nasce centrado horizontalmente e num z alto (fica por cima),
 * pronto pra ser arrastado.
 */
import type {
  FreeBlock,
  FreeImageBlock,
  FreePostSpec,
  FreeShapeBlock,
  FreeTextBlock,
} from "./free-spec"

/** z acima do conteúdo gerado, pra o bloco novo nascer visível e clicável. */
const TOP_Z = 50

/** Estilos de texto oferecidos ao adicionar (espelha a hierarquia dos skeletons). */
export type TextStyleId = "title" | "subtitle" | "body" | "caption"

interface TextStylePreset {
  id: TextStyleId
  label: string
  font: FreeTextBlock["font"]
  font_size: string
  font_weight: number
  text_transform?: FreeTextBlock["text_transform"]
}

export const TEXT_STYLES: TextStylePreset[] = [
  {
    id: "title",
    label: "Título",
    font: "anton",
    font_size: "min(11cqw, 3rem)",
    font_weight: 700,
    text_transform: "uppercase",
  },
  {
    id: "subtitle",
    label: "Subtítulo",
    font: "playfair_italic",
    font_size: "min(6cqw, 1.6rem)",
    font_weight: 500,
  },
  {
    id: "body",
    label: "Corpo",
    font: "inter",
    font_size: "min(4cqw, 1.05rem)",
    font_weight: 400,
  },
  {
    id: "caption",
    label: "Legenda",
    font: "inter",
    font_size: "min(3cqw, 0.8rem)",
    font_weight: 500,
    text_transform: "uppercase",
  },
]

/**
 * Cor de texto legível sobre o fundo do post.
 *
 * Fundo foto ou sólido escuro → texto claro; sólido claro → texto escuro.
 * Sem isso o bloco novo nasce invisível em metade dos posts.
 */
function readableTextColor(spec: FreePostSpec): string {
  const bg = spec.background
  if (bg.kind === "photo") return "#FFFFFF"
  const hex = (bg.kind === "solid" ? bg.color : bg.gradient_from) ?? "#000000"
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return "#FFFFFF"
  const n = parseInt(m[1], 16)
  // Luminância relativa aproximada (ITU-R BT.601).
  const lum =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.55 ? "#111111" : "#FFFFFF"
}

/** Adiciona um bloco de texto no centro do canvas. */
export function addTextBlock(spec: FreePostSpec, styleId: TextStyleId): FreePostSpec {
  const preset = TEXT_STYLES.find((s) => s.id === styleId) ?? TEXT_STYLES[2]
  const block: FreeTextBlock = {
    type: "text",
    text: preset.label,
    font: preset.font,
    font_size: preset.font_size,
    font_weight: preset.font_weight,
    text_transform: preset.text_transform,
    color: readableTextColor(spec),
    text_align: "center",
    position: { left: "50%", top: "44%", width: "76%", center_x: true },
    z: TOP_Z,
  }
  return { ...spec, blocks: [...spec.blocks, block] }
}

/** Adiciona uma imagem (logo, mockup, PNG recortado) como camada móvel. */
export function addImageBlock(spec: FreePostSpec, url: string): FreePostSpec {
  const block: FreeImageBlock = {
    type: "image",
    url,
    fit: "contain",
    position: { left: "50%", top: "38%", width: "40%", center_x: true },
    z: TOP_Z,
  }
  return { ...spec, blocks: [...spec.blocks, block] }
}

/** Adiciona uma forma sólida (fundo de destaque, marca d'água geométrica). */
export function addShapeBlock(
  spec: FreePostSpec,
  shape: FreeShapeBlock["shape"],
): FreePostSpec {
  const accent = spec.blocks.length ? readableTextColor(spec) : "#1668E3"
  const block: FreeShapeBlock = {
    type: "shape",
    shape,
    color: accent,
    opacity: 0.18,
    position: { left: "50%", top: "40%", width: "36%", height: "36%", center_x: true },
    // Abaixo dos textos novos, acima da arte — serve de realce, não tapa.
    z: TOP_Z - 1,
  }
  return { ...spec, blocks: [...spec.blocks, block] }
}

/** Remove o último bloco adicionado (desfazer simples do "adicionar"). */
export function removeLastBlock(spec: FreePostSpec): FreePostSpec {
  if (!spec.blocks.length) return spec
  const blocks: FreeBlock[] = spec.blocks.slice(0, -1)
  return { ...spec, blocks }
}
