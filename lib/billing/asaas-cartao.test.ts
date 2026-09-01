import { describe, expect, it } from "vitest"
import {
  buildAsaasClienteBody,
  buildAssinaturaCartaoBody,
  resumoSeguroDeErros,
  traduzirErroAsaas,
} from "./asaas-cartao"
import type { DadosCartaoNormalizados } from "@/lib/cartao"

const dados: DadosCartaoNormalizados = {
  numero: "4111111111111111",
  nome: "Marcos Paulo",
  expiryMonth: "12",
  expiryYear: "2029",
  ccv: "123",
  cpfCnpj: "11144477735",
  cep: "22041080",
  enderecoNumero: "100",
  celular: "21994959476",
}

describe("buildAsaasClienteBody", () => {
  it("usa o userId como externalReference e nunca inclui número/CVV", () => {
    const body = buildAsaasClienteBody({
      userId: "user-1",
      nome: "Marcos Paulo",
      cpfCnpj: "111.444.777-35",
      email: "marcos@exemplo.com",
      celular: "(21) 99495-9476",
    })
    expect(body.externalReference).toBe("user-1")
    expect(body.cpfCnpj).toBe("11144477735")
    expect(body.mobilePhone).toBe("21994959476")
    expect(body.notificationDisabled).toBe(true)
    expect(JSON.stringify(body)).not.toMatch(/4111|123/)
  })

  it("omite email/celular quando não vierem", () => {
    const body = buildAsaasClienteBody({ userId: "user-2", nome: "Fulano", cpfCnpj: "11144477735" })
    expect(body.email).toBeUndefined()
    expect(body.mobilePhone).toBeUndefined()
  })
})

describe("buildAssinaturaCartaoBody", () => {
  it("cobra HOJE (sem trial) e usa o preço de lib/billing/plans.ts", () => {
    const body = buildAssinaturaCartaoBody({
      plan: "pro",
      cycle: "monthly",
      externalReference: "u:user-1|p:pro|c:monthly",
      customerId: "cus_123",
      today: "2026-09-01",
      dados,
      emailTitular: "marcos@exemplo.com",
      remoteIp: "203.0.113.9",
    })
    expect(body.nextDueDate).toBe("2026-09-01")
    expect(body.value).toBe(97)
    expect(body.cycle).toBe("MONTHLY")
    expect(body.billingType).toBe("CREDIT_CARD")
    expect(body.customer).toBe("cus_123")
    expect(body.remoteIp).toBe("203.0.113.9")
    expect(body.description).toMatch(/1\.000 tokens\/mês/)
    expect(body.creditCard.number).toBe("4111111111111111")
    expect(body.creditCardHolderInfo.cpfCnpj).toBe("11144477735")
    expect(body.creditCardHolderInfo.postalCode).toBe("22041080")
  })

  it("anual usa o preço com desconto e o ciclo YEARLY", () => {
    const body = buildAssinaturaCartaoBody({
      plan: "studio",
      cycle: "annual",
      externalReference: "u:user-1|p:studio|c:annual",
      customerId: "cus_123",
      today: "2026-09-01",
      dados,
      emailTitular: "marcos@exemplo.com",
      remoteIp: "203.0.113.9",
    })
    expect(body.cycle).toBe("YEARLY")
    expect(body.value).toBe(Math.round(247 * 0.7) * 12)
  })

  it("nunca loga/expõe CVV no corpo além do necessário pra Asaas", () => {
    const body = buildAssinaturaCartaoBody({
      plan: "starter",
      cycle: "monthly",
      externalReference: "u:user-1|p:starter|c:monthly",
      customerId: "cus_1",
      today: "2026-09-01",
      dados,
      emailTitular: "a@b.com",
      remoteIp: "203.0.113.9",
    })
    // O CVV existe só dentro de creditCard — não é duplicado em holderInfo.
    expect(body.creditCard.ccv).toBe("123")
    expect(JSON.stringify(body.creditCardHolderInfo)).not.toContain("123")
  })
})

describe("traduzirErroAsaas", () => {
  it("5xx e falha de rede (status 0) viram indisponível/503", () => {
    expect(traduzirErroAsaas(500, null).tipo).toBe("indisponivel")
    expect(traduzirErroAsaas(0, null).tipo).toBe("indisponivel")
  })

  it("recusa da operadora vira cartao_recusado/402", () => {
    const json = { errors: [{ code: "invalid_creditCard", description: "Transação não autorizada" }] }
    const erro = traduzirErroAsaas(400, json)
    expect(erro.tipo).toBe("cartao_recusado")
    expect(erro.httpStatus).toBe(402)
  })

  it("erro de validação vira dados_invalidos/400 com a description da Asaas", () => {
    const json = { errors: [{ code: "invalid_postalCode", description: "CEP inválido" }] }
    const erro = traduzirErroAsaas(400, json)
    expect(erro.tipo).toBe("dados_invalidos")
    expect(erro.message).toBe("CEP inválido")
  })
})

describe("resumoSeguroDeErros", () => {
  it("mascara sequências longas de dígitos (nunca o cartão no log)", () => {
    const json = { errors: [{ code: "x", description: "Cartão 4111111111111111 recusado" }] }
    const resumo = resumoSeguroDeErros(400, json)
    expect(resumo).not.toContain("4111111111111111")
    expect(resumo).toContain("•••")
  })
})
