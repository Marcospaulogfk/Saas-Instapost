// =====================================================================
// lib/inspiracoes/validacao.ts
// Validação da fonte ANTES de qualquer fetch.
//
// Aqui mora a defesa de SSRF: a URL é digitada pelo usuário e quem faz o
// request é o nosso servidor, que enxerga a rede interna. Sem esta checagem,
// "http://169.254.169.254/..." viraria um leitor de metadados da VPS.
// =====================================================================

export type ResultadoValidacao =
  | { ok: true; valor: string }
  | { ok: false; erro: string }

/** Hosts que nunca podem ser buscados pelo servidor. */
const HOST_BLOQUEADO =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.*\.local)$/i

/**
 * Normaliza e valida uma URL de fonte.
 *
 * LIMITE CONHECIDO: a checagem é no hostname, não no IP resolvido — um
 * domínio público apontando pra 127.0.0.1 (DNS rebinding) passa. Fechar isso
 * exige resolver o DNS e prender o socket, o que só vale a pena se a feature
 * escalar; por ora o dano possível é ler uma página local, sem escrita.
 */
export function normalizarUrlDeFonte(raw: string): ResultadoValidacao {
  const bruto = raw.trim()
  if (!bruto) return { ok: false, erro: "Cole o endereço do site ou artigo." }

  const comProtocolo = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`

  let url: URL
  try {
    url = new URL(comProtocolo)
  } catch {
    return { ok: false, erro: "Esse endereço não parece uma URL válida." }
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, erro: "Só aceito endereços http ou https." }
  }
  if (!url.hostname.includes(".") || HOST_BLOQUEADO.test(url.hostname)) {
    return { ok: false, erro: "Esse endereço não é público." }
  }
  if (comProtocolo.length > 1000) {
    return { ok: false, erro: "Endereço longo demais." }
  }

  // Fragmento não muda o conteúdo e só criaria fonte duplicada.
  url.hash = ""
  return { ok: true, valor: url.toString() }
}

/** Valida um termo de busca. */
export function normalizarPalavraChave(raw: string): ResultadoValidacao {
  const termo = raw.trim().replace(/\s+/g, " ")
  if (termo.length < 3) {
    return { ok: false, erro: "O termo precisa ter pelo menos 3 letras." }
  }
  if (termo.length > 120) {
    return { ok: false, erro: "O termo está longo demais (máximo 120 letras)." }
  }
  return { ok: true, valor: termo }
}
