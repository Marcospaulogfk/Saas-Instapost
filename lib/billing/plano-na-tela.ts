// =====================================================================
// lib/billing/plano-na-tela.ts
// O que o cartão "Plano" da /dashboard/tokens conta ao cliente.
//
// POR QUE ISTO EXISTE COMO FUNÇÃO (19/09/2026):
// A tela dizia "Próxima cobrança" para um cliente que tinha pago o ano
// inteiro adiantado. Quem paga adiantado e lê que vem cobranca no mês que
// vem entende que vai ser cobrado duas vezes — e esse cliente tinha acabado
// de passar dois meses travado por culpa nossa.
//
// A regra virou função pura por um motivo prático: não existe nenhuma conta
// com assinatura no provedor em produção, então não dá pra abrir a tela e
// mostrar que o mensalista continua intacto. Aqui dá pra AFIRMAR isso num
// teste, caso por caso, sem inventar conta de mentira no banco de verdade.
//
// A decisão é sempre pelo ESTADO da conta, nunca por cliente.
// =====================================================================

export type PlanoNaTela =
  /** Período já pago e sem assinatura no provedor: não vem cobrança nenhuma. */
  | {
      modo: "prepago"
      /** "Anual, pago adiantado" — sem preço: a tabela não é o acordo dela. */
      cicloLabel: string | null
      proximaRecarga: string | null
      pagoAte: string
    }
  /** Tem assinatura no provedor: continua lendo cobrança, como sempre leu. */
  | {
      modo: "cobranca"
      cobrancaEm: string | null
      /** No anual, cobrança e recarga deixaram de ser o mesmo dia. */
      proximaRecarga: string | null
      mostrarPreco: true
    }
  /** Ativo marcado à mão, sem plano/ciclo: só o grant mensal. */
  | { modo: "ativo_sem_cobranca" }
  /** Teste grátis, cancelado, em atraso. */
  | { modo: "inativo" }

export interface EstadoDoPlano {
  subscription_status: string | null | undefined
  plan_id: string | null | undefined
  plan_cycle: string | null | undefined
  plan_renews_at: string | null | undefined
  plan_prepaid_until: string | null | undefined
  billing_subscription_id: string | null | undefined
}

/**
 * Decide o que o cartão do plano mostra.
 *
 * @param agora relógio de referência (os testes passam; a tela passa `new Date()`).
 */
export function plano(e: EstadoDoPlano, agora: Date = new Date()): PlanoNaTela {
  const ativo = e.subscription_status === "active"
  if (!ativo) return { modo: "inativo" }

  const renovaEm = e.plan_renews_at ?? null
  const pagoAte = e.plan_prepaid_until ?? null
  const temProvedor = Boolean(e.billing_subscription_id)
  const anual = e.plan_cycle === "annual"

  // Pré-paga: o dinheiro já entrou e não existe assinatura pra cobrar de
  // novo. Só enquanto o período corre — passou da data, o job diário encerra
  // e a conta vira trial.
  if (pagoAte && !temProvedor && new Date(pagoAte) > agora) {
    return {
      modo: "prepago",
      cicloLabel: e.plan_cycle
        ? anual
          ? "Anual, pago adiantado"
          : "Mensal, pago adiantado"
        : null,
      proximaRecarga: renovaEm,
      pagoAte,
    }
  }

  if (e.plan_id && e.plan_cycle) {
    return {
      modo: "cobranca",
      // No ANUAL a cobrança cai no fim do período pago, não na recarga
      // mensal das fichas. No MENSAL os dois são o mesmo dia, então o valor
      // é idêntico ao que a tela mostrava antes de 19/09/2026.
      cobrancaEm: anual && pagoAte ? pagoAte : renovaEm,
      proximaRecarga: anual && pagoAte ? renovaEm : null,
      mostrarPreco: true,
    }
  }

  return { modo: "ativo_sem_cobranca" }
}
