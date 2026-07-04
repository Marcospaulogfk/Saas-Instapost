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

  // dedup, mais longos primeiro (nome completo antes de parcial), limita
  return [...new Set(out)].sort((a, b) => b.length - a.length).slice(0, max)
}
