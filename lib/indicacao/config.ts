// =====================================================================
// lib/indicacao/config.ts
// Fonte única da verdade (lado TS) do programa INDIQUE E GANHE.
//
// Os mesmos números vivem como DEFAULT na função SQL
// `creditar_indicacao_no_pagamento` (0014_indicacao.sql). Quem manda é
// este arquivo: o webhook passa os valores explicitamente na RPC, e o
// default do SQL é só rede de segurança se alguém chamar a função na mão.
//
// POR QUE two-sided (a nossa diferença pro concorrente):
// o BestContent paga só quem indica. Quem clica no link não ganha nada e
// entra no funil como visitante qualquer — o link vira um anúncio, não uma
// oferta. Aqui os DOIS ganham, e os dois só ganham no PRIMEIRO PAGAMENTO
// CONFIRMADO do indicado. Isso muda a natureza do bônus do indicado: ele
// deixa de ser incentivo de CADASTRO (farm de conta falsa) e vira
// incentivo de COMPRA, exatamente no ponto onde o funil perde gente.
// =====================================================================

import { PLAN_TOKENS, TOKEN_COST } from "@/lib/tokens"

/**
 * Tokens creditados quando um indicado paga a primeira fatura.
 *
 * CALIBRAGEM (por que estes números, e não outros):
 *
 * - `indicador: 100` — mesmo headline do concorrente (100 créditos), e é um
 *   número que significa alguma coisa na NOSSA moeda: 100 tokens = 3 posts
 *   únicos completos (29 cada) ou 2 carrosséis de 7 slides com capa de IA
 *   (41 cada). Um terço do grant mensal do Starter (300).
 *
 * - `indicado: 45` — igual a PLAN_TOKENS.trial. A promessa fica redonda de
 *   explicar: "quem entrar pelo seu link ganha um teste grátis inteiro a
 *   mais na primeira assinatura". 45 cobre com folga um carrossel completo
 *   de 7 slides (4 + 25 + 6x2 = 41 tokens).
 *
 * CUSTO: 145 tokens x R$0,016069/token ≈ R$2,33 de COGS, pago UMA vez e só
 * depois que a conversão já aconteceu. Contra R$47 da primeira mensalidade
 * do Starter (o plano mais barato), são ~5% — e não recorre, então o piso
 * de 80% de margem bruta de lib/tokens.ts continua de pé: isto é custo de
 * aquisição, não de operação.
 */
export const REFERRAL_TOKENS = {
  /** Quem indica. */
  indicador: 100,
  /** Quem foi indicado (creditado junto, no mesmo pagamento). */
  indicado: PLAN_TOKENS.trial,
} as const

/** Quantos posts únicos dá pra fazer com N tokens (usado na copy da página). */
export function postsUnicosEquivalentes(tokens: number): number {
  return Math.floor(tokens / (TOKEN_COST.singlePostText + TOKEN_COST.singlePostImage))
}

/** Janela (dias) em que um cadastro ainda pode ser vinculado a um código. */
export const JANELA_VINCULO_DIAS = 30

/**
 * Alfabeto do código — espelha `gerar_codigo_indicacao()` no SQL.
 * Sem 0/O/1/I/L: o código é ditado por WhatsApp e Stories e precisa
 * sobreviver a ser digitado à mão.
 */
const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const TAMANHO_CODIGO = 8

/** Normaliza o que o usuário colou (maiúsculas, sem espaço). */
export function normalizarCodigo(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "")
}

/** `true` se o formato bate com o que o SQL gera. Validação de UI, não de segurança. */
export function codigoTemFormatoValido(raw: string): boolean {
  const c = normalizarCodigo(raw)
  if (c.length !== TAMANHO_CODIGO) return false
  for (const ch of c) if (!ALFABETO_CODIGO.includes(ch)) return false
  return true
}

/**
 * Monta o link de indicação.
 *
 * Aponta pra /cadastro (rota pública no middleware) com `?ref=CODIGO`.
 * O apex redireciona 307 pro subdomínio do app preservando a query, então
 * o link funciona nos dois domínios.
 */
export function montarLinkIndicacao(codigo: string, origem?: string): string {
  const base = (
    origem ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.nexuscontentai.com.br"
  ).replace(/\/+$/, "")
  return `${base}/cadastro?ref=${encodeURIComponent(codigo)}`
}

/** Status de uma indicação, como está no CHECK da tabela. */
export type StatusIndicacao = "pending" | "qualified" | "blocked"

/** Retorno de `registrar_indicacao` no SQL. */
export type ResultadoVinculo =
  | "ok"
  | "codigo_invalido"
  | "auto_indicacao"
  | "ja_vinculado"
  | "ja_pagante"
  | "janela_expirada"

/** Mensagem em PT-BR pra cada resultado do vínculo. */
export function mensagemVinculo(r: ResultadoVinculo): string {
  switch (r) {
    case "ok":
      return `Convite aplicado. Você ganha ${REFERRAL_TOKENS.indicado} tokens extras assim que assinar seu primeiro plano.`
    case "codigo_invalido":
      return "Esse código não existe. Confira as letras e tente de novo."
    case "auto_indicacao":
      return "Você não pode usar o seu próprio código de indicação."
    case "ja_vinculado":
      return "Sua conta já está vinculada a um convite."
    case "ja_pagante":
      return "Convites só valem antes da primeira assinatura."
    case "janela_expirada":
      return `O convite só pode ser aplicado nos primeiros ${JANELA_VINCULO_DIAS} dias da conta.`
  }
}
