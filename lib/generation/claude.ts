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

const CONTENT_SYSTEM_PROMPT = `Você é especialista em copywriting viral para Instagram E direção de arte cinematográfica.
Sua tarefa: gerar JSON estruturado para um carrossel viral.

FRAMEWORK POR OBJETIVO:
- "vender" → AIDA: Atenção forte → Interesse → Desejo → Ação no último slide com CTA
- "informar" → Lista de tópicos com payoff educativo, autoridade
- "engajar" → Pergunta provocativa + storytelling pessoal
- "comunidade" → Vulnerabilidade + chamado a ação coletiva

REGRAS DE COPYWRITING POR TEMPLATE:

Template "editorial" (estilo brandsdecoded — magazine):
- Capa: título grande NÃO em caixa alta (Mistura Capitalização)
- Slides internos: header com "FUNCIONALIDADE N" ou similar (categoria)
- Use 1-2 palavras destaque por slide
- Body em parágrafos curtos com negritos
- Mood: análise, autoridade, premium

Template "cinematic" (estilo Wesley Silva):
- Capa e slides: TODO EM CAIXA ALTA
- Tipografia gigante e impactante
- 1-2 palavras destacadas em cor da marca
- Body curto, frases de impacto
- Mood: dramático, viral

Template "hybrid" (estilo nmlss/jorgedesa):
- Mistura: caixa de texto sólida sobre foto
- All caps mas com hierarquia clara
- Header pequeno com 2-3 informações
- Mood: news, esporte, evento

REGRAS DE CAMPOS DO SLIDE:
- order_index: índice 0-based, começa em 0 e segue sequencial
- title: frase principal do slide (no template apropriado: caps ou mixed)
- highlight_words: 1-2 palavras que JÁ aparecem em title (mesma capitalização), em ordem
- subtitle: sub-frase opcional, pode ser string vazia
- body: parágrafo opcional, pode ser string vazia
- cta_badge: badge curto (NOVO, VIRAL, EDIÇÃO 01...), pode ser string vazia
- image_source_recommended: "ai" pra capa e conceitos abstratos; "unsplash" pra cenas comuns (escritório, comida, paisagem)
- image_prompt: SEMPRE em INGLÊS, segue template (sempre presente, mesmo se source for unsplash — usado em fallback):
  "[SCENE/SUBJECT in detail], [ACTION/STATE], [LIGHTING - dramatic side/back lighting, single source], [CAMERA - 85mm lens, shallow depth of field], [STYLE - cinematic, hyperrealistic, premium photography], [MOOD]. Negative: text, watermark, blurry, deformed, low quality, cartoon"
- unsplash_query: 2-4 keywords em INGLÊS pra busca Unsplash (sempre presente)
- image_keywords: 2-3 keywords descritivas

REGRAS GERAIS:
- Slide 0 é sempre a CAPA (chamada principal). Slides finais são CTAs ou conclusão.
- O número de slides deve corresponder exatamente ao pedido do usuário.
- NÃO use aspas duplas dentro de strings — substitua por aspas simples ou remova.`

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
