/**
 * POLÍTICA DE IMAGEM — decide QUE TIPO de imagem um slide recebe, antes de
 * qualquer prompt ser escrito.
 *
 * O erro estrutural do pipeline antigo não era o modelo de imagem, era a ORDEM
 * das decisões: ele fazia `texto → prompt → gerar`. Um post sobre uma arquiteta
 * premiada virava "pessoa no contexto da profissão" → mulher numa mesa em luz
 * baixa, sem nenhuma relação com a notícia.
 *
 * A ordem correta é:
 *   texto → ENTIDADE ÂNCORA → CLASSE de imagem → FONTE → produzir → VALIDAR
 *
 * As quatro famílias (direção de arte editorial):
 *   A. retrato do sujeito   — exige foto REAL verificada
 *   B. objeto simbólico     — concreto e único, nunca "pessoa trabalhando"
 *   C. cena / lugar         — obra, ambiente, atividade
 *   D. composição gráfica   — tipografia + cor, sem foto. É o fallback que
 *                             nunca mente.
 *
 * Degradar de FAMÍLIA é seguro (pessoa → obra → objeto → tipográfico).
 * Degradar de PRECISÃO não é (foto de outra pessoa "parecida" = erro editorial).
 */

export type ImageFamily = "portrait" | "object" | "scene" | "typographic"

export type EntityKind = "person" | "work" | "org" | "place" | "none"

export interface ImagePolicy {
  family: ImageFamily
  entity: string
  entityKind: EntityKind
  /** o texto do slide nomeia uma pessoa real → trava de rosto ligada */
  namesRealPerson: boolean
}

/**
 * Termos que indicam contexto negativo. Regra de veracidade R3: nesses casos
 * nenhum rosto identificável entra na arte — nem real, nem gerado. O risco é
 * difamação por associação visual.
 */
const NEGATIVE_CONTEXT = [
  "crime", "criminoso", "prisão", "preso", "fraude", "golpe", "estelionato",
  "processo", "processado", "condenado", "acusado", "investigação", "investigado",
  "demissão", "demitido", "falência", "dívida", "endividado", "prejuízo",
  "doença", "câncer", "morte", "morreu", "óbito", "acidente", "tragédia",
  "escândalo", "polêmica", "denúncia", "assédio", "vazamento",
]

export function hasNegativeContext(text: string): boolean {
  const t = (text || "").toLowerCase()
  return NEGATIVE_CONTEXT.some((w) => t.includes(w))
}

/**
 * Classifica a entidade declarada pela IA. O LLM só diz QUAL é a entidade e de
 * que TIPO ela é; quem decide se existe foto usável é o código (Wikidata +
 * validação de identidade), nunca o palpite do modelo.
 */
export function classifyEntity(entity: string, kindHint?: string): EntityKind {
  const e = (entity || "").trim()
  if (!e) return "none"
  const hint = (kindHint || "").trim().toLowerCase()
  if (hint === "person" || hint === "work" || hint === "org" || hint === "place") {
    return hint
  }
  // Sem dica explícita: nome com 2+ palavras capitalizadas e sem marcador de
  // organização é tratado como pessoa (o caso de maior risco), então a busca
  // sai com requireHuman e falha limpo em vez de trazer foto de outra coisa.
  const orgMarker = /\b(ltda|s\.?a\.?|inc|corp|group|studio|agência|agencia|revista|magazine)\b/i
  if (orgMarker.test(e)) return "org"
  const words = e.split(/\s+/).filter(Boolean)
  if (words.length >= 2 && words.every((w) => /^[A-ZÀ-Þ]/.test(w))) return "person"
  return "work"
}

export function decideImagePolicy(input: {
  entity?: string | null
  entityKind?: string | null
  text: string
}): ImagePolicy {
  const entity = (input.entity ?? "").trim()
  const kind = classifyEntity(entity, input.entityKind ?? undefined)

  const family: ImageFamily =
    kind === "person" ? "portrait" : kind === "none" ? "object" : "scene"

  return {
    family,
    entity,
    entityKind: kind,
    namesRealPerson: kind === "person",
  }
}

// =============================================================================
// Trava de veracidade (R1/R2/R3) — regra de CÓDIGO, não instrução de prompt
// =============================================================================

/** Negativos que impedem o modelo de inventar um rosto humano. */
const NO_FACE_NEGATIVE =
  "no human face, no identifiable person, no portrait, no people looking at camera"

/** Negativos que matam o look de banco de imagens (a causa do clichê antigo). */
const NO_STOCK_NEGATIVE =
  "stock photo, generic office, person at desk with laptop, business handshake, smiling model looking at camera, lens flare, 3D render, CGI plastic skin, watermark, text, extra fingers, flat even lighting"

function appendNegative(prompt: string, extra: string): string {
  const p = (prompt || "").trim()
  if (!p) return p
  // O template já termina com "Negative: ..." na maioria dos casos — anexa ali
  // em vez de abrir uma segunda seção de negativos.
  if (/negative\s*:/i.test(p)) {
    return p.replace(/\s*$/, "").replace(/\.?$/, "") + ", " + extra + "."
  }
  return `${p} Negative: ${extra}.`
}

/**
 * Aplica a trava de veracidade ao prompt de imagem ANTES de gerar.
 *
 * R1 — o texto nomeia uma pessoa real e não temos foto verificada dela:
 *      proibido gerar rosto. Ou é a pessoa certa, ou não é pessoa nenhuma.
 * R3 — contexto negativo: nenhum rosto identificável, mesmo genérico.
 *
 * Isso vive no código porque instrução em prompt vaza — o modelo desobedece
 * sob pressão de outras regras. Aqui não tem como desobedecer.
 */
export function enforceVeracity(
  prompt: string,
  opts: { namesRealPerson: boolean; hasVerifiedPhoto: boolean; text?: string },
): string {
  let out = appendNegative(prompt, NO_STOCK_NEGATIVE)

  const negativeContext = hasNegativeContext(opts.text ?? "")
  const mustHideFaces =
    (opts.namesRealPerson && !opts.hasVerifiedPhoto) || negativeContext

  if (mustHideFaces) {
    out = appendNegative(out, NO_FACE_NEGATIVE)
  }
  return out
}

/**
 * Prompt de última instância quando a família degrada até o fim e ainda assim
 * não há imagem confiável: cena editorial concreta SEM pessoa, derivada do
 * vocabulário visual do próprio texto. Melhor uma imagem honesta do assunto do
 * que um retrato inventado de alguém que não é quem o post diz que é.
 */
export function fallbackScenePrompt(subject: string): string {
  const s = (subject || "").trim() || "the subject of the article"
  return (
    `Editorial photograph of ${s}, no people in frame, natural directional light, ` +
    `shot on 35mm, vertical 4:5 composition with the subject in the lower two thirds ` +
    `and clean negative space in the upper third for typography, ` +
    `magazine reportage aesthetic, medium-format film grain, natural color. ` +
    `Negative: ${NO_STOCK_NEGATIVE}, ${NO_FACE_NEGATIVE}.`
  )
}
