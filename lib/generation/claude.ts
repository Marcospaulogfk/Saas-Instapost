import Anthropic from "@anthropic-ai/sdk"
import { sanitizeCopyDeep } from "@/lib/copy/sanitize"
import { regrasCopy } from "@/lib/copy/regras"
import { MODEL_ESCRITOR, MODEL_MECANICO } from "@/lib/generation/models"
import { computeCostUsd } from "@/lib/generation/usage-log"
import type { ReferenceImage } from "@/lib/generation/reference-input"

// =============================================================================
// Schemas (structured outputs — guarantee JSON validity)
// =============================================================================

const CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["project_title", "caption", "hook_alternatives", "slides"],
  properties: {
    project_title: { type: "string" },
    caption: { type: "string" },
    // Os 2 hooks descartados (arquétipos diferentes do escolhido). O NYT roda
    // A/B em ~29% das manchetes com até 8 variantes; sem A/B, o substituto é
    // gerar arquétipos distintos, pontuar e guardar os vice-campeões pro
    // usuário poder trocar a capa sem regerar o carrossel inteiro.
    hook_alternatives: { type: "array", items: { type: "string" } },
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
          "image_entity_kind",
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
          // Tipo da entidade. O código usa isto pra ligar a trava de veracidade
          // ("person" → exige P31=Q5 + P18, senão nenhuma foto). O modelo NÃO
          // decide se existe foto — só diz o que a coisa é.
          image_entity_kind: {
            type: "string",
            enum: ["person", "work", "org", "place", "none"],
          },
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

/**
 * System prompt do escritor do carrossel.
 *
 * As REGRAS DE COPY (princípios, capa/manchete, estrutura, profundidade,
 * legenda, direção de imagem) vivem em `lib/copy/regras/*.md`, em markdown
 * neutro, sem amarração a modelo. Aqui fica só o que é FORMATO do nosso
 * produto: persona, estética por template, campos do JSON e o contrato de
 * image_entity / source. Trocar o escritor (teste cego) não mexe nos .md.
 */
function contentSystemPrompt(): string {
  return `Você é copy + diretor de arte sênior tipo Wieden+Kennedy / Pentagram. Faz carrossel que para o scroll: copy específica, surpreendente, com voz humana, NÃO genérica, NÃO de IA, NÃO chavão de marketing. Cada slide tem 1 ideia, alinhada num arco narrativo.

${regrasCopy("principios", "capa", "estrutura", "profundidade")}

# ESTÉTICA POR TEMPLATE

**editorial** (magazine): Capa título em Mistura Capitalização (não tudo caps). Slides com header tipo "CAPÍTULO N" ou categoria. Body em parágrafos curtos com negritos. Premium, analítico, autoridade.

**cinematic**: TODO EM CAIXA ALTA. Tipografia gigante. 1-2 palavras destacadas em cor de marca. Body curto, impacto. Dramático, viral.

**hybrid**: Caixa de texto sólida sobre foto. All caps com hierarquia (header pequeno + título grande). Tom de news/esporte/evento.

# CAMPOS POR SLIDE

- **order_index**: 0-based sequencial.
- **title**: frase principal, segue capitalização do template. 6-9 palavras (exceto capa de notícia, ver regras de capa).
- **highlight_words**: 1-2 palavras que JÁ aparecem em title (mesma capitalização exata).
- **subtitle**: complemento OPCIONAL (max 12 palavras) que tensiona o título; pode ser "".
- **body**: parágrafo com 2-3 frases (30-45 palavras) nos templates editorial e hybrid; 1-2 frases (max 25) no cinematic. A última frase é a PONTE pro próximo slide (ver estrutura). Pode ser "" só na capa, se o subtitle já cumprir o papel.
- **cta_badge**: badge curto (NOVO, VIRAL, ESTUDO 01); pode ser "".
- **hook_alternatives** (raiz do JSON): array de 2 strings, a capa completa em cada um, de arquétipos diferentes do title do slide 0 (ver método dos 6 hooks).

# IMAGE PROMPT (sempre em INGLÊS, mesmo quando source = unsplash; vira fallback do gerador de imagem)

${regrasCopy("imagem")}

**source_recommended**: use "ai" pra capas, conceitos abstratos, retratos específicos. Use "unsplash" pra cenas comuns (escritórios, comida, paisagens, lifestyle genérico) onde stock funciona melhor.

**unsplash_query**: 2-4 keywords em INGLÊS pra busca (ex: "lawyer office portrait" / "minimalist desk laptop"). Sempre forneça.

**image_entity**: o nome EXATO de algo REAL que é o assunto do slide.

VOCÊ NÃO DECIDE SE EXISTE FOTO. Você só declara QUAL é a entidade e de que TIPO ela é (image_entity_kind). Quem verifica se existe foto real, se o nome corresponde e se a foto é usável é o SISTEMA, consultando o Wikidata. Se não existir, ele usa o image_prompt, sem nunca colocar a foto de outra pessoa no lugar. O modelo não tem como saber quem tem verbete em enciclopédia: declare com honestidade, o código valida.

**image_entity_kind**: obrigatório sempre que image_entity não for "".
- \`person\`: gente. Liga a trava de veracidade: ou é a foto real dessa pessoa, ou a arte sai SEM rosto nenhum.
- \`work\`: obra, filme, série, livro, álbum, edifício, projeto, produto.
- \`org\`: empresa, marca, veículo de imprensa, instituição.
- \`place\`: cidade, país, marco geográfico.
- \`none\`: quando image_entity está vazio.

PREENCHA (nome exato) sempre que a entidade É O ASSUNTO do slide:
- PESSOA pública/famosa citada pelo nome: ator, atleta, músico, CEO, político (ex: "Tom Cruise", "Anitta"). → foto real da pessoa.
- FILME/SÉRIE/JOGO/ÁLBUM/LIVRO nomeado → use a PESSOA protagonista/diretor quando o slide gira em torno dela, ou o nome da obra se for o mais reconhecível visualmente.
- PRODUTO físico icônico que o slide discute (ex: "iPhone", "Tesla Model 3").
- LUGAR/MARCO específico SÓ quando o slide é REALMENTE sobre aquele lugar como destino/local (ex: "o que ver na Tate Modern" → "Tate Modern").

REGRA DA CAPA (slide 0): se o carrossel inteiro é sobre uma pessoa/obra/produto real nomeado, a CAPA quase sempre deve trazer image_entity dessa entidade; é o rosto que o público reconhece e faz parar o dedo.

DEIXE "" (vazio) nestes casos:
- slide de estatística, dado, conceito, opinião, pergunta ou tendência SEM protagonista real. "75% dos brasileiros usam IA" NÃO é sobre o Brasil-lugar; NÃO use "Brasil"/"São Paulo", uma foto de skyline fica fora de contexto. Descreva uma cena editorial concreta no image_prompt.
- país/cidade só MENCIONADO de passagem (demografia, mercado, origem).
- EMPRESA/MARCA/APP cuja imagem seria só um LOGO recortado (ex: "OpenAI"); use "" e cena editorial no image_prompt.
- slide que compara 2+ entidades sem uma protagonista visual única.

REGRA DE OURO: entidade real nomeada e VERIFICÁVEL → preencha image_entity + image_entity_kind. NUNCA invente nome, e NUNCA "melhore" o nome pra parecer mais famoso; se a pessoa do briefing é pouco conhecida, escreva o nome dela mesmo assim: o sistema checa e, não achando, usa a obra dela como imagem.

SEMPRE preencha image_prompt também (é o fallback) e, quando a entidade for \`person\`, escreva o image_prompt SEM pessoa no quadro: ele só é usado quando a foto real não foi encontrada.

**extra_image_prompts**: na GRANDE MAIORIA dos slides, deixe \`[]\`. Preencha com 1-2 prompts SÓ quando o slide mostra naturalmente coisas DIFERENTES lado a lado (comparação, antes-e-depois, 2-3 exemplos visuais distintos). Cada prompt é uma CENA DIFERENTE da principal; imagens repetidas ficam ridículas. Mesmo padrão editorial-concreto, em INGLÊS.

**image_keywords**: 2-3 descritores para SEO/cataloging.

# CAPTION (legenda do Instagram, OBRIGATÓRIA, campo "caption")

Além do texto que vai NOS slides, escreva a legenda (\`caption\`) que a pessoa cola embaixo do carrossel. Parágrafos separados por \\n\\n.

${regrasCopy("legenda")}

# FORMATO

- O número de slides DEVE bater exato com o pedido.
- NÃO use aspas duplas dentro de strings; use simples ou remova.`
}

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
- PROIBIDO travessão ("—" ou "–") em qualquer campo. Use vírgula, dois-pontos ou ponto. É o tique que mais denuncia texto de IA em português.
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
  /**
   * Registro editorial detectado na extração do link. Quando "noticia", as
   * regras de manchete do system prompt deixam de depender de inferência —
   * o user message liga o bloco explicitamente, com nome e fonte reais.
   */
  registro?: string
  /** Entidade protagonista da notícia (nome exato da extração). */
  protagonista?: string
  /** Fonte do fato (ex: "revista Wallpaper*"). */
  fonte?: string
  /**
   * Prompt adicional livre digitado pelo usuário no Step3 do wizard — pedido
   * específico por cima do briefing/link (ex.: "crie posts apresentando esse
   * produto pro público X"). Prioridade alta, mas nunca por cima das regras
   * de formato do system prompt.
   */
  instrucoesAdicionais?: string
  /**
   * Imagens de referência anexadas pelo usuário (já comprimidas e em base64
   * pelo cliente). Entram como blocos multimodais na mesma mensagem — só
   * quando o usuário de fato anexou algo, pra não inflar tokens à toa.
   */
  imagensReferencia?: ReferenceImage[]
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
  /**
   * QUE TIPO de coisa é a image_entity. O modelo só declara o tipo; quem decide
   * se existe foto usável é o código (Wikidata + validação de identidade).
   * "person" liga a trava de veracidade: ou é a foto real da pessoa, ou não
   * entra rosto nenhum na arte.
   */
  image_entity_kind?: "person" | "work" | "org" | "place" | "none"
  /** Prompts de imagens ADICIONAIS (cenas diferentes). [] na maioria. */
  extra_image_prompts?: string[]
  unsplash_query?: string
  image_keywords: string[]
}

export interface ClaudeResponse {
  project_title: string
  /** Legenda do Instagram (gancho + valor + CTA + linha de hashtags). */
  caption: string
  /** Os 2 hooks de capa descartados, de arquétipos diferentes do escolhido. */
  hook_alternatives?: string[]
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

function computeCost(
  usage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number | null
    cache_read_input_tokens?: number | null
  },
  model: string,
): ClaudeMetrics["costUsd"] {
  return computeCostUsd(usage, model)
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

  // Briefing vindo de link: o registro é DADO (detectado na extração), não
  // inferência. Deixar o modelo adivinhar falhava — depois do refine-prompt o
  // briefing parecia copy de funil e o bloco de manchete nunca disparava.
  //
  // A exigência de NOMEAR o sujeito vale pra todo registro: capa de conteúdo
  // editorial é capa de sujeito, nunca de conceito. Só o FORMATO de manchete
  // longa é exclusivo de notícia (numa crítica ela soaria burocrática).
  const noticiaBlock = input.registro
    ? `

ESTE BRIEFING VEIO DE UM ARTIGO. Registro detectado na extração: ${input.registro.toUpperCase()} (é dado, não inferência sua).${
        input.protagonista
          ? `

⚠️ SUJEITO OBRIGATÓRIO NA CAPA: o title do slide 0 DEVE nomear "${input.protagonista}". Nomear só no subtítulo NÃO vale, e pronome ("ela", "ele", "a vilã", "uma brasileira") NÃO substitui o nome.
Motivo: quem vê a capa no feed precisa saber em 1 segundo de QUEM/DO QUE se trata. Capa que descreve sem nomear ("Você torceu pela vilã a temporada toda") não recruta nem o fã do assunto, porque ele não sabe que é sobre o que ele gosta. Se houver uma obra/série/produto que dá reconhecimento ainda mais imediato que o protagonista, cite os dois.`
          : ""
      }${
        input.fonte
          ? `
- O fato depende de fonte: credite "${input.fonte}" na capa ou no subtítulo dela.`
          : ""
      }${
        input.registro === "noticia"
          ? `
- Capa em formato manchete de revista, 15-25 palavras, com o sujeito nomeado. Forma livre (sem molde de dois-pontos obrigatório). O teto de 6-9 palavras NÃO vale pra essa capa.`
          : `
- Registro ${input.registro}: mantenha a capa curta e afiada (6-12 palavras), mas com o nome do sujeito dentro. Não é manchete de jornal, é frase de crítica/ensaio, e mesmo assim precisa do nome.`
      }
- Se o briefing trouxer uma "Headline de Impacto" pronta que não nomeia o sujeito, DESCARTE-A.`
    : ""

  const avoidBlock =
    input.avoidTitles && input.avoidTitles.length
      ? `

ROTEIRO ANTERIOR REJEITADO PELO USUÁRIO — os títulos foram:
${input.avoidTitles.map((t) => `- "${t}"`).join("\n")}

Gere uma versão SUBSTANCIALMENTE diferente: outro gancho de capa, outra estrutura de arco, outros exemplos e ângulos. NÃO reutilize nem parafraseie nenhum desses títulos — se o novo roteiro parecer uma variação cosmética do anterior, ele será rejeitado de novo.`
      : ""

  // Pedido livre do usuário por cima do briefing (ex.: "foque no público
  // iniciante"). Prioridade alta na leitura, mas o system prompt continua
  // sendo dono do FORMATO (schema, limites de palavra, regras de capa) — a
  // instrução nunca pode quebrar isso, só direcionar o conteúdo dentro dele.
  const instrucoesBlock = input.instrucoesAdicionais?.trim()
    ? `

INSTRUÇÕES ADICIONAIS DO USUÁRIO (prioridade alta, mas nunca quebre as regras de formato):
${input.instrucoesAdicionais.trim()}`
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
  }${noticiaBlock}${avoidBlock}${instrucoesBlock}`

  // Imagens de referência do usuário — só entram na chamada quando existem
  // (custo de tokens de imagem é zero senão). Seguem o mesmo formato
  // multimodal de analyzeLogoColors: blocos de imagem ANTES do texto.
  const imageBlocks = (input.imagensReferencia ?? []).slice(0, 3).map((img) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: img.mediaType as
        | "image/png"
        | "image/jpeg"
        | "image/webp"
        | "image/gif",
      data: img.data,
    },
  }))
  const userContent = imageBlocks.length
    ? [
        ...imageBlocks,
        {
          type: "text" as const,
          text:
            "As imagens acima são referências visuais enviadas pelo usuário. Considere-as ao escrever a copy e os image_prompts dos slides quando fizer sentido.\n\n" +
            userMessage,
        },
      ]
    : userMessage

  const start = performance.now()
  const response = await client.messages.create({
    model: MODEL_ESCRITOR,
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
        text: contentSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
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
  // Travessão some aqui, não no prompt: a regra existe no system prompt, mas
  // num roteiro de 7 slides o modelo escorrega em pelo menos um. Ver
  // lib/copy/sanitize.ts.
  const data = sanitizeCopyDeep(parseJson<ClaudeResponse>(raw))

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
      costUsd: computeCost(response.usage, MODEL_ESCRITOR),
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
    model: MODEL_MECANICO,
    max_tokens: 1500,
    thinking: { type: "disabled" },
    output_config: {
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
      costUsd: computeCost(response.usage, MODEL_MECANICO),
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
    model: MODEL_MECANICO,
    max_tokens: 4096,
    thinking: { type: "disabled" },
    output_config: {
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
  const data = sanitizeCopyDeep(parseJson<EditorialPlanResponse>(raw))

  return {
    data,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage, MODEL_MECANICO),
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
- PROIBIDO travessão ("—" ou "–"). Use vírgula, dois-pontos ou ponto.
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
    model: MODEL_MECANICO,
    max_tokens: 1200,
    thinking: { type: "disabled" },
    output_config: {
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
  const data = sanitizeCopyDeep(parseJson<PlanejarChatTurn>(raw))

  return {
    data,
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationInputTokens:
        response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      costUsd: computeCost(response.usage, MODEL_MECANICO),
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
    model: MODEL_MECANICO,
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
      costUsd: computeCost(response.usage, MODEL_MECANICO),
    },
  }
}
