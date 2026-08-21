/**
 * Validação em código da capa do carrossel.
 *
 * O system prompt já manda nomear o sujeito, proíbe abrir com "Você" e limita
 * a manchete a 25 palavras. Regra de prompt o modelo cumpre na maioria das
 * vezes; esta trava cobre o resto. Foi escrita a partir de duas capas reais
 * que passaram por todas as regras e chegaram ruins no usuário:
 *   "VOCÊ TORCEU PELA VILÃ A TEMPORADA TODA."  (não diz qual série)
 *   "UMA BRASILEIRA ENTRE OS 30 MAIS PROMISSORES DO MUNDO"  (não diz quem)
 *
 * Vive fora do route.ts porque o Next valida os exports de um route handler:
 * exportar helper de lá quebra o build.
 */

const STOPWORDS = new Set([
  "de", "do", "da", "dos", "das", "e", "a", "o", "as", "os", "um", "uma",
  "para", "com", "que", "entre", "como", "the", "of", "and",
])

/** Teto de palavras da capa. Manchete de revista vai a 25; acima não cabe no 4:5. */
const MAX_PALAVRAS_CAPA = 26

/**
 * Aberturas que o prompt já proíbe (regra de front-load) e o modelo usa mesmo
 * assim. Gastam as duas primeiras palavras, as que decidem a leitura no feed,
 * sem dizer o assunto.
 */
const ABERTURAS_VAZIAS = [
  "voce", "vc", "se voce", "sabia que", "existe", "existem", "muita gente",
  "imagine", "imagina", "todo mundo sabe", "e se",
]

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
}

/**
 * A capa nomeia o sujeito? Aceita o nome completo OU qualquer token
 * significativo dele (>= 4 chars, fora stopwords): "Pellegrini" basta pra
 * "Marilia Pellegrini", "Dragão" basta pra "A Casa do Dragão". Tolerante por
 * design: falso positivo não custa nada, falso negativo queima uma regeração.
 */
export function coverMentions(coverText: string, sujeito: string): boolean {
  const cover = normalize(coverText)
  const nome = normalize(sujeito).trim()
  if (!nome) return true
  if (cover.includes(nome)) return true
  return nome
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
    .some((t) => cover.includes(t))
}

/** Nome da abertura proibida usada no título, ou `null` se a abertura é boa. */
export function aberturaFraca(title: string): string | null {
  const t = normalize(title).replace(/^[^a-z0-9]+/, "")
  return (
    ABERTURAS_VAZIAS.find(
      (p) => t === p || t.startsWith(p + " ") || t.startsWith(p + ","),
    ) ?? null
  )
}

/**
 * Decide se a capa precisa ser refeita. `null` = capa aprovada.
 * O texto devolvido vai direto no prompt da regeração, então é escrito pra
 * ser lido pelo modelo.
 */
export function motivoRejeicaoCapa(
  cover: { title: string; subtitle?: string },
  sujeito: string,
): string | null {
  const abertura = aberturaFraca(cover.title)
  if (abertura) {
    return `a capa abre com "${abertura}", que queima as duas primeiras palavras (as que decidem a leitura no feed) sem dizer o assunto`
  }
  if (sujeito && !coverMentions(cover.title, sujeito)) {
    return `não nomeia o sujeito do post ("${sujeito}") no title do slide 0, então quem vê no feed não sabe do que se trata`
  }
  const palavras = cover.title.trim().split(/\s+/).length
  if (palavras > MAX_PALAVRAS_CAPA) {
    return `a capa tem ${palavras} palavras e não cabe legível num card 4:5 (teto: 25). Corte para o essencial sem perder o nome do sujeito`
  }
  return null
}
