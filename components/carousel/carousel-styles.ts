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
    desc: "Fundo branco, letras grandes e linhas finas, com muito espaço em volta, como numa revista. Serve para dicas, listas e conteúdo que ensina, em qualquer área.",
    badge: { label: "Mais popular", tone: "brand" },
  },
  {
    style: "perfil",
    name: "Perfil",
    desc: "Parece uma publicação de perfil de rede social, com foto do perfil, selo e texto. Boa para passar autoridade e para textos mais pessoais.",
    badge: { label: "Estilo Twitter/X", tone: "neutral" },
  },
  {
    style: "gradient",
    name: "Gradiente",
    desc: "Fundo escuro com cores que se misturam em degradê. Visual moderno, bom para chamar atenção no feed.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "cards",
    name: "Cards",
    desc: "A capa mostra a foto com o título sobre um vidro fosco, e o conteúdo vem em quadros brancos separados. Fica limpo e organizado, bom para vários tópicos curtos.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "wesley",
    name: "Impacto",
    desc: "Fundo escuro, título em letras maiúsculas grandes e foto atrás. Para frases fortes que fazem a pessoa parar de rolar.",
  },
  {
    style: "brandsdecoded",
    name: "Revista",
    desc: "Estilo de capa de revista: título enorme, texto em colunas e números grandes e apagados ao fundo. Passa sofisticação.",
  },
  {
    style: "bolo",
    name: "Lista Cream",
    desc: "Lista sobre fundo cor de creme, leve e acolhedor. Boa para passo a passo, receitas e listas de verificação.",
  },
  {
    style: "seamless",
    name: "Seamless",
    desc: "Os slides parecem uma imagem só que continua de um para o outro, com uma linha de progresso que avança. Faz a pessoa querer passar até o último.",
  },
  {
    style: "mypostflow",
    name: "Chamada Final",
    desc: "Visual limpo, com o último slide pedindo uma ação em destaque, como chamar no WhatsApp ou agendar. Boa para quem quer gerar contato.",
  },
  {
    style: "auto",
    name: "Automático",
    desc: "A inteligência artificial alterna slides escuros e claros e escolhe o melhor jeito para cada um. Você não precisa decidir nada.",
  },
]
