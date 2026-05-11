import Anthropic from "@anthropic-ai/sdk"
import { generateImage } from "@/lib/generation/fal"
import { POST_TEMPLATES, getTemplate } from "./catalog"
import type {
  PostBrand,
  PostContent,
  PostTemplateMeta,
  PostCategory,
} from "./types"

export interface GenerateMetrics {
  ms: number
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  costUsd: number
}

const SYSTEM_PROMPT = `Você é copy + diretor de arte sênior estilo Wieden+Kennedy / Pentagram. Faz copy que para o scroll: específica, surpreendente, voz humana — NÃO genérica, NÃO de IA, NÃO chavão de marketing.

Tarefa: brand + template específico + briefing → JSON com os campos do template.

# PRINCÍPIOS DE COPY (não ignore)

**1. Específico vence genérico, sempre.**
RUIM: "Conheça o melhor advogado da região" / "Descubra nossa academia"
BOM:  "Seu processo trabalhista parou há 8 meses?" / "Aqui ninguém te julga pelo banco do supino"

**2. Uma ideia por post.** Subtitle tensiona o título — não repete.

**3. Frases curtas, com ritmo.** Title 6-9 palavras. Body 1-2 frases (max 25 palavras). Sem "ponto-e-vírgula" ou "dois-pontos no meio".

**4. Verbos vivos. Sem clichê.**
PROIBIDO (bandeira vermelha de IA): "Descubra", "Conheça", "Saiba mais", "Vem com a gente", "A solução que você procurava", "Transforme sua vida", "Faça parte", "Não perca", "Aproveite agora", "Vamos juntos", "Mude sua história", "O futuro é agora", "Você merece".

**5. Use o que o briefing fornece.** Se tem dado/ângulo/fato — usa. Não substitui por chavão.

**6. PT-BR coloquial culto.** Sem gerundismo.

**7. Não invente números, datas, telefones, garantias que NÃO estão no input.**

# REGRAS POR CAMPO

- **title** / **title_lines**: 6-9 palavras totais. Se for pergunta, deve incomodar.
- **kicker**: 1-3 palavras uppercase (etiqueta — VAGAS ABERTAS, NOVO, ATENÇÃO).
- **subtitle / intro**: ângulo COMPLEMENTAR ao título, max 12 palavras.
- **body**: 1-2 frases curtas, max 25 palavras totais. Concretas.
- **cta_text**: 2-4 palavras imperativas. "Marque agora", "Quero esse plano", "Falar no whats". NUNCA "Saiba mais" ou "Clique aqui".
- **cta_secondary**: outline alternativo, max 3 palavras.
- **question_keyword**: 1 palavra/expressão UPPERCASE com "?" — complementa o título.
- **stat_value**: só número (30%, 24H, 100). Sem label.
- **stat_label**: contexto, max 4 palavras (DE GARANTIA, OFF NA 1ª AULA).
- **ghost_word**: 1 substantivo uppercase do tema (FORÇA, JUSTIÇA, CASA).
- **outline_word**: 1 palavra do title pra efeito vazado — escolha a de mais impacto.
- **highlight_words**: 1-2 palavras que JÁ aparecem em body/title (mesma capitalização exata).
- **checklist**: itens curtos (max 5 palavras cada), específicos.
- **pill_lines**: 2-4 linhas curtas (max 4 palavras).

# PHOTO PROMPT (sempre em INGLÊS)

## REGRA CRÍTICA — sem metáforas visuais

Pra tópicos abstratos (negócio, tech, política, finanças, conceito), JAMAIS use metáfora literal. Cliché-metáforas que o Flux gera por default e ficam ruins:
- "two ships drifting apart" pra distanciamento / separação
- "hands letting go" pra rompimento
- "two paths diverging" pra escolha
- "broken chain" pra ruptura
- "puzzle pieces" pra colaboração
- "lightbulb" pra ideia
- "rocket launching" pra crescimento
- "sunrise / golden horizon" pra esperança
- "scales of justice" pra direito (só se MESMO for foto de balança real em escritório)
- Qualquer ilustração simbólica, sketch, diagrama.

Se o tópico é abstrato, o photo é editorial-concreto:
- **tech/empresas** → sede corporativa, executivos, server room, mesa de reunião
- **finanças/economia** → bolsa, gráficos em monitor, prédio de banco
- **direito** → sala de tribunal, biblioteca jurídica, advogado em escritório
- **lifestyle/produto** → produto em ambiente real, pessoa interagindo
- **retrato profissional** → pessoa no contexto da profissão (não posando)

## Estrutura

Subject específico + lighting nomeada + mood + style + technical.

- ✓ "Wide shot of two glass corporate skyscrapers under heavy overcast Seattle sky, no people, cold gray atmosphere, shot on 35mm wide, photojournalism, editorial press photo"
- ✓ "Brazilian female lawyer mid-30s in dark navy blazer typing on laptop in dim home office, cold blue monitor light on her face, blurred bookshelf behind, shot on 35mm, cinematic still, contemplative"
- ✗ "lawyer photo" / ✗ "two ships in ocean" / ✗ "beautiful woman smiling"

Iluminação nomeada: Rembrandt, golden hour, hard noon, soft window light, studio softbox, fluorescent overhead, dim tungsten, cold blue monitor light.
Mood: intense, contemplative, defiant, tender, urgent, melancholic, tense, focused.
Estilo: editorial photography, documentary, cinematic still, photojournalism, fine-art portrait.
Camera/lens: shot on 85mm shallow DoF, 35mm wide environmental, medium-format film grain.

PROIBIDO em todos os photos: text, watermarks, logos, brand names, signs, billboards, illustrations, sketches, diagrams, metaphors, posing forçado.

NÃO use aspas duplas dentro de strings — use simples.
OUTPUT: APENAS JSON válido, sem markdown, sem fence \`\`\`.`

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

interface ClaudeContentResponse extends PostContent {
  /** Prompt em inglês pra Flux gerar a foto */
  photo_prompt?: string
}

function parseJson(raw: string): ClaudeContentResponse {
  let s = raw.trim()
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  return JSON.parse(s) as ClaudeContentResponse
}

function computeCost(usage: {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}): number {
  // Sonnet 4.6 pricing
  const inputCost = (usage.input_tokens * 3) / 1_000_000
  const outputCost = (usage.output_tokens * 15) / 1_000_000
  const cacheCreate = ((usage.cache_creation_input_tokens ?? 0) * 3.75) / 1_000_000
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) * 0.3) / 1_000_000
  return inputCost + outputCost + cacheCreate + cacheRead
}

function buildPrompt(
  brand: PostBrand,
  template: PostTemplateMeta,
  rawContent: string,
): string {
  return `MARCA:
- Nome: ${brand.name}
- Handle: @${brand.instagram_handle ?? brand.name.toLowerCase()}
- Profissão/nicho: ${brand.profession ?? "—"}
- Tom de voz: —
- Cores: ${brand.brand_colors.join(", ") || "—"}

TEMPLATE ESCOLHIDO:
- ID: ${template.id}
- Categoria: ${template.category}
- Descrição: ${template.description}
- Use quando: ${template.use_when.join(" | ")}
- Campos OBRIGATÓRIOS: ${template.required_fields.join(", ")}
- Campos OPCIONAIS: ${template.optional_fields.join(", ")}

BRIEFING DO USUÁRIO:
"${rawContent}"

Devolva JSON com os campos obrigatórios preenchidos e os opcionais quando fizer sentido. Slots possíveis:
{
  "kicker": string,
  "intro": string,
  "intro_2": string,
  "title": string,
  "title_lines": string[],
  "title_emphasis": string,
  "subtitle": string,
  "body": string,
  "highlight_words": string[],
  "framed_word": string,
  "strikethrough_word": string,
  "ghost_word": string,
  "cta_text": string,
  "cta_secondary": string,
  "stat_value": string,
  "stat_label": string,
  "question_keyword": string,
  "outline_word": string,
  "badge_label": string,
  "checklist": string[],
  "pill_lines": string[],
  "contact_phone": string,
  "contact_website": string,
  "contact_email": string,
  "photo_prompt": string  // OBRIGATÓRIO se template precisa de foto. EM INGLÊS, cinematográfico.
}

REGRA CRÍTICA SOBRE FOTO:
- Se o template precisa de foto (image_url, photo_image_url, product_image_url ou background_image_url está nos campos), SEMPRE devolva \`photo_prompt\` em INGLÊS.
- Use prompts cinematográficos: assunto + iluminação + mood + estilo.
- Exemplos: "professional lawyer portrait, dramatic side lighting, dark navy backdrop, confident expression, editorial photography"
            "minimalist beige textured ambient, soft natural light, glassware still life, warm tones"
            "fitness instructor mid-action with kettlebell, harsh top lighting, gym backdrop, intense expression"
- A foto deve combinar com o briefing do usuário (assunto/tema do post).
- Sem texto, watermarks ou branding na foto.

Responda APENAS com JSON.`
}

/**
 * Detecta quais slots de imagem o template usa (entre required + optional).
 * Retorna na ordem de prioridade — o primeiro recebe a imagem gerada.
 */
function detectImageSlots(template: PostTemplateMeta): Array<keyof PostContent> {
  const all = [...template.required_fields, ...template.optional_fields]
  const candidates: Array<keyof PostContent> = [
    "image_url",
    "photo_image_url",
    "product_image_url",
    "background_image_url",
    "image_2_url",
    "image_3_url",
  ]
  return candidates.filter((slot) => all.includes(slot as never))
}

export async function generatePostContent(
  brand: PostBrand,
  template: PostTemplateMeta,
  rawContent: string,
): Promise<{
  content: PostContent
  metrics: GenerateMetrics & { totalCostUsd: number }
  photo_url: string | null
}> {
  const client = getClient()
  const t0 = performance.now()
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildPrompt(brand, template, rawContent) },
    ],
  })
  const block = response.content.find((b) => b.type === "text")
  if (!block || block.type !== "text") throw new Error("Claude não retornou texto")
  const parsed = parseJson(block.text)
  const usage = response.usage
  const claudeCost = computeCost(usage)

  // Extrai photo_prompt (não vai pro content final)
  const photoPrompt = parsed.photo_prompt
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { photo_prompt: _ignored, ...content } = parsed

  // Gera foto(s) via Flux se template precisa
  // Slots distintos (image_url + image_2_url + ...) recebem imagens DIFERENTES — mesma vibe, prompt+seed varia.
  let photoUrl: string | null = null
  let imageCost = 0
  const imageSlots = detectImageSlots(template)
  // Slots considerados "principais" (recebem cópia da 1ª imagem) vs slots "extras" (precisam variação)
  const PRIMARY_SLOTS = new Set([
    "image_url",
    "photo_image_url",
    "product_image_url",
    "background_image_url",
  ])
  const primarySlots = imageSlots.filter((s) => PRIMARY_SLOTS.has(s as string))
  const extraSlots = imageSlots.filter((s) => !PRIMARY_SLOTS.has(s as string))
  if (template.needs_photo && photoPrompt && imageSlots.length > 0) {
    try {
      const img = await generateImage(photoPrompt)
      photoUrl = img.url
      imageCost += img.costUsd
      for (const slot of primarySlots) {
        ;(content as Record<string, unknown>)[slot] = photoUrl
      }
      // Pra cada slot extra, gera uma nova foto (variação) com sufixo no prompt pra diversificar
      for (let i = 0; i < extraSlots.length; i++) {
        try {
          const variantPrompt = `${photoPrompt}, alternate angle, different composition`
          const variant = await generateImage(variantPrompt)
          imageCost += variant.costUsd
          ;(content as Record<string, unknown>)[extraSlots[i]] = variant.url
        } catch (err) {
          console.warn("[generate] Flux variante falhou:", err)
          // fallback: usa a 1ª imagem mesmo
          ;(content as Record<string, unknown>)[extraSlots[i]] = photoUrl
        }
      }
    } catch (err) {
      console.warn("[generate] Flux falhou:", err)
    }
  }

  const ms = performance.now() - t0
  return {
    content: content as PostContent,
    photo_url: photoUrl,
    metrics: {
      ms,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
      costUsd: claudeCost,
      totalCostUsd: claudeCost + imageCost,
    },
  }
}

/**
 * Heurística local pra escolher template baseado no briefing.
 * Sem chamada Claude — rápido e gratuito.
 */
function scoreTemplateFor(
  template: PostTemplateMeta,
  briefing: string,
  brand: PostBrand,
  categoryHint?: PostCategory | null,
): number {
  let score = 0
  const niche = (brand.profession ?? "").toLowerCase()

  // Hint forte de categoria
  if (categoryHint && template.category === categoryHint) score += 15

  // Categoria match por keywords (sem \b — não funciona bem com diacríticos pt-br)
  const categoryKeywords: Record<PostCategory, RegExp[]> = {
    profissional: [
      /(advogado|m[ée]dico|consultor|expert|profissional|aprendi|experi[êe]ncia|consci[êe]n|direito|justi[çc]a)/i,
    ],
    beauty: [
      /(est[ée]tica|beleza|pele|boca|rosto|cosm[ée]tic|col[áa]geno|tratamento(?! de )|spa|harmoniza)/i,
    ],
    comercial: [
      /(produto|iphone|comprar|lan[çc]amento|sku|loja|varejo|cftv|seguran[çc]a privada)/i,
    ],
    empresa: [
      /(formaliz|cnpj|mei|cont[áa]bil|finan[çc]as|tribut[áa]rio|empres[áa]r|investi)/i,
    ],
    fitness: [
      /(academia|treino|muay thai|musc(ula|le)|fitness|emagrec|kg em|condicionamento|aluno|personal trainer)/i,
    ],
    informativo: [
      /(aviso|aten[çc][ãa]o|alerta|comunicado|vaga|requisito|case|hist[óo]ria de|transforma[çc][ãa]o real|depoiment)/i,
    ],
  }
  for (const re of categoryKeywords[template.category] ?? []) {
    if (re.test(briefing)) score += 4
  }

  // Niche match — só pesa se o nicho da marca aparece no use_when (peso baixo)
  for (const ux of template.use_when) {
    const u = ux.toLowerCase()
    if (niche && u.includes(niche.split(" ")[0])) score += 1
  }

  // Padrões específicos por template — peso ALTO porque são sinais fortes
  const patterns: Array<[RegExp, string, number]> = [
    // % desconto → promocional
    [/\d+\s?%\s?(off|de\s?desconto|desconto)/i, "fitness-02-promocional-retrato", 12],
    [/\d+\s?%\s?(off|de\s?desconto|desconto)/i, "comercial-01-split-color-product", 8],
    // número grande/garantia
    [/\b\d+\s?h\b|24\/7|100%|garantia|certifica/i, "comercial-04-numero-grande-retrato", 10],
    // vagas
    [/(vaga|vagas|contrat(amos|ando)|requisitos|estamos contratando|curr[íi]culo)/i, "informativo-03-vagas-requisitos", 14],
    // case/história
    [/(case|hist[óo]ria de|transforma[çc][ãa]o real|depoiment|emagreceu|perdeu \d+ ?kg)/i, "informativo-02-case-storytelling", 14],
    // alerta/comunicado
    [/(aten[çc][ãa]o|aviso|alerta|importante|comunicado|fechado|feriado|estaremos fechad)/i, "informativo-01-alerta-card-buttons", 14],
    // pergunta provocativa
    [/(é muito caro|vale a pena|por que .+\?|o que ningu[ée]m|sabia que)/i, "profissional-03-pergunta-provocativa", 10],
    // antes/depois
    [/(antes e depois|resultado em \d+|visíveis em \d+ dias)/i, "fitness-01-resultados-grid", 12],
    // desafio com prazo
    [/(desafio de \d+|programa de \d+ dias|\d+ dias para)/i, "fitness-03-desafio-com-selo", 12],
    // institucional
    [/(ven[mh]a (conhecer|ser|experimentar)|conhe[çc]a o (espa[çc]o|nosso)|tour pelo)/i, "fitness-04-institucional-fotos-espaco", 8],
    // empresa/serviço
    [/(formaliz|burocracia|cnpj|mei|simples nacional)/i, "empresa-03-cta-seta-grande", 10],
    // notícia/manchete
    [/(lan[çc]a|estreia|novo single|chega aos|filme|s[ée]rie)/i, "profissional-01-retrato-titulo-bottom", 6],
    // produto isolado
    [/(quem tem|n[ãa]o volta|escolha definitiva|premium)/i, "comercial-02-produto-isolado-clean", 5],
  ]
  for (const [re, id, w] of patterns) {
    if (template.id === id && re.test(briefing)) score += w
  }

  return score
}

export function pickBestTemplate(
  brand: PostBrand,
  briefing: string,
  categoryHint?: PostCategory | null,
): PostTemplateMeta {
  const ranked = POST_TEMPLATES.map((t) => ({
    template: t,
    score: scoreTemplateFor(t, briefing, brand, categoryHint),
  }))
    .sort((a, b) => b.score - a.score)

  // se todos os scores forem 0, usa primeiro template (fallback determinístico)
  return ranked[0]?.template ?? POST_TEMPLATES[0]
}

export { getTemplate }
