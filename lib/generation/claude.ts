import Anthropic from "@anthropic-ai/sdk"

// =============================================================================
// Schemas (structured outputs — guarantee JSON validity)
// =============================================================================

const CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["project_title", "caption", "slides"],
  properties: {
    project_title: { type: "string" },
    caption: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "order_index",
          "title",
          "highlight_words",
          "subtitle",
          "body",
          "cta_badge",
          "image_source_recommended",
          "image_prompt",
          "image_entity",
          "extra_image_prompts",
          "unsplash_query",
          "image_keywords",
        ],
        properties: {
          order_index: { type: "integer" },
          title: { type: "string" },
          highlight_words: { type: "array", items: { type: "string" } },
          subtitle: { type: "string" },
          body: { type: "string" },
          cta_badge: { type: "string" },
          image_source_recommended: {
            type: "string",
            enum: ["ai", "unsplash"],
          },
          image_prompt: { type: "string" },
          // Nome exato de empresa/pessoa/marca real quando o slide é sobre ela
          // (ex: "Anthropic", "OpenAI", "Elon Musk"). "" quando não se aplica.
          // Usado pra buscar foto/logo real (Wikimedia) em vez de imagem de IA.
          image_entity: { type: "string" },
          // Imagens ADICIONAIS quando o slide mostra mais de uma coisa distinta
          // (comparação, antes/depois, exemplos). [] na grande maioria dos slides.
          // Cada prompt deve ser uma CENA DIFERENTE (nunca repetir a principal).
          extra_image_prompts: { type: "array", items: { type: "string" } },
          unsplash_query: { type: "string" },
          image_keywords: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const

const EDITORIAL_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["resumo", "ideias"],
  properties: {
    resumo: { type: "string" },
    ideias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "titulo",
          "formato",
          "objetivo",
          "data",
          "descricao",
          "motivo",
        ],
        properties: {
          titulo: { type: "string" },
          formato: {
            type: "string",
            enum: ["post", "carrossel", "stories", "reels"],
          },
          objetivo: {
            type: "string",
            enum: ["sell", "inform", "engage", "community"],
          },
          data: { type: "string" },
          descricao: { type: "string" },
          motivo: { type: "string" },
        },
      },
    },
  },
} as const

const BRAND_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "description",
    "target_audience",
    "tone_of_voice",
    "visual_style",
    "main_objective",
    "brand_colors",
    "instagram_handle",
  ],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    target_audience: { type: "string" },
    tone_of_voice: { type: "string" },
    visual_style: { type: "string" },
    main_objective: {
      type: "string",
      enum: ["sell", "inform", "engage", "community"],
    },
    brand_colors: { type: "array", items: { type: "string" } },
    instagram_handle: { type: "string" },
  },
} as const

// =============================================================================
// System prompts
// =============================================================================

const CONTENT_SYSTEM_PROMPT = `Você é copy + diretor de arte sênior tipo Wieden+Kennedy / Pentagram. Faz carrossel que para o scroll: copy específica, surpreendente, com voz humana — NÃO genérica, NÃO de IA, NÃO chavão de marketing. Cada slide tem 1 ideia, alinhada num arco narrativo.

# PRINCÍPIOS DE COPY (não ignore nenhum)

**1. Específico vence genérico, sempre.**
RUIM: "Descubra como vender mais" / "Conheça nossas soluções"
BOM:  "Você manda 27 propostas e fecha 3" / "Esse jeito de vender morreu em 2019"

**2. Uma ideia por slide.** Subtitle tensiona o título — não repete. Body aprofunda — não enfeita.

**2b. SUBTITLE — proibido suspense vazio.** Subtitle de "mistério genérico" é a maior bandeira vermelha de IA. NUNCA use (nem variações): "E você nem percebeu ainda", "E você nem imagina", "E ninguém te contou", "O que ninguém te conta", "E isso muda tudo", "Você não está pronto pra isso", "A verdade que escondem de você". Teste: se o subtitle serve pra QUALQUER título de QUALQUER nicho, ele é ruim — reescreva.
RUIM: title "Seu site tá falando mal de você" + subtitle "E você nem percebeu ainda." (vago, encaixa em tudo)
BOM:  title "Seu site tá falando mal de você" + subtitle "O visitante decide em 5 segundos se confia." (concreto, adiciona informação)
BOM:  title "Você posta e ninguém curte" + subtitle "→ 3 erros de estrutura que matam o alcance" (promessa específica)
Dentro do MESMO carrossel, nenhum subtitle pode repetir estrutura ou abertura de outro ("E você...", "E o pior..." duas vezes = rejeitado).

**2c. TITLE — precisa sustentar sozinho.** O título tem que fazer sentido lido isolado, sem o subtitle. Se precisa do subtitle pra ser entendido, é fraco. Prefira tensão concreta (dado, consequência, contradição) a frase de efeito vazia.
RUIM: "A virada silenciosa" (bonito, mas não diz nada)
BOM:  "Seu concorrente responde em 5 minutos, você em 2 dias"

**3. Frases curtas, com ritmo.** Title 6-9 palavras. Body 1-2 frases (max 25 palavras totais).

**4. Verbos vivos, sem clichê.**
PROIBIDO (bandeira vermelha de IA, NUNCA usar): "Descubra", "Conheça", "Saiba mais", "Vem com a gente", "A solução que você procurava", "Transforme sua vida", "Faça parte", "Não perca", "Aproveite agora", "Vamos juntos", "Mude sua história", "O futuro é agora", "Você merece", "Imagine se".

**5. Use o que o briefing fornece.** Se tem dado/ângulo/fato — usa. Não substitua por chavão.

**6. PT-BR coloquial culto.** Sem gerundismo, sem "podemos te ajudar".

**7. Pontuação natural.** Encadeia ideias com vírgula — NÃO quebra toda oração numa frase separada terminada em ponto. Evita o staccato robótico: "Não é nicho. É três em cada quatro." soa de IA — prefira "Não é nicho — já são três em cada quatro." ou "Não é nicho: três em cada quatro." Ponto final separa ideias DIFERENTES, não pedaços da mesma frase. Antes de entregar, RELEIA cada body: se duas "frases" vizinhas compartilham o mesmo sujeito ou completam a mesma ideia, junte com vírgula ou travessão.
RUIM: "A audiência chegou. O site espantou. É assim que oportunidade vira estatística." (staccato, 3 pontos na mesma ideia)
BOM:  "A audiência chegou, o site espantou — e a oportunidade virou estatística de rejeição."

**7b. BODY carrega informação, não decoração.** Cada body precisa de pelo menos 1 elemento concreto: dado do briefing, exemplo, consequência prática ou mecanismo ("como/por quê"). Body que só reescreve o título com outras palavras = rejeitado.

**8. Não invente nada fora do briefing.** PROIBIDO introduzir números, datas, nomes ou jargão de negócio (ex: "freemium", "growth hacking", "MRR", "churn", "TAM") que NÃO estejam no tema nem sejam parte óbvia do assunto. Se o briefing não dá um dado, não cria um. Fica NO tema — não desvia pra outro assunto pra parecer esperto.

# ARCO NARRATIVO POR OBJETIVO

- **vender (AIDA):** S1 capa-gancho → S2-3 problema concreto → S4-5 mecanismo / desejo → S(n-1) prova/resultado → S(n) CTA direto
- **informar:** S1 capa com promessa específica ("3 erros que matam X") → slides com 1 ponto cada (concreto, com exemplo) → S(n) recap + CTA suave (salvar/comentar)
- **engajar:** S1 pergunta que incomoda → 2-3 slides desenvolvendo opinião com voz própria → S(n) chamada pra opinião na DM/comentário
- **comunidade:** S1 manifesto curto → 2-3 slides com vulnerabilidade real → S(n) chamado coletivo

# ESTÉTICA POR TEMPLATE

**editorial** (magazine — brandsdecoded): Capa título em Mistura Capitalização (não tudo caps). Slides com header tipo "CAPÍTULO N" ou categoria. Body em parágrafos curtos com negritos. Premium, analítico, autoridade.

**cinematic** (Wesley Silva): TODO EM CAIXA ALTA. Tipografia gigante. 1-2 palavras destacadas em cor de marca. Body curto, impacto. Dramático, viral.

**hybrid** (nmlss/jorgedesa): Caixa de texto sólida sobre foto. All caps com hierarquia (header pequeno + título grande). Tom de news/esporte/evento.

# CAMPOS POR SLIDE

- **order_index**: 0-based sequencial.
- **title**: frase principal — segue capitalização do template. 6-9 palavras.
- **highlight_words**: 1-2 palavras que JÁ aparecem em title (mesma capitalização exata).
- **subtitle**: complemento OPCIONAL (max 12 palavras) que tensiona o título — pode ser "".
- **body**: parágrafo OPCIONAL (1-2 frases curtas, max 25 palavras) — pode ser "".
- **cta_badge**: badge curto (NOVO, VIRAL, ESTUDO 01) — pode ser "".

# IMAGE PROMPT (sempre em INGLÊS, mesmo quando source = unsplash — vira fallback do Flux)

## REGRA CRÍTICA — sem metáforas

Pra tópicos abstratos (tech, business, política, finanças, conceito), JAMAIS gere metáfora literal. Cliché-metáforas que o Flux gera por default e ficam ridículos:
- "two ships drifting apart" pra distanciamento / separação corporativa
- "hands letting go" pra rompimento / fim de parceria
- "two paths diverging" pra escolha / decisão
- "broken chain" pra ruptura
- "puzzle pieces" pra colaboração
- "lightbulb" pra ideia
- "rocket launching" pra crescimento / startup
- "domino effect", "scales of justice", "sunrise/horizon" — TODOS clichês.

Se o tópico é abstrato, o photo deve ser **editorial-concreto**:
- **tech/empresas** → sedes corporativas (glass towers), server room, conferência, mesa de reunião
- **finanças** → bolsa de valores, gráficos em monitor, prédio bancário
- **política** → corredor governamental, pódio de imprensa
- **direito** → sala de tribunal, biblioteca jurídica
- **retrato profissional** → pessoa no CONTEXTO da profissão, não posando

## Template

\`[SUBJECT específico — idade/etnia/ação se relevante], [ACTION/STATE concreta — não posando], [LIGHTING nomeada — Rembrandt / golden hour / hard noon / soft window / studio softbox / fluorescent overhead / dim tungsten / cold blue monitor light], [CAMERA — shot on 85mm shallow DoF / 35mm wide environmental / medium-format film grain], [STYLE — editorial photography / cinematic still / photojournalism / fine-art portrait], [MOOD — intense / contemplative / defiant / urgent / tense / focused]. Negative: text, watermark, logos, signs, illustrations, sketches, metaphors, blurry, deformed, cartoon, posing.\`

- ✓ "Wide shot of two glass corporate skyscrapers under heavy overcast Seattle sky, no people, cold gray atmosphere, shot on 35mm wide, photojournalism, editorial press photo. Negative: text, logos, ships, metaphors."
- ✓ "Brazilian male entrepreneur 40s typing on laptop in dim home office at night, cold blue monitor light on his face, shot on 35mm wide, cinematic still, contemplative. Negative: text, watermark, logos."
- ✗ "person working" (vago) / ✗ "happy entrepreneur" (genérico) / ✗ "two ships in misty ocean" (metáfora)

**source_recommended**: use "ai" pra capas, conceitos abstratos, retratos específicos. Use "unsplash" pra cenas comuns (escritórios, comida, paisagens, lifestyle genérico) onde stock funciona melhor.

**unsplash_query**: 2-4 keywords em INGLÊS pra busca (ex: "lawyer office portrait" / "minimalist desk laptop"). Sempre forneça.

**image_entity**: o nome de algo REAL cuja FOTO de verdade ilustra o slide melhor do que uma arte de IA. O sistema busca a foto real na Wikipedia. Use o NOME EXATO.

⚠️ PRIORIDADE MÁXIMA — se o slide é sobre uma PESSOA, FILME/SÉRIE, PRODUTO ou EVENTO real nomeado, PREENCHER image_entity é OBRIGATÓRIO, não opcional. Uma foto real do Tom Cruise num slide sobre o Tom Cruise é SEMPRE melhor que uma arte de IA de uma mão ou cena genérica. Errar isso (gerar IA quando o assunto tem rosto/foto real conhecida) é o pior erro de imagem que existe — o post fica com cara de que não sabe do que está falando.

✅ PREENCHA (nome exato) sempre que a entidade É O ASSUNTO do slide:
- PESSOA pública/famosa citada pelo nome: ator, atleta, músico, CEO, político (ex: "Tom Cruise", "Elon Musk", "Cristiano Ronaldo", "Anitta"). → foto real da pessoa.
- FILME/SÉRIE/JOGO/ÁLBUM/LIVRO nomeado → use a PESSOA protagonista/diretor quando o slide gira em torno dela (ex: post sobre o filme novo do Tom Cruise → image_entity "Tom Cruise"), ou o nome da obra se for o mais reconhecível visualmente.
- PRODUTO físico icônico que o slide discute (ex: "iPhone", "Tesla Model 3").
- LUGAR/MARCO específico SÓ quando o slide é REALMENTE sobre aquele lugar como destino/local (ex: "o que ver na Tate Modern" → "Tate Modern"; "pôr do sol em Santorini" → "Santorini").

REGRA DA CAPA (slide 0): se o carrossel inteiro é sobre uma pessoa/obra/produto real nomeado, a CAPA quase sempre deve trazer image_entity dessa entidade — é o rosto que o público reconhece e faz parar o dedo.

❌ DEIXE "" (vazio) nestes casos:
- slide de estatística, dado, conceito, opinião, pergunta ou tendência SEM protagonista real. Ex: "75% dos brasileiros usam IA" NÃO é sobre o Brasil-lugar — é sobre adoção de IA. NÃO use "Brasil"/"São Paulo": uma foto de skyline não tem NADA a ver e fica fora de contexto. Descreva uma cena editorial concreta no image_prompt.
- país/cidade só MENCIONADO de passagem (demografia, mercado, origem) — não é o assunto visual.
- EMPRESA/MARCA/APP cuja imagem seria só um LOGO recortado (ex: "OpenAI", "Anthropic") — use "" e cena editorial no image_prompt.
- slide que compara 2+ entidades sem uma protagonista visual única.

REGRA DE OURO: entidade real nomeada COM foto conhecida (pessoa/filme/produto/evento) → SEMPRE image_entity. Só deixe "" pra stats, conceitos, demografia, tendências e lugares-de-passagem. Uma imagem fora de contexto é PIOR que uma genérica boa, MAS uma IA genérica num slide sobre uma celebridade é o PIOR de tudo. NUNCA invente nome. SEMPRE preencha image_prompt também (é o fallback).

**extra_image_prompts**: VOCÊ decide se o slide precisa de mais de uma imagem. Na GRANDE MAIORIA dos slides, deixe \`[]\` (uma imagem só). Preencha com 1-2 prompts SÓ quando o slide mostra naturalmente coisas DIFERENTES lado a lado:
- comparação / antes-e-depois (ex: 2 cenas distintas);
- 2-3 exemplos visuais diferentes do mesmo ponto.
Regras: cada prompt é uma CENA DIFERENTE da principal (NUNCA repita o mesmo assunto — imagens repetidas ficam ridículas). Mesmo padrão editorial-concreto, em INGLÊS. Se o slide é uma ideia/stat/conceito único, deixe \`[]\` — uma imagem basta. Não force múltiplas imagens só pra preencher.

**image_keywords**: 2-3 descritores para SEO/cataloging.

# CAPTION (legenda do Instagram — OBRIGATÓRIA, campo "caption")

Além do texto que vai NOS slides, escreva a legenda (\`caption\`) que a pessoa cola embaixo do carrossel no Instagram. A legenda NÃO é um resumo tímido — ela precisa funcionar SOZINHA pra quem não abre o carrossel, dando contexto completo e desenvolvendo o raciocínio. Regras:
- Começa com um gancho forte na 1ª linha (NÃO repete o título da capa literalmente) — é o que aparece antes do "...mais".
- Desenvolve em 3-5 parágrafos curtos (2-3 frases cada, separados por \\n\\n): contexto do assunto (por que isso importa AGORA), o argumento central com pelo menos 2 informações concretas do briefing, e uma implicação prática pro leitor (o que fazer com isso).
- A legenda pode (e deve) trazer 1 camada a mais que os slides — um detalhe, nuance ou exemplo que NÃO coube nos cards. Quem lê os dois não pode sentir repetição.
- Fecha com um convite/CTA natural e específico (salvar pra consultar, comentar com a experiência própria, mandar pra alguém que precisa).
- Última linha: 3 a 5 hashtags relevantes, em uma única linha, sem exageros.
- Mesmos princípios anti-clichê da copy: PROIBIDO "Descubra", "Confira", "Saiba mais", "Não perca", "Vem com a gente" etc. PT-BR coloquial culto.

# PROFUNDIDADE EDITORIAL (anti-superficialidade)

Conteúdo raso é a segunda maior bandeira de IA (depois do clichê). Em CADA carrossel:
- Vá além do óbvio: explique o MECANISMO (como/por que acontece), não só o fenômeno. "Postar todo dia não adianta" é raso; "o algoritmo pontua retenção por impressão — 10 posts medianos derrubam a média que 2 bons construíram" tem mecanismo.
- Traga pelo menos 1 consequência de segunda ordem, trade-off ou contraponto honesto ("isso funciona, MAS custa X"). Opinião com nuance > lista de obviedades.
- Cada slide intermediário AVANÇA o raciocínio — reformular o mesmo ponto com outras palavras em 2 slides é rejeitado.
- Teste final: um especialista do nicho salvaria esse carrossel? Se a resposta é "não, ele já sabe tudo isso", aprofunde o ângulo antes de entregar.

# REGRAS GERAIS

- Slide 0 = CAPA (gancho principal). Último slide = CTA / conclusão.
- O número de slides DEVE bater exato com o pedido.
- NÃO use aspas duplas dentro de strings — use simples ou remova.
- Se o briefing for vago/curto, prefira ser específico em UMA direção (chuta uma boa) do que genérico em todas.`

const BRAND_SYSTEM_PROMPT = `Você é especialista em análise de marca e brand strategy.
Sua tarefa: analisar conteúdo extraído de uma URL (site, blog, perfil) e devolver JSON estruturado com a identidade da marca.

REGRAS POR CAMPO:
- name: nome da marca/empresa/criador conforme aparece no conteúdo
- description: 2-3 frases descrevendo o que a marca faz, em português
- target_audience: perfil do público-alvo, em português, 1-2 frases (ex: "Devs e founders early-stage, 25-40 anos")
- tone_of_voice: 2-4 adjetivos separados por vírgula em português (ex: "casual, autoral, com humor seco")
- visual_style: 2-4 adjetivos sobre estética em português (ex: "minimalista, alto contraste, editorial")
- main_objective: o objetivo de comunicação principal — escolher EXATAMENTE um:
  - "sell" para marcas que vendem produtos/serviços
  - "inform" para criadores educacionais, blogs, mídia, jornalismo
  - "engage" para perfis de lifestyle, comunidades de nicho, entretenimento
  - "community" para movimentos, ONGs, causas
- brand_colors: array com 3-5 cores hex em formato #RRGGBB (caixa alta nas letras). Se não conseguir extrair do conteúdo, infere baseado no estilo visual e setor.
- instagram_handle: handle do instagram se aparecer no conteúdo (sem @), ou string vazia se não houver.

Se a informação for escassa, infere com base no nome/setor/contexto. Nunca devolve campos vazios além de instagram_handle.`

const EDITORIAL_PLAN_SYSTEM_PROMPT = `Você é um(a) estrategista de conteúdo sênior que monta cronogramas editoriais pra Instagram. Fala como gente — direto, específico, sem clichê de marketing. Seu trabalho: a partir do que você sabe da marca + da conversa com o cliente, montar um plano de posts pra um período (geralmente uma semana ou um mês), distribuindo as ideias nas datas de forma equilibrada.

# COMO PENSAR O PLANO

- Misture objetivos: nem só venda, nem só conteúdo educativo. Um bom cronograma equilibra autoridade, engajamento, venda e comunidade ao longo dos dias.
- Use o que a marca te dá: público, tom, objetivo principal, nicho. Cada ideia deve soar como ESSA marca falando — não genérica.
- Aproveite datas comemorativas e ganchos sazonais quando fizer sentido pro nicho (não force).
- Distribua nas datas dentro da janela pedida. Não amontoe tudo no mesmo dia. Respeite a frequência sugerida (ex: 3 posts/semana = espalhe nos dias).
- Varie formatos: carrossel pra conteúdo denso, post único pra impacto/prova, stories pra interação, reels pra alcance.

# CADA IDEIA

- **titulo**: ideia concreta e específica (6-10 palavras). Não "Dica de hoje" — algo como "3 erros que travam seu funil de vendas".
- **formato**: post | carrossel | stories | reels
- **objetivo**: sell | inform | engage | community
- **data**: YYYY-MM-DD dentro da janela informada.
- **descricao**: 1-2 frases sobre o ângulo do conteúdo — o que entra, qual a sacada.
- **motivo**: 1 frase curta explicando por que essa ideia entra no plano dessa marca (encaixe estratégico).

# REGRAS

- PROIBIDO clichê de IA: "Descubra", "Conheça", "Saiba mais", "Vem com a gente", "Transforme sua vida", "Não perca", "Aproveite agora".
- PT-BR coloquial culto. Sem gerundismo.
- O número de ideias DEVE bater com o pedido.
- Datas SEMPRE dentro da janela [data_inicio, data_fim] informada.
- NÃO use aspas duplas dentro das strings.
- resumo: 1-2 frases amigáveis explicando a lógica do cronograma que você montou (tom humano, como se estivesse apresentando pro cliente).`

// =============================================================================
// Types
// =============================================================================

export interface GenerationInput {
  topic: string
  objective: "sell" | "inform" | "engage" | "community"
  template: "editorial" | "cinematic" | "hybrid"
  brandName: string
  toneOfVoice: string
  targetAudience: string
  visualStyle: string
  brandColors: string[]
  nSlides: number
  /**
   * Abordagem escolhida no wizard (viral, educativo, dados, storytelling,
   * comunidade, oferta). Muda ESTRUTURA e REGISTRO do texto — ver
   * ABORDAGEM_BRIEF. Opcional (fluxos antigos não mandam).
   */
  abordagem?: string
  /**
   * Títulos do roteiro anterior REJEITADO (fluxo "gerar novo roteiro").
   * Quando presente, o novo roteiro deve ser substancialmente diferente.
   */
  avoidTitles?: string[]
}

/**
 * Registro/estrutura por abordagem — injetado no user message pra IA
 * realmente diferenciar (antes a abordagem nem chegava no prompt e os
 * roteiros saíam todos parecidos).
 */
const ABORDAGEM_BRIEF: Record<string, string> = {
  viral:
    "VIRAL: gancho agressivo na capa (contraste, quebra de expectativa ou afirmação polêmica defensável), frases curtas de impacto, tensão crescente slide a slide, CTA de compartilhamento. Otimize pra parar o dedo — sem clickbait vazio: a promessa da capa é paga nos slides.",
  educativo:
    "EDUCATIVO: didático e sequencial — conceito → como fazer → exemplo prático → erro comum → recap. Cada slide ensina UMA coisa aplicável hoje. Tom professor experiente, zero pressa de vender.",
  dados:
    "DADOS & PROVAS: cada slide ancorado num número, fato ou comparação do briefing. Nunca jogue o dado solto — diga o que ele SIGNIFICA (contexto, comparação, consequência). Tom analítico de relatório editorial.",
  storytelling:
    "STORYTELLING: narrativa com arco — situação, tensão, virada, lição. Cenas concretas (quem, onde, o que aconteceu), menos bullets e mais fio condutor: cada slide termina puxando o próximo.",
  comunidade:
    "COMUNIDADE: vulnerabilidade real, linguagem de pertencimento ('a gente', 'quem vive isso sabe'), convite à conversa. Menos autoridade, mais identificação. CTA de comentário/DM genuíno.",
  oferta:
    "OFERTA DIRETA: benefício concreto e específico logo na capa, mecanismo (como funciona), prova (resultado/depoimento do briefing), quebra de objeção e CTA direto sem vergonha. Urgência só se houver motivo real.",
}

export interface ClaudeSlide {
  order_index: number
  title: string
  highlight_words: string[]
  subtitle: string
  body?: string
  cta_badge?: string
  image_source_recommended: "ai" | "unsplash"
  image_prompt: string
  /** Empresa/pessoa/marca real do slide (ex: "Anthropic"). "" se não houver. */
  image_entity?: string
  /** Prompts de imagens ADICIONAIS (cenas diferentes). [] na maioria. */
  extra_image_prompts?: string[]
  unsplash_query?: string
  image_keywords: string[]
}

export interface ClaudeResponse {
  project_title: string
  /** Legenda do Instagram (gancho + valor + CTA + linha de hashtags). */
  caption: string
  slides: ClaudeSlide[]
}

export interface BrandAnalysis {
  name: string
  description: string
  target_audience: string
  tone_of_voice: string
  visual_style: string
  main_objective: "sell" | "inform" | "engage" | "community"
  brand_colors: string[]
  instagram_handle: string
}

export interface EditorialPlanIdea {
  titulo: string
  formato: "post" | "carrossel" | "stories" | "reels"
  objetivo: "sell" | "inform" | "engage" | "community"
  data: string
  descricao: string
  motivo: string
}

export interface EditorialPlanResponse {
  resumo: string
  ideias: EditorialPlanIdea[]
}

export interface EditorialPlanInput {
  brandName: string
  description: string
  targetAudience: string
  toneOfVoice: string
  visualStyle: string
  mainObjective: string
  /** Resumo da conversa do chat com o cliente (briefing humanizado). */
  conversationBrief: string
  /** Janela de planejamento */
  startDate: string
  endDate: string
  /** Quantas ideias gerar */
  count: number
  /** Datas comemorativas relevantes na janela (nome + data) */
  relevantDates?: Array<{ nome: string; data: string }>
}

export interface LogoAnalysis {
  is_logo: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  description: string
}

export interface ClaudeMetrics {
  ms: number
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  costUsd: number
}

const OBJECTIVE_LABELS: Record<string, string> = {
  sell: "vender",
  inform: "informar",
  engage: "engajar",
  community: "comunidade",
}

// =============================================================================
// Shared helpers
// =============================================================================

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente em .env.local")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function computeCost(usage: {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}): ClaudeMetrics["costUsd"] {
  // Sonnet 4.6 pricing
  const inputCost = (usage.input_tokens * 3) / 1_000_000
  const outputCost = (usage.output_tokens * 15) / 1_000_000
  const cacheCreateCost =
    ((usage.cache_creation_input_tokens ?? 0) * 3.75) / 1_000_000
  const cacheReadCost =
    ((usage.cache_read_input_tokens ?? 0) * 0.3) / 1_000_000
  return inputCost + outputCost + cacheCreateCost + cacheReadCost
}

function extractText(
  content: Anthropic.Messages.ContentBlock[],
): string {
  const block = content.find((b) => b.type === "text")
  if (!block || block.type !== "text") {
    throw new Error("Claude nao retornou bloco de texto")
  }
  return block.text.trim()
}

function parseJson<T>(raw: string): T {
  let s = raw
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  try {
    return JSON.parse(s) as T
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Claude retornou JSON invalido: ${message}\n\nRaw output (primeiros 600 chars):\n${s.slice(0, 600)}`,
    )
  }
}

// =============================================================================
// generateContent — carousel slides
// =============================================================================

export async function generateContent(
  input: GenerationInput,
): Promise<{ data: ClaudeResponse; raw: string; metrics: ClaudeMetrics }> {
  const client = getClient()
  const objective = OBJECTIVE_LABELS[input.objective] ?? input.objective

  const abordagemBrief = input.abordagem
    ? ABORDAGEM_BRIEF[input.abordagem]
    : null

  const avoidBlock =
    input.avoidTitles && input.avoidTitles.length
      ? `

ROTEIRO ANTERIOR REJEITADO PELO USUÁRIO — os títulos foram:
${input.avoidTitles.map((t) => `- "${t}"`).join("\n")}

Gere uma versão SUBSTANCIALMENTE diferente: outro gancho de capa, outra estrutura de arco, outros exemplos e ângulos. NÃO reutilize nem parafraseie nenhum desses títulos — se o novo roteiro parecer uma variação cosmética do anterior, ele será rejeitado de novo.`
      : ""

  const userMessage = `Gere o JSON do carrossel.

CONTEXTO:
- Tema: ${input.topic}
- Objetivo: ${objective}
- Template visual: ${input.template}
- Marca: ${input.brandName}
- Tom de voz: ${input.toneOfVoice}
- Público-alvo: ${input.targetAudience}
- Estilo visual: ${input.visualStyle}
- Cores da marca: ${input.brandColors.join(", ")}
- Número de slides: ${input.nSlides}${
    abordagemBrief
      ? `

ABORDAGEM ESCOLHIDA PELO USUÁRIO — ela define a ESTRUTURA e o REGISTRO do texto (dois carrosséis sobre o mesmo tema com abordagens diferentes precisam ficar claramente diferentes):
${abordagemBrief}`
      : ""
  }${avoidBlock}`

  const start = performance.now()
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    // Escala com o número de slides — 20 slides não cabem em 8192.
    max_tokens: Math.min(32000, 8192 + Math.max(0, input.nSlides - 7) * 1200),
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: CONTENT_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: CONTENT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  } as Anthropic.Messages.MessageCreateParamsNonStreaming)
  const ms = performance.now() - start

  if (response.stop_reason === "refusal") {
    throw new Error(
      "Claude se recusou a gerar conteudo pra esse tema (stop_reason: refusal)",
    )
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Claude atingiu max_tokens — output truncado. Tente reduzir n_slides ou simplificar o tema.",
    )
  }

  const raw = extractText(response.content)
  const data = parseJson<ClaudeResponse>(raw)

  return {
    data,
    raw,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage),
    },
  }
}

// =============================================================================
// analyzeBrand — extract brand identity from URL content
// =============================================================================

export interface AnalyzeBrandInput {
  url: string
  title: string
  description: string
  text: string
  instagram: string | null
}

export async function analyzeBrand(
  input: AnalyzeBrandInput,
): Promise<{ data: BrandAnalysis; metrics: ClaudeMetrics }> {
  const client = getClient()

  const userMessage = `Analise esta marca a partir do conteúdo extraído da URL.

URL: ${input.url}
Título da página: ${input.title || "(sem título)"}
Meta description: ${input.description || "(sem description)"}
${input.instagram ? `Instagram detectado: @${input.instagram}` : ""}

CONTEÚDO EXTRAÍDO (até 5000 chars):
${input.text || "(vazio — apenas URL/título disponível)"}

Devolva o JSON com a identidade analisada.`

  const start = performance.now()
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: BRAND_SCHEMA },
    },
    system: BRAND_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  } as Anthropic.Messages.MessageCreateParamsNonStreaming)
  const ms = performance.now() - start

  if (response.stop_reason === "refusal") {
    throw new Error("Claude se recusou a analisar essa URL.")
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude atingiu max_tokens analisando a URL.")
  }

  const raw = extractText(response.content)
  const data = parseJson<BrandAnalysis>(raw)

  return {
    data,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage),
    },
  }
}

// =============================================================================
// generateEditorialPlan — cronograma editorial baseado na marca + conversa
// =============================================================================

export async function generateEditorialPlan(
  input: EditorialPlanInput,
): Promise<{ data: EditorialPlanResponse; metrics: ClaudeMetrics }> {
  const client = getClient()
  // main_objective pode ter múltiplos valores separados por vírgula
  // (ex: "sell,engage") — traduz cada um pro rótulo.
  const objetivo = input.mainObjective
    .split(",")
    .map((o) => OBJECTIVE_LABELS[o.trim()] ?? o.trim())
    .filter(Boolean)
    .join(", ")

  const datasTxt =
    input.relevantDates && input.relevantDates.length
      ? input.relevantDates
          .map((d) => `- ${d.data}: ${d.nome}`)
          .join("\n")
      : "(nenhuma data comemorativa relevante na janela)"

  const userMessage = `Monte o plano editorial pra essa marca.

MARCA: ${input.brandName}
Descrição: ${input.description || "(não informada)"}
Público-alvo: ${input.targetAudience || "(não informado)"}
Tom de voz: ${input.toneOfVoice || "(não informado)"}
Estilo visual: ${input.visualStyle || "(não informado)"}
Objetivo principal: ${objetivo}

CONVERSA COM O CLIENTE (briefing humanizado):
${input.conversationBrief || "(sem detalhes adicionais — use o que sabe da marca)"}

JANELA DE PLANEJAMENTO: de ${input.startDate} até ${input.endDate}
QUANTAS IDEIAS: exatamente ${input.count}

DATAS COMEMORATIVAS NA JANELA (use só se fizer sentido pro nicho):
${datasTxt}

Devolva o JSON do plano editorial com as ideias distribuídas nas datas.`

  const start = performance.now()
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: EDITORIAL_PLAN_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: EDITORIAL_PLAN_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  } as Anthropic.Messages.MessageCreateParamsNonStreaming)
  const ms = performance.now() - start

  if (response.stop_reason === "refusal") {
    throw new Error("Claude se recusou a gerar o plano editorial.")
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Claude atingiu max_tokens montando o plano — reduza a quantidade de ideias.",
    )
  }

  const raw = extractText(response.content)
  const data = parseJson<EditorialPlanResponse>(raw)

  return {
    data,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage),
    },
  }
}

// =============================================================================
// planejarChatTurn — turno do chat conversacional da aba Planejar
// =============================================================================

const PLANEJAR_CHAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action", "message", "brief"],
  properties: {
    action: { type: "string", enum: ["ask", "generate"] },
    message: { type: "string" },
    brief: { type: "string" },
    horizonDays: { type: "integer" },
    count: { type: "integer" },
  },
} as const

const PLANEJAR_CHAT_SYSTEM_PROMPT = `Você é um(a) estrategista de conteúdo que conversa com o dono da marca pra montar o briefing de um cronograma de posts do Instagram. Fala como gente — PT-BR coloquial culto, direto, caloroso sem ser bajulador. NUNCA soa como formulário.

# COMO CONDUZIR

- Você recebe o contexto da marca + o histórico da conversa. RESPONDA AO QUE A PESSOA DISSE — comente, reaja, aproveite o que ela deu. Nada de ignorar a resposta e cuspir a próxima pergunta de um script.
- Pergunte APENAS o que ainda falta pra montar um bom plano: objetivo do período, recorte de público (se não estiver claro no cadastro), temas/lançamentos/datas a destacar, ritmo (posts por semana) e horizonte (semana, quinzena, mês).
- UMA pergunta por vez (no máximo duas curtas juntas). Se a pessoa já respondeu algo em outra mensagem, NÃO pergunte de novo.
- Se a pessoa pedir algo específico ("foca em reels", "sem posts de venda", "só terças e quintas"), ACEITE e registre no brief.
- Se a pessoa disser "deixa com você", "tanto faz" ou similar, decida você e siga em frente.
- Em NO MÁXIMO 4 perguntas você deve ter o suficiente. Aí action = "generate".

# SAÍDA (JSON)

- action "ask": ainda falta informação essencial. "message" = sua próxima fala (reação + pergunta). "brief" = resumo parcial do que já sabe.
- action "generate": briefing suficiente. "message" = frase curta confirmando que vai montar o plano (mencione 1 detalhe concreto da conversa pra mostrar que ouviu). "brief" = briefing COMPLETO e estruturado pro gerador de cronograma (objetivo do cliente, público/recorte, temas e datas a destacar, restrições/pedidos específicos, ritmo). "horizonDays" = dias do plano (7, 14 ou 30 conforme a conversa; default 7). "count" = quantidade de posts coerente com o ritmo pedido e o horizonte (ex: 3/semana em 14 dias = 6).

- PROIBIDO clichê de IA ("Perfeito!", "Ótima escolha!", "Com certeza!" em toda mensagem). Varie o registro.
- NÃO use aspas duplas dentro das strings.`

export interface PlanejarChatInput {
  brandName: string
  description: string
  targetAudience: string
  toneOfVoice: string
  mainObjective: string
  /** Histórico da conversa: role user/assistant + texto. */
  messages: Array<{ role: "user" | "assistant"; text: string }>
}

export interface PlanejarChatTurn {
  action: "ask" | "generate"
  message: string
  brief: string
  horizonDays?: number
  count?: number
}

export async function planejarChatTurn(
  input: PlanejarChatInput,
): Promise<{ data: PlanejarChatTurn; metrics: ClaudeMetrics }> {
  const client = getClient()

  const contexto = `CONTEXTO DA MARCA:
- Nome: ${input.brandName}
- Descrição: ${input.description || "(não informada)"}
- Público-alvo cadastrado: ${input.targetAudience || "(não informado)"}
- Tom de voz: ${input.toneOfVoice || "(não informado)"}
- Objetivo principal: ${input.mainObjective || "(não informado)"}`

  // Converte o histórico pro formato de messages da API (contexto vai na
  // primeira mensagem de user pra manter o system prompt cacheável).
  const history = input.messages.slice(-20)
  const apiMessages: Anthropic.Messages.MessageParam[] = []
  history.forEach((m, i) => {
    const text = i === 0 ? `${contexto}\n\n---\n\n${m.text}` : m.text
    apiMessages.push({ role: m.role, content: text })
  })
  if (apiMessages.length === 0) {
    apiMessages.push({ role: "user", content: `${contexto}\n\n---\n\n(início da conversa — abra você)` })
  }
  // A API exige terminar em user — se o último é assistant, pede continuação.
  if (apiMessages[apiMessages.length - 1].role === "assistant") {
    apiMessages.push({ role: "user", content: "(continue)" })
  }

  const start = performance.now()
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: PLANEJAR_CHAT_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: PLANEJAR_CHAT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: apiMessages,
  } as Anthropic.Messages.MessageCreateParamsNonStreaming)
  const ms = performance.now() - start

  if (response.stop_reason === "refusal") {
    throw new Error("Claude recusou o turno do chat de planejamento.")
  }

  const raw = extractText(response.content)
  const data = parseJson<PlanejarChatTurn>(raw)

  return {
    data,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage),
    },
  }
}

// =============================================================================
// analyzeLogoColors — multimodal extraction of brand colors from logo image
// =============================================================================

const LOGO_COLOR_SYSTEM_PROMPT = `Você analisa imagens de logos e devolve a paleta da marca.
Retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem comentários, sem texto antes ou depois) com:
{
  "is_logo": boolean,                // true se a imagem realmente parece uma logo de marca
  "colors": {
    "primary": "#RRGGBB",             // cor predominante na logo
    "secondary": "#RRGGBB",           // segunda cor mais relevante (ou um neutro complementar se monocromática)
    "accent": "#RRGGBB"               // cor de destaque (ou repetir a primária se não houver)
  },
  "description": "string"             // 1 frase curta descrevendo a logo visualmente
}
Cores em hex sempre com # e 6 dígitos em caixa alta (ex: "#7C5CFF"). Se a logo for monocromática ou tem só preto/branco, ainda assim devolva 3 cores coerentes.`

export async function analyzeLogoColors(
  logo: { data: string; mediaType: string },
): Promise<{ data: LogoAnalysis; metrics: ClaudeMetrics }> {
  const client = getClient()

  const start = performance.now()
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 512,
    system: LOGO_COLOR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: logo.mediaType as
                | "image/png"
                | "image/jpeg"
                | "image/webp"
                | "image/gif",
              data: logo.data,
            },
          },
          {
            type: "text",
            text: "Analise esta logo e devolva o JSON da paleta da marca.",
          },
        ],
      },
    ],
  } as Anthropic.Messages.MessageCreateParamsNonStreaming)
  const ms = performance.now() - start

  if (response.stop_reason === "refusal") {
    throw new Error("Claude recusou analisar a logo")
  }

  const raw = extractText(response.content)
  const data = parseJson<LogoAnalysis>(raw)

  return {
    data,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage),
    },
  }
}
