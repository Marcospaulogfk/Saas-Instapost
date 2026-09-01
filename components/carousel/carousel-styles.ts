// Metadados dos estilos de carrossel, num módulo SEM "use client" de propósito:
// Server Components (ex. as páginas públicas /modelos) precisam ler o array de
// verdade, e importar valor de módulo client vira client reference no servidor
// (CAROUSEL_STYLES.filter deixa de ser função). Os componentes client continuam
// importando via carousel-style-gallery, que re-exporta daqui.
import type { EditorialStyle } from "./slide-preview"

export type StyleBadgeTone = "brand" | "new" | "neutral"

export interface CarouselStyleMeta {
  style: EditorialStyle
  name: string
  desc: string
  badge?: { label: string; tone: StyleBadgeTone }
}

// Estilos de carrossel (mesmo motor do editor). Cada um vira um card com preview
// ao vivo + navegação pelos slides (capa → conteúdo → CTA).
export const CAROUSEL_STYLES: CarouselStyleMeta[] = [
  {
    style: "minimal",
    name: "Minimalista",
    desc: "Branco suíço, tipografia gigante e hairlines. Versátil pra listas, dicas e conteúdo educativo de qualquer nicho.",
    badge: { label: "Mais popular", tone: "brand" },
  },
  {
    style: "perfil",
    name: "Perfil",
    desc: "Imita um post nativo de rede social: avatar, selo e texto. Ideal pra autoridade, threads e conteúdo de criador.",
    badge: { label: "Estilo Twitter/X", tone: "neutral" },
  },
  {
    style: "gradient",
    name: "Gradiente",
    desc: "Dark vibrante com destaque em gradiente. Moderno e impactante pra quem quer se destacar no feed.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "cards",
    name: "Cards",
    desc: "Capa com foto e título em vidro; conteúdo em cards brancos flutuantes. Clean e bem organizado.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "wesley",
    name: "Impacto",
    desc: "Dark de alto impacto, título em caixa alta e foto de fundo. Pra manchetes que param o scroll.",
  },
  {
    style: "brandsdecoded",
    name: "Revista",
    desc: "Editorial de revista: título massivo, colunas e numeração fantasma. Sofisticado e autoral.",
  },
  {
    style: "bolo",
    name: "Lista Cream",
    desc: "Lista em fundo creme, leve e acolhedor. Perfeito pra passo a passo, receitas e checklists.",
  },
  {
    style: "seamless",
    name: "Seamless",
    desc: "Panorâmico: a linha de progresso avança slide a slide. Continuidade que prende até o final.",
  },
  {
    style: "mypostflow",
    name: "MyPostFlow",
    desc: "Clean com CTA forte no último slide. Equilíbrio entre conteúdo e chamada pra ação.",
  },
  {
    style: "auto",
    name: "Automático",
    desc: "A IA alterna layouts dark/light e escolhe o melhor pra cada slide. Deixa no piloto automático.",
  },
]
