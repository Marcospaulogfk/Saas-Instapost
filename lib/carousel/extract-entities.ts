/**
 * Extrai candidatos a NOME PRÓPRIO de pessoa de um texto (título/subtítulo).
 *
 * Rede de segurança pra imagem: quando a IA esquece de marcar `image_entity`
 * mas o slide cita alguém famoso ("Tom Cruise está correndo pro Oscar"), o
 * pipeline usa esses candidatos pra tentar a foto real da PESSOA (validando
 * humano via Wikidata P31=Q5, então nunca puxa foto de lugar/conceito).
 *
 * Só retorna sequências com 2+ palavras capitalizadas (nome + sobrenome) — evita
 * acrônimos (IMAX), palavras soltas capitalizadas (Oscar) e início de frase.
 */

// Conectores que podem aparecer NO MEIO de um nome (de/da/do…), sem quebrá-lo.
const CONNECTORS = new Set([
  "de", "da", "do", "dos", "das", "e", "di", "del", "della",
  "van", "von", "of", "the", "la", "le",
])

function stripEdges(word: string): string {
  // remove pontuação nas bordas, preserva acento/apóstrofo/hífen internos
  return word.replace(/^[^A-Za-zÀ-ÿ]+/, "").replace(/[^A-Za-zÀ-ÿ'’.-]+$/, "")
}

// Capitalizada = começa com maiúscula E tem ao menos uma minúscula (exclui
// acrônimos tipo "IMAX", "IA", "CEO").
function isCapitalized(word: string): boolean {
  return /^[A-ZÀ-Þ]/.test(word) && /[a-zà-ÿ]/.test(word)
}

export function properNounCandidates(text: string, max = 3): string[] {
  const tokens = (text || "")
    .split(/\s+/)
    .map(stripEdges)
    .filter(Boolean)

  const out: string[] = []
  let cur: string[] = []
  let caps = 0

  const flush = () => {
    // tira conector pendurado no fim ("Tom Cruise e" → "Tom Cruise")
    while (cur.length && CONNECTORS.has(cur[cur.length - 1].toLowerCase())) {
      cur.pop()
    }
    if (caps >= 2) out.push(cur.join(" "))
    cur = []
    caps = 0
  }

  for (const t of tokens) {
    if (isCapitalized(t)) {
      cur.push(t)
      caps++
    } else if (cur.length && CONNECTORS.has(t.toLowerCase())) {
      cur.push(t) // conector interno — só se já começamos um nome
    } else {
      flush()
    }
  }
  flush()

  // Ordena por PROBABILIDADE DE SER PESSOA, não por tamanho da string.
  //
  // Ordenar por comprimento parecia razoável ("nome completo antes de parcial")
  // e produzia o erro: no subtítulo "A Wallpaper escolheu Marilia Pellegrini
  // pro Architects' Directory 2026", a string "Architects' Directory" (21) era
  // testada ANTES de "Marilia Pellegrini" (18) — e a primeira que resolvesse
  // pra algo com foto ganhava a capa.
  return [...new Set(out)]
    .sort((a, b) => personScore(b) - personScore(a) || b.length - a.length)
    .slice(0, max)
}

/**
 * Palavras que denunciam que o sintagma é uma ORGANIZAÇÃO, PRÊMIO, OBRA ou
 * LUGAR — não uma pessoa. Candidatos com esses termos vão pro fim da fila.
 */
const NOT_PERSON_MARKERS = new Set([
  "directory", "awards", "award", "prize", "prêmio", "premio", "magazine",
  "revista", "jornal", "instituto", "fundação", "fundacao", "universidade",
  "faculdade", "museu", "galeria", "estúdio", "estudio", "studio", "agência",
  "agencia", "escritório", "escritorio", "empresa", "grupo", "group", "company",
  "inc", "ltda", "editora", "festival", "bienal", "casa", "edifício", "edificio",
  "torre", "avenida", "rua", "praça", "praca", "parque", "brasil", "brazil",
  "portugal", "europa", "america", "américa",
])

/**
 * Score simples de "isto parece um nome de pessoa".
 * +2 = duas ou três palavras, nenhuma delas marcador de organização (o formato
 * típico de nome+sobrenome). Penaliza marcador de organização e ano no meio.
 */
function personScore(candidate: string): number {
  const words = candidate.split(/\s+/).filter(Boolean)
  let score = 0

  const lower = words.map((w) => w.toLowerCase().replace(/[^a-zà-ÿ]/g, ""))
  if (lower.some((w) => NOT_PERSON_MARKERS.has(w))) score -= 3
  // Ano ou número dentro do sintagma quase nunca é nome de gente
  // ("Architects' Directory 2026").
  if (/\d/.test(candidate)) score -= 2
  // Apóstrofo de genitivo inglês ("Architects'") é marcador de instituição.
  if (/['’]s?\b/.test(candidate)) score -= 1

  const significant = words.filter((w) => w.length > 1)
  if (significant.length >= 2 && significant.length <= 3) score += 2
  else if (significant.length > 3) score -= 1

  return score
}
