// =====================================================================
// lib/afiliados/config.ts
// Fonte única da verdade (lado TS) do programa de AFILIADOS.
//
// Afiliado != indicação: indicação (lib/indicacao) paga em tokens, uma
// vez, pra qualquer usuário. Afiliado paga em DINHEIRO, recorrente, e só
// pra quem foi aprovado manualmente. Os dois não cumulam: a cobrança é
// atribuída ao afiliado (subscriptions.affiliate_code) ou à indicação,
// nunca às duas.
// =====================================================================

/** Comissão padrão (%) sobre cada cobrança do cliente indicado. */
export const COMISSAO_PADRAO_PCT = 25

/** Cookie de atribuição gravado pelo middleware quando a URL traz `?af=`. */
export const COOKIE_AFILIADO = "nx_af"
export const COOKIE_AFILIADO_DIAS = 60

/** Alfabeto do código (espelha `gerar_codigo_afiliado()` no SQL). */
const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const TAMANHO_CODIGO = 8

/** Maiúsculas, sem espaço. */
export function normalizarCodigoAfiliado(raw: string): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "")
}

/** Formato bate com o que o SQL gera. Validação de UI, não de segurança. */
export function codigoAfiliadoValido(raw: string): boolean {
  const c = normalizarCodigoAfiliado(raw)
  if (c.length !== TAMANHO_CODIGO) return false
  for (const ch of c) if (!ALFABETO_CODIGO.includes(ch)) return false
  return true
}

/** Link público do afiliado: `${base}/?af=CODE` (a home da landing). */
export function montarLinkAfiliado(code: string, base?: string): string {
  const origem = (
    base ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://nexuscontentai.com.br"
  ).replace(/\/+$/, "")
  return `${origem}/?af=${encodeURIComponent(normalizarCodigoAfiliado(code))}`
}

export type StatusAfiliado = "pending" | "approved" | "rejected" | "suspended"
export type StatusComissao = "pending" | "paid" | "reversed"

/** Retorno de `candidatar_afiliado` no SQL. */
export type ResultadoCandidatura = "ok" | "ja_candidato" | "dados_invalidos"

export function mensagemCandidatura(r: ResultadoCandidatura): string {
  switch (r) {
    case "ok":
      return "Candidatura enviada. A gente analisa manualmente e responde pelo e-mail informado."
    case "ja_candidato":
      return "Já existe uma candidatura com esse e-mail ou conta. Aguarde a análise."
    case "dados_invalidos":
      return "Confira o nome e o e-mail e tente de novo."
  }
}

/** Quanto o afiliado ganha por mês, em reais, por plano (copy da página pública). */
export function comissaoMensal(precoMensal: number, pct = COMISSAO_PADRAO_PCT): number {
  return Math.round(precoMensal * pct) / 100
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
