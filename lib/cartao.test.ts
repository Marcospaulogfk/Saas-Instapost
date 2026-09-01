import { describe, expect, it } from "vitest"
import {
  apenasDigitos,
  bandeiraDoCartao,
  cnpjValido,
  cpfValido,
  luhnValido,
  mascaraCelular,
  mascaraCep,
  mascaraCpfCnpj,
  mascaraNumeroCartao,
  mascaraValidade,
  validarDadosCartao,
} from "./cartao"

// CPF de teste com dígitos verificadores VÁLIDOS de verdade (11144477735) —
// o mesmo número usado nos tutoriais BR, não um "123.456.789-00" qualquer.
const CPF_VALIDO = "111.444.777-35"
const CNPJ_VALIDO = "11.222.333/0001-81"

describe("validação de cartão/CPF (checkout transparente)", () => {
  it("Luhn aceita número válido e recusa dígito trocado", () => {
    expect(luhnValido("4111 1111 1111 1111")).toBe(true)
    expect(luhnValido("4111 1111 1111 1112")).toBe(false)
    expect(luhnValido("123")).toBe(false)
  })

  it("bandeira reconhece Visa, Mastercard e Amex pelo BIN", () => {
    expect(bandeiraDoCartao("4111111111111111")).toBe("visa")
    expect(bandeiraDoCartao("5555555555554444")).toBe("mastercard")
    expect(bandeiraDoCartao("378282246310005")).toBe("amex")
    expect(bandeiraDoCartao("")).toBe(null)
  })

  it("CPF com dígito verificador correto passa, sequência repetida não", () => {
    expect(cpfValido(CPF_VALIDO)).toBe(true)
    expect(cpfValido("111.111.111-11")).toBe(false)
    expect(cpfValido("111.444.777-36")).toBe(false) // dígito trocado
  })

  it("CNPJ com dígito verificador correto passa", () => {
    expect(cnpjValido(CNPJ_VALIDO)).toBe(true)
    expect(cnpjValido("11.222.333/0001-82")).toBe(false)
  })

  it("máscaras não vazam mais dígitos do que o formato permite", () => {
    expect(mascaraNumeroCartao("4111111111111111")).toBe("4111 1111 1111 1111")
    expect(mascaraValidade("1229")).toBe("12/29")
    expect(mascaraCpfCnpj("11144477735")).toBe(CPF_VALIDO)
    expect(mascaraCep("22041080")).toBe("22041-080")
    expect(mascaraCelular("21994959476")).toBe("(21) 99495-9476")
  })

  it("apenasDigitos remove tudo que não é número", () => {
    expect(apenasDigitos("(21) 99495-9476")).toBe("21994959476")
  })
})

describe("validarDadosCartao", () => {
  const dadosOk = {
    numero: "4111 1111 1111 1111",
    nome: "Marcos Paulo",
    validadeMes: "12",
    validadeAno: "29",
    cvv: "123",
    cpfCnpj: CPF_VALIDO,
    cep: "22041-080",
    enderecoNumero: "100",
    celular: "(21) 99495-9476",
  }
  const hoje = "2026-09-01"

  it("aceita e normaliza um cartão válido", () => {
    const r = validarDadosCartao(dadosOk, hoje)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.dados.numero).toBe("4111111111111111")
      expect(r.dados.expiryMonth).toBe("12")
      expect(r.dados.expiryYear).toBe("2029")
      expect(r.dados.cpfCnpj).toBe("11144477735")
      expect(r.dados.cep).toBe("22041080")
      expect(r.dados.celular).toBe("21994959476")
    }
  })

  it("recusa cartão vencido (mês/ano antes de hoje)", () => {
    const r = validarDadosCartao({ ...dadosOk, validadeMes: "01", validadeAno: "20" }, hoje)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erros.validadeMes).toMatch(/vencido/i)
  })

  it("recusa CPF inválido sem derrubar os outros campos", () => {
    const r = validarDadosCartao({ ...dadosOk, cpfCnpj: "000.000.000-00" }, hoje)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.erros.cpfCnpj).toBeDefined()
      expect(r.erros.numero).toBeUndefined()
    }
  })

  it("recusa CEP e celular fora do tamanho esperado", () => {
    const r = validarDadosCartao({ ...dadosOk, cep: "123", celular: "999" }, hoje)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.erros.cep).toBeDefined()
      expect(r.erros.celular).toBeDefined()
    }
  })
})
