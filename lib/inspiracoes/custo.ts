// =====================================================================
// lib/inspiracoes/custo.ts
// Preço de uma rodada de "gerar ideias a partir de uma fonte".
//
// NÃO existe número novo aqui: o custo é DERIVADO de TOKEN_COST
// (lib/tokens.ts), que segue sendo a fonte única da verdade de preço.
// Este módulo só decide a POLÍTICA (cota grátis + o que cobrar depois).
// =====================================================================

import { TOKEN_COST } from "@/lib/tokens"

/**
 * DECISÃO DE PREÇO — pauta é gancho de funil, não produto.
 *
 * O concorrente (BestContent) cobra 5 créditos por inspiração e ainda limita
 * a automação em 5/dia. A gente faz o contrário de propósito:
 *
 *   1. As primeiras N rodadas do dia são GRÁTIS.
 *   2. Da N+1 em diante, custa `TOKEN_COST.textOnly` (4 tokens) — a MENOR
 *      unidade de texto já precificada no produto ("roteiro + legenda").
 *
 * Por quê:
 * - A pauta é a primeira coisa que o usuário faz e a última que ele quer
 *   pagar. Se descobrir o que postar custa crédito, ele não descobre — e não
 *   gera. O que a gente quer cobrar é a ARTE, que é onde o COGS mora de fato
 *   (uma capa = 25 tokens contra 4 do texto inteiro).
 * - O calendário editorial (feito em paralelo) também deixa a pauta grátis.
 *   Duas portas de pauta com política de preço diferente confundiria — e a
 *   incoerente seria esta, que é a porta nova.
 * - O contra-argumento óbvio ("então é infinito e sangra dinheiro") é
 *   resolvido pelo LIMITE, não pelo preço: a contenção é a cota diária, não
 *   uma barreira de crédito na primeira tentativa.
 *
 * CALIBRAGEM (números reais, pra quem for mexer):
 * uma rodada é UMA chamada de texto do Claude Sonnet.
 *   - fonte 'url'     -> ~R$0,13 de COGS (texto raspado no input + ~1k de saída)
 *   - fonte 'keyword' -> ~R$0,31 de COGS (soma 2 buscas web a US$0,01 cada
 *                        mais o conteúdo dos resultados no input)
 * Com 3 rodadas/dia o teto de custo por usuário é ~R$0,93/dia no pior caso
 * (todas keyword, todo dia) — um teto que na prática ninguém encosta.
 *
 * ⚠️ Assumido conscientemente: 4 tokens NÃO cobrem o COGS de uma rodada com
 * busca web no piso de 80% de margem que rege lib/tokens.ts. É preço de
 * gancho — quem segura o custo é a cota, não a cobrança. Se o consumo real
 * mostrar que dói, os dois botões nesta ordem são: (1) baixar
 * IDEIAS_GRATIS_POR_DIA, (2) trocar o modelo da geração de ideias por Haiku.
 * Subir o preço da pauta é o último recurso, porque desfaz o gancho.
 */
export const IDEIAS_GRATIS_POR_DIA = 3

/** Custo em tokens de uma rodada FORA da cota diária. */
export const IDEIAS_TOKEN_COST = TOKEN_COST.textOnly

/** Quantas ideias uma rodada entrega (também trava o custo de saída). */
export const IDEIAS_POR_RODADA = 5

/**
 * Quanto custa a PRÓXIMA rodada, dado quantas o usuário já fez hoje.
 * É esta função que alimenta o "vai custar N tokens" na UI — o preço nunca
 * deve ser recalculado à mão em outro lugar.
 */
export function custoDaRodada(rodadasHoje: number): number {
  return rodadasHoje < IDEIAS_GRATIS_POR_DIA ? 0 : IDEIAS_TOKEN_COST
}

/** Quantas rodadas grátis ainda restam hoje (nunca negativo). */
export function gratisRestantes(rodadasHoje: number): number {
  return Math.max(0, IDEIAS_GRATIS_POR_DIA - rodadasHoje)
}

export interface CotaInspiracao {
  rodadasHoje: number
  gratisRestantes: number
  /** Custo em tokens da próxima rodada (0 = dentro da cota). */
  custoProxima: number
  /** Saldo de tokens do usuário, ou null sem sessão. */
  saldo: number | null
}

/** Rótulo do custo, pronto pra UI. Sem emoji, por preferência do produto. */
export function rotuloDeCusto(cota: CotaInspiracao): string {
  if (cota.custoProxima === 0) {
    return `Grátis — ${cota.gratisRestantes} de ${IDEIAS_GRATIS_POR_DIA} hoje`
  }
  return `Custa ${cota.custoProxima} tokens`
}
