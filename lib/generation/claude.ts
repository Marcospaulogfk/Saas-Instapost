import Anthropic from "@anthropic-ai/sdk"

// =============================================================================
// Schemas (structured outputs — guarantee JSON validity)
// =============================================================================

const CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["project_title", "slides"],
  properties: {
    project_title: { type: "string" },
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
          unsplash_query: { type: "string" },
          image_keywords: { type: "array", items: { type: "string" } },
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

**3. Frases curtas, com ritmo.** Title 6-9 palavras. Body 1-2 frases (max 25 palavras totais).

**4. Verbos vivos, sem clichê.**
PROIBIDO (bandeira vermelha de IA, NUNCA usar): "Descubra", "Conheça", "Saiba mais", "Vem com a gente", "A solução que você procurava", "Transforme sua vida", "Faça parte", "Não perca", "Aproveite agora", "Vamos juntos", "Mude sua história", "O futuro é agora", "Você merece", "Imagine se".

**5. Use o que o briefing fornece.** Se tem dado/ângulo/fato — usa. Não substitua por chavão.

**6. PT-BR coloquial culto.** Sem gerundismo, sem "podemos te ajudar".

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

**image_keywords**: 2-3 descritores para SEO/cataloging.

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
  unsplash_query?: string
  image_keywords: string[]
}

export interface ClaudeResponse {
  project_title: string
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
- Número de slides: ${input.nSlides}`

  const start = performance.now()
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
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
