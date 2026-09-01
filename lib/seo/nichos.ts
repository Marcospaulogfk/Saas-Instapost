// Conteúdo das páginas públicas de SEO programático (/modelos/carrossel/[nicho]).
// Fonte: SEO-PROGRAMATICO-NICHOS.md (10 nichos priorizados, fase 1 da pesquisa).
// Arquivo server-safe (sem "use client"): consumido tanto pelo Server Component
// da página quanto, via import type, pela ilha client da galeria.

import type { PreviewSlide } from "@/components/carousel/slide-preview"

export interface NichoFaq {
  pergunta: string
  resposta: string
}

export interface NichoSeo {
  slug: string
  /** Nome de exibição (H1, cards, breadcrumb). */
  nome: string
  keywordPrimaria: string
  keywordsSecundarias: string[]
  dor: string
  /** Os 4 temas de carrossel que esse nicho mais posta. */
  temas: string[]
  propostaDeValor: string
  /** Slides de demonstração (capa + conteúdo + CTA) no shape que o SlidePreview consome. */
  demoSlides: PreviewSlide[]
  /** Briefing de 1-2 frases usado pra pré-preencher o wizard no CTA. */
  briefExemplo: string
  faq: NichoFaq[]
}

// Placeholder de imagem: os previews públicos não têm foto real (custaria
// geração de IA por visita), então as zonas de imagem viram o mesmo placeholder
// "IMAGEM" que o produto usa antes de gerar.
const NO_IMAGE = { url: null, source: null, attribution: null, error: null } as const

// Exportado (não só interno) pra que lib/seo/templates-nicho.ts monte os
// demoSlides dos templates por nicho com o mesmo shape capa/conteúdo/CTA,
// sem duplicar o array de PreviewSlide na mão.
export function slides(
  capa: { title: string; highlight: string[]; subtitle: string; badge: string },
  conteudo: {
    title: string
    highlight: string[]
    subtitle: string
    body: string
    badge: string
  },
  cta: { title: string; highlight: string[]; subtitle: string; badge: string },
): PreviewSlide[] {
  return [
    {
      order_index: 0,
      title: capa.title,
      highlight_words: capa.highlight,
      subtitle: capa.subtitle,
      cta_badge: capa.badge,
      image: { ...NO_IMAGE },
    },
    {
      order_index: 1,
      title: conteudo.title,
      highlight_words: conteudo.highlight,
      subtitle: conteudo.subtitle,
      body: conteudo.body,
      cta_badge: conteudo.badge,
      image: { ...NO_IMAGE },
    },
    {
      order_index: 2,
      title: cta.title,
      highlight_words: cta.highlight,
      subtitle: cta.subtitle,
      cta_badge: cta.badge,
      image: { ...NO_IMAGE },
    },
  ]
}

// Piloto reduzido a 5 nichos ATIVOS por decisão do dono (01/09/2026), pra
// concentrar a produção de templates. Ordem de prioridade: nutricionista,
// advogado, dentista, psicólogo, personal-trainer. Os outros 5 nichos que já
// tinham ficha pronta viraram NICHOS_RESERVA (dados intactos, voltam na onda 2).
export const NICHOS: NichoSeo[] = [
  {
    slug: "nutricionista",
    nome: "Nutricionista",
    keywordPrimaria: "carrossel para nutricionista",
    keywordsSecundarias: [
      "post para instagram de nutricionista",
      "template carrossel nutrição",
      "ideias de post para nutricionista",
      "conteúdo instagram nutricionista",
      "arte para nutricionista",
    ],
    dor: "Precisa postar todo dia pra manter autoridade e captar paciente particular, mas não tem tempo nem habilidade de design. Recorre a templates genéricos do Canva que não têm vocabulário de nutrição: nada de gráfico de macro, prato ou lista de alimento.",
    temas: [
      "Mitos e verdades sobre dieta",
      "5 alimentos que ajudam a emagrecer",
      "Antes e depois de paciente (com autorização)",
      "Rotina de café da manhã saudável",
    ],
    propostaDeValor:
      "Você sai da consulta e em minutos tem um carrossel pronto sobre o tema do dia, com visual de clínica de nutrição (cores clean, estrutura de mito e verdade) em vez de um template genérico que parece feito pra qualquer nicho.",
    demoSlides: slides(
      {
        title: "5 mitos da dieta que seus pacientes ainda acreditam",
        highlight: ["mitos"],
        subtitle: "O que a ciência já derrubou, mas continua repetido nas redes.",
        badge: "Nutrição",
      },
      {
        title: "Mito: comer de 3 em 3 horas acelera o metabolismo",
        highlight: ["Mito"],
        subtitle: "A verdade depende da rotina de cada paciente, não de uma regra fixa.",
        body: "O metabolismo reage ao total calórico e à composição da dieta ao longo do dia, não ao número de refeições. Explique isso com um exemplo prático e o paciente entende de vez.",
        badge: "Mito 01",
      },
      {
        title: "Salve este post e leve pro seu próximo paciente",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e use na próxima consulta.",
        badge: "Siga @suaclinica",
      },
    ),
    briefExemplo:
      "Carrossel para nutricionista sobre os 5 mitos mais comuns que os pacientes acreditam sobre dieta, com linguagem acolhedora e visual clean de clínica de nutrição.",
    faq: [
      {
        pergunta: "O carrossel serve pra falar de um caso de paciente real?",
        resposta:
          "Sim, mas sempre com autorização do paciente. Descreva o caso no briefing (sem precisar citar nome) e a IA monta o antes e depois no formato educativo que já converte melhor pra captação.",
      },
      {
        pergunta: "Preciso saber usar Canva ou qualquer editor de design?",
        resposta:
          "Não. Você escreve o tema do dia em uma frase, escolhe o estilo visual e a IA gera o roteiro completo, com o design pronto. Editar depois é sempre grátis.",
      },
      {
        pergunta: "Dá pra manter a mesma identidade visual em todos os posts?",
        resposta:
          "Sim. Você cadastra a cor e o tom da sua marca uma vez e todo carrossel novo sai com essa identidade, sem precisar reconfigurar a cada post.",
      },
      {
        pergunta: "O texto sai pronto pra postar ou preciso revisar?",
        resposta:
          "O roteiro sai pronto, mas como conteúdo de saúde exige responsabilidade profissional, recomendamos sempre revisar antes de publicar.",
      },
    ],
  },
  {
    slug: "advogado",
    nome: "Advogado",
    keywordPrimaria: "carrossel para advogado",
    keywordsSecundarias: [
      "post para instagram de advogado",
      "template carrossel advocacia",
      "conteúdo jurídico instagram",
      "ideias de post para advogado",
      "arte para escritório de advocacia",
    ],
    dor: "Precisa parecer sério e confiável (a OAB não deixa parecer vendedor), mas os templates de design disponíveis são coloridos e informais demais para o tom jurídico exigido.",
    temas: [
      "Você sabia que tem direito a...",
      "Mitos sobre um tipo de processo",
      "Passo a passo de um processo comum",
      "Erros que fazem você perder uma causa",
    ],
    propostaDeValor:
      "Gera carrossel com tom sério e visual profissional, sem apelo comercial excessivo, já estruturado pro formato educativo que engaja no nicho jurídico, sem você precisar abrir um editor e ajustar cor e fonte pra não parecer propaganda.",
    demoSlides: slides(
      {
        title: "Você sabia que tem direito a rescisão indireta?",
        highlight: ["direito"],
        subtitle: "Casos comuns que passam batido e o trabalhador não reclama.",
        badge: "Direito Trabalhista",
      },
      {
        title: "Passo 1: reúna as provas antes de qualquer conversa",
        highlight: ["Passo 1"],
        subtitle: "O que vale como prova e o que não ajuda em nada no processo.",
        body: "Mensagens, e-mails e testemunhas contam mais do que parece. Organize tudo com data antes de procurar um advogado: isso muda o tempo do processo inteiro.",
        badge: "Passo a passo",
      },
      {
        title: "Salve este post pra consultar quando precisar",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e volte quando for útil.",
        badge: "Siga @seuescritorio",
      },
    ),
    briefExemplo:
      "Carrossel para advogado trabalhista explicando o passo a passo pra reunir provas antes de entrar com um processo, em tom sério e educativo, sem apelo comercial.",
    faq: [
      {
        pergunta: "O conteúdo respeita as regras da OAB de publicidade?",
        resposta:
          "O produto gera o roteiro e o visual no tom educativo (sem promessa de resultado nem apelo comercial), mas a revisão final do texto à luz do provimento da OAB continua sendo sua responsabilidade.",
      },
      {
        pergunta: "Dá pra usar pra qualquer área do direito?",
        resposta:
          "Sim. Descreva a área e o tema no briefing (trabalhista, cível, família, tributário) e a IA adapta o vocabulário e os exemplos.",
      },
      {
        pergunta: "O visual fica sério o suficiente pra um escritório?",
        resposta:
          "Sim, existem estilos com tom mais sóbrio (preto e branco, tipografia editorial) que fogem do visual colorido genérico de template de design.",
      },
      {
        pergunta: "Posso postar sobre um caso específico do escritório?",
        resposta:
          "Pode, desde que sem identificar o cliente. Descreva a situação de forma genérica no briefing e a IA transforma em conteúdo educativo.",
      },
    ],
  },
  {
    slug: "dentista",
    nome: "Dentista",
    keywordPrimaria: "carrossel para dentista",
    keywordsSecundarias: [
      "post para instagram de dentista",
      "template carrossel odontologia",
      "ideias de post para clínica odontológica",
      "conteúdo instagram dentista",
      "arte para consultório odontológico",
    ],
    dor: "Clínica pequena não tem verba pra agência e o dentista não tem tempo entre atendimentos. Precisa de conteúdo educativo e antes e depois que transmita confiança sem parecer clínica de grife.",
    temas: [
      "Mitos sobre clareamento e tratamento de canal",
      "Antes e depois de caso (com autorização)",
      "Sinais de que você precisa ir ao dentista",
      "Cuidados pós-procedimento",
    ],
    propostaDeValor:
      "Cria carrossel com visual clínico e confiável, focado em educar o paciente sobre procedimento e prevenção, no formato que já converte melhor pra captação de consulta nesse nicho.",
    demoSlides: slides(
      {
        title: "3 sinais de que você precisa ir ao dentista agora",
        highlight: ["3 sinais"],
        subtitle: "Nem toda dor de dente espera a consulta de rotina.",
        badge: "Odontologia",
      },
      {
        title: "Sinal 1: sensibilidade que não passa em uma semana",
        highlight: ["Sinal 1"],
        subtitle: "Pode ser algo simples ou o início de um problema maior.",
        body: "Sensibilidade persistente costuma indicar desgaste do esmalte ou início de cárie. Quanto antes for avaliada, mais simples e barato é o tratamento.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e agende sua avaliação",
        highlight: ["agende"],
        subtitle: "Toque em salvar e marque sua consulta.",
        badge: "Siga @suaclinica",
      },
    ),
    briefExemplo:
      "Carrossel para dentista sobre os sinais de que o paciente precisa marcar uma consulta, tom acolhedor e visual clínico e confiável.",
    faq: [
      {
        pergunta: "Dá pra postar caso de antes e depois de um paciente?",
        resposta:
          "Sim, sempre com autorização por escrito do paciente. O estilo Cards e o Impacto têm layout pensado pra valorizar foto de antes e depois sem cortar o resultado.",
      },
      {
        pergunta: "O tom fica clínico demais ou dá pra ser mais leve?",
        resposta:
          "Você escolhe. Descreva no briefing se quer um tom mais técnico ou mais próximo, e a IA ajusta o vocabulário mantendo a credibilidade.",
      },
      {
        pergunta: "Serve pra clínica com mais de um dentista?",
        resposta:
          "Serve. Você cadastra a identidade visual da clínica (não da pessoa) e todo post sai consistente, mesmo alternando quem posta.",
      },
      {
        pergunta: "Consigo gerar conteúdo sobre um procedimento específico?",
        resposta:
          "Sim. Descreva o procedimento no briefing (clareamento, canal, implante) e a IA monta o roteiro educativo sobre esse tema.",
      },
    ],
  },
  {
    slug: "psicologo",
    nome: "Psicólogo",
    keywordPrimaria: "carrossel para psicólogo",
    keywordsSecundarias: [
      "post para instagram de psicólogo",
      "template carrossel saúde mental",
      "ideias de post para psicólogo",
      "conteúdo instagram terapia",
      "arte para consultório de psicologia",
    ],
    dor: "Precisa gerar conteúdo educativo sobre saúde mental sem parecer clínico demais nem raso demais, e o código de ética da profissão limita o tom vendedor comum em outros nichos.",
    temas: [
      "Sinais de ansiedade e burnout",
      "Mitos sobre terapia",
      "Por que terapia não é só pra quem está mal",
      "Diferença entre tipos de abordagem terapêutica",
    ],
    propostaDeValor:
      "Produz carrossel com tom acolhedor e visual leve, adequado ao jeito de comunicar do nicho de saúde mental, ajudando você a manter presença educativa no Instagram sem soar como propaganda de consultório.",
    demoSlides: slides(
      {
        title: "5 sinais de burnout que passam despercebidos",
        highlight: ["burnout"],
        subtitle: "Nem sempre é cansaço: às vezes é o corpo pedindo pausa.",
        badge: "Saúde mental",
      },
      {
        title: "Mito: terapia é só pra quem está em crise",
        highlight: ["Mito"],
        subtitle: "O acompanhamento preventivo também é terapia, e vale muito.",
        body: "Buscar terapia antes da crise é como fazer check up antes de adoecer. Quem chega assim tem mais espaço pra trabalhar padrões, não só apagar incêndio.",
        badge: "Mito 01",
      },
      {
        title: "Salve este post pra quando precisar lembrar",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e volte quando fizer sentido.",
        badge: "Siga @seuconsultorio",
      },
    ),
    briefExemplo:
      "Carrossel para psicólogo sobre sinais de burnout que passam despercebidos, tom acolhedor, visual leve e sem apelo clínico.",
    faq: [
      {
        pergunta: "O conteúdo respeita o código de ética do CFP?",
        resposta:
          "O roteiro é gerado em tom educativo, sem promessa de resultado terapêutico nem apelo comercial, mas a revisão final à luz do código de ética continua sendo sua responsabilidade.",
      },
      {
        pergunta: "Dá pra falar sobre uma abordagem terapêutica específica?",
        resposta:
          "Sim. Descreva a abordagem no briefing (TCC, psicanálise, humanista) e a IA adapta o vocabulário ao público leigo, sem perder precisão.",
      },
      {
        pergunta: "O visual consegue transmitir acolhimento, não frieza?",
        resposta:
          "Sim, os estilos Minimalista e Lista Cream têm paleta clara e tipografia leve, feitos pra esse tom mais acolhedor.",
      },
      {
        pergunta: "Posso adaptar o conteúdo pro meu público específico?",
        resposta:
          "Pode. Descreva o público no briefing (adolescentes, casais, terceira idade) e o roteiro se ajusta à linguagem certa.",
      },
    ],
  },
  {
    slug: "personal-trainer",
    nome: "Personal Trainer",
    keywordPrimaria: "carrossel para personal trainer",
    keywordsSecundarias: [
      "post para instagram de personal trainer",
      "template carrossel treino",
      "ideias de post para personal",
      "conteúdo instagram academia",
      "arte para treino instagram",
    ],
    dor: "Precisa postar treino, dica e resultado de aluno com frequência alta pra captar aluno online, mas grava vídeo o dia todo e não sobra tempo pra montar carrossel bonito.",
    temas: [
      "5 exercícios para...",
      "Erros comuns na execução de um exercício",
      "Antes e depois de aluno",
      "Mitos sobre treino e dieta",
    ],
    propostaDeValor:
      "Transforma a rotina de treino do dia em carrossel pronto pro Instagram em poucos minutos, com estrutura de lista e destaque de exercício que já funciona nesse nicho, sem precisar editar imagem por imagem.",
    demoSlides: slides(
      {
        title: "5 exercícios para fortalecer a lombar sem dor",
        highlight: ["5 exercícios"],
        subtitle: "A sequência que uso com aluno sedentário na primeira semana.",
        badge: "Treino",
      },
      {
        title: "Erro comum: descer rápido demais no agachamento",
        highlight: ["Erro comum"],
        subtitle: "A pressa é o que mais tira o resultado do exercício.",
        body: "Controle a descida em 3 segundos e sinta o glúteo trabalhando antes de subir. Esse ajuste sozinho já muda o resultado de quem treina errado há meses.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e comece hoje mesmo",
        highlight: ["hoje"],
        subtitle: "Toque em salvar e leve pro seu próximo treino.",
        badge: "Siga @seutreino",
      },
    ),
    briefExemplo:
      "Carrossel para personal trainer com 5 exercícios pra fortalecer a lombar sem dor, linguagem direta e motivadora, visual de academia moderna.",
    faq: [
      {
        pergunta: "Dá pra postar resultado de aluno (antes e depois)?",
        resposta:
          "Sim, com a autorização do aluno. Descreva o resultado no briefing e escolha um estilo com destaque forte pra foto, como o Impacto ou o Cards.",
      },
      {
        pergunta: "Funciona pra quem treina em casa e não só personal de academia?",
        resposta:
          "Sim. O conteúdo se adapta ao contexto que você descrever no briefing: academia, treino em casa, online ou ao ar livre.",
      },
      {
        pergunta: "Consigo manter a mesma cor da minha marca em todo post?",
        resposta:
          "Sim, sua paleta e seu handle ficam salvos e aparecem automaticamente em cada carrossel novo.",
      },
      {
        pergunta: "Preciso ter foto profissional pra usar a ferramenta?",
        resposta:
          "Não é obrigatório. Você pode gerar imagem com IA ou subir suas próprias fotos de treino e aluno.",
      },
    ],
  },
]

// Reserva da onda 2 (decisão de 01/09/2026): fichas prontas, mas fora do
// piloto por enquanto. Não alimentam sitemap, generateStaticParams nem os
// chips de profissões — voltam pra NICHOS quando a produção de templates
// abrir espaço.
export const NICHOS_RESERVA: NichoSeo[] = [
  {
    slug: "esteticista",
    nome: "Esteticista",
    keywordPrimaria: "carrossel para esteticista",
    keywordsSecundarias: [
      "post para instagram de esteticista",
      "template carrossel estética",
      "ideias de post para esteticista",
      "conteúdo instagram estética facial",
      "arte para procedimento estético",
    ],
    dor: "O resultado do trabalho é visual (pele, rosto, corpo), mas grande parte trabalha sozinha em casa ou salão pequeno e não sabe montar um antes e depois que pareça profissional.",
    temas: [
      "Antes e depois de procedimento",
      "O que esperar da sua primeira sessão de...",
      "Cuidados antes e depois do procedimento",
      "Mitos sobre um tratamento específico",
    ],
    propostaDeValor:
      "Gera carrossel com destaque forte pra foto de antes e depois (a peça que mais vende no nicho) já dentro de um layout que valoriza a imagem sem cortar nem distorcer o resultado do procedimento.",
    demoSlides: slides(
      {
        title: "O que esperar da sua primeira sessão de limpeza de pele",
        highlight: ["primeira sessão"],
        subtitle: "Do que sente durante ao resultado que aparece nos dias seguintes.",
        badge: "Estética",
      },
      {
        title: "Cuidado 1: evite sol direto nas primeiras 48 horas",
        highlight: ["Cuidado 1"],
        subtitle: "A pele fica mais sensível logo depois do procedimento.",
        body: "Protetor solar todos os dias, inclusive em casa, e nada de exposição direta na primeira semana. Esse cuidado simples evita manchas e prolonga o resultado.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e leve pra sua próxima cliente",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e envie pra quem perguntar.",
        badge: "Siga @suaestetica",
      },
    ),
    briefExemplo:
      "Carrossel para esteticista explicando o que esperar da primeira sessão de limpeza de pele, com cuidados pós procedimento, visual clean e acolhedor.",
    faq: [
      {
        pergunta: "O layout consegue destacar bem uma foto de antes e depois?",
        resposta:
          "Sim, esse é o ponto forte do formato: os estilos Cards e Minimalista foram pensados pra dar espaço grande à foto, sem cortar rosto nem distorcer o resultado.",
      },
      {
        pergunta: "Preciso de câmera profissional pra tirar a foto?",
        resposta:
          "Não. Foto de celular com boa luz funciona bem. Você também pode combinar foto real com imagem gerada por IA nos slides educativos.",
      },
      {
        pergunta: "Dá pra usar pra qualquer tipo de procedimento estético?",
        resposta:
          "Sim, descreva o procedimento no briefing (facial, corporal, capilar) e a IA adapta o vocabulário e os cuidados mencionados.",
      },
      {
        pergunta: "O texto já vem com aviso de resultado individual?",
        resposta:
          "A IA evita promessa de resultado garantido no roteiro, mas revise sempre o texto final antes de publicar, principalmente em posts de antes e depois.",
      },
    ],
  },
  {
    slug: "corretor-de-imoveis",
    nome: "Corretor de Imóveis",
    keywordPrimaria: "carrossel para corretor de imóveis",
    keywordsSecundarias: [
      "post para instagram de imobiliária",
      "template carrossel imóveis",
      "ideias de post para corretor",
      "conteúdo instagram imóvel à venda",
      "arte para anúncio de imóvel",
    ],
    dor: "Precisa anunciar imóvel de forma atraente e ainda postar conteúdo educativo sobre financiamento e documentação, mas a maioria trabalha sozinha ou em imobiliária pequena sem designer.",
    temas: [
      "Tour de imóvel (fotos e características)",
      "Passo a passo de financiamento",
      "Documentos necessários pra comprar imóvel",
      "Erros comuns na hora de comprar ou alugar",
    ],
    propostaDeValor:
      "Cria carrossel de imóvel com layout que organiza foto, preço e características de forma clara, além de conteúdo educativo sobre o processo de compra, tudo sem precisar contratar designer pra cada anúncio.",
    demoSlides: slides(
      {
        title: "4 documentos que você precisa antes de comprar um imóvel",
        highlight: ["4 documentos"],
        subtitle: "Separe tudo isso antes de marcar a visita com o corretor.",
        badge: "Imóveis",
      },
      {
        title: "Documento 1: certidão negativa de débitos do imóvel",
        highlight: ["Documento 1"],
        subtitle: "Evita comprar um imóvel com dívida pendente no nome do vendedor.",
        body: "Peça essa certidão direto na prefeitura ou no site do município. Sem ela, você corre o risco de herdar uma dívida que não era sua.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e leve pro seu próximo cliente",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e envie pra quem está comprando.",
        badge: "Siga @seucreci",
      },
    ),
    briefExemplo:
      "Carrossel para corretor de imóveis explicando os documentos necessários antes de comprar um imóvel, tom didático e visual profissional.",
    faq: [
      {
        pergunta: "Dá pra montar o tour de um imóvel específico com as fotos reais?",
        resposta:
          "Sim. Suba as fotos do imóvel e a IA organiza título, preço e características no layout, sem precisar montar isso manualmente num editor.",
      },
      {
        pergunta: "Funciona pra conteúdo educativo, não só anúncio?",
        resposta:
          "Sim, essa é uma das quatro linhas de conteúdo do nicho: financiamento, documentação e erros comuns rendem carrossel educativo que gera autoridade, não só venda direta.",
      },
      {
        pergunta: "Dá pra usar pra imobiliária, não só corretor autônomo?",
        resposta:
          "Dá. A identidade visual (cor, logo, CRECI) fica salva na marca e todo post sai padronizado, ainda que vários corretores postem pela mesma conta.",
      },
      {
        pergunta: "As informações sobre financiamento são atualizadas?",
        resposta:
          "O roteiro segue o que você descrever no briefing. Como regras de financiamento mudam, sempre confira os números e prazos antes de publicar.",
      },
    ],
  },
  {
    slug: "social-media",
    nome: "Social Media",
    keywordPrimaria: "carrossel para social media",
    keywordsSecundarias: [
      "template carrossel para clientes",
      "ferramenta de carrossel para agência",
      "post para instagram de cliente",
      "gerador de carrossel para social media",
      "arte para múltiplos clientes",
    ],
    dor: "Atende vários clientes de nichos diferentes e precisa entregar conteúdo de qualidade em volume, mas monta tudo manualmente em um editor de design, perdendo tempo que devia ser cobrado.",
    temas: [
      "Estrutura de carrossel educativo genérico (adaptável por cliente)",
      "Prova social e depoimento",
      "Lista de dicas do nicho do cliente",
      "Antes e depois de resultado do cliente",
    ],
    propostaDeValor:
      "Dá a você uma forma de gerar carrossel pronto pra qualquer nicho de cliente em poucos minutos, permitindo atender mais contas sem aumentar o tempo gasto em design, com resultado consistente entre um cliente e outro.",
    demoSlides: slides(
      {
        title: "Por que seu concorrente posta 10x mais que você",
        highlight: ["10x mais"],
        subtitle: "Não é mais gente na equipe, é outro processo de produção.",
        badge: "Social Media",
      },
      {
        title: "Etapa 1: separe roteiro de design no seu fluxo",
        highlight: ["Etapa 1"],
        subtitle: "Misturar as duas coisas é o que mais trava a produção em volume.",
        body: "Gere o roteiro e a arte juntos com IA, revise o resultado e ajuste só o que precisa. O tempo que sobra vai pra estratégia de cada cliente, que é o que ninguém mais entrega.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e use no próximo briefing",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e mostre pra sua equipe.",
        badge: "Siga @suaagencia",
      },
    ),
    briefExemplo:
      "Carrossel para social media explicando como escalar a produção de conteúdo pra vários clientes sem perder qualidade, tom direto e prático.",
    faq: [
      {
        pergunta: "Dá pra gerenciar vários clientes com identidades diferentes?",
        resposta:
          "Sim. O produto tem gestão multi marca: você cadastra cor, tom e handle de cada cliente e troca de contexto num clique, sem misturar identidade visual.",
      },
      {
        pergunta: "Consigo entregar carrossel pra nichos que nunca trabalhei?",
        resposta:
          "Sim, essa é a vantagem: a IA já tem vocabulário pros nichos mais comuns (saúde, jurídico, imóvel, estética, entre outros), você só ajusta o briefing por cliente.",
      },
      {
        pergunta: "Sai mais barato do que montar tudo manualmente por hora?",
        resposta:
          "Na prática, sim: o tempo de produção cai de horas pra minutos por carrossel, e editar depois de gerado é sempre grátis.",
      },
      {
        pergunta: "Consigo manter meu próprio padrão de qualidade em cima do que a IA gera?",
        resposta:
          "Sim, tudo é editável: texto, cor, imagem e layout. A IA entrega a base pronta, você refina o que for específico de cada cliente.",
      },
    ],
  },
  {
    slug: "barbearia",
    nome: "Barbearia",
    keywordPrimaria: "carrossel para barbearia",
    keywordsSecundarias: [
      "post para instagram de barbearia",
      "template carrossel barbeiro",
      "ideias de post para barbearia",
      "conteúdo instagram corte de cabelo",
      "arte para barbearia",
    ],
    dor: "Negócio local que depende do Instagram pra atrair cliente de bairro, mas o dono corta cabelo o dia todo e não tem tempo nem know-how de design pra postar com frequência.",
    temas: [
      "Antes e depois de corte",
      "Tipos de corte pra cada formato de rosto",
      "Cuidados com a barba",
      "Promoção do mês e pacote de serviço",
    ],
    propostaDeValor:
      "Gera carrossel com visual moderno de barbearia (antes e depois de corte, grade de estilos) pronto em minutos, ajudando você a manter o Instagram ativo sem tirar tempo da cadeira.",
    demoSlides: slides(
      {
        title: "3 cortes que mais saem na barbearia esse mês",
        highlight: ["3 cortes"],
        subtitle: "Do clássico ao moderno, pra você escolher na cadeira.",
        badge: "Barbearia",
      },
      {
        title: "Corte 1: undercut com risco lateral",
        highlight: ["Corte 1"],
        subtitle: "Combina com rosto oval e é fácil de manter no dia a dia.",
        body: "Peça o degradê baixo nas laterais e mais comprimento no topo. Funciona bem pra quem quer trocar o visual sem exagerar na manutenção.",
        badge: "Dica 01",
      },
      {
        title: "Salve este post e mostre na sua próxima visita",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e traga a referência.",
        badge: "Siga @suabarbearia",
      },
    ),
    briefExemplo:
      "Carrossel para barbearia mostrando 3 cortes em alta esse mês, tom moderno e direto, visual de barbearia com grade de estilos.",
    faq: [
      {
        pergunta: "Dá pra postar antes e depois de um corte real?",
        resposta:
          "Sim, o estilo Impacto e o Cards foram pensados pra destacar foto de antes e depois sem cortar o resultado do corte.",
      },
      {
        pergunta: "Preciso saber usar algum programa de edição?",
        resposta:
          "Não. Você descreve o tema (um corte, uma promoção, um cuidado com barba) e a IA gera o carrossel completo, pronto pra postar.",
      },
      {
        pergunta: "Dá pra divulgar promoção do mês nesse formato?",
        resposta:
          "Sim, é um dos quatro temas que mais funcionam pro nicho. Descreva a promoção no briefing e o roteiro sai com a chamada certa.",
      },
      {
        pergunta: "Funciona pra barbearia com mais de um barbeiro na equipe?",
        resposta:
          "Funciona. A identidade da barbearia (cor, logo, handle) fica salva e todo post sai padronizado, independente de quem estiver postando.",
      },
    ],
  },
  {
    slug: "clinica-de-estetica",
    nome: "Clínica de Estética",
    keywordPrimaria: "carrossel para clínica de estética",
    keywordsSecundarias: [
      "post para instagram de clínica de estética",
      "template carrossel estética facial e corporal",
      "ideias de post para clínica",
      "conteúdo instagram procedimento estético",
      "arte para clínica de estética",
    ],
    dor: "Tem mais de um procedimento e profissional pra divulgar, precisa de consistência visual de marca (diferente da esteticista autônoma) e já lida com concorrência de outras clínicas na região.",
    temas: [
      "Antes e depois por procedimento",
      "Comparação entre dois tratamentos (qual escolher)",
      "O que é um procedimento específico",
      "Depoimento e prova social de paciente",
    ],
    propostaDeValor:
      "Entrega carrossel com identidade visual consistente entre os posts da clínica (não um template solto por post), destacando antes e depois e comparação de procedimento, no formato que sustenta autoridade de clínica frente à concorrência local.",
    demoSlides: slides(
      {
        title: "Botox ou bioestimulador: qual escolher primeiro",
        highlight: ["Botox", "bioestimulador"],
        subtitle: "A resposta muda com a idade e o objetivo do paciente.",
        badge: "Clínica de Estética",
      },
      {
        title: "Diferença 1: o botox trata a expressão, o bioestimulador o volume",
        highlight: ["Diferença 1"],
        subtitle: "Entender isso evita procedimento errado pro objetivo do paciente.",
        body: "Botox relaxa a musculatura que causa a ruga de expressão. Bioestimulador estimula colágeno e devolve firmeza. Em muitos casos, os dois se complementam.",
        badge: "Comparação",
      },
      {
        title: "Salve este post e leve pra avaliação do paciente",
        highlight: ["Salve"],
        subtitle: "Toque em salvar e use na próxima consulta.",
        badge: "Siga @suaclinica",
      },
    ),
    briefExemplo:
      "Carrossel para clínica de estética comparando botox e bioestimulador de colágeno, tom técnico e confiável, visual consistente de clínica.",
    faq: [
      {
        pergunta: "Dá pra manter a identidade da clínica com vários profissionais postando?",
        resposta:
          "Sim, esse é o problema que o formato resolve: a identidade visual (cor, tipografia, handle) fica salva na marca da clínica, não na pessoa que posta.",
      },
      {
        pergunta: "Consigo comparar dois procedimentos no mesmo carrossel?",
        resposta:
          "Sim, é um dos quatro temas mais fortes do nicho. Descreva os dois procedimentos no briefing e a IA monta a comparação de forma didática.",
      },
      {
        pergunta: "Depoimento de paciente pode virar carrossel?",
        resposta:
          "Pode, com autorização do paciente. Descreva o depoimento no briefing e escolha um estilo com espaço de destaque pro texto, como o Revista ou o Perfil.",
      },
      {
        pergunta: "O texto evita promessa de resultado, que é proibido em publicidade de saúde?",
        resposta:
          "A IA evita afirmações de resultado garantido no roteiro, mas a revisão final do texto quanto às normas do seu conselho profissional continua sendo responsabilidade da clínica.",
      },
    ],
  },
]

export function nichoPorSlug(slug: string): NichoSeo | undefined {
  return NICHOS.find((n) => n.slug === slug)
}

// Fonte única de title/description das páginas de nicho: usada tanto pelo
// generateMetadata da página real quanto pelo endpoint de preview SERP do
// CRM (app/api/webhooks/websync-os/seo-pages), pra nunca divergir.
export function seoTitleNicho(nicho: NichoSeo): string {
  // O Google trunca o title por volta de 60 chars: em nome longo
  // (Nutricionista, Personal Trainer) o "Pronto" sai pra caber o
  // "Grátis com IA", que é o gancho de clique que não pode ser cortado.
  const completo = `Carrossel para ${nicho.nome} Pronto em Segundos | Grátis com IA`
  if (completo.length <= 60) return completo
  return `Carrossel para ${nicho.nome} em Segundos | Grátis com IA`
}

export function seoDescriptionNicho(nicho: NichoSeo): string {
  return `Descreva o tema e a IA monta seu carrossel de ${nicho.nome.toLowerCase()} completo: copy, design e arte em segundos. Modelos prontos pra editar. Comece grátis, sem cartão.`
}
