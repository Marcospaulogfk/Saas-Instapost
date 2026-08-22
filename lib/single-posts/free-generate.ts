import Anthropic from "@anthropic-ai/sdk"
import { MODEL_ESCRITOR } from "@/lib/generation/models"
import { generateBrandImageForRole } from "@/lib/generation/image"
import {
  editNanoBanana,
  generateNanoBanana,
} from "@/lib/generation/nano-banana"
import {
  POST_UNICO_BITMAP,
  POST_UNICO_FOTO_REAL,
  POST_UNICO_HIBRIDO,
} from "@/lib/features"
import {
  buildSpecFromLayout,
  extractTextLayout,
} from "./extract-layout"
import { fetchImageAsBase64 } from "@/lib/generation/fetch-image"
import { sanitizeCopyDeep } from "@/lib/copy/sanitize"
import { regrasCopy } from "@/lib/copy/regras"
import { searchWikimediaPerson } from "@/lib/generation/wikimedia"
import { SKELETONS, getSkeleton, listSkeletonsForPrompt } from "./skeletons"
import { composeSpec } from "./compose"
import type { PostBrand } from "./types"
import type { FreePostSpec } from "./free-spec"
import type { GenerateMetrics } from "./generate"
import type { SkeletonContent, SkeletonImpl } from "./skeletons"
import { computeCostUsd } from "@/lib/generation/usage-log"
import type { UsageLike, UsageStage } from "@/lib/generation/usage-log"

/**
 * Uso de uma etapa de geração, pro log de custo.
 *
 * A geração devolve o uso QUEBRADO POR ETAPA em vez de um total: um número só
 * responde "custou X" e nenhuma das perguntas que interessam — se o caro é a
 * copy ou o compositor, se o loop de 4 tentativas se paga. Quem grava é a
 * rota (é lá que existem supabase e user); aqui a gente só carrega o dado.
 */
export interface UsageStageRecord {
  stage: UsageStage
  usage: UsageLike
  attempts?: number
  approvedOnAttempt?: number | null
}

const systemPrompt = (): string => `Você é copy + diretor de arte sênior numa agência tipo Wieden+Kennedy / Pentagram. Faz copy que para o scroll: específica, surpreendente, com voz humana — NÃO genérica, NÃO de robô, NÃO de manual de marketing.

Sua tarefa: receber uma marca + briefing, e preencher os slots de conteúdo do skeleton já escolhido (você não escolhe skeleton, fontes, cores, posições — só copy + photo prompt).

${regrasCopy("principios")}

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
- **bullets**: exatamente **3** itens \`{ label, text }\` que sustentam a tese do título. \`label\` = 2-4 palavras, o rótulo do ponto (ex: "Menos desperdício", "Prazo mais curto"). \`text\` = 1 frase de até **10 palavras** com o fato concreto — frase mais longa não cabe na arte e é cortada. Cada item traz uma informação NOVA — não reformule o título nem repita o body. Preencha sempre que o briefing tiver matéria pra isso (trajetória, números, etapas, critérios, motivos); é o que dá densidade de revista à arte. Só deixe vazio quando o post for de uma frase só (manifesto, pergunta provocativa, oferta seca).

# PHOTO PROMPT — o DESIGN COMPLETO do post (sempre em INGLÊS)

O \`photo_prompt\` descreve o POST INTEIRO como um designer sênior o desenharia
— 1080×1350 (4:5), com TIPOGRAFIA INCLUÍDA. Ele vira uma imagem de REFERÊNCIA
gerada por um modelo de imagem de última geração; depois o sistema remove o
texto da imagem e um diretor de arte transcreve o layout em camadas editáveis.
Então: descreva um design finalizado, bonito, denso — não uma foto.

## Anatomia do prompt (nesta ordem)

1. Comece com: "Instagram post design, 1080x1350 vertical, in Brazilian Portuguese."
2. **Conceito visual**: o assunto/cena dominante e onde ele vive no quadro
   (ex: "dramatic night shot of a concrete house emerging on the right half",
   "athletic woman mid-kick emerging from dark haze at bottom", "macro of
   product on marble slab, top third"). Sem metáfora clichê (ships, puzzle,
   lightbulb, rocket, scales); tema abstrato pede cena editorial-concreta.

   ⚠️ **REGRA DO SUJEITO.** Se o briefing nomeia uma OBRA, PRODUTO, EDIFÍCIO,
   LUGAR ou PEÇA concreta, o sujeito da imagem é ESSA COISA — nunca uma pessoa
   anônima fazendo o trabalho relacionado a ela. "Profissional genérico numa
   mesa em luz baixa" é o clichê mais caro que existe aqui: um post sobre uma
   arquiteta premiada é a CASA que ela construiu, não alguém numa escrivaninha.

   ⚠️ **TRAVA DE VERACIDADE.** Se o post é sobre uma pessoa REAL nomeada, só há
   duas saídas: a foto real dela (via photo_entity, que o sistema busca e
   valida) ou uma imagem SEM pessoa nenhuma. JAMAIS descreva uma pessoa
   inventada num post sobre alguém real — isso põe o retrato de uma estranha ao
   lado de um nome verdadeiro, e é erro editorial, não questão de gosto. Na
   dúvida, tire a pessoa do quadro.

   Declare sempre onde o texto vai pousar: "amplo espaço negativo no terço
   superior para tipografia". Sem isso o modelo centraliza o assunto e não
   sobra lugar pra manchete.
3. **A tipografia do design, com os TEXTOS REAIS dos slots** (title, kicker,
   subtitle curto, os RÓTULOS dos bullets, cta) — em português, entre aspas,
   com hierarquia: qual é gigante, qual é apoio, onde cada um senta.
   Ex: headline "O CAFÉ CARO SAI MAIS BARATO" bold condensed white,
   upper left; kicker pill "CONTAS DA PADARIA"; three bullet rows with small
   icons and labels "...", "...", "..."; CTA button "Ver a planilha".
   ⚠️ SÓ TEXTO GRANDE E MÉDIO: o modelo de imagem embaralha letra miúda.
   NUNCA peça as frases descritivas dos bullets nem parágrafos pequenos na
   arte — na imagem entram só headline, kicker, subtitle de 1 linha, os
   rótulos curtos dos bullets (2-4 palavras) e o CTA. Feche esta parte do
   prompt com, literal: "Only the quoted texts above may appear. No other
   words, no small print, no fine text anywhere."
4. **Paleta e clima**: 2-4 cores dominantes (pode ancorar na cor da marca),
   iluminação nomeada, mood.
5. **Acabamento**: "premium social media design, professional typography,
   cohesive lighting, high production value".

## Variedade — NÃO repita o mesmo arquétipo

Use o VARIATION SEED da mensagem pra variar de verdade entre gerações:
- lado do assunto (esquerda/direita/topo/fundo/central),
- fundo claro ou escuro,
- headline serif elegante OU condensada impactante OU mista,
- itens como linhas com ícone, chips, cards pequenos ou lista numerada,
- com ou sem selo/carimbo, quote-card, número gigante.
Um feed onde todo post tem o mesmo esqueleto denuncia IA — alterne.

## Exemplo

"Instagram post design, 1080x1350 vertical, in Brazilian Portuguese. Macro photograph of freshly roasted coffee beans spilling across a dark slate slab, hard side light raking across the grain, occupying the lower right. Warm near-black background fading clean toward the upper left. Bold condensed white headline 'O CAFÉ CARO SAI MAIS BARATO' upper left with the word 'BARATO' in amber; small amber pill label 'CONTAS DA PADARIA' above it; elegant thin italic serif line 'Cada xícara ruim custa um cliente que não volta.' below; three compact rows lower left with small circular amber icons and bold labels 'Grão fresco rende mais', 'Menos desperdício', 'Ticket médio maior'; small outlined button 'Ver a planilha'. Palette: near-black brown, amber #C8862B, warm cream highlights, white. Premium social media design, professional typography, cohesive lighting, high production value."

# CAPTION (legenda do post — OBRIGATÓRIA)

Além do texto que vai NA imagem, escreva a **legenda** (\`caption\`) que vai
embaixo do post no Instagram. A legenda NÃO é um resumo tímido: a arte prende
o olho, a legenda entrega o contexto e o argumento completos. Regras:
- Começa com um gancho forte na 1ª linha (não repete o título literalmente) — é o que aparece antes do "...mais".
- Desenvolve em 2-4 parágrafos curtos (separados por \\n\\n): por que o assunto importa agora, o argumento central com pelo menos 1-2 informações concretas do briefing, e o que o leitor faz com isso.
- Traga 1 camada a mais que a arte — um detalhe, nuance ou exemplo que não coube na imagem.
- Termina com um convite/CTA natural e específico (salvar, comentar, mandar pra alguém).
- Voz humana, PT-BR coloquial culto. Os mesmos clichês proibidos da copy valem aqui.
- NÃO use hashtags no corpo.
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
    "question_keyword"?: string,
    "bullets"?: [{ "label": string, "text": string }]
  },
  "caption": "legenda completa do post (gancho + 2-4 parágrafos com contexto + CTA + linha de hashtags)",
  "photo_prompt"?: string,
  "image_entity"?: string,
  "rationale": "1 frase explicando a escolha de copy"
}

# IMAGE_ENTITY — foto real em vez de IA (quando fizer sentido)

Preencha "image_entity" com o NOME EXATO de algo REAL cuja FOTO de verdade ilustra o post melhor que uma arte de IA. O sistema busca a foto real (Wikipedia, grátis).

⚠️ SÓ para PESSOA pública real, citada pelo nome (ator, atleta, músico, CEO, artista — ex: "Tom Cruise", "Anitta", "Gilberto Gil"). O sistema valida que a entidade é humana e tem foto; qualquer outra coisa é descartada. Post sobre filme/série → a PESSOA protagonista.

❌ Deixe vazio pra: lugar, produto, empresa, negócio local, oferta, conceito — nesses casos a cena gerada é sempre melhor que imagem de enciclopédia.

SEMPRE forneça photo_prompt também (é o fallback se a foto real não existir ou for reprovada).

Preencha os slots required + os opcionais que adicionam valor — incluindo \`bullets\`, que é o material de densidade da arte e vale pra qualquer layout. Slots vazios não viram nada; não invente fato que o briefing não deu. Minimal na FRASE, denso no CONTEÚDO.`

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
 * tenta foto real na Wikipedia; senão (ou se não achar) gera por IA.
 *
 * A imagem do post único tem papel de CAPA — é uma peça só, e é ela que para
 * o scroll. Roda no modelo bom para todos os planos, igual à capa do
 * carrossel, e é cobrada como tal (25 tokens). Se o Nano Banana cair pro
 * Flux, volta como 'normal' e o usuário paga 2 — o que recebeu de fato.
 */
interface ResolvedPhoto {
  /** Fundo que vai pro spec (clean plate na Rota B2; foto real; ou a própria geração). */
  url: string | null
  /** Referência COMPLETA (com tipografia) pra transcrição por visão — só na Rota B2. */
  referenceUrl: string | null
  costUsd: number
  quality: "normal" | "pro" | null
  /** true = a url É a arte completa (modo bitmap): sem compose, sem skeleton. */
  bitmap?: boolean
}

/** Prompt fixo da clean plate — remove a tipografia preservando o design. */
const CLEAN_PLATE_PROMPT =
  "Erase every single piece of text from this image — headlines, small body text, captions, bullet list text, labels inside buttons and pills, prices, numbers, usernames, watermarks. No letters or digits of any size may remain anywhere. Keep untouched: the photograph, background colors, panels, gradients, shapes, pill/button shapes (now empty) and small icons without letters. Where text was erased, seamlessly continue the surface behind it. Do not add anything new."

async function resolvePhotoUrl(
  entity: string | null | undefined,
  photoPrompt: string | null | undefined,
): Promise<ResolvedPhoto> {
  // POST ÚNICO É NANO-BANANA. A entidade real só é consultada com a flag
  // ligada (hoje desligada, ver lib/features.ts): sem esse guard, bastava a
  // copy citar uma pessoa pública pra peça desviar do bitmap e cair no
  // compositor de camadas — que entrega arte pior, custa mais e cobra menos.
  const e = POST_UNICO_FOTO_REAL ? (entity ?? "").trim() : ""
  if (e) {
    try {
      // SÓ pessoa real com foto validada (P31=Q5 + P18 + proporção de foto).
      // A busca genérica devolvia o primeiro resultado full-text sem checar
      // nada — num teste real, o fundo do post saiu o PÔSTER da novela "Terra
      // e Paixão". Entidade que não é gente (obra, lugar, empresa) rende fundo
      // melhor via cena gerada do que via imagem de enciclopédia.
      const real = await searchWikimediaPerson(e)
      // A foto crua do Wikimedia NÃO vira o post: ela entra como referência
      // no nano-banana, que monta a arte em volta do rosto verdadeiro.
      //
      // Antes ela ia direto pro `composeSpec` — o único componente que sabia
      // pôr texto sobre uma foto crua —, e era de lá que saía o layout ruim.
      // Assim a peça de pessoa real ganha o mesmo padrão de arte das outras,
      // some a composição do caminho, e o rosto continua sendo o rosto certo.
      if (real?.url && photoPrompt) {
        // BASE64 OBRIGATÓRIO: o Fal baixa `image_urls` do lado dele e NÃO
        // consegue baixar upload.wikimedia.org (mesmo bloqueio que derrubou a
        // Anthropic no compose). Com a URL crua o modelo gerava SEM referência
        // — saiu outra pessoa no lugar da Marília — ou devolvia 422. Com a
        // imagem inline, a identidade sai pixel-fiel (testado em 21/08/2026).
        const inline = await fetchImageAsBase64(real.url)
        if (!inline) throw new Error(
          "Não foi possível baixar a foto de referência. Tente gerar de novo.",
        )
        const art = await editNanoBanana(
          `Photo edit task. The input photo shows a real person (${e}) — keep them PIXEL-FAITHFUL: same face, same hair, same features, same identity, instantly recognizable. Do not replace, restyle or beautify them.

Edit only the surroundings, following this design brief:
${photoPrompt}`,
          `data:${inline.mediaType};base64,${inline.data}`,
        )
        return {
          url: art.url,
          referenceUrl: null,
          costUsd: art.costUsd,
          quality: "pro",
          bitmap: true,
        }
      }
    } catch {
      // segue pro fallback de IA
    }
  }
  if (photoPrompt) {
    try {
      // ROTA B2: o prompt descreve o POST COMPLETO (com tipografia). A
      // referência sai do modelo de imagem — que compõe layout melhor que
      // qualquer estimativa — e a clean plate remove o texto pra tipografia
      // HTML editável entrar por cima, na posição transcrita da referência.
      // ESTRITO: nano-banana ou nada. `generateBrandImageForRole` cai pro
      // Flux quando o nano falha, e Flux devolve quality "normal" — o que
      // derruba o teste de bitmap abaixo e joga a peça na composição livre,
      // que entrega layout ruim. `generateNanoBanana` já tem retries internos
      // com backoff; se ele desiste, a geração inteira desiste junto.
      // "bitmap" = nano-banana-2 (arte completa com texto). O rótulo interno
      // continua "pro" porque é o enum gravado em image_quality.
      const nano = await generateNanoBanana(photoPrompt, "bitmap")
      const img = { ...nano, quality: "pro" as const }
      // MODO BITMAP/HÍBRIDO: a referência completa é a arte. Se a clean plate
      // sair, o layout vira camadas editáveis medidas por visão (híbrido);
      // se falhar, o post fica no bitmap puro (edição cirúrgica).
      if (POST_UNICO_BITMAP && img.quality === "pro") {
        let cleanUrl: string | null = null
        let cleanCost = 0
        if (POST_UNICO_HIBRIDO) {
          try {
            const clean = await editNanoBanana(CLEAN_PLATE_PROMPT, img.url)
            cleanUrl = clean.url
            cleanCost = clean.costUsd
          } catch (err) {
            console.warn("[free-generate] clean plate (híbrido) falhou — bitmap puro:", err)
          }
        }
        return {
          url: img.url,
          referenceUrl: cleanUrl,
          costUsd: img.costUsd + cleanCost,
          quality: img.quality,
          bitmap: true,
        }
      }
      if (img.quality === "pro") {
        try {
          const clean = await editNanoBanana(CLEAN_PLATE_PROMPT, img.url)
          return {
            url: clean.url,
            referenceUrl: img.url,
            costUsd: img.costUsd + clean.costUsd,
            quality: img.quality,
          }
        } catch (err) {
          console.warn("[free-generate] clean plate falhou:", err)
          // Sem clean plate a referência não serve de fundo (o texto bitmapado
          // brigaria com o HTML). 2º fallback: regera a MESMA cena pedindo os
          // espaços de texto vazios — perde a transcrição fiel, mas mantém o
          // fundo bonito (modo cena, sem referenceUrl).
          try {
            const scene = await generateBrandImageForRole(
              photoPrompt +
                " IMPORTANT OVERRIDE: do NOT render any of the quoted text, letters or numbers — leave those areas as clean empty surfaces ready for typography.",
              "cover",
            )
            return {
              url: scene.url,
              referenceUrl: null,
              costUsd: img.costUsd + scene.costUsd,
              quality: scene.quality,
            }
          } catch {
            return { url: null, referenceUrl: null, costUsd: img.costUsd, quality: null }
          }
        }
      }
      // Fallback Flux (sem edit disponível): usa a geração direto como fundo.
      return { url: img.url, referenceUrl: null, costUsd: img.costUsd, quality: img.quality }
    } catch (err) {
      // NÃO engole: engolir aqui fazia a execução seguir pro fim da função e
      // devolver url:null, que vira composição livre. Sem exceções.
      console.error("[free-generate] geração de imagem falhou:", err)
      throw new Error(
        "Não foi possível gerar a arte do post. Tente gerar de novo.",
      )
    }
  }
  // Sem photo_prompt não há arte possível no padrão do produto, e cair na
  // composição tipográfica significaria entregar layout ruim. Falha explícita:
  // a rota devolve erro e NÃO debita token (ver route.ts — o débito só ocorre
  // depois do sucesso).
  throw new Error(
    "Não foi possível gerar a arte do post (o modelo não devolveu prompt de imagem). Tente gerar de novo.",
  )
}

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente")
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}


function computeCost(usage: {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}): number {
  return computeCostUsd(usage, MODEL_ESCRITOR)
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
  /** Legenda do post pro Instagram (gancho + valor + CTA + hashtags). */
  caption: string
  photo_url: string | null
  /** Textos que estão NA arte (slots da copy) — alimenta a edição cirúrgica
   * do modo bitmap. */
  content: SkeletonContent | null
  /**
   * Qualidade da imagem IA gerada (pro=Nano Banana Pro, normal=Flux) ou null
   * se a foto veio da Wikimedia / não houve imagem. Pro débito de tokens.
   */
  image_quality: "normal" | "pro" | null
  /** Custo em USD da imagem (Fal.ai); 0 quando foto real ou sem imagem. */
  image_cost_usd: number
  metrics: GenerateMetrics & { totalCostUsd: number }
  /** Uso por etapa — a rota grava em generation_usage. */
  usage_stages: UsageStageRecord[]
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
  /** Uso por etapa — a rota grava em generation_usage. */
  usage_stages: UsageStageRecord[]
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
  /** Briefing original — dá contexto de assunto ao compositor de layout. */
  briefing?: string | null
}

/**
 * Escolhe um skeleton aleatório SERVER-SIDE.
 * - Se forceSkeletonId estiver setado, usa ele.
 * - Senão escolhe random uniforme dos disponíveis (excluindo os já usados).
 */
/**
 * Sorteia CANDIDATOS de layout e deixa a IA escolher qual combina com o
 * briefing.
 *
 * Antes um unico skeleton era sorteado e imposto ao Claude. Isso dava
 * variedade, mas ignorava o assunto: o layout `card-center-on-color`, cuja
 * vibe cadastrada e "alerta, urgencia, comunicado" (icone de triangulo de
 * alerta hardcoded, titulo padrao "ATENCAO"), podia cair numa noticia de
 * reconhecimento. O sorteio continua — mas de uma LISTA, e quem decide dentro
 * dela e a IA, que le a vibe de cada um.
 */
function pickSkeletonShortlist(
  forceId: string | null | undefined,
  excludeIds: string[] = [],
  size = 5,
): SkeletonImpl[] {
  if (forceId) {
    const forced = getSkeleton(forceId)
    if (forced) return [forced]
  }
  const available = SKELETONS.filter((s) => !excludeIds.includes(s.meta.id))
  const pool = available.length > 0 ? [...available] : [...SKELETONS]
  // Fisher-Yates parcial — sorteia `size` sem repetir.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(size, pool.length))
}

/** Monta o user prompt da geração de copy com a lista de layouts candidatos. */
function buildUserPrompt(
  brand: PostBrand,
  briefing: string,
  candidates: SkeletonImpl[],
): string {
  const seed = Math.floor(Math.random() * 100000)
  return `MARCA:
- Nome: ${brand.name}
- Handle: @${brand.instagram_handle ?? brand.name.toLowerCase()}
- Profissão/nicho: ${brand.profession ?? "—"}
- Cores da marca: ${brand.brand_colors.join(", ") || "—"}
- Tagline: ${brand.tagline ?? "—"}

BRIEFING:
"${briefing}"

LAYOUTS CANDIDATOS — escolha o que combina com o briefing:
${candidates
  .map(
    (c) => `- id: "${c.meta.id}" | ${c.meta.name}
  vibe: ${c.meta.vibe}
  slots OBRIGATÓRIOS: ${c.meta.required_slots.join(", ")}
  slots opcionais: ${c.meta.optional_slots.join(", ")}
  layout: ${c.meta.description}
`,
  )
  .join("")}

Escolha pela VIBE: um layout de "alerta/urgência" não serve pra notícia boa,
um de "comunicado" não serve pra bastidor. Se nenhum encaixar perfeitamente,
pegue o mais neutro da lista.

VARIATION SEED: ${seed}

REGRA CRÍTICA SOBRE FOTO: SEMPRE forneça \`photo_prompt\` em INGLÊS seguindo a anatomia do system prompt — o DESIGN COMPLETO do post (cena + tipografia com os textos reais dos slots + paleta), variando o arquétipo pelo VARIATION SEED. Nunca "textured background" solto: textura sem cena é o que produz fundo sem sentido.

No JSON de resposta, devolva em "skeleton_id" o id do layout que você escolheu — obrigatoriamente um da lista acima.

Preencha os slots required + os opcionais que melhoram o post.

⚠️ \`bullets\` NÃO aparece na lista de slots dos layouts acima e mesmo assim é pra preencher: quem monta a arte final é um diretor de arte que compõe o layout livremente, e os itens são o material que dá densidade de revista à peça. A lista de slots do layout é o mínimo, não o teto. Só deixe \`bullets\` vazio se o post for genuinamente de uma frase só.`
}

/**
 * Schema da resposta de copy.
 *
 * Existe pra que o modelo devolva a copy por TOOL USE em vez de um bloco de
 * texto com JSON dentro. Copy publicitária vive cheia de aspas e travessões, e
 * cada aspas não escapada quebrava o `JSON.parse` — perdendo a geração inteira
 * depois de já paga. Por tool use a serialização é problema da API.
 */
const COPY_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    skeleton_id: { type: "string" },
    content: {
      type: "object",
      properties: {
        kicker: { type: "string" },
        title: { type: "string" },
        title_lines: { type: "array", items: { type: "string" } },
        subtitle: { type: "string" },
        body: { type: "string" },
        highlight_words: { type: "array", items: { type: "string" } },
        outline_word: { type: "string" },
        ghost_word: { type: "string" },
        cta_text: { type: "string" },
        stat_value: { type: "string" },
        stat_label: { type: "string" },
        question_keyword: { type: "string" },
        bullets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              text: { type: "string" },
            },
            required: ["label", "text"],
          },
        },
      },
    },
    caption: { type: "string" },
    photo_prompt: { type: "string" },
    image_entity: {
      type: "string",
      description:
        'Nome EXATO da pessoa pública real de quem a capa fala, ou "" (string vazia) se a capa não fala de ninguém real. OBRIGATÓRIO — responda sempre, nem que seja "".',
    },
    rationale: { type: "string" },
  },
  // `image_entity` é obrigatório porque como opcional ele vinha vazio
  // justamente quando importava: num post com "Warren Buffett" no briefing, o
  // modelo ignorou o campo e a peça saiu com um sósia gerado por IA ao lado do
  // nome verdadeiro. Campo obrigatório é respondido; campo opcional enterrado
  // em orientação de prompt, não.
  required: [
    "skeleton_id",
    "content",
    "caption",
    "rationale",
    "image_entity",
  ],
}

/**
 * Copy com RETRY quando vem sem `photo_prompt`.
 *
 * Sem prompt de imagem não há arte possível no padrão do produto, e a única
 * saída seria a composição livre — que não pode mais entregar peça. O que
 * sobrava era erro na cara do usuário por um sorteio ruim do modelo: UX ruim
 * pra uma coisa que o sistema resolve sozinho repetindo.
 *
 * Uma volta só, e o custo dela é o de uma copy (~US$0,03): duas seguidas sem
 * prompt de imagem é sinal de briefing problemático, não de azar, e aí o erro
 * é a resposta honesta.
 */
async function generateCopyComRetry(
  brand: PostBrand,
  briefing: string,
  candidates: SkeletonImpl[],
): Promise<{ parsed: SkeletonResponse; usage: Anthropic.Messages.Usage }> {
  const first = await generateCopy(brand, briefing, candidates)
  if (first.parsed.photo_prompt?.trim()) return first

  console.warn("[free-generate] copy veio sem photo_prompt — repetindo uma vez")
  const second = await generateCopy(brand, briefing, candidates)
  return {
    parsed: second.parsed,
    // Soma os dois usos: a volta perdida também foi paga, e esconder isso
    // falsearia justamente a medição de custo que a gente acabou de montar.
    usage: {
      ...second.usage,
      input_tokens: first.usage.input_tokens + second.usage.input_tokens,
      output_tokens: first.usage.output_tokens + second.usage.output_tokens,
      cache_creation_input_tokens:
        (first.usage.cache_creation_input_tokens ?? 0) +
        (second.usage.cache_creation_input_tokens ?? 0),
      cache_read_input_tokens:
        (first.usage.cache_read_input_tokens ?? 0) +
        (second.usage.cache_read_input_tokens ?? 0),
    },
  }
}

/** Chama o Claude pra gerar copy (content + caption + photo_prompt) de um skeleton. */
async function generateCopy(
  brand: PostBrand,
  briefing: string,
  candidates: SkeletonImpl[],
) {
  const client = getClient()
  const userPrompt = buildUserPrompt(brand, briefing, candidates)
  const response = await client.messages.create({
    model: MODEL_ESCRITOR,
    // Com os `bullets` (3-4 itens de rótulo + frase) a resposta passou do teto
    // anterior de 1500 e chegava cortada no meio.
    max_tokens: 3000,
    temperature: 0.8,
    // ~5,3k tokens fixos entre chamadas → cacheia (ver lib/tokens.ts).
    system: [
      {
        type: "text",
        text: systemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "entregar_copy",
        description: "Entrega a copy do post no formato estruturado.",
        input_schema: COPY_TOOL_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "entregar_copy" },
    messages: [{ role: "user", content: userPrompt }],
  })
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "A resposta da IA foi cortada no limite de tokens. Tente de novo com um briefing mais curto.",
    )
  }
  const block = response.content.find((b) => b.type === "tool_use")
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude não retornou a copy estruturada")
  }
  // Travessão fora, inclusive dos textos citados dentro do photo_prompt (eles
  // viram tipografia no bitmap). Ver lib/copy/sanitize.ts.
  return {
    parsed: sanitizeCopyDeep(block.input as SkeletonResponse),
    usage: response.usage,
  }
}

/**
 * HÍBRIDO OU BITMAP: com clean plate disponível, mede o layout da arte por
 * visão e monta camadas editáveis sobre o fundo limpo (drag/edição grátis,
 * como no carrossel). Qualquer falha degrada pro bitmap puro — nunca quebra.
 */
async function hybridOrBitmapSpec(
  artUrl: string,
  cleanUrl: string | null,
  content: SkeletonContent | null,
): Promise<FreePostSpec> {
  if (cleanUrl && content) {
    try {
      const items = await extractTextLayout(artUrl, content)
      const spec = buildSpecFromLayout(cleanUrl, items)
      console.info(
        `[free-generate] híbrido: ${spec.blocks.length} camadas medidas por visão`,
      )
      return spec
    } catch (err) {
      console.warn("[free-generate] medição do layout falhou — bitmap puro:", err)
    }
  }
  return bitmapSpec(artUrl)
}

/** Spec do modo bitmap: a arte completa vira o fundo, zero camadas HTML. */
function bitmapSpec(url: string): FreePostSpec {
  return {
    version: 1,
    background: { kind: "photo", photo_url: url },
    blocks: [],
    rationale:
      "Arte completa gerada pelo modelo de imagem (modo bitmap) — edição por camadas opcionais por cima.",
  }
}

/**
 * TRAVA FINAL: a composição livre não pode entregar peça enquanto o produto
 * for nano-banana.
 *
 * Os fallbacks que levavam até ela já estão fechados um a um (Flux, ausência
 * de photo_prompt, erro de imagem engolido), mas fechar caminho a caminho é
 * frágil: basta alguém abrir um novo. Esta função é a garantia estrutural —
 * com `POST_UNICO_BITMAP` ligado, chegar aqui fora do modo bitmap é bug, e a
 * resposta é falhar em voz alta em vez de entregar layout ruim.
 *
 * Com a flag desligada, o comportamento antigo volta inteiro.
 */
function assertPodeCompor(bitmap: boolean, photoUrl: string | null): void {
  if (POST_UNICO_BITMAP && !(bitmap && photoUrl)) {
    throw new Error(
      "Não foi possível gerar a arte do post no padrão esperado. Tente gerar de novo.",
    )
  }
}

export async function generateFreeSpec({
  brand,
  briefing,
  forceSkeletonId,
  excludeSkeletonIds,
}: GenerateOpts): Promise<FreeGenerateResult> {
  const t0 = performance.now()

  // Sorteia candidatos; a IA escolhe entre eles pela vibe do briefing.
  const candidates = pickSkeletonShortlist(forceSkeletonId, excludeSkeletonIds)
  const { parsed, usage } = await generateCopyComRetry(brand, briefing, candidates)

  // Trava a escolha na lista oferecida — se a IA inventar um id, cai no 1º.
  const skeleton =
    candidates.find((c) => c.meta.id === parsed.skeleton_id) ?? candidates[0]
  parsed.skeleton_id = skeleton.meta.id

  // Foto real (Wikipedia) se a IA marcou entidade real; senão IA (Pro/Flux).
  const resolved = await resolvePhotoUrl(parsed.image_entity, parsed.photo_prompt)
  const photoUrl = resolved.url
  const imageCost = resolved.costUsd

  // Composição livre com o skeleton como rede de segurança — mesma política
  // de buildApprovedSpec. No modo bitmap a arte já está pronta: nada a compor.
  assertPodeCompor(!!resolved.bitmap, photoUrl)
  const composed =
    resolved.bitmap && photoUrl
      ? null
      : await composeSpec({
          brand,
          content: parsed.content,
          photoUrl,
          // Fora do modo bitmap, referenceUrl é a referência de transcrição.
          referenceUrl: resolved.bitmap ? null : resolved.referenceUrl,
          briefing,
        })
  const spec =
    resolved.bitmap && photoUrl
      ? await hybridOrBitmapSpec(photoUrl, resolved.referenceUrl, parsed.content)
      : (composed?.spec ??
        skeleton.build({
          brand,
          content: parsed.content,
          photo_url: photoUrl,
        }))

  const ms = performance.now() - t0
  const claudeCost = computeCost(usage) + (composed ? computeCost(composed.usage) : 0)
  const usage_stages: UsageStageRecord[] = [
    { stage: "post_unico_copy", usage },
    ...(composed
      ? [
          {
            stage: "post_unico_compose" as const,
            usage: composed.usage,
            attempts: composed.attempts,
            approvedOnAttempt: composed.approvedOnAttempt,
          },
        ]
      : []),
  ]
  return {
    usage_stages,
    spec: { ...spec, rationale: parsed.rationale },
    rationale: parsed.rationale,
    skeleton_id: parsed.skeleton_id,
    caption: parsed.caption ?? "",
    photo_url: photoUrl,
    content: parsed.content,
    image_quality: resolved.quality,
    image_cost_usd: resolved.costUsd,
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

  const candidates = pickSkeletonShortlist(forceSkeletonId, excludeSkeletonIds)
  const { parsed, usage } = await generateCopyComRetry(brand, briefing, candidates)

  // Trava a escolha na lista oferecida — se a IA inventar um id, cai no 1º.
  parsed.skeleton_id = (
    candidates.find((c) => c.meta.id === parsed.skeleton_id) ?? candidates[0]
  ).meta.id

  const ms = performance.now() - t0
  const claudeCost = computeCost(usage)
  return {
    usage_stages: [{ stage: "post_unico_copy", usage }],
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
  briefing,
}: ApprovedOpts): Promise<FreeGenerateResult> {
  const t0 = performance.now()

  const skeleton = getSkeleton(skeletonId)
  if (!skeleton) throw new Error(`Skeleton "${skeletonId}" não existe`)

  // Foto real (Wikipedia) se há entidade real; senão IA (Pro/Flux).
  const resolved = await resolvePhotoUrl(photoEntity, photoPrompt)
  const photoUrl = resolved.url
  const imageCost = resolved.costUsd

  // Composição livre: a IA monta o layout inteiro (ver compose.ts). O skeleton
  // escolhido na etapa de texto vira rede de segurança — se a composição falhar
  // ou vier inválida, o post sai no layout pré-composto em vez de quebrar.
  assertPodeCompor(!!resolved.bitmap, photoUrl)
  const composed =
    resolved.bitmap && photoUrl
      ? null
      : await composeSpec({
          brand,
          content,
          photoUrl,
          referenceUrl: resolved.bitmap ? null : resolved.referenceUrl,
          briefing,
        })
  const spec =
    resolved.bitmap && photoUrl
      ? await hybridOrBitmapSpec(photoUrl, resolved.referenceUrl, content)
      : (composed?.spec ?? skeleton.build({ brand, content, photo_url: photoUrl }))
  const rationale =
    resolved.bitmap && photoUrl
      ? (spec.rationale ?? "Arte completa (modo bitmap)")
      : composed
        ? (composed.spec.rationale ?? "Composição livre")
        : `Composição indisponível — layout ${skeletonId}`
  const composeCost = composed ? computeCost(composed.usage) : 0

  const ms = performance.now() - t0

  return {
    usage_stages: composed
      ? [
          {
            stage: "post_unico_compose",
            usage: composed.usage,
            attempts: composed.attempts,
            approvedOnAttempt: composed.approvedOnAttempt,
          },
        ]
      : [],
    spec: { ...spec, rationale },
    rationale,
    skeleton_id: skeletonId,
    caption: "",
    photo_url: photoUrl,
    content,
    image_quality: resolved.quality,
    image_cost_usd: resolved.costUsd,
    metrics: {
      ms,
      inputTokens: composed?.usage.input_tokens ?? 0,
      outputTokens: composed?.usage.output_tokens ?? 0,
      cacheCreationInputTokens:
        composed?.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: composed?.usage.cache_read_input_tokens ?? 0,
      costUsd: composeCost,
      totalCostUsd: composeCost + imageCost,
    },
  }
}
