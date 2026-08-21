/**
 * Limpeza de assinatura de IA na copy gerada.
 *
 * O travessão (— / –) é o tique mais denunciante de texto de LLM: brasileiro
 * escrevendo no Instagram usa vírgula, dois-pontos ou ponto. Nossos prompts
 * ensinavam o vício ("encadeie ideias com vírgula/travessão", exemplos "BOM"
 * com —), e o modelo obedecia. As regras do prompt foram corrigidas, mas regra
 * de prompt o modelo esquece no slide 6 — então a garantia é aqui, em código.
 *
 * Vale só pra texto que o LEITOR vê (slots da copy, legenda, textos citados
 * dentro do prompt de arte, que viram tipografia no bitmap).
 */

/** Um travessão entre espaços vira vírgula: "não é nicho — são três" → ", são três". */
const DASH_BETWEEN_SPACES = /\s+[—–]\s+/g
/** Travessão abrindo a frase (fala/aposto): some junto com o espaço. */
const DASH_LEADING = /^\s*[—–]\s*/
/** Travessão sobrando no fim: some. */
const DASH_TRAILING = /\s*[—–]\s*$/
/** Resto (inclusive "10—20", "R$5–10"): vira hífen, que é pontuação normal. */
const DASH_ANY = /[—–]/g
/** Vírgula duplicada criada pela troca. */
const DOUBLE_COMMA = /,\s*,/g
/** Vírgula colada em pontuação forte: ", ." / ", :" */
const COMMA_BEFORE_PUNCT = /,\s*([.;:!?])/g

/**
 * Troca travessões por pontuação que gente usa.
 *
 * A vírgula é o substituto seguro: nunca quebra a gramática em PT-BR, mesmo
 * quando o trecho seguinte abre com conjunção ("..., e a oportunidade virou").
 */
export function stripEmDash(text: string): string {
  if (!text || !/[—–]/.test(text)) return text
  return text
    .replace(DASH_LEADING, "")
    .replace(DASH_TRAILING, "")
    .replace(DASH_BETWEEN_SPACES, ", ")
    .replace(DASH_ANY, "-")
    .replace(DOUBLE_COMMA, ",")
    .replace(COMMA_BEFORE_PUNCT, "$1")
    .trim()
}

/**
 * Aplica `stripEmDash` em toda string de uma estrutura (objeto, array, string).
 * Preserva o formato: o que entra objeto sai objeto, com as mesmas chaves.
 */
export function sanitizeCopyDeep<T>(value: T): T {
  if (typeof value === "string") return stripEmDash(value) as unknown as T
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeCopyDeep(v)) as unknown as T
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeCopyDeep(v)
    }
    return out as unknown as T
  }
  return value
}

/**
 * Bloco de regra pros system prompts que produzem copy. Fica aqui pra não
 * divergir entre carrossel e post único.
 */
export const REGRA_TRAVESSAO = `**PONTUAÇÃO: travessão é PROIBIDO.** NUNCA use "—" nem "–" em NENHUM texto que o leitor vê (título, subtítulo, corpo, legenda, badge, textos citados no prompt de arte). É o tique que mais denuncia texto de IA em português. Use vírgula, dois-pontos ou ponto final. Se a frase só funciona com travessão, ela está mal construída: reescreva.
RUIM: "Não é nicho — já são três em cada quatro."
BOM:  "Não é nicho: já são três em cada quatro."
BOM:  "Não é nicho. São três em cada quatro."`
