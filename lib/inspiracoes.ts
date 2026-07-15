/**
 * Catálogo de sugestões — ideias de post pré-prontas que viram briefing no wizard.
 * Cada sugestão tem um briefing detalhado que o usuário pode editar.
 *
 * Briefings aceitam os placeholders {{marca}} e {{publico}}, preenchidos com os
 * dados da marca ativa (ou com texto neutro quando não há marca).
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
  | "servicos"
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
  // ── TECH / SITES / SAAS ────────────────────────────────────────────────
  {
    id: "site-vendedor-247",
    titulo: "Seu Site é um Vendedor 24/7?",
    descricao:
      "Eduque sobre a importância de um site estratégico — ângulo de vendas e autoridade.",
    briefing:
      "Um post de {{marca}} pra empresas e profissionais liberais que ainda não têm site profissional. Argumento principal: site bem feito vende sozinho mesmo enquanto o dono dorme — autoridade, prova social e SEO trazem leads orgânicos. Tom: provocativo no início (gancho com pergunta), técnico no meio (3 motivos com dados), CTA pra avaliar o site atual.",
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
    id: "quanto-custa-projeto",
    titulo: "Quanto custa? (transparência de preço)",
    descricao:
      "Quebra a objeção de preço explicando o que compõe o investimento.",
    briefing:
      "Carrossel respondendo de frente a pergunta que {{publico}} sempre faz: 'quanto custa?'. Slide 1: a pergunta como gancho. Slides seguintes: o que compõe o preço (etapas, tempo, o que está incluso), faixa de investimento honesta e o que muda o valor pra cima ou pra baixo. Slide final: CTA pra pedir orçamento sem compromisso. Transparência gera confiança — zero enrolação.",
    categoria: "venda",
    nichos: ["tech", "servicos", "geral"],
    xp: 70,
    formato: "carrossel",
  },
  // ── ADVOCACIA ──────────────────────────────────────────────────────────
  {
    id: "direitos-que-ninguem-conta",
    titulo: "3 direitos que quase ninguém conhece",
    descricao: "Conteúdo jurídico útil e salvável — autoridade instantânea.",
    briefing:
      "Carrossel educativo listando 3 direitos que {{publico}} tem e quase ninguém sabe. Um direito por slide: situação concreta do dia a dia + o que a lei garante + o que fazer na prática. Linguagem simples, sem juridiquês — traduzir a lei pra vida real. Slide final: 'Salva esse post, você vai precisar' + CTA pra tirar dúvidas no direct. Sem promessa de resultado (respeitar OAB).",
    categoria: "autoridade",
    nichos: ["advocacia"],
    xp: 75,
    formato: "carrossel",
  },
  {
    id: "sinais-precisa-advogado",
    titulo: "Sinais de que você precisa de um advogado",
    descricao: "Educa sobre o momento certo de procurar ajuda jurídica.",
    briefing:
      "Post único listando 3-4 sinais claros de que a pessoa deveria procurar orientação jurídica ANTES do problema virar prejuízo — ex: assinou contrato sem ler, recebeu cobrança estranha, foi demitido de forma suspeita. Ângulo: prevenir é mais barato que remediar. Tom sóbrio e acessível, sem terrorismo. CTA educativo, não comercial agressivo.",
    categoria: "venda",
    nichos: ["advocacia"],
    xp: 55,
    formato: "post",
  },
  // ── FITNESS ────────────────────────────────────────────────────────────
  {
    id: "treino-20-minutos",
    titulo: "Treino pra quem não tem tempo",
    descricao: "Conteúdo prático e salvável pra quem vive sem agenda.",
    briefing:
      "Carrossel com um mini-treino de 20 minutos pra {{publico}} que 'não tem tempo'. Slide 1: gancho atacando a desculpa nº 1 ('sem tempo' = sem prioridade? Não — sem método). Slides seguintes: 4-5 exercícios com séries/repetições e 1 dica de execução cada. Slide final: 'Salva e faz hoje' + convite pra acompanhamento. Específico e executável, nada de motivacional vazio.",
    categoria: "autoridade",
    nichos: ["fitness"],
    xp: 70,
    formato: "carrossel",
  },
  {
    id: "erro-iniciante-academia",
    titulo: "O erro nº 1 de quem está começando",
    descricao: "Corrige um erro comum do iniciante — gera identificação e comentário.",
    briefing:
      "Post único apontando O erro mais comum de quem começa a treinar (ex: treinar pesado demais na primeira semana e desistir na segunda). Estrutura: erro no headline, por que todo mundo comete, o que fazer no lugar (regra prática). Caption termina perguntando 'qual desses você já cometeu?' pra puxar comentário.",
    categoria: "engajamento",
    nichos: ["fitness"],
    xp: 45,
    formato: "post",
  },
  // ── BELEZA / ESTÉTICA ──────────────────────────────────────────────────
  {
    id: "verdade-sobre-procedimento",
    titulo: "A verdade sobre o procedimento X",
    descricao: "Desmistifica um procedimento — dor, tempo, resultado real.",
    briefing:
      "Carrossel contando a verdade completa sobre o procedimento mais procurado por {{publico}}: dói ou não, quanto tempo dura a sessão, quando aparece o resultado, quanto tempo o resultado dura e quem NÃO deve fazer. A honestidade (inclusive sobre limitações) é o diferencial — quem esconde contraindicação perde confiança. Slide final: CTA pra avaliação.",
    categoria: "autoridade",
    nichos: ["beleza", "saude"],
    xp: 70,
    formato: "carrossel",
  },
  {
    id: "agenda-da-semana",
    titulo: "Agenda aberta da semana",
    descricao: "Stories de disponibilidade — converte seguidor em agendamento.",
    briefing:
      "Sequência de 3 stories anunciando horários disponíveis da semana. Story 1: 'Abriu agenda!' com os dias/horários livres em destaque. Story 2: foto ou vídeo curto de um resultado recente (com autorização) pra lembrar o valor do serviço. Story 3: CTA direto — 'chama no direct ou clica no link pra agendar'. Senso de urgência real: se são poucos horários, diga quantos.",
    categoria: "venda",
    nichos: ["beleza", "saude", "servicos"],
    xp: 40,
    formato: "stories",
  },
  // ── GASTRONOMIA / FOOD ─────────────────────────────────────────────────
  {
    id: "prato-mais-pedido",
    titulo: "O prato mais pedido da casa",
    descricao: "Close no carro-chefe — dá fome e dá vontade de pedir agora.",
    briefing:
      "Post único com foto em close do prato mais pedido. Headline com o nome do prato + o número de vendas se tiver ('o preferido de 9 em cada 10 mesas'). Caption descrevendo o prato de um jeito sensorial (textura, temperatura, o detalhe que ninguém esquece) em 2-3 linhas. CTA: pedir agora / reservar. Nada de foto genérica de banco de imagem — tem que parecer que saiu da cozinha agora.",
    categoria: "venda",
    nichos: ["alimentacao"],
    xp: 45,
    formato: "post",
  },
  {
    id: "bastidor-cozinha",
    titulo: "Como esse prato nasce (bastidor)",
    descricao: "Processo na cozinha — ingrediente, preparo, cuidado invisível.",
    briefing:
      "Stories mostrando o bastidor do preparo de um prato: escolha do ingrediente, um momento do preparo e a finalização. Destaque 1 cuidado que o cliente nem imagina (ingrediente que chega de madrugada, tempo de descanso da massa, o teste de ponto). Story final: prato pronto + CTA pra pedir. Autêntico > produzido.",
    categoria: "comunidade",
    nichos: ["alimentacao"],
    xp: 40,
    formato: "stories",
  },
  // ── SAÚDE / CLÍNICAS ───────────────────────────────────────────────────
  {
    id: "sinais-nao-ignorar",
    titulo: "5 sinais que você não deve ignorar",
    descricao: "Alerta responsável — informa sem alarmismo e posiciona autoridade.",
    briefing:
      "Carrossel listando 5 sinais relacionados à especialidade que {{publico}} costuma ignorar até virar problema. Um sinal por slide: como se manifesta + por que merece atenção + quando procurar avaliação. Tom responsável e acolhedor, SEM alarmismo nem autodiagnóstico — reforçar que só avaliação profissional confirma. Slide final: CTA pra agendar avaliação.",
    categoria: "autoridade",
    nichos: ["saude"],
    xp: 75,
    formato: "carrossel",
  },
  {
    id: "pergunta-mais-ouvida",
    titulo: "A pergunta que eu mais escuto no consultório",
    descricao: "Responde publicamente a dúvida nº 1 dos pacientes.",
    briefing:
      "Post único respondendo a pergunta que os pacientes mais fazem no consultório. Headline: a pergunta exatamente como o paciente fala (linguagem coloquial). Caption: resposta clara e honesta em até 4 linhas, sem juridiquês médico. Fechamento: 'tem outra dúvida? Pergunta nos comentários que eu respondo' — vira fonte de pauta pros próximos posts.",
    categoria: "engajamento",
    nichos: ["saude", "geral"],
    xp: 50,
    formato: "post",
  },
  // ── EDUCAÇÃO / CURSOS ──────────────────────────────────────────────────
  {
    id: "mini-aula-60s",
    titulo: "Mini-aula: aprenda algo em 1 minuto",
    descricao: "Ensina uma coisa útil de graça — quem ensina bem, vende fácil.",
    briefing:
      "Carrossel formato mini-aula: ensinar UMA habilidade pequena e completa que {{publico}} consegue aplicar hoje. Slide 1: promessa específica ('aprenda X em 1 minuto'). Slides 2-5: passo a passo real, sem reter informação — entregar de verdade. Slide final: 'isso é 1% do que tem no [curso/mentoria]' + CTA. Generosidade no conteúdo gratuito é o que valida o pago.",
    categoria: "autoridade",
    nichos: ["educacao"],
    xp: 70,
    formato: "carrossel",
  },
  {
    id: "resultado-de-aluno",
    titulo: "Resultado de aluno (case real)",
    descricao: "Prova social de quem aprendeu e aplicou — o marketing mais honesto.",
    briefing:
      "Post único contando a trajetória de 1 aluno real: onde estava antes, o que travava, o que mudou depois de aplicar o método e o resultado concreto (com número ou marco específico). Print ou foto do aluno com autorização. Fechamento: 'ele começou igual você' + CTA. Específico > genérico: nome, contexto e tempo real.",
    categoria: "venda",
    nichos: ["educacao", "geral"],
    xp: 55,
    formato: "post",
  },
  // ── MODA / E-COMMERCE ──────────────────────────────────────────────────
  {
    id: "3-formas-1-peca",
    titulo: "3 formas de usar a mesma peça",
    descricao: "Versatilidade de produto — aumenta valor percebido e salva o post.",
    briefing:
      "Carrossel mostrando 1 peça estilizada de 3 formas diferentes (ex: casual de dia, trabalho, noite). Um look por slide com foto real da peça e 1 linha explicando a combinação. Ângulo: 'não é gasto, é peça-curinga'. Slide final: preço + CTA pra comprar/ver no site. Bom pra salvamento — quem salva look, volta pra comprar.",
    categoria: "venda",
    nichos: ["moda"],
    xp: 60,
    formato: "carrossel",
  },
  {
    id: "chegou-novidade",
    titulo: "Chegou! (lançamento/reposição)",
    descricao: "Stories de novidade com urgência real de estoque.",
    briefing:
      "Sequência de stories anunciando peça nova ou reposição da mais pedida. Story 1: teaser ('chegou o que vocês pediram'). Story 2: produto em detalhe — tecido, caimento, cores disponíveis. Story 3: urgência honesta (quantas unidades/numeração) + CTA com link direto. Se for reposição, dizer que esgotou antes — prova social embutida.",
    categoria: "venda",
    nichos: ["moda", "alimentacao"],
    xp: 40,
    formato: "stories",
  },
  // ── IMOBILIÁRIO ────────────────────────────────────────────────────────
  {
    id: "erros-ao-comprar-imovel",
    titulo: "Erros caros na hora de comprar imóvel",
    descricao: "Protege o comprador de armadilhas — autoridade que gera confiança.",
    briefing:
      "Carrossel listando 4 erros caros que {{publico}} comete ao comprar imóvel: não checar documentação, ignorar custos além do preço (ITBI, escritura, condomínio), fechar sem visitar em horários diferentes, não negociar. Um erro por slide com o prejuízo real que ele causa + como evitar. Slide final: 'quer comprar sem cair nessas? Fala comigo'.",
    categoria: "autoridade",
    nichos: ["imobiliario"],
    xp: 70,
    formato: "carrossel",
  },
  // ── SERVIÇOS LOCAIS ────────────────────────────────────────────────────
  {
    id: "antes-de-contratar",
    titulo: "O que checar antes de contratar esse serviço",
    descricao: "Guia honesto de contratação — mesmo que escolham outro, confiam em você.",
    briefing:
      "Carrossel ensinando {{publico}} a avaliar QUALQUER prestador do seu segmento antes de fechar: o que perguntar, que documento/garantia exigir, sinal de alerta de orçamento bom demais. A coragem de ensinar a comparar (inclusive com concorrentes) é o que posiciona {{marca}} como a opção confiável. Slide final: 'nós passamos em todos esses critérios — pede seu orçamento'.",
    categoria: "autoridade",
    nichos: ["servicos", "geral"],
    xp: 65,
    formato: "carrossel",
  },
  // ── GERAIS (funcionam pra qualquer nicho) ──────────────────────────────
  {
    id: "depoimento-cliente",
    titulo: "Depoimento de cliente real",
    descricao: "Storytelling com prova social — formato post único impactante.",
    briefing:
      "Post único com depoimento de um cliente de {{marca}} — frase forte do cliente como headline, contexto curto sobre o problema que ele tinha, resultado concreto (com número se possível). Foto do cliente ou ambiente do trabalho dele.",
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
      "Post mostrando o bastidor real do trabalho de {{marca}} — equipamento, equipe, processo. Não posado: foto natural do cotidiano. Caption com 1 detalhe específico que o cliente nem imagina (custos, tempo, cuidado).",
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
      "Carrossel formato 'Mito vs Verdade' — slide 1 com o mito que {{publico}} mais repete, slide 2 desmistificando com fonte/argumento técnico. Encerra com 'Salva esse post pra mostrar pra quem ainda acredita'.",
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
    nichos: ["fitness", "beleza", "saude", "tech", "servicos"],
    xp: 50,
    formato: "post",
  },
  {
    id: "pergunta-que-incomoda",
    titulo: "Pergunta que incomoda",
    descricao: "Pergunta provocativa pra gerar comentário real.",
    briefing:
      "Post único com uma pergunta forte que toca em uma dor real de {{publico}} — não pergunta genérica ('o que você acha?') mas algo específico que faz a pessoa parar e responder. Caption pede pra responder em 1 palavra nos comentários.",
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
      "Carrossel formato checklist — 5 a 7 itens essenciais sobre o tema que {{publico}} mais precisa dominar. Slide 1 anuncia o que tem na lista. Slide final pede pra salvar. Itens curtos com 1 linha de explicação cada.",
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
      "Post anunciando vaga aberta em {{marca}}. Foco em: o que faz, qual perfil procura, 3 requisitos não-negociáveis, salário/benefício, como aplicar. Tom direto, sem clichê de RH ('família', 'desafio único'). Honesto sobre o que é o trabalho.",
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
      "Story 1 com enquete provocativa sobre uma dúvida real de {{publico}}. Story 2 com 'resultado parcial + comentário'. Story 3 fechando com insight ou CTA pra saber mais. Visual minimalista, foco no conteúdo.",
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
  {
    id: "faq-comentarios",
    titulo: "Respondendo as 3 perguntas mais frequentes",
    descricao: "FAQ público — mata objeção repetida e vira conteúdo salvável.",
    briefing:
      "Carrossel respondendo as 3 perguntas que {{publico}} mais faz no direct/comentários de {{marca}}. Uma pergunta por slide, com a pergunta escrita do jeito que o cliente pergunta (coloquial) e resposta direta em 2-3 linhas. Slide final: 'ficou outra dúvida? Comenta aqui'. Economiza direct e mostra que a marca escuta.",
    categoria: "comunidade",
    nichos: ["geral"],
    xp: 55,
    formato: "carrossel",
  },
  {
    id: "erro-que-cometi",
    titulo: "Um erro que cometi (e o que aprendi)",
    descricao: "Vulnerabilidade estratégica — humaniza e gera conexão real.",
    briefing:
      "Post único contando um erro REAL que a marca/o dono cometeu no negócio, o prejuízo ou constrangimento que causou, e a lição prática que tirou. Estrutura: gancho com o erro (sem suavizar), o contexto em 2 linhas, a virada. Nada de erro-humblebrag ('meu erro foi trabalhar demais'). Autenticidade gera mais confiança que perfeição.",
    categoria: "comunidade",
    nichos: ["geral"],
    xp: 60,
    formato: "post",
  },
]

/** Contexto mínimo da marca pra personalizar as sugestões. */
export interface BrandContext {
  name: string
  description: string | null
  target_audience: string | null
  tone_of_voice: string | null
  main_objective: string | null
}

/** Mapeia um objetivo da marca (sell/inform/...) pra categoria de sugestão. */
function objetivoToCategoria(objetivo: string): InspiracaoCategoria | null {
  switch (objetivo.trim()) {
    case "sell":
      return "venda"
    case "inform":
      return "autoridade"
    case "engage":
      return "engajamento"
    case "community":
      return "comunidade"
    default:
      return null
  }
}

/**
 * main_objective pode vir composto ("sell,engage") — considera todos.
 */
export function objetivosToCategorias(
  mainObjective: string | null,
): InspiracaoCategoria[] {
  if (!mainObjective) return []
  return mainObjective
    .split(",")
    .map((o) => objetivoToCategoria(o))
    .filter((c): c is InspiracaoCategoria => c !== null)
}

/** Keywords por nicho — usadas em name + description + target_audience. */
const NICHO_KEYWORDS: Array<[InspiracaoNicho, string[]]> = [
  [
    "advocacia",
    ["advog", "jurídic", "juridic", "direito", "oab", "escritório de advocacia", "escritorio de advocacia", "tributár", "tributar", "trabalhista", "previdenciár", "previdenciar", "cível", "civel"],
  ],
  [
    "fitness",
    ["fitness", "academia", "treino", "personal", "musculação", "musculacao", "crossfit", "pilates", "corrida", "emagrecim", "hipertrofia", "yoga"],
  ],
  [
    "beleza",
    ["beleza", "estética", "estetica", "salão", "salao", "cabelo", "maquiagem", "sobrancelha", "cílios", "cilios", "unha", "manicure", "barbearia", "barbeiro", "depilação", "depilacao", "skincare", "botox", "harmonização", "harmonizacao"],
  ],
  [
    "alimentacao",
    ["restaurante", "comida", "food", "gastronom", "delivery", "confeitaria", "hamburgue", "pizzaria", "lanchonete", "cafeteria", "café", "doceria", "marmita", "açaí", "acai", "padaria", "chef", "cozinha"],
  ],
  [
    "tech",
    ["tech", "software", "saas", "tecnologia", "app", "startup", "dev", "site", "web", "digital", "automação", "automacao", "inteligência artificial", "inteligencia artificial", " ia ", "marketing digital", "agência", "agencia", "e-commerce", "ecommerce", "sistema"],
  ],
  [
    "educacao",
    ["curso", "educa", "ensino", "escola", "professor", "mentoria", "aula", "treinamento", "capacitação", "capacitacao", "idioma", "inglês", "ingles", "faculdade", "concurso", "aluno"],
  ],
  [
    "imobiliario",
    ["imóv", "imov", "imobiliár", "imobiliar", "corretor", "aluguel", "apartamento", "lançamento imobiliário", "lancamento imobiliario", "condomínio", "condominio", "loteamento"],
  ],
  [
    "moda",
    ["moda", "roupa", "vestuário", "vestuario", "loja de roupa", "boutique", "acessório", "acessorio", "calçado", "calcado", "jeans", "fitness wear", "moda feminina", "moda masculina", "semijoia", "bijuteria"],
  ],
  [
    "saude",
    ["saúde", "saude", "clínica", "clinica", "médic", "medic", "psicólog", "psicolog", "nutri", "odonto", "dentista", "fisioterap", "terapeuta", "fonoaudi", "veterinár", "veterinar", "consultório", "consultorio", "paciente", "bem-estar", "bem estar"],
  ],
  [
    "servicos",
    ["serviço", "servico", "manutenção", "manutencao", "reforma", "instalação", "instalacao", "encanador", "eletricista", "limpeza", "jardinagem", "conserto", "assistência técnica", "assistencia tecnica", "chaveiro", "climatização", "climatizacao", "ar condicionado", "pintura", "marcenaria", "contabil", "contador", "consultoria"],
  ],
]

/**
 * Infere o nicho aproximado a partir de nome + descrição + público da marca.
 * Score por quantidade de keywords encontradas — o nicho com mais matches vence.
 */
export function inferNicho(brand: BrandContext): InspiracaoNicho {
  const hay = ` ${brand.name} ${brand.description ?? ""} ${brand.target_audience ?? ""} `.toLowerCase()

  let best: InspiracaoNicho = "geral"
  let bestScore = 0
  for (const [nicho, terms] of NICHO_KEYWORDS) {
    const score = terms.reduce((acc, t) => (hay.includes(t) ? acc + 1 : acc), 0)
    if (score > bestScore) {
      best = nicho
      bestScore = score
    }
  }
  return best
}

/**
 * Preenche os placeholders {{marca}} e {{publico}} do briefing.
 * Sem dados, cai em texto neutro ("sua marca" / "seu público").
 */
export function preencherBriefing(
  briefing: string,
  marca?: string | null,
  publico?: string | null,
): string {
  return briefing
    .replace(/\{\{marca\}\}/g, marca?.trim() || "sua marca")
    .replace(/\{\{publico\}\}/g, publico?.trim() || "seu público")
}

/**
 * Bloco de contexto da marca pra prefixar briefings (sugestões e datas).
 */
export function buildContextoMarca(brand: BrandContext): string {
  return [
    `Esse conteúdo é da marca "${brand.name}".`,
    brand.description ? `Sobre a marca: ${brand.description}.` : "",
    brand.target_audience ? `Público-alvo: ${brand.target_audience}.` : "",
    brand.tone_of_voice ? `Tom de voz: ${brand.tone_of_voice}.` : "",
    "Adapte o conteúdo abaixo pra essa marca específica, sem genérico.",
  ]
    .filter(Boolean)
    .join(" ")
}

/**
 * Catálogo genérico (sem marca): curado a um punhado — trends primeiro, com
 * variedade de categoria — pra não jogar 30 cards genéricos na cara.
 */
export function getInspiracoesGenericas(
  limit = 9,
): Array<Inspiracao & { personalizada: boolean }> {
  // trends primeiro; depois preenche variando a categoria pra não repetir.
  const trends = INSPIRACOES.filter((i) => i.trend)
  const resto = INSPIRACOES.filter((i) => !i.trend)
  const diversos: Inspiracao[] = []
  const vistas = new Set<InspiracaoCategoria>()
  for (const i of resto) {
    if (!vistas.has(i.categoria)) {
      diversos.push(i)
      vistas.add(i.categoria)
    }
  }
  const selecionadas = [...trends, ...diversos, ...resto]
    .filter((i, idx, arr) => arr.findIndex((x) => x.id === i.id) === idx)
    .slice(0, limit)

  return selecionadas.map((i) => ({
    ...i,
    briefing: preencherBriefing(i.briefing),
    personalizada: false,
  }))
}

/**
 * Retorna sugestões personalizadas pra marca, ordenadas por relevância:
 * 1. do nicho da marca E alinhadas ao(s) objetivo(s) principal(is)
 * 2. demais do nicho da marca
 * 3. gerais alinhadas ao(s) objetivo(s)
 * 4. demais gerais
 * Injeta nome da marca + público-alvo nos briefings (placeholders + contexto).
 */
export function getInspiracoesParaMarca(
  brand: BrandContext,
  limit = 9,
): Array<Inspiracao & { briefing: string; personalizada: boolean }> {
  const nicho = inferNicho(brand)
  const categorias = objetivosToCategorias(brand.main_objective)
  const base = getInspiracoesByNicho(nicho)

  const prioridade = (i: Inspiracao): number => {
    const nichoMatch = nicho !== "geral" && i.nichos.includes(nicho)
    const objetivoMatch = categorias.includes(i.categoria)
    if (nichoMatch && objetivoMatch) return 0
    if (nichoMatch) return 1
    if (objetivoMatch) return 2
    return 3
  }

  // Ordena por prioridade; empate resolve por trend primeiro.
  const ordered = [...base].sort((a, b) => {
    const diff = prioridade(a) - prioridade(b)
    if (diff !== 0) return diff
    return (a.trend ? 0 : 1) - (b.trend ? 0 : 1)
  })

  const contexto = buildContextoMarca(brand)

  // CURADORIA: só as mais relevantes (nicho/objetivo no topo). Antes devolvia
  // o catálogo inteiro (nicho + TODAS as gerais), o que floodava de genérico.
  return ordered.slice(0, limit).map((i) => ({
    ...i,
    briefing: `${contexto}\n\n${preencherBriefing(i.briefing, brand.name, brand.target_audience)}`,
    personalizada: true,
  }))
}

export function getInspiracoesByNicho(nicho: InspiracaoNicho): Inspiracao[] {
  if (nicho === "geral") return INSPIRACOES
  return INSPIRACOES.filter(
    (i) => i.nichos.includes(nicho) || i.nichos.includes("geral"),
  )
}

export function getInspiracao(id: string): Inspiracao | null {
  return INSPIRACOES.find((i) => i.id === id) ?? null
}
