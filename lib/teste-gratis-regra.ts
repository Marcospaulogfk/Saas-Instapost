// =====================================================================
// lib/teste-gratis-regra.ts
// A regra do teste grátis por peça, na parte que o NAVEGADOR também pode
// importar (sem next/server, sem service_role). Quem decide de verdade é o
// banco (RPC reservar_peca_teste, migration 0029); aqui mora o que as telas
// precisam pra FALAR a mesma regra: o texto, o teto de slides e a conta de
// "quanto do teste já foi usado".
//
// Por que existe (rodada 4 do testador, 10/09/2026): a conta nova já era
// barrada certo no servidor, mas as telas continuavam falando do grátis
// antigo ("45 tokens", "7 slides", "0 de 45 créditos"). A pessoa só
// descobria a regra real na hora de gerar a segunda peça.
// =====================================================================

/** Teto de slides de um carrossel gerado no teste grátis. */
export const MAX_SLIDES_TESTE = 5

/** A regra em uma frase, igual em toda tela que fala do teste. */
export const TEXTO_REGRA_TESTE =
  "Teste grátis: 1 carrossel de até 5 slides ou 3 posts únicos"

export const MENSAGEM_TESTE_ESGOTADO =
  "Seu teste grátis já foi usado: ele inclui 1 carrossel de até 5 slides ou até 3 posts únicos. Para continuar criando, escolha um plano."

/**
 * Data de corte da regra (contas criadas a partir de 10/09/2026, 00h de
 * Brasília). ESPELHO do literal em reservar_peca_teste (migration 0029):
 * se um mudar, o outro muda junto, senão a tela promete uma regra e o
 * servidor aplica outra.
 */
export const CORTE_TESTE_GRATIS = "2026-09-10T03:00:00Z"

/** Unidades do teste: carrossel vale 3, post único vale 1, teto 3. */
export const UNIDADES_TESTE = 3

export interface EstadoTeste {
  /** A conta está na regra por peça (nova, sem plano, sem saldo comprado). */
  noTeste: boolean
  carrosseis: number
  posts: number
  /** Unidades que sobram (0 a 3). */
  restante: number
  /** Nada mais cabe: nem 1 post. */
  esgotado: boolean
}

export const FORA_DO_TESTE: EstadoTeste = {
  noTeste: false,
  carrosseis: 0,
  posts: 0,
  restante: 0,
  esgotado: false,
}

/** A mesma conta de reservar_peca_teste, pra tela mostrar sem gastar peça. */
export function calcularEstadoTeste(
  conta: {
    created_at: string | null
    subscription_status: string | null
    topup_credits: number | null
    referral_credits: number | null
  },
  pecas: { carrosseis: number; posts: number },
): EstadoTeste {
  const nova =
    !!conta.created_at && new Date(conta.created_at).getTime() >= Date.parse(CORTE_TESTE_GRATIS)
  const naRegra =
    nova &&
    conta.subscription_status !== "active" &&
    (conta.topup_credits ?? 0) <= 0 &&
    (conta.referral_credits ?? 0) <= 0
  if (!naRegra) return FORA_DO_TESTE
  const usado = pecas.carrosseis * 3 + pecas.posts
  const restante = Math.max(0, UNIDADES_TESTE - usado)
  return {
    noTeste: true,
    carrosseis: pecas.carrosseis,
    posts: pecas.posts,
    restante,
    esgotado: restante <= 0,
  }
}

/** A mensagem de erro que a tela recebeu é a do teste esgotado? */
export function eTesteEsgotado(mensagem: string | null | undefined): boolean {
  return !!mensagem && mensagem.startsWith("Seu teste grátis já foi usado")
}
