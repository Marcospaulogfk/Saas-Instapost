/**
 * Catálogo de inspirações — ideias de post pré-prontas que viram briefing no wizard.
 * Cada inspiração tem um briefing detalhado que o usuário pode editar.
 */

export type InspiracaoCategoria =
  | "trends"
  | "engajamento"
  | "venda"
  | "autoridade"
  | "comunidade"

export type InspiracaoNicho =
  | "advocacia"
  | "fitness"
  | "beleza"
  | "alimentacao"
  | "tech"
  | "educacao"
  | "imobiliario"
  | "moda"
  | "saude"
  | "geral"

export interface Inspiracao {
  id: string
  titulo: string
  descricao: string
  briefing: string
  categoria: InspiracaoCategoria
  nichos: InspiracaoNicho[]
  /** XP estimado se completar */
  xp: number
  /** Hot/trend label */
  trend?: boolean
  /** Formato sugerido */
  formato: "post" | "carrossel" | "stories"
}

export const INSPIRACOES: Inspiracao[] = [
  {
    id: "site-vendedor-247",
    titulo: "Seu Site é um Vendedor 24/7?",
    descricao:
      "Eduque sobre a importância de um site estratégico — ângulo de vendas e autoridade.",
    briefing:
      "Um post pra empresas e profissionais liberais que ainda não têm site profissional. Argumento principal: site bem feito vende sozinho mesmo enquanto o dono dorme — autoridade, prova social e SEO trazem leads orgânicos. Tom: provocativo no início (gancho com pergunta), técnico no meio (3 motivos com dados), CTA pra avaliar o site atual.",
    categoria: "venda",
    nichos: ["tech", "geral"],
    xp: 60,
    trend: true,
    formato: "carrossel",
  },
  {
    id: "erros-instagram-2026",
    titulo: "5 erros que matam seu Instagram em 2026",
    descricao: "Lista educativa com diagnóstico e soluções concretas.",
    briefing:
      "Carrossel educativo apontando os 5 principais erros que sabotam o crescimento orgânico no Instagram em 2026. Cada slide aborda 1 erro com exemplo concreto + correção rápida. Foco em: gancho fraco, copy genérica, hashtags spam, sem CTA, frequência inconsistente. Tom: direto, sem floreio.",
    categoria: "autoridade",
    nichos: ["tech", "geral"],
    xp: 80,
    trend: true,
    formato: "carrossel",
  },
  {
    id: "depoimento-cliente",
    titulo: "Depoimento de cliente real",
    descricao: "Storytelling com prova social — formato post único impactante.",
    briefing:
      "Post único com depoimento de um cliente — frase forte do cliente como headline, contexto curto sobre o problema que ele tinha, resultado concreto (com número se possível). Foto do cliente ou ambiente do trabalho dele.",
    categoria: "venda",
    nichos: ["geral"],
    xp: 40,
    formato: "post",
  },
  {
    id: "bastidores-trabalho",
    titulo: "Bastidores do trabalho",
    descricao: "Mostra o processo — humaniza a marca e cria conexão.",
    briefing:
      "Post mostrando o bastidor real do trabalho — equipamento, equipe, processo. Não posado: foto natural do cotidiano. Caption com 1 detalhe específico que o cliente nem imagina (custos, tempo, cuidado).",
    categoria: "comunidade",
    nichos: ["geral"],
    xp: 50,
    formato: "post",
  },
  {
    id: "mito-vs-verdade",
    titulo: "Mito vs Verdade do meu nicho",
    descricao: "Quebra um mito popular do seu segmento com fonte/dado.",
    briefing:
      "Carrossel formato 'Mito vs Verdade' — slide 1 com mito popular do nicho, slide 2 desmistificando com fonte/argumento técnico. Encerra com 'Salva esse post pra mostrar pra quem ainda acredita'.",
    categoria: "autoridade",
    nichos: ["geral"],
    xp: 70,
    formato: "carrossel",
  },
  {
    id: "antes-depois",
    titulo: "Antes e Depois (transformação)",
    descricao: "Resultado visual — funciona forte em estética, fitness, design.",
    briefing:
      "Post com 2 fotos lado a lado: estado anterior vs resultado atual. Caption descrevendo: o que foi feito, em quanto tempo, o que o cliente sentiu. Sem promessa irreal — destacar o trabalho real envolvido.",
    categoria: "venda",
    nichos: ["fitness", "beleza", "saude"],
    xp: 50,
    formato: "post",
  },
  {
    id: "pergunta-que-incomoda",
    titulo: "Pergunta que incomoda",
    descricao: "Pergunta provocativa pra gerar comentário real.",
    briefing:
      "Post único com uma pergunta forte que toca em uma dor real do público — não pergunta genérica ('o que você acha?') mas algo específico que faz a pessoa parar e responder. Caption pede pra responder em 1 palavra nos comentários.",
    categoria: "engajamento",
    nichos: ["geral"],
    xp: 35,
    formato: "post",
  },
  {
    id: "checklist-essencial",
    titulo: "Checklist essencial (salvável)",
    descricao: "Lista visual de 5-7 itens que o público vai querer salvar.",
    briefing:
      "Carrossel formato checklist — 5 a 7 itens essenciais sobre tema do nicho. Slide 1 anuncia o que tem na lista. Slide final pede pra salvar. Itens curtos com 1 linha de explicação cada.",
    categoria: "autoridade",
    nichos: ["geral"],
    xp: 60,
    formato: "carrossel",
  },
  {
    id: "vaga-aberta",
    titulo: "Vagas abertas (recrutamento)",
    descricao: "Post de oportunidade — atrai candidatos com cultura clara.",
    briefing:
      "Post anunciando vaga aberta. Foco em: o que faz, qual perfil procura, 3 requisitos não-negociáveis, salário/benefício, como aplicar. Tom direto, sem clichê de RH ('família', 'desafio único'). Honesto sobre o que é o trabalho.",
    categoria: "comunidade",
    nichos: ["geral"],
    xp: 50,
    formato: "post",
  },
  {
    id: "stories-pergunta-quiz",
    titulo: "Stories: enquete + resultado",
    descricao: "Engajamento real com quem está nos stories.",
    briefing:
      "Story 1 com enquete provocativa do nicho. Story 2 com 'resultado parcial + comentário'. Story 3 fechando com insight ou CTA pra saber mais. Visual minimalista, foco no conteúdo.",
    categoria: "engajamento",
    nichos: ["geral"],
    xp: 30,
    formato: "stories",
  },
  {
    id: "case-numerico",
    titulo: "Case com número grande",
    descricao: "Resultado mensurável — número gigante + contexto.",
    briefing:
      "Post único com um número de impacto (ex: '23 leads em 30 dias', 'R$ 12k em 1 lançamento'). Number gigante na arte, 2 linhas de contexto explicando como foi feito, CTA pra conversar.",
    categoria: "venda",
    nichos: ["geral"],
    xp: 55,
    formato: "post",
  },
  {
    id: "polemica-do-nicho",
    titulo: "Opinião polêmica do meu nicho",
    descricao: "Posicionamento claro pra atrair o público certo (e repelir errado).",
    briefing:
      "Post com opinião CONTRA-corrente sobre algo do seu nicho. Exemplo: 'Não, você NÃO precisa de marca pessoal pra vender'. Argumenta com 2-3 razões. Aceita que vai polarizar — esse é o ponto.",
    categoria: "engajamento",
    nichos: ["geral"],
    xp: 70,
    trend: true,
    formato: "post",
  },
]

export function getInspiracoesByNicho(nicho: InspiracaoNicho): Inspiracao[] {
  if (nicho === "geral") return INSPIRACOES
  return INSPIRACOES.filter(
    (i) => i.nichos.includes(nicho) || i.nichos.includes("geral"),
  )
}

export function getInspiracao(id: string): Inspiracao | null {
  return INSPIRACOES.find((i) => i.id === id) ?? null
}
