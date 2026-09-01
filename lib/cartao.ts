// =====================================================================
// lib/cartao.ts
// Validação e máscaras de CARTÃO do checkout transparente — módulo
// deliberadamente sem import de lib/billing/*: roda no CLIENTE (o
// formulário valida enquanto a pessoa digita) e lib/billing/asaas.ts puxa
// node:fs, que não existe no bundle do browser.
//
// Nada aqui toca rede, banco ou log. Número e CVV só existem em memória —
// nem passam perto de localStorage/sessionStorage.
// =====================================================================

export function apenasDigitos(s: string): string {
  return s.replace(/\D+/g, "")
}

/** Luhn — pega dígito trocado/faltando ANTES de gastar uma chamada na Asaas. */
export function luhnValido(numero: string): boolean {
  const d = apenasDigitos(numero)
  if (d.length < 13 || d.length > 19) return false
  let soma = 0
  let dobra = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48
    if (dobra) {
      n *= 2
      if (n > 9) n -= 9
    }
    soma += n
    dobra = !dobra
  }
  return soma % 10 === 0
}

export type BandeiraCartao = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "diners" | null

/**
 * Detecção de bandeira SÓ PRA UI (badge ao lado do número). Quem decide a
 * bandeira de verdade é a Asaas — errar aqui não recusa transação nenhuma.
 * Elo e Hipercard vêm ANTES de Visa/Mastercard porque os BINs deles vivem
 * dentro das faixas 4xxx/5xxx/6xxx.
 */
export function bandeiraDoCartao(numero: string): BandeiraCartao {
  const d = apenasDigitos(numero)
  if (!d) return null
  if (/^(606282|3841)/.test(d)) return "hipercard"
  if (/^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) {
    return "elo"
  }
  if (/^3[47]/.test(d)) return "amex"
  if (/^3(0[0-5]|6|8)/.test(d)) return "diners"
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard"
  if (/^4/.test(d)) return "visa"
  return null
}

export const NOME_DA_BANDEIRA: Record<Exclude<BandeiraCartao, null>, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  hipercard: "Hipercard",
  diners: "Diners",
}

/** CPF com dígitos verificadores de verdade — não só "tem 11 dígitos". */
export function cpfValido(cpf: string): boolean {
  const d = apenasDigitos(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  for (const pos of [9, 10]) {
    let soma = 0
    for (let i = 0; i < pos; i++) soma += (d.charCodeAt(i) - 48) * (pos + 1 - i)
    const dv = ((soma * 10) % 11) % 10
    if (dv !== d.charCodeAt(pos) - 48) return false
  }
  return true
}

export function cnpjValido(cnpj: string): boolean {
  const d = apenasDigitos(cnpj)
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (len: number): number => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < len; i++) soma += (d.charCodeAt(i) - 48) * pesos[i]!
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return calc(12) === d.charCodeAt(12) - 48 && calc(13) === d.charCodeAt(13) - 48
}

export function cpfCnpjValido(doc: string): boolean {
  const d = apenasDigitos(doc)
  if (d.length === 11) return cpfValido(d)
  if (d.length === 14) return cnpjValido(d)
  return false
}

/* -------------------------------------------------------------------------- */
/*                                  Máscaras                                  */
/* -------------------------------------------------------------------------- */

/** '5162306219378829' → '5162 3062 1937 8829' (Amex: 4-6-5). */
export function mascaraNumeroCartao(v: string): string {
  const d = apenasDigitos(v).slice(0, 19)
  if (/^3[47]/.test(d)) {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ")
  }
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

/** '1229' → '12/29'. */
export function mascaraValidade(v: string): string {
  const d = apenasDigitos(v).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function mascaraCpfCnpj(v: string): string {
  const d = apenasDigitos(v).slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2")
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

/** '22041080' → '22041-080'. */
export function mascaraCep(v: string): string {
  const d = apenasDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/** '21994959476' → '(21) 99495-9476'. */
export function mascaraCelular(v: string): string {
  const d = apenasDigitos(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/* -------------------------------------------------------------------------- */
/*                                 Validação                                  */
/* -------------------------------------------------------------------------- */

/** O que o formulário manda (tudo string; máscara entra e sai aqui). */
export interface DadosCartaoInput {
  numero: string
  nome: string
  /** 'MM' ou 'M'. */
  validadeMes: string
  /** 'AA' ou 'AAAA'. */
  validadeAno: string
  cvv: string
  cpfCnpj: string
  cep: string
  enderecoNumero: string
  celular: string
}

export interface DadosCartaoNormalizados {
  numero: string
  nome: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  cpfCnpj: string
  cep: string
  enderecoNumero: string
  celular: string
}

export type ValidacaoCartao =
  | { ok: true; dados: DadosCartaoNormalizados }
  | { ok: false; erros: Partial<Record<keyof DadosCartaoInput, string>> }

/**
 * Valida e normaliza os dados do formulário. `hoje` em 'YYYY-MM-DD' (São
 * Paulo) — a validade é comparada contra o MÊS corrente, porque cartão vence
 * no fim do mês impresso.
 *
 * As mensagens são as que o formulário exibe embaixo de cada campo, então são
 * escritas pro dono de negócio, não pro desenvolvedor.
 */
export function validarDadosCartao(input: DadosCartaoInput, hoje: string): ValidacaoCartao {
  const erros: Partial<Record<keyof DadosCartaoInput, string>> = {}

  const numero = apenasDigitos(input.numero)
  if (!luhnValido(numero)) {
    erros.numero = "Confira o número do cartão — parece ter um dígito errado."
  }

  const nome = input.nome.trim()
  if (nome.length < 2) erros.nome = "Digite o nome como está impresso no cartão."

  const mes = apenasDigitos(input.validadeMes)
  const anoRaw = apenasDigitos(input.validadeAno)
  const ano = anoRaw.length === 2 ? `20${anoRaw}` : anoRaw
  const mesN = Number(mes)
  if (!mes || mesN < 1 || mesN > 12 || ano.length !== 4) {
    erros.validadeMes = "Validade inválida — use o formato MM/AA."
  } else {
    const mesHoje = hoje.slice(0, 7) // 'YYYY-MM'
    const mesCartao = `${ano}-${String(mesN).padStart(2, "0")}`
    if (mesCartao < mesHoje) erros.validadeMes = "Este cartão está vencido."
  }

  const ccv = apenasDigitos(input.cvv)
  if (ccv.length < 3 || ccv.length > 4) erros.cvv = "O código de segurança tem 3 ou 4 dígitos."

  const doc = apenasDigitos(input.cpfCnpj)
  if (!cpfCnpjValido(doc)) erros.cpfCnpj = "CPF ou CNPJ inválido — confira os números."

  const cep = apenasDigitos(input.cep)
  if (cep.length !== 8) erros.cep = "CEP inválido — são 8 números."

  const enderecoNumero = input.enderecoNumero.trim()
  if (!enderecoNumero) erros.enderecoNumero = 'Número do endereço (pode ser "s/n").'

  const celular = apenasDigitos(input.celular)
  if (celular.length < 10 || celular.length > 11) {
    erros.celular = "Celular com DDD — 10 ou 11 números."
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros }
  return {
    ok: true,
    dados: {
      numero,
      nome,
      expiryMonth: String(mesN).padStart(2, "0"),
      expiryYear: ano,
      ccv,
      cpfCnpj: doc,
      cep,
      enderecoNumero,
      celular,
    },
  }
}

/** 'YYYY-MM-DD' de São Paulo — client-safe (Intl, sem node:crypto/node:fs). */
export function hojeSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}
