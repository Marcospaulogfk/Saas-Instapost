import type { PostTemplateMeta } from "./types"

/**
 * Catálogo dos templates implementados.
 * Por enquanto só Profissional. Outras categorias entram conforme aprovação.
 */
export const POST_TEMPLATES: PostTemplateMeta[] = [
  {
    id: "profissional-01-retrato-titulo-bottom",
    category: "profissional",
    label: "Retrato + Título Bottom",
    description:
      "Retrato fullbleed escurecido + logo top-right + introdução serif italic + chamada uppercase grande no rodapé",
    reference_image: "/refs-posts-unicos/Profissional/01/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: ["intro", "intro_2", "image_url"],
    needs_photo: true,
    use_when: [
      "Cliente é advogado, médico, consultor ou expert pessoal",
      "Tema é educativo / autoridade",
      "Copy tipo 'o que eu aprendi', 'minha experiência', anos de prática",
    ],
    fonts: ["Playfair Display Italic", "Anton"],
  },
  {
    id: "profissional-02-retrato-card-cta",
    category: "profissional",
    label: "Split + CTA",
    description:
      "Layout split 50/50: texto + logo + CTA pill na esquerda, retrato fullbleed na direita",
    reference_image: "/refs-posts-unicos/Profissional/02/referencia.jpg",
    required_fields: ["title", "body"],
    optional_fields: [
      "cta_text",
      "image_url",
      "contact_phone",
      "contact_website",
    ],
    needs_photo: true,
    use_when: [
      "Copy informativa/educativa específica",
      "Tem retrato profissional de corpo",
      "Tema nichado para público específico",
    ],
    fonts: ["Playfair Display", "Inter"],
  },
  {
    id: "profissional-03-pergunta-provocativa",
    category: "profissional",
    label: "Pergunta Provocativa",
    description:
      "Retrato fullbleed escurecido + logo centralizado no torso + pergunta uppercase 2 linhas com palavra riscada",
    reference_image: "/refs-posts-unicos/Profissional/03/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: ["strikethrough_word", "image_url"],
    needs_photo: true,
    use_when: [
      "Copy é pergunta provocativa terminando com '?'",
      "Quebra de mito / 'o que dizem vs realidade'",
      "Tom direto e desafiador",
    ],
    fonts: ["Anton", "Playfair Display"],
  },
  {
    id: "profissional-04-frase-educativa-moldura",
    category: "profissional",
    label: "Frase Educativa + Moldura",
    description:
      "Fundo escuro com retrato à direita + frase serif italic à esquerda terminando com palavra-chave moldurada",
    reference_image: "/refs-posts-unicos/Profissional/04/referencia.jpg",
    required_fields: ["title", "framed_word"],
    optional_fields: ["highlight_words", "image_url"],
    needs_photo: true,
    use_when: [
      "Frase educativa/reflexiva",
      "Tem 1 palavra-chave forte (conceito técnico)",
      "Tom mentor/conselheiro",
    ],
    fonts: ["Playfair Display Italic"],
  },
]

export function getTemplate(id: string): PostTemplateMeta | null {
  return POST_TEMPLATES.find((t) => t.id === id) ?? null
}

export function templatesByCategory() {
  const out: Record<string, PostTemplateMeta[]> = {}
  for (const t of POST_TEMPLATES) {
    out[t.category] ??= []
    out[t.category].push(t)
  }
  return out
}

export const CATEGORY_LABELS: Record<string, string> = {
  profissional: "Profissional",
  beauty: "Elegante",
  comercial: "Comercial",
  empresa: "Empresa",
  fitness: "Fitness",
  informativo: "Informativo",
}
