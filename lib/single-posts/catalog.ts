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
    reference_image: "/posts-unicos/profissional/01.jpg",
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
    reference_image: "/posts-unicos/profissional/02.jpg",
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
    reference_image: "/posts-unicos/profissional/03.jpg",
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
    reference_image: "/posts-unicos/profissional/04.jpg",
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

  // ===== BEAUTY =====
  {
    id: "beauty-01-closeup-serif-editorial",
    category: "beauty",
    label: "Closeup Serif Editorial",
    description:
      "Foto fullbleed close-up + título serif 3 linhas (palavra do meio italic) + body com bold inline",
    reference_image: "/refs-posts-unicos/beauty/01/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: ["body", "highlight_words", "image_url"],
    needs_photo: true,
    use_when: [
      "Estética, beleza, dermatologia, cosméticos",
      "Tema: resultado/transformação",
      "Tom sofisticado e desejável",
    ],
    fonts: ["Playfair Display"],
  },
  {
    id: "beauty-03-instagram-ui-mockup",
    category: "beauty",
    label: "Instagram UI Mockup",
    description:
      "Mockup com elementos UI Instagram (POST/STORY/LIVE + botão capture) + título lateral em 3 partes",
    reference_image: "/refs-posts-unicos/beauty/03/referencia.jpg",
    required_fields: ["kicker", "title", "subtitle"],
    optional_fields: ["image_url"],
    needs_photo: true,
    use_when: [
      "Vibe app/Instagram nativa",
      "Tom jovem/moderno",
      "Tem foto close-up sensual/estética",
    ],
    fonts: ["Playfair Display"],
  },
  {
    id: "beauty-04-produto-com-elemento",
    category: "beauty",
    label: "Produto + Elemento",
    description:
      "Foto rosto natural + palavra-chave gigante serif italic com underline orgânico + PNG do produto sobreposto",
    reference_image: "/refs-posts-unicos/beauty/04/referencia.jpg",
    required_fields: ["title", "intro", "intro_2"],
    optional_fields: ["image_url"],
    needs_photo: true,
    use_when: [
      "Cosméticos com produto físico",
      "Conceito-chave em 1 palavra",
      "Tom elegante e clean",
    ],
    fonts: ["Playfair Display Italic"],
  },
  {
    id: "beauty-05-frase-conceitual-centered",
    category: "beauty",
    label: "Frase Conceitual Centered",
    description:
      "Foto atmosférica + manifesto serif italic gigante 2 linhas + tagline italic + footer com tagline vertical",
    reference_image: "/refs-posts-unicos/beauty/05/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: ["body", "image_url"],
    needs_photo: true,
    use_when: [
      "Frase conceitual/manifesto da marca",
      "Tom filosófico/posicionamento",
      "Sem CTA",
    ],
    fonts: ["Playfair Display Italic"],
  },

  // ===== COMERCIAL =====
  {
    id: "comercial-01-split-color-product",
    category: "comercial",
    label: "Split Cor + Produto",
    description:
      "Split foto-topo + cor sólida bottom + mockup do produto sobreposto na linha de divisão",
    reference_image: "/refs-posts-unicos/comercial/01/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: [
      "subtitle",
      "highlight_words",
      "cta_text",
      "image_url",
      "product_image_url",
    ],
    needs_photo: true,
    use_when: [
      "Vende produto físico (eletrônicos, moda, alimentação)",
      "Tem mockup PNG do produto",
      "Tom impactante e moderno",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "comercial-02-produto-isolado-clean",
    category: "comercial",
    label: "Produto Isolado Clean",
    description:
      "Fundo claro + título uppercase 3 linhas + mockup do produto centralizado + selo lateral",
    reference_image: "/refs-posts-unicos/comercial/02/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: [
      "body",
      "highlight_words",
      "product_image_url",
      "contact_website",
    ],
    needs_photo: true,
    use_when: [
      "Destaca UM produto específico",
      "Tem PNG sem fundo",
      "Tom premium/sofisticado",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "comercial-03-equipe-card-lateral",
    category: "comercial",
    label: "Equipe + Card Lateral",
    description:
      "BG cor marca + texto fantasma gigante + composição equipe + card branco vendedor lateral + CTA",
    reference_image: "/refs-posts-unicos/comercial/03/referencia.jpg",
    required_fields: ["title_lines", "body"],
    optional_fields: [
      "ghost_word",
      "cta_text",
      "contact_website",
      "image_url",
    ],
    needs_photo: true,
    use_when: [
      "Serviço B2B/profissional dependente de equipe",
      "Tom institucional/credibilidade",
      "Precisa transmitir solidez",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "comercial-04-numero-grande-retrato",
    category: "comercial",
    label: "Número Gigante + Retrato",
    description:
      "BG cor sólida + label uppercase + número gigante (24H, 100%) + retrato lateral + CTA pill",
    reference_image: "/refs-posts-unicos/comercial/04/referencia.jpg",
    required_fields: ["kicker", "stat_value"],
    optional_fields: [
      "body",
      "cta_text",
      "contact_website",
      "image_url",
    ],
    needs_photo: true,
    use_when: [
      "Destaca um número/garantia (24h, 100%, X anos)",
      "Tem foto de profissional uniformizado",
      "Tom vendedor/promocional",
    ],
    fonts: ["Anton", "Inter"],
  },

  // ===== EMPRESA =====
  {
    id: "empresa-03-cta-seta-grande",
    category: "empresa",
    label: "CTA com Seta Grande",
    description:
      "Foto top + card primary bottom + seta circular gigante accent na divisão + título Inter bold + descrição + CTA pill",
    reference_image: "/refs-posts-unicos/empresa/03/referencia.jpg",
    required_fields: ["title", "body", "cta_text"],
    optional_fields: ["highlight_words", "image_url"],
    needs_photo: true,
    use_when: [
      "Serviço B2B focado em conversão",
      "Copy com CTA forte",
      "Tom direto e profissional",
    ],
    fonts: ["Inter"],
  },

  // ===== FITNESS =====
  {
    id: "fitness-01-resultados-grid",
    category: "fitness",
    label: "Resultados (grid 3 fotos)",
    description:
      "BG cor primary + título uppercase grande + card preto com grid 3 fotos antes/depois + CTA pill preto",
    reference_image: "/refs-posts-unicos/fitness/01/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: [
      "body",
      "outline_word",
      "cta_text",
      "image_url",
      "image_2_url",
      "image_3_url",
    ],
    needs_photo: true,
    use_when: [
      "Tema 'transformação' ou 'resultados'",
      "Tem fotos antes/depois",
      "Copy menciona números (X dias, Y kg)",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "fitness-02-promocional-retrato",
    category: "fitness",
    label: "Promoção + Retrato",
    description:
      "BG cor primary + blob orgânico + retrato fitness PNG direita + título uppercase com % desconto + descrição",
    reference_image: "/refs-posts-unicos/fitness/02/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: ["intro", "body", "image_url"],
    needs_photo: true,
    use_when: [
      "Promoção/oferta com % desconto",
      "Tem foto de pessoa fitness PNG",
      "Tom vendedor direto",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "fitness-03-desafio-com-selo",
    category: "fitness",
    label: "Desafio + Selo",
    description:
      "Split 60/40 + texto fantasma vertical lateral + título uppercase com palavra outline + selo circular de garantia",
    reference_image: "/refs-posts-unicos/fitness/03/referencia.jpg",
    required_fields: ["title_lines"],
    optional_fields: [
      "body",
      "outline_word",
      "ghost_word",
      "badge_label",
      "image_url",
    ],
    needs_photo: true,
    use_when: [
      "Programa/desafio com prazo definido",
      "Precisa de elemento de garantia/credibilidade",
      "Tom motivacional",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "fitness-04-institucional-fotos-espaco",
    category: "fitness",
    label: "Institucional (espaço)",
    description:
      "BG cor primary + convite uppercase + nome marca gigante + 2 fotos do espaço empilhadas + CTA pill com agenda",
    reference_image: "/refs-posts-unicos/fitness/04/referencia.jpg",
    required_fields: ["body"],
    optional_fields: [
      "kicker",
      "title_emphasis",
      "cta_text",
      "image_url",
      "image_2_url",
    ],
    needs_photo: true,
    use_when: [
      "Apresentação institucional do espaço",
      "Tem fotos do local/produto",
      "Copy é convite/apresentação",
    ],
    fonts: ["Anton", "Inter"],
  },

  // ===== INFORMATIVO =====
  {
    id: "informativo-01-alerta-card-buttons",
    category: "informativo",
    label: "Alerta + Botões Duplos",
    description:
      "BG cor primary + ghost text gigante + card branco com ícone alerta + título + body + 2 botões (outline + filled)",
    reference_image: "/refs-posts-unicos/informativo/01/referencia.jpg",
    required_fields: ["title", "body"],
    optional_fields: [
      "ghost_word",
      "subtitle",
      "cta_text",
      "cta_secondary",
      "contact_website",
    ],
    needs_photo: false,
    use_when: [
      "Alerta/aviso importante",
      "Decisão binária (Sim/Não, Aceitar/Recusar)",
      "Tom direto e cta-driven",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "informativo-02-case-storytelling",
    category: "informativo",
    label: "Case / Storytelling",
    description:
      "BG accent + ghost text vertical + card escuro com kicker uppercase + nome em bold + descrição do case",
    reference_image: "/refs-posts-unicos/informativo/02/referencia.jpg",
    required_fields: ["title", "body"],
    optional_fields: ["ghost_word", "kicker", "highlight_words"],
    needs_photo: false,
    use_when: [
      "Case real / depoimento de cliente",
      "Tom inspirador/motivacional",
      "Sem foto da pessoa do case",
    ],
    fonts: ["Anton", "Inter"],
  },
  {
    id: "informativo-03-vagas-requisitos",
    category: "informativo",
    label: "Vagas / Requisitos",
    description:
      "BG dark + título uppercase accent + pill cargo + lista de requisitos com check + CTA email + retrato lateral",
    reference_image: "/refs-posts-unicos/informativo/03/referencia.jpg",
    required_fields: ["title_lines", "kicker", "checklist"],
    optional_fields: ["contact_email", "image_url"],
    needs_photo: true,
    use_when: [
      "Anúncio de vaga aberta",
      "Lista de requisitos específicos",
      "Email pra envio de currículo",
    ],
    fonts: ["Anton", "Inter"],
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
