/**
 * Geracao das PAUTAS do Calendario Inteligente (Claude).
 *
 * CUSTO: 0 tokens do usuario. Esta chamada e paga por nos, de proposito — e o
 * gancho do funil. O usuario enche o calendario de ideias sem gastar nada e
 * so paga quando decide materializar uma pauta em post (29 tokens, cobrados
 * no wizard de criacao via lib/tokens.ts). NAO acoplar debito aqui.
 *
 * Por isso o pedido roda barato: sem thinking, sem busca web,
 * e o system prompt fixo entra com cache_control ephemeral — o mesmo padrao
 * de lib/generation/claude.ts e app/api/refine-prompt/route.ts.
 */

import Anthropic from "@anthropic-ai/sdk"
import { MODEL_MECANICO } from "@/lib/generation/models"
import type { PostFormato, PostObjetivo } from "@/lib/planejar"
import { DIA_SEMANA_LABEL, type PautaGerada, type PautaRede } from "./types"

const MODEL = MODEL_MECANICO

/** Um slot da grade: data fixa + o que acontece naquele dia. */
export interface SlotPauta {
  /** YYYY-MM-DD */
  data: string
  /** Nome da data comemorativa, quando cai exatamente neste dia. */
  efemeride?: string
}

export interface GerarPautasInput {
  brandName: string
  description: string
  targetAudience: string
  toneOfVoice: string
  mainObjective: string
  rede: PautaRede
  slots: SlotPauta[]
  /**
   * Titulos das inspiracoes ja curadas pro nicho da marca
   * (lib/inspiracoes.ts). E o que sustenta a promessa do card: "baseado nas
   * suas inspiracoes" — sem elas a IA repete o generico de sempre.
   */
  inspiracoes: Array<{ titulo: string; descricao: string }>
  /** Titulos que ja existem no calendario — evita sugerir a mesma coisa. */
  evitarTitulos: string[]
}

const PAUTAS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pautas"],
  properties: {
    pautas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["indice", "titulo", "descricao", "motivo", "formato", "objetivo"],
        properties: {
          // O indice amarra a pauta ao slot. Pedir a DATA de volta convidaria
          // o modelo a inventar uma — o indice nao tem como sair da grade.
          indice: { type: "integer" },
          titulo: { type: "string" },
          descricao: { type: "string" },
          motivo: { type: "string" },
          formato: {
            type: "string",
            enum: ["post", "carrossel", "stories", "reels"],
          },
          objetivo: {
            type: "string",
            enum: ["sell", "inform", "engage", "community"],
          },
        },
      },
    },
  },
} as const

const REDE_BRIEF: Record<PautaRede, string> = {
  instagram:
    "Instagram: feed e stories. Carrossel domina conteudo educativo; reels pra alcance. Gancho nos primeiros 5 caracteres do titulo.",
  facebook:
    "Facebook: publico mais velho, texto mais longo funciona, post unico com imagem forte performa melhor que carrossel.",
  linkedin:
    "LinkedIn: registro profissional, primeira pessoa, bastidor e numero real. Sem gria, sem emoji, sem CTA de venda direta.",
}

const SYSTEM_PROMPT = `Voce e head de conteudo de uma agencia brasileira. Sua entrega e uma PAUTA editorial: a lista do que a marca vai postar, em que dia, e por que.

O QUE VOCE ENTREGA
Para cada slot de data que eu passar, uma pauta com:
- titulo: o assunto do post, em 3 a 8 palavras. Especifico da marca, nunca categoria generica. RUIM: "Dica de segunda". BOM: "O erro de contrato que custa 3 meses de obra".
- descricao: 1 ou 2 frases dizendo o que o post fala e onde ele termina (o CTA). E o briefing que vai virar o post depois — precisa ser suficiente pra outra pessoa executar.
- motivo: 1 frase curta explicando POR QUE esse post nesse dia. E o que convence o usuario a confiar na sugestao. Aponte o gancho real (data comemorativa, momento da semana, sequencia com a pauta anterior, objetivo da marca). Nunca "pra engajar".
- formato: post, carrossel, stories ou reels.
- objetivo: sell, inform, engage ou community.

COMO PENSAR O CONJUNTO
- O calendario e um ARCO, nao uma lista solta: pautas conversam entre si, uma prepara a outra. Sequencia (parte 1 / parte 2) e bem-vinda quando as datas sao proximas.
- Equilibre os objetivos. Um calendario 100% venda queima a audiencia; um 100% educativo nao fatura. Regra pratica: a cada 4 pautas, no maximo 1 de venda direta.
- Varie o formato. Carrossel todo dia cansa e e caro de produzir.
- Segunda e terca puxam conteudo denso; sexta e fim de semana puxam leve, bastidor, comunidade.
- Use a data comemorativa SO quando ela fizer sentido pro nicho. Forcar "Dia do Abraco" numa contabilidade e pior que ignorar.

REGRAS DURAS
- Portugues brasileiro. Sem emoji. Sem clichê de IA ("Descubra", "Transforme sua vida", "Vem com a gente", "Saiba mais").
- NAO invente fato, numero, premio, caso de cliente ou dado de mercado que eu nao tenha te dado. Pauta e angulo, nao afirmacao factual.
- Uma pauta por slot, na mesma quantidade e na mesma ordem dos slots. O campo indice repete o numero do slot.
- Nao repita titulo que eu marcar como ja existente no calendario.`

export interface GerarPautasResult {
  pautas: PautaGerada[]
  metrics: { ms: number; inputTokens: number; outputTokens: number }
}

export async function gerarPautas(
  input: GerarPautasInput,
): Promise<GerarPautasResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY ausente em .env.local")
  }
  if (input.slots.length === 0) {
    return { pautas: [], metrics: { ms: 0, inputTokens: 0, outputTokens: 0 } }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const slotsTxt = input.slots
    .map((s, i) => {
      const d = new Date(`${s.data}T12:00:00`)
      const dia = DIA_SEMANA_LABEL[d.getDay()]
      const efem = s.efemeride ? ` — data comemorativa: ${s.efemeride}` : ""
      return `${i}. ${s.data} (${dia})${efem}`
    })
    .join("\n")

  const inspiracoesTxt = input.inspiracoes.length
    ? input.inspiracoes.map((i) => `- ${i.titulo}: ${i.descricao}`).join("\n")
    : "(sem inspiracoes salvas — use o que sabe da marca)"

  const evitarTxt = input.evitarTitulos.length
    ? input.evitarTitulos.map((t) => `- "${t}"`).join("\n")
    : "(nenhum)"

  const userMessage = `Monte a pauta editorial desta marca.

MARCA: ${input.brandName}
Sobre: ${input.description || "(nao informado)"}
Publico-alvo: ${input.targetAudience || "(nao informado)"}
Tom de voz: ${input.toneOfVoice || "(nao informado)"}
Objetivo principal: ${input.mainObjective || "engage"}

REDE DE DESTINO: ${REDE_BRIEF[input.rede]}

INSPIRACOES DO USUARIO (os temas que ele ja demonstrou interesse — use como direcao, adaptando ao momento, nao copie o titulo):
${inspiracoesTxt}

JA EXISTE NO CALENDARIO (nao repita):
${evitarTxt}

SLOTS (${input.slots.length}) — uma pauta pra cada, na mesma ordem:
${slotsTxt}`

  const start = performance.now()
  const response = await client.messages.create({
    model: MODEL,
    // ~180 tokens por pauta + folga do envelope JSON.
    max_tokens: Math.min(16000, 1200 + input.slots.length * 260),
    thinking: { type: "disabled" },
    // Sem `effort`: Haiku 4.5 rejeita o parâmetro (400).
    output_config: {
      format: { type: "json_schema", schema: PAUTAS_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  } as Anthropic.Messages.MessageCreateParamsNonStreaming)
  const ms = performance.now() - start

  if (response.stop_reason === "refusal") {
    throw new Error("Claude se recusou a montar a pauta.")
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Claude atingiu max_tokens montando a pauta — reduza os posts por semana ou o periodo.",
    )
  }

  const raw = extractText(response.content)
  const parsed = parseJson<{ pautas: RawPauta[] }>(raw)

  return {
    pautas: amarrarNaGrade(parsed.pautas ?? [], input.slots),
    metrics: {
      ms,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  }
}

interface RawPauta {
  indice?: number
  titulo?: string
  descricao?: string
  motivo?: string
  formato?: string
  objetivo?: string
}

const FORMATOS: PostFormato[] = ["post", "carrossel", "stories", "reels"]
const OBJETIVOS: PostObjetivo[] = ["sell", "inform", "engage", "community"]

/**
 * Casa cada pauta com o slot dela e joga fora o que a IA inventou.
 *
 * A grade manda: se vierem pautas a mais, sobra e ignora; se vier de menos, o
 * calendario fica com menos dias preenchidos — nunca com uma data fora da
 * janela que o usuario pediu. O `indice` e a chave; quando ele vier ausente
 * ou fora do intervalo (o modelo as vezes pula), cai na posicao do array.
 */
function amarrarNaGrade(brutas: RawPauta[], slots: SlotPauta[]): PautaGerada[] {
  const out: PautaGerada[] = []
  const usados = new Set<number>()

  brutas.forEach((p, pos) => {
    const idx =
      typeof p.indice === "number" && p.indice >= 0 && p.indice < slots.length
        ? p.indice
        : pos
    const slot = slots[idx]
    if (!slot || usados.has(idx)) return
    const titulo = (p.titulo ?? "").trim()
    if (!titulo) return
    usados.add(idx)
    out.push({
      titulo: titulo.slice(0, 160),
      descricao: (p.descricao ?? "").trim().slice(0, 600),
      motivo: (p.motivo ?? "").trim().slice(0, 300),
      formato: FORMATOS.includes(p.formato as PostFormato)
        ? (p.formato as PostFormato)
        : "post",
      objetivo: OBJETIVOS.includes(p.objetivo as PostObjetivo)
        ? (p.objetivo as PostObjetivo)
        : "engage",
      data: slot.data,
    })
  })

  return out.sort((a, b) => a.data.localeCompare(b.data))
}

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
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
    throw new Error(`Claude retornou JSON invalido: ${message}`)
  }
}
