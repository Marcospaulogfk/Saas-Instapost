import Anthropic from "@anthropic-ai/sdk"
import { generateBrandImage } from "@/lib/generation/image"
import type { Plan } from "@/lib/tokens"
import { searchWikimedia } from "@/lib/generation/wikimedia"
import { SKELETONS, getSkeleton, listSkeletonsForPrompt } from "./skeletons"
import type { PostBrand } from "./types"
import type { FreePostSpec } from "./free-spec"
import type { GenerateMetrics } from "./generate"
import type { SkeletonContent, SkeletonImpl } from "./skeletons"

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
⚠️ Proibido subtitle de suspense vazio (nem variações): "E você nem percebeu ainda", "E você nem imagina", "E ninguém te contou", "O que ninguém te conta", "E isso muda tudo". Se o subtitle serve pra QUALQUER título, é ruim — reescreva com algo concreto.
RUIM: "Seu site tá falando mal de você" + "E você nem percebeu ainda."
BOM:  "Seu site tá falando mal de você" + "O visitante decide em 5 segundos se confia."

**3. Frases que cabem no Insta — curtas, com ritmo.**
6-9 palavras no título. Body em 1-2 frases. Sem ponto-e-vírgula, sem dois-pontos no meio.
⚠️ Pontuação natural: encadeie ideias com vírgula/travessão — ponto final só separa ideias DIFERENTES. "A audiência chegou. O site espantou." é staccato robótico; prefira "A audiência chegou, o site espantou."

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

# CAPTION (legenda do post — OBRIGATÓRIA)

Além do texto que vai NA imagem, escreva a **legenda** (\`caption\`) que vai
embaixo do post no Instagram. Regras:
- 2 a 4 frases. Começa com um gancho forte (não repete o título literalmente).
- Desenvolve a ideia com 1 informação concreta e termina com um convite/CTA natural.
- Voz humana, PT-BR coloquial culto. Os mesmos clichês proibidos da copy valem aqui.
- Pode usar 1-2 quebras de linha (\\n). NÃO use hashtags no corpo.
- Feche com uma linha separada de 3-5 hashtags relevantes em minúsculo.

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
  "caption": "legenda do post pro Instagram (2-4 frases + linha de hashtags)",
  "photo_prompt"?: string,
  "image_entity"?: string,
  "rationale": "1 frase explicando a escolha de copy"
}

# IMAGE_ENTITY — foto real em vez de IA (quando fizer sentido)

Preencha "image_entity" com o NOME EXATO de algo REAL cuja FOTO de verdade ilustra o post melhor que uma arte de IA. O sistema busca a foto real (Wikipedia, grátis).

⚠️ OBRIGATÓRIO quando o post é sobre uma PESSOA, FILME/SÉRIE ou PRODUTO real nomeado: preencher image_entity NÃO é opcional. Foto real do Tom Cruise num post sobre o Tom Cruise é SEMPRE melhor que arte de IA genérica. Gerar IA quando o assunto tem rosto/foto real conhecida é o pior erro de imagem possível.

✅ Preencha quando o post é sobre:
- PESSOA pública/famosa citada pelo nome (ator, atleta, músico, CEO — ex: "Tom Cruise", "Elon Musk", "Cristiano Ronaldo", "Anitta") → foto real da pessoa
- FILME/SÉRIE/JOGO/ÁLBUM nomeado → use a PESSOA protagonista (ex: post sobre o filme novo do Tom Cruise → "Tom Cruise")
- LUGAR / cidade / país / ponto turístico real (ex: "São Paulo", "Cristo Redentor", "Times Square")
- PRODUTO físico icônico (ex: "iPhone", "Tesla Model 3")

❌ Deixe vazio (não inclua o campo) quando:
- o post é sobre NEGÓCIO LOCAL / oferta / serviço genérico (ex: "vagas de muay thai", "nova unidade") — isso NÃO tem foto na Wikipedia, use photo_prompt (IA);
- é conceito abstrato, ou a entidade só teria um LOGO (empresa/marca/app — logo fica ruim).

SEMPRE forneça photo_prompt também (é o fallback se a foto real não existir). Regra: entidade real nomeada com foto conhecida (pessoa/filme/produto) → SEMPRE image_entity; negócio local / oferta / conceito → vazio (IA).

Preencha SÓ slots required + opcionais que adicionam valor. Slots vazios não viram nada — não invente. Minimal vence ruidoso.`

interface SkeletonResponse {
  skeleton_id: string
  content: SkeletonContent
  caption?: string
  photo_prompt?: string
  /** Entidade real (lugar/pessoa/produto) pra puxar foto real em vez de IA. */
  image_entity?: string
  rationale: string
}

/**
 * Resolve a foto do post: se há uma entidade real (lugar/pessoa/produto),
 * tenta foto real na Wikipedia; senão (ou se não achar) cai pra IA (Flux).
 */
async function resolvePhotoUrl(
  entity: string | null | undefined,
  photoPrompt: string | null | undefined,
  plan: Plan = "trial",
): Promise<{ url: string | null; costUsd: number; quality: "normal" | "pro" | null }> {
  const e = (entity ?? "").trim()
  if (e) {
    try {
      const real = await searchWikimedia(e)
      // Foto real (Wikimedia) não gera imagem por IA → não custa token.
      if (real?.url) return { url: real.url, costUsd: 0, quality: null }
    } catch {
      // segue pro fallback de IA
    }
  }
  if (photoPrompt) {
    try {
      const img = await generateBrandImage(photoPrompt, plan)
      return { url: img.url, costUsd: img.costUsd, quality: img.quality }
    } catch (err) {
      console.warn("[free-generate] geração de imagem falhou:", err)
    }
  }
  return { url: null, costUsd: 0, quality: null }
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
  /** Plano do user → decide Nano Banana Pro (Pro/Studio) vs Flux. Default trial. */
  plan?: Plan
}

export interface FreeGenerateResult {
  spec: FreePostSpec
  rationale: string
  skeleton_id: string
  /** Legenda do post pro Instagram (gancho + valor + CTA + hashtags). */
  caption: string
  photo_url: string | null
  /**
   * Qualidade da imagem IA gerada (pro=Nano Banana Pro, normal=Flux) ou null
   * se a foto veio da Wikimedia / não houve imagem. Pro débito de tokens.
   */
  image_quality: "normal" | "pro" | null
  metrics: GenerateMetrics & { totalCostUsd: number }
}

/**
 * Resultado da geração "text-only": NÃO gera foto via Flux.
 * Usado na etapa de revisão/aprovação, antes do usuário aprovar o design.
 */
export interface FreeGenerateTextResult {
  skeleton_id: string
  /** Slots de conteúdo que vão NA imagem (título, corpo, etc). */
  content: SkeletonContent
  /** Legenda do post pro Instagram. */
  caption: string
  /** Prompt de foto (EN) gerado pela IA — guardado pra usar na aprovação. */
  photo_prompt: string | null
  /** Entidade real (lugar/pessoa/produto) — se houver, vira foto real na aprovação. */
  image_entity: string | null
  rationale: string
  metrics: GenerateMetrics & { totalCostUsd: number }
}

interface TextOnlyOpts {
  brand: PostBrand
  briefing: string
  forceSkeletonId?: string | null
  excludeSkeletonIds?: string[]
}

interface ApprovedOpts {
  brand: PostBrand
  /** Skeleton já escolhido na etapa de texto. */
  skeletonId: string
  /** Conteúdo já aprovado/editado pelo usuário — NÃO é regenerado. */
  content: SkeletonContent
  /** Prompt de foto preservado da etapa de texto (ou null pra pular foto). */
  photoPrompt?: string | null
  /** Entidade real preservada da etapa de texto — vira foto real (Wikipedia). */
  photoEntity?: string | null
  /** Plano do user → decide Nano Banana Pro (Pro/Studio) vs Flux. Default trial. */
  plan?: Plan
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

/** Monta o user prompt da geração de copy pra um skeleton já escolhido. */
function buildUserPrompt(brand: PostBrand, briefing: string, chosen: SkeletonImpl): string {
  const seed = Math.floor(Math.random() * 100000)
  return `MARCA:
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
}

/** Chama o Claude pra gerar copy (content + caption + photo_prompt) de um skeleton. */
async function generateCopy(brand: PostBrand, briefing: string, chosen: SkeletonImpl) {
  const client = getClient()
  const userPrompt = buildUserPrompt(brand, briefing, chosen)
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    temperature: 0.8,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  })
  const block = response.content.find((b) => b.type === "text")
  if (!block || block.type !== "text") throw new Error("Claude não retornou texto")
  const parsed = parseJson(block.text)
  return { parsed, usage: response.usage }
}

export async function generateFreeSpec({
  brand,
  briefing,
  forceSkeletonId,
  excludeSkeletonIds,
  plan = "trial",
}: GenerateOpts): Promise<FreeGenerateResult> {
  const t0 = performance.now()

  // Escolhe skeleton ANTES de chamar Claude — garantia de aleatoriedade real
  const chosenSkeletonId = pickRandomSkeleton(forceSkeletonId, excludeSkeletonIds)
  const chosen = getSkeleton(chosenSkeletonId)
  if (!chosen) throw new Error(`Skeleton "${chosenSkeletonId}" não existe`)

  const { parsed, usage } = await generateCopy(brand, briefing, chosen)

  const skeleton = getSkeleton(parsed.skeleton_id)
  if (!skeleton) {
    throw new Error(`Skeleton "${parsed.skeleton_id}" não existe`)
  }

  // Foto real (Wikipedia) se a IA marcou entidade real; senão IA (Pro/Flux).
  const resolved = await resolvePhotoUrl(parsed.image_entity, parsed.photo_prompt, plan)
  const photoUrl = resolved.url
  const imageCost = resolved.costUsd

  const spec = skeleton.build({
    brand,
    content: parsed.content,
    photo_url: photoUrl,
  })

  const ms = performance.now() - t0
  const claudeCost = computeCost(usage)
  return {
    spec: { ...spec, rationale: parsed.rationale },
    rationale: parsed.rationale,
    skeleton_id: parsed.skeleton_id,
    caption: parsed.caption ?? "",
    photo_url: photoUrl,
    image_quality: resolved.quality,
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
 * Geração "text-only" — gera SÓ o texto (content + caption) e o photo_prompt,
 * SEM chamar o Flux. Usado na etapa de revisão/aprovação do conteúdo: o usuário
 * vê e edita o título/legenda/corpo antes de aprovar a geração da arte.
 */
export async function generateFreeText({
  brand,
  briefing,
  forceSkeletonId,
  excludeSkeletonIds,
}: TextOnlyOpts): Promise<FreeGenerateTextResult> {
  const t0 = performance.now()

  const chosenSkeletonId = pickRandomSkeleton(forceSkeletonId, excludeSkeletonIds)
  const chosen = getSkeleton(chosenSkeletonId)
  if (!chosen) throw new Error(`Skeleton "${chosenSkeletonId}" não existe`)

  const { parsed, usage } = await generateCopy(brand, briefing, chosen)

  if (!getSkeleton(parsed.skeleton_id)) {
    throw new Error(`Skeleton "${parsed.skeleton_id}" não existe`)
  }

  const ms = performance.now() - t0
  const claudeCost = computeCost(usage)
  return {
    skeleton_id: parsed.skeleton_id,
    content: parsed.content,
    caption: parsed.caption ?? "",
    photo_prompt: parsed.photo_prompt ?? null,
    image_entity: parsed.image_entity?.trim() || null,
    rationale: parsed.rationale,
    metrics: {
      ms,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
      costUsd: claudeCost,
      totalCostUsd: claudeCost,
    },
  }
}

/**
 * Monta o spec a partir de conteúdo JÁ APROVADO pelo usuário (sem regenerar
 * texto). Gera SÓ a foto via Flux (se houver photo_prompt) e constrói o design.
 */
export async function buildApprovedSpec({
  brand,
  skeletonId,
  content,
  photoPrompt,
  photoEntity,
  plan = "trial",
}: ApprovedOpts): Promise<FreeGenerateResult> {
  const t0 = performance.now()

  const skeleton = getSkeleton(skeletonId)
  if (!skeleton) throw new Error(`Skeleton "${skeletonId}" não existe`)

  // Foto real (Wikipedia) se há entidade real; senão IA (Pro/Flux).
  const resolved = await resolvePhotoUrl(photoEntity, photoPrompt, plan)
  const photoUrl = resolved.url
  const imageCost = resolved.costUsd

  const spec = skeleton.build({ brand, content, photo_url: photoUrl })
  const ms = performance.now() - t0

  return {
    spec: { ...spec, rationale: "Conteúdo aprovado pelo usuário" },
    rationale: "Conteúdo aprovado pelo usuário",
    skeleton_id: skeletonId,
    caption: "",
    photo_url: photoUrl,
    image_quality: resolved.quality,
    metrics: {
      ms,
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      costUsd: 0,
      totalCostUsd: imageCost,
    },
  }
}
