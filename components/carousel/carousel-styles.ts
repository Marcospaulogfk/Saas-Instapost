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
    style: "lookbook",
    name: "Lookbook",
    desc: "Foto grande de pessoa ou produto ocupando o slide, título branco enorme com uma palavra em letra fina inclinada e um botãozinho embaixo. Para moda, beleza, produto e marca pessoal.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "cinema",
    name: "Cinema",
    desc: "Foto escurecida de fundo, título em letras maiúsculas no centro, nome da marca no topo e rodapé em três colunas. Para bastidores, autoridade e frases de impacto.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "estudio",
    name: "Estúdio",
    desc: "Fundo creme com título grande em letras minúsculas numa cor forte, etiquetas pequenas nos cantos e seta no rodapé. Alterna slides com foto em cartão e slides em cor sólida. Para agências, consultorias e serviços.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "colagem",
    name: "Colagem",
    desc: "Fundo na cor da marca, foto em preto e branco recortada, título enorme em maiúsculas e uma palavra em letra manuscrita. Para promoções, lançamentos e chamar atenção no feed.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "cartaz",
    name: "Cartaz P&B",
    desc: "Foto em preto e branco com um cartão branco e título curto em maiúsculas, com um detalhe na cor da marca. Para coleções, moda e marcas com visual mais ousado.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "agencia",
    name: "Agência",
    desc: "Slides pretos e creme se alternando, título em maiúsculas com uma palavra na cor da marca, texto curto embaixo e seta no rodapé. Para tecnologia, serviços entre empresas e apresentação de soluções.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "poster",
    name: "Pôster",
    desc: "Fundo escuro, título em maiúsculas estreitas na cor da marca, foto com véu escuro, @ no topo e cartão tipo post-it para depoimento. Para escolas, cursos, eventos e comunidades.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "geometrico",
    name: "Geométrico",
    desc: "Branco e preto com formas na cor da marca, nome da marca gigante e apagado ao fundo, foto recortada e logo no rodapé. Para construção, indústria, clínicas e empresas que querem passar solidez.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "auto",
    name: "Automático",
    desc: "A inteligência artificial alterna slides escuros e claros e escolhe o melhor jeito para cada um. Você não precisa decidir nada.",
  },
]
