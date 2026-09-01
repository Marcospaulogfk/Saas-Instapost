// =====================================================================
// lib/atribuicao/parse.ts
// Parse defensivo do cookie nx_ft (posto pelo middleware.ts). O valor é um
// JSON com chaves conhecidas, string a string, até 200 chars cada. Mas o
// cookie chega do navegador, então nada aqui pode confiar no formato: JSON
// inválido, objeto grande demais ou chave estranha simplesmente descarta.
// Compartilhado entre app/actions/auth.ts (cadastro por e-mail) e
// lib/atribuicao/vincular.ts (vínculo pós-OAuth).
// =====================================================================

/** Espelha as chaves que o middleware grava em nx_ft (ver middleware.ts). */
const CHAVES_CONHECIDAS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "referrer",
  "landing_page",
  "ts",
])

/** Mesmo limite do middleware (FT_PARAM_MAX): cada valor tem até 200 chars. */
const VALOR_MAX = 200
// Cookie inteiro não deveria passar disso nunca; acima é lixo ou adulteração.
const COOKIE_MAX_BYTES = 2048

/**
 * Converte o valor bruto do cookie nx_ft num objeto só com as chaves
 * conhecidas. Retorna `null` se o cookie não existir ou não for confiável
 * (JSON quebrado, tamanho fora do esperado, formato errado). Nunca lança.
 */
export function parsePrimeiroToqueCookie(
  raw: string | undefined | null,
): Record<string, string> | null {
  if (!raw) return null
  if (raw.length > COOKIE_MAX_BYTES) return null

  let bruto: unknown
  try {
    bruto = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof bruto !== "object" || bruto === null || Array.isArray(bruto)) {
    return null
  }

  const limpo: Record<string, string> = {}
  for (const [chave, valor] of Object.entries(bruto as Record<string, unknown>)) {
    if (!CHAVES_CONHECIDAS.has(chave)) continue
    if (typeof valor !== "string") continue
    const v = valor.slice(0, VALOR_MAX)
    if (v) limpo[chave] = v
  }
  return Object.keys(limpo).length > 0 ? limpo : null
}
