// =====================================================================
// lib/billing/asaas-cartao.ts
// Checkout TRANSPARENTE de cartão — corpos das chamadas Asaas e tradução
// de erros (SERVIDOR; a validação/máscara client-safe mora em lib/cartao.ts).
//
// POR QUE ISTO EXISTE (CEO, 01/09/2026): o checkout hospedado manda pra uma
// página fora do app pra "assinar" — no fluxo de teste grátis estilo Canva
// isso é fricção que sobra. A saída é o formulário de cartão morar no NOSSO
// app e a assinatura nascer direto pela API: `POST /v3/subscriptions` com
// `creditCard` + `creditCardHolderInfo` + `remoteIp`
// (docs.asaas.com/reference/criar-assinatura-com-cartao-de-credito).
//
// SEM TRIAL AQUI: o teste grátis do Nexus já foi concedido no cadastro (45
// tokens pelo trigger `handle_new_user`, migration 0010/0020) — quem chega
// nesta rota está contratando um PLANO, então `nextDueDate` é sempre HOJE
// (cobrança imediata). Isso é diferente do EverReply, cujo checkout
// transparente tem trial-com-cartão (nextDueDate no futuro) — não portar
// esse conceito pra cá.
//
// POR QUE NÃO `POST /creditCard/tokenizeCreditCard` PRIMEIRO: a tokenização
// avulsa exige habilitação prévia pelo gerente de contas da Asaas em
// produção — dependência externa que pode ser negada. Criar a assinatura com
// o objeto `creditCard` direto não tem esse pré-requisito e é UMA chamada em
// vez de duas. A Asaas tokeniza internamente pras renovações de qualquer jeito.
//
// REGRA DE OURO: número e CVV atravessam a memória do request e MORREM ali.
// Nada aqui loga, persiste ou devolve o número inteiro — `resumoSeguroDeErros`
// existe pra que nem o log de erro consiga vazar dígitos.
// =====================================================================

import { CYCLE_TO_ASAAS } from "./asaas"
import { PLAN_LABEL, priceFor, tokensFor, type BillingCycle, type PaidPlan } from "./plans"
import { apenasDigitos, type DadosCartaoNormalizados } from "@/lib/cartao"

export {
  validarDadosCartao,
  hojeSaoPaulo,
  apenasDigitos,
  bandeiraDoCartao,
  NOME_DA_BANDEIRA,
  mascaraNumeroCartao,
  mascaraValidade,
  mascaraCpfCnpj,
  mascaraCep,
  mascaraCelular,
} from "@/lib/cartao"
export type { DadosCartaoInput, DadosCartaoNormalizados, ValidacaoCartao } from "@/lib/cartao"

/* -------------------------------------------------------------------------- */
/*                          Corpos das chamadas Asaas                         */
/* -------------------------------------------------------------------------- */

export interface AsaasClienteBody {
  name: string
  cpfCnpj: string
  email?: string
  mobilePhone?: string
  /** Nosso userId — é como o cliente Asaas é reencontrado nas próximas vezes
   *  (upgrade/recompra reusam o MESMO cliente, sem duplicar no painel). */
  externalReference: string
  /** A comunicação de cobrança é NOSSA (painel /dashboard/tokens). E-mail da
   *  Asaas com "fatura" no meio confundiria quem já recebe do app. */
  notificationDisabled: boolean
}

export function buildAsaasClienteBody(input: {
  userId: string
  nome: string
  cpfCnpj: string
  email?: string | null
  celular?: string | null
}): AsaasClienteBody {
  return {
    name: input.nome.slice(0, 100),
    cpfCnpj: apenasDigitos(input.cpfCnpj),
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(input.celular ? { mobilePhone: apenasDigitos(input.celular) } : {}),
    externalReference: input.userId,
    notificationDisabled: true,
  }
}

export interface AsaasAssinaturaCartaoBody {
  customer: string
  billingType: "CREDIT_CARD"
  value: number
  nextDueDate: string
  cycle: "MONTHLY" | "YEARLY"
  description: string
  externalReference: string
  creditCard: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
  remoteIp: string
}

/**
 * Monta o corpo do POST /v3/subscriptions com cartão.
 *
 * O PREÇO VEM DE `lib/billing/plans.ts`, NUNCA DO CLIENTE — mesma regra do
 * checkout hospedado. `nextDueDate` = hoje: sem trial nesta rota (ver
 * cabeçalho do arquivo). `externalReference` carrega plano/ciclo/afiliado
 * codificados (`encodeReference`, lib/billing/types.ts) — é dali que
 * `lib/billing/apply.ts` resolve o usuário quando o webhook real chegar.
 *
 * `remoteIp` é o IP do COMPRADOR (exigência antifraude da Asaas — "o IP do
 * seu servidor não deve ser informado"), por isso atravessa a rota via
 * header em vez de ser resolvido aqui.
 */
export function buildAssinaturaCartaoBody(input: {
  plan: PaidPlan
  cycle: BillingCycle
  externalReference: string
  customerId: string
  today: string
  dados: DadosCartaoNormalizados
  emailTitular: string
  remoteIp: string
}): AsaasAssinaturaCartaoBody {
  const preco = priceFor(input.plan, input.cycle)
  const tokens = tokensFor(input.plan)
  return {
    customer: input.customerId,
    billingType: "CREDIT_CARD",
    value: preco.total,
    nextDueDate: input.today,
    cycle: CYCLE_TO_ASAAS[input.cycle],
    description: `Nexus ${PLAN_LABEL[input.plan]} · ${tokens.toLocaleString("pt-BR")} tokens/mês · cobrado ${
      input.cycle === "annual" ? "anualmente" : "mensalmente"
    }`.slice(0, 150),
    externalReference: input.externalReference,
    creditCard: {
      holderName: input.dados.nome,
      number: input.dados.numero,
      expiryMonth: input.dados.expiryMonth,
      expiryYear: input.dados.expiryYear,
      ccv: input.dados.ccv,
    },
    creditCardHolderInfo: {
      name: input.dados.nome,
      email: input.emailTitular,
      cpfCnpj: input.dados.cpfCnpj,
      postalCode: input.dados.cep,
      addressNumber: input.dados.enderecoNumero,
      phone: input.dados.celular,
    },
    remoteIp: input.remoteIp,
  }
}

/* -------------------------------------------------------------------------- */
/*                        Tradução dos erros da Asaas                         */
/* -------------------------------------------------------------------------- */

/** Formato de erro da Asaas: `{ errors: [{ code, description }] }`. */
interface AsaasErroItem {
  code?: string
  description?: string
}

function errosDoJson(json: unknown): AsaasErroItem[] {
  if (!json || typeof json !== "object") return []
  const arr = (json as { errors?: unknown }).errors
  if (!Array.isArray(arr)) return []
  return arr.filter((e): e is AsaasErroItem => Boolean(e) && typeof e === "object")
}

export type ErroAssinaturaCartao =
  /** A operadora disse não: cartão sem limite, bloqueado, dados não conferem. */
  | { tipo: "cartao_recusado"; message: string; httpStatus: 402 }
  /** Algum campo não passou na validação da Asaas (CEP inexistente etc.). */
  | { tipo: "dados_invalidos"; message: string; httpStatus: 400 }
  /** Asaas fora do ar / 5xx / resposta ilegível — tentar de novo depois. */
  | { tipo: "indisponivel"; message: string; httpStatus: 503 }

const MSG_RECUSADO =
  "O cartão não foi aceito pela operadora. Confira os dados ou tente outro cartão — nada foi cobrado."
const MSG_DADOS = "Alguns dados não foram aceitos. Confira o CPF/CNPJ, o CEP e a validade do cartão."
const MSG_INDISPONIVEL =
  "Não conseguimos falar com o processador de pagamento agora. Seus dados não foram salvos — tente de novo em instantes."

/**
 * Traduz a resposta de erro da Asaas numa mensagem PT-BR que dá pra mostrar
 * pro dono de negócio sem assustar. Recusa de cartão NÃO é falha nossa nem
 * dele — o texto mantém a pessoa no formulário ("tente outro cartão") em vez
 * de encerrar o fluxo.
 */
export function traduzirErroAsaas(httpStatus: number, json: unknown): ErroAssinaturaCartao {
  if (httpStatus >= 500 || httpStatus === 0) {
    return { tipo: "indisponivel", message: MSG_INDISPONIVEL, httpStatus: 503 }
  }

  const erros = errosDoJson(json)
  const texto = erros
    .map((e) => `${e.code ?? ""} ${e.description ?? ""}`)
    .join(" | ")
    .toLowerCase()

  // Recusa da OPERADORA — os textos reais da Asaas falam em "não autorizada",
  // "recusada", "saldo/limite". `invalid_creditCard` é o code que acompanha.
  if (/n[aã]o autorizad|recusad|saldo insuficiente|limite|invalid_creditcard|cart[aã]o inv/.test(texto)) {
    return { tipo: "cartao_recusado", message: MSG_RECUSADO, httpStatus: 402 }
  }
  if (httpStatus === 400 || erros.length > 0) {
    // A description da Asaas já vem em PT-BR e aponta o campo; quando ela é
    // curta e legível, mostrar ajuda mais que o texto genérico. Mesma
    // máscara do log (`resumoSeguroDeErros`): a description volta pro
    // BROWSER do cliente — se a Asaas algum dia ecoar um número longo, não sai.
    const desc = (erros[0]?.description ?? "").replace(/\d{7,}/g, "•••").trim()
    const legivel = desc.length > 0 && desc.length <= 160 ? desc : MSG_DADOS
    return { tipo: "dados_invalidos", message: legivel, httpStatus: 400 }
  }
  return { tipo: "indisponivel", message: MSG_INDISPONIVEL, httpStatus: 503 }
}

/**
 * O que PODE ir pro log quando a Asaas recusa: só codes e descriptions, com
 * qualquer sequência longa de dígitos mascarada. Nunca o corpo do request —
 * ele carrega número e CVV.
 */
export function resumoSeguroDeErros(httpStatus: number, json: unknown): string {
  const erros = errosDoJson(json)
    .map((e) => `${e.code ?? "?"}: ${(e.description ?? "").replace(/\d{7,}/g, "•••")}`)
    .join(" | ")
  return `HTTP ${httpStatus}${erros ? ` — ${erros}` : ""}`
}
