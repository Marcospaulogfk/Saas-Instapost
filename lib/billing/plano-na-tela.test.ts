import { describe, expect, it } from "vitest"
import { plano } from "./plano-na-tela"

// =====================================================================
// O QUE O CARTÃO DO PLANO CONTA AO CLIENTE.
//
// Existe porque não há nenhuma conta com assinatura no provedor em produção:
// sem estes testes, "não quebrei a tela do mensalista" seria palavra minha.
// Aqui os dois casos são afirmados lado a lado.
// =====================================================================

const AGORA = new Date("2026-09-19T21:00:00Z")

/** A conta do primeiro cliente: pagou o ano adiantado, sem assinatura no provedor. */
const PRE_PAGA = {
  subscription_status: "active",
  plan_id: "pro",
  plan_cycle: "annual",
  plan_renews_at: "2026-10-09T12:00:00.000Z",
  plan_prepaid_until: "2027-07-09T12:00:00.000Z",
  billing_subscription_id: null,
}

/** Mensalista do Asaas: tem cobrança de verdade todo mês. */
const MENSALISTA = {
  subscription_status: "active",
  plan_id: "pro",
  plan_cycle: "monthly",
  plan_renews_at: "2026-10-15T00:00:00.000Z",
  plan_prepaid_until: "2026-10-15T00:00:00.000Z",
  billing_subscription_id: "sub_asaas_123",
}

describe("conta pré-paga: a tela para de prometer cobrança", () => {
  it("é modo pré-pago, e não o de cobrança", () => {
    expect(plano(PRE_PAGA, AGORA).modo).toBe("prepago")
  })

  it("fala de RECARGA, diz até quando está pago, e não mostra preço", () => {
    const c = plano(PRE_PAGA, AGORA)
    if (c.modo !== "prepago") throw new Error("modo errado")
    expect(c.proximaRecarga).toBe("2026-10-09T12:00:00.000Z")
    expect(c.pagoAte).toBe("2027-07-09T12:00:00.000Z")
    expect(c.cicloLabel).toBe("Anual, pago adiantado")
    // Não existe campo de cobrança nem de preço neste modo: o cliente não
    // tem como ler uma cobrança que não vem, nem um valor que não pagou.
    expect("cobrancaEm" in c).toBe(false)
    expect("mostrarPreco" in c).toBe(false)
  })

  it("a regra é o ESTADO da conta, não o cliente: ganhar uma assinatura no provedor muda o modo", () => {
    const c = plano({ ...PRE_PAGA, billing_subscription_id: "sub_novo" }, AGORA)
    expect(c.modo).toBe("cobranca")
  })

  it("acabou o período pago, deixa de ser pré-paga", () => {
    const c = plano(PRE_PAGA, new Date("2027-07-10T06:00:00Z"))
    expect(c.modo).toBe("cobranca") // volta ao fluxo normal até o job encerrar
  })
})

describe("mensalista do provedor: nada mudou", () => {
  it("continua lendo COBRANÇA, com preço", () => {
    const c = plano(MENSALISTA, AGORA)
    if (c.modo !== "cobranca") throw new Error("modo errado")
    expect(c.mostrarPreco).toBe(true)
    expect(c.cobrancaEm).toBe("2026-10-15T00:00:00.000Z")
  })

  it("a data da cobrança é EXATAMENTE a que a tela já mostrava (plan_renews_at)", () => {
    const c = plano(MENSALISTA, AGORA)
    if (c.modo !== "cobranca") throw new Error("modo errado")
    expect(c.cobrancaEm).toBe(MENSALISTA.plan_renews_at)
  })

  it("não ganha linha de recarga separada: no mensal seria a mesma data duas vezes", () => {
    const c = plano(MENSALISTA, AGORA)
    if (c.modo !== "cobranca") throw new Error("modo errado")
    expect(c.proximaRecarga).toBe(null)
  })

  it("mensalista de antes da 0031 (sem período pago gravado) também não muda", () => {
    const c = plano({ ...MENSALISTA, plan_prepaid_until: null }, AGORA)
    if (c.modo !== "cobranca") throw new Error("modo errado")
    expect(c.cobrancaEm).toBe(MENSALISTA.plan_renews_at)
    expect(c.proximaRecarga).toBe(null)
  })
})

describe("anual no provedor: cobra uma vez por ano, recarrega todo mês", () => {
  it("a cobrança aponta pro fim do ano pago, e a recarga pro mês que vem", () => {
    const c = plano(
      {
        subscription_status: "active",
        plan_id: "pro",
        plan_cycle: "annual",
        plan_renews_at: "2026-10-19T12:00:00.000Z",
        plan_prepaid_until: "2027-09-19T00:00:00.000Z",
        billing_subscription_id: "sub_anual",
      },
      AGORA,
    )
    if (c.modo !== "cobranca") throw new Error("modo errado")
    expect(c.cobrancaEm).toBe("2027-09-19T00:00:00.000Z") // a cobrança de verdade
    expect(c.proximaRecarga).toBe("2026-10-19T12:00:00.000Z") // as fichas
  })
})

describe("os outros estados continuam onde estavam", () => {
  it("teste grátis é inativo", () => {
    expect(plano({ ...MENSALISTA, subscription_status: "trial" }, AGORA).modo).toBe("inativo")
  })
  it("em atraso é inativo", () => {
    expect(plano({ ...MENSALISTA, subscription_status: "past_due" }, AGORA).modo).toBe("inativo")
  })
  it("ativo marcado à mão, sem plano nem ciclo, não mostra cobrança", () => {
    const c = plano(
      {
        subscription_status: "active",
        plan_id: null,
        plan_cycle: null,
        plan_renews_at: null,
        plan_prepaid_until: null,
        billing_subscription_id: null,
      },
      AGORA,
    )
    expect(c.modo).toBe("ativo_sem_cobranca")
  })
})
