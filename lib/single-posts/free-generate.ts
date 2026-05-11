import Anthropic from "@anthropic-ai/sdk"
import { generateImage } from "@/lib/generation/fal"
import { SKELETONS, getSkeleton, listSkeletonsForPrompt } from "./skeletons"
import type { PostBrand } from "./types"
import type { FreePostSpec } from "./free-spec"
import type { GenerateMetrics } from "./generate"
import type { SkeletonContent } from "./skeletons"

const SYSTEM_PROMPT = `Você é copy + diretor de arte sênior numa agência tipo Wieden+Kennedy / Pentagram. Faz copy que para o scroll: específica, surpreendente, com voz humana — NÃO genérica, NÃO de robô, NÃO de manual de marketing.

Sua tarefa: receber uma marca + briefing, e preencher os slots de conteúdo do skeleton já escolhido (você não escolhe skeleton, fontes, cores, posições — só copy + photo prompt).

# PRINCÍPIOS DE COPY (não ignore nenhum)

**1. Específico vence genérico, sempre.**
RUIM: "Descubra o melhor advogado da região"
BOM:  "Seu processo trabalhista para de andar há 8 meses?"

RUIM: "Conheça nossa academia"
BOM:  "Aqui ninguém vai te julgar pelo banco do supino"

**2. Diga uma coisa, não três.**
Um post = uma ideia. Se tem subtitle, ele tensiona o título — não repete.

**3. Frases que cabem no Insta — curtas, com ritmo.**
6-9 palavras no título. Body em 1-2 frases. Sem ponto-e-vírgula, sem dois-pontos no meio.

**4. Verbos vivos, sem clichê.**
PROIBIDO usar (são bandeira vermelha de IA): "Descubra", "Conheça", "Saiba mais", "Vem com a gente", "A solução que você procurava", "Transforme sua vida", "Faça parte", "Não perca", "Aproveite agora", "Vamos juntos", "Mude sua história", "O futuro é agora".

**5. Quando o briefing tem dado/fato/ângulo, USE.**
Não substitua por chavão genérico. "67% dos casos resolvem em 90 dias" é melhor que "A gente resolve rápido".

**6. Português brasileiro coloquial culto. Sem gerundismo, sem "você merece".**

# SLOTS — REGRAS POR CAMPO

- **title** / **title_lines**: 6-9 palavras totais, max 3 linhas curtas. Se for pergunta, deve incomodar.
- **kicker**: 1-3 palavras uppercase (etiqueta). Ex: "VAGAS ABERTAS", "ENTENDA", "NOVO".
- **subtitle**: complementa o título com um ângulo NOVO (não repete). Max 12 palavras.
- **body**: 1-2 frases curtas, max 25 palavras totais. Concretas.
- **cta_text**: 2-4 palavras, verbo no imperativo direto. "Marque agora", "Quero esse plano", "Falar no whats". NÃO use "Saiba mais", "Clique aqui".
- **question_keyword**: 1 palavra ou expressão curta UPPERCASE com "?" final que complementa o título. Ex: "ADVOGADO?", "VALE A PENA?", "PRA QUEM?".
- **stat_value**: número curto (30%, 24H, 3 ANOS). Sem label.
- **stat_label**: contexto do número, max 4 palavras (DE GARANTIA, OFF NA 1ª AULA).
- **ghost_word**: 1 substantivo uppercase tema do post (fica gigante de fundo). Ex: "FORÇA", "JUSTIÇA".
- **outline_word**: 1 palavra do title pra efeito vazado — escolha a com mais impacto visual.
- **highlight_words**: 1-2 palavras que JÁ aparecem no body/title (mesma capitalização exata).

# PHOTO PROMPT (sempre forneça em INGLÊS)

Composição: subject + lighting + mood + style + technical. Seja específico.

## REGRA CRÍTICA — sem metáforas visuais

Pra tópicos abstratos (negócio, tech, política, finanças, conceito), JAMAIS gere imagem metafórica. O Flux já te dá isso por default e fica ruim.

PROIBIDO esses cliché-metáforas:
- "two ships drifting apart" pra distanciamento / separação / divórcio empresarial
- "hands letting go of each other" pra rompimento / fim de parceria
- "two paths diverging" pra escolha / decisão
- "broken chain" pra ruptura
- "puzzle pieces" pra colaboração
- "lightbulb" pra ideia
- "rocket launching" pra crescimento / startup
- "sunrise / golden horizon" pra esperança / oportunidade
- "domino effect" pra cadeia de eventos
- "scales of justice" pra direito (a menos que MESMO seja foto de balança em escritório)
- Qualquer ilustração simbólica, sketch, diagrama, ícone

Se o tópico é abstrato, o photo deve ser editorial-concreto:
- Tópico **tech/empresas** → sede corporativa, executivos em conferência, server room, mesa de reunião, prédio de vidro contra céu cinza
- Tópico **finanças/economia** → bolsa de valores, mãos digitando em laptop com gráficos, prédio de banco
- Tópico **política/poder** → corredor de prédio governamental, pódio de imprensa, sala de reunião formal
- Tópico **direito** → sala de tribunal, biblioteca jurídica, advogado em escritório
- Tópico **lifestyle/produto** → produto em ambiente real, pessoa interagindo com ele
- Retrato **profissional** → pessoa no contexto da profissão (advogado em sala de audiência, dev em mesa com 2 monitores)

## Estrutura do prompt

- Subject específico (idade aproximada, etnia, gênero quando relevante, AÇÃO CONCRETA — não posando)
- Iluminação nomeada (Rembrandt, golden hour, hard noon, soft window light, studio softbox, fluorescent overhead, dim warm tungsten, cold blue monitor light)
- Mood adjective (intense, contemplative, defiant, tender, urgent, melancholic, tense, focused)
- Estilo (editorial photography, documentary, cinematic still, fine-art portrait, photojournalism)
- Camera/lens detail (shot on 85mm shallow DoF, 35mm wide environmental, medium-format film grain)

✓ Bom (tópico distanciamento OpenAI/Microsoft):
"Wide shot of two glass corporate skyscrapers under heavy overcast sky in Seattle, no people, cold gray atmosphere, shot on 35mm wide, photojournalism style, editorial press photo. Negative: text, logos, signs, illustrations, metaphors, ships, hands."

✓ Bom (advogada empreendedora):
"Brazilian female lawyer mid-30s in dark navy blazer typing on laptop in dim home office at night, cold blue monitor light on her face, blurred bookshelf with law books behind, shot on 35mm, cinematic still, contemplative mood. Negative: text, watermarks, logos, posing."

✗ Ruim:
- "lawyer photo" (vago)
- "two ships in ocean" (metáfora conceitual)
- "beautiful woman smiling" (genérico, posando)

PROIBIDO em todos os prompts: text, watermarks, logos, brand names, signs, billboards, illustrations, sketches, diagrams, posing forçado.

# OUTPUT — APENAS JSON válido (sem fence \`\`\`):
{
  "skeleton_id": "id-do-skeleton",
  "content": {
    "kicker"?: string,
    "title"?: string,
    "title_lines"?: string[],
    "subtitle"?: string,
    "body"?: string,
    "highlight_words"?: string[],
    "outline_word"?: string,
    "ghost_word"?: string,
    "cta_text"?: string,
    "stat_value"?: string,
    "stat_label"?: string,
    "question_keyword"?: string
  },
  "photo_prompt"?: string,
  "rationale": "1 frase explicando a escolha de copy"
}

Preencha SÓ slots required + opcionais que adicionam valor. Slots vazios não viram nada — não invente. Minimal vence ruidoso.`

interface SkeletonResponse {
  skeleton_id: string
  content: SkeletonContent
  photo_prompt?: string
  rationale: string
}

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function parseJson(raw: string): SkeletonResponse {
  let s = raw.trim()
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
  }
  return JSON.parse(s) as SkeletonResponse
}

function computeCost(usage: {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}): number {
  const inputCost = (usage.input_tokens * 3) / 1_000_000
  const outputCost = (usage.output_tokens * 15) / 1_000_000
  const cacheCreate = ((usage.cache_creation_input_tokens ?? 0) * 3.75) / 1_000_000
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) * 0.3) / 1_000_000
  return inputCost + outputCost + cacheCreate + cacheRead
}

interface GenerateOpts {
  brand: PostBrand
  briefing: string
  /** Se fornecido, força o skeleton ao invés de deixar a IA escolher */
  forceSkeletonId?: string | null
  /** IDs de skeletons que NÃO devem ser escolhidos (variação entre regenerações) */
  excludeSkeletonIds?: string[]
}

export interface FreeGenerateResult {
  spec: FreePostSpec
  rationale: string
  skeleton_id: string
  photo_url: string | null
  metrics: GenerateMetrics & { totalCostUsd: number }
}

/**
 * Escolhe um skeleton aleatório SERVER-SIDE.
 * - Se forceSkeletonId estiver setado, usa ele.
 * - Senão escolhe random uniforme dos disponíveis (excluindo os já usados).
 */
function pickRandomSkeleton(
  forceId: string | null | undefined,
  excludeIds: string[] = [],
): string {
  if (forceId) return forceId
  const available = SKELETONS.filter((s) => !excludeIds.includes(s.meta.id))
  // Se todos foram excluídos, ignora exclusão e escolhe qualquer um
  const pool = available.length > 0 ? available : SKELETONS
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx].meta.id
}

export async function generateFreeSpec({
  brand,
  briefing,
  forceSkeletonId,
  excludeSkeletonIds,
}: GenerateOpts): Promise<FreeGenerateResult> {
  const client = getClient()
  const t0 = performance.now()

  // Escolhe skeleton ANTES de chamar Claude — garantia de aleatoriedade real
  const chosenSkeletonId = pickRandomSkeleton(
    forceSkeletonId,
    excludeSkeletonIds,
  )
  const chosen = getSkeleton(chosenSkeletonId)
  if (!chosen) throw new Error(`Skeleton "${chosenSkeletonId}" não existe`)

  const seed = Math.floor(Math.random() * 100000)
  const userPrompt = `MARCA:
- Nome: ${brand.name}
- Handle: @${brand.instagram_handle ?? brand.name.toLowerCase()}
- Profissão/nicho: ${brand.profession ?? "—"}
- Cores da marca: ${brand.brand_colors.join(", ") || "—"}
- Tagline: ${brand.tagline ?? "—"}

BRIEFING:
"${briefing}"

SKELETON ESCOLHIDO: ${chosen.meta.id}
Nome: ${chosen.meta.name}
Vibe: ${chosen.meta.vibe}
Slots OBRIGATÓRIOS: ${chosen.meta.required_slots.join(", ")}
Slots opcionais: ${chosen.meta.optional_slots.join(", ")}
Descrição do layout: ${chosen.meta.description}

VARIATION SEED: ${seed}

REGRA CRÍTICA SOBRE FOTO: SEMPRE forneça \`photo_prompt\` em INGLÊS pra enriquecer visualmente. Use prompts cinematográficos: assunto + iluminação + mood + estilo (ex: "minimalist beige textured background, soft natural light, editorial style", "professional fitness instructor mid-action, dramatic side lighting, intense expression").

No JSON de resposta, sempre devolva "skeleton_id": "${chosen.meta.id}" (já está fixo, não mude).

Preencha APENAS os slots required + opcionais que melhoram o post. Mantém minimalismo.`

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    temperature: 1.0,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  })

  const block = response.content.find((b) => b.type === "text")
  if (!block || block.type !== "text") throw new Error("Claude não retornou texto")
  const parsed = parseJson(block.text)

  const skeleton = getSkeleton(parsed.skeleton_id)
  if (!skeleton) {
    throw new Error(`Skeleton "${parsed.skeleton_id}" não existe`)
  }

  // Gera foto via Flux Schnell SEMPRE que a IA forneça photo_prompt
  // (todos os skeletons agora aceitam foto, pelo menos como bg sutil)
  let photoUrl: string | null = null
  let imageCost = 0
  if (parsed.photo_prompt) {
    try {
      const img = await generateImage(parsed.photo_prompt)
      photoUrl = img.url
      imageCost = img.costUsd
    } catch (err) {
      console.warn("[free-generate] Flux falhou:", err)
    }
  }

  const spec = skeleton.build({
    brand,
    content: parsed.content,
    photo_url: photoUrl,
  })

  const ms = performance.now() - t0
  const usage = response.usage
  const claudeCost = computeCost(usage)
  return {
    spec: { ...spec, rationale: parsed.rationale },
    rationale: parsed.rationale,
    skeleton_id: parsed.skeleton_id,
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
