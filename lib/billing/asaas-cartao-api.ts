// =====================================================================
// lib/billing/asaas-cartao-api.ts
// Chamadas de REDE do checkout transparente (fetch de verdade — por isso
// fora de lib/billing/asaas-cartao.ts, que é a parte pura/testável).
//
// REGRA DE SEGURANÇA, sem exceção: o corpo da criação de assinatura carrega
// NÚMERO e CVV de cartão. Ele nunca é logado, nunca é devolvido inteiro e
// nunca encosta no banco. Todo log de falha passa por `resumoSeguroDeErros`.
// =====================================================================

import { asaasBaseUrl } from "./asaas"
import { resumoSeguroDeErros, type AsaasAssinaturaCartaoBody, type AsaasClienteBody } from "./asaas-cartao"

/** Timeout das chamadas: além disso, melhor devolver "tente de novo" que
 *  deixar o dono olhando um spinner com o cartão na mão. */
const TIMEOUT_MS = 25_000

interface Conexao {
  apiKey: string
  asaasEnv: string | undefined | null
}

async function asaasFetch(
  conexao: Conexao,
  path: string,
  init: RequestInit,
): Promise<{ status: number; json: unknown } | { status: 0; json: null }> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${asaasBaseUrl(conexao.asaasEnv)}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        access_token: conexao.apiKey,
        ...(init.headers ?? {}),
      },
      signal: ctl.signal,
      cache: "no-store",
    })
    const json: unknown = await res.json().catch(() => null)
    return { status: res.status, json }
  } catch {
    // Timeout/DNS/reset. O motivo real não interessa pro fluxo — e logar o
    // erro cru arriscaria arrastar o body junto em alguma serialização.
    return { status: 0, json: null }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Acha (por `externalReference=userId`) ou cria o cliente Asaas do usuário.
 *
 * Reusar em vez de criar sempre importa por dois motivos: a Asaas guarda
 * tokens de cartão POR CLIENTE, e um cliente novo a cada tentativa de
 * formulário (ou a cada troca de plano) viraria uma fileira de duplicatas
 * no painel financeiro — que é COMPARTILHADO com o EverReply.
 */
export async function garantirClienteAsaas(
  conexao: Conexao,
  body: AsaasClienteBody,
): Promise<{ ok: true; customerId: string } | { ok: false }> {
  const busca = await asaasFetch(
    conexao,
    `/customers?externalReference=${encodeURIComponent(body.externalReference)}&limit=1`,
    { method: "GET" },
  )
  if (busca.status === 200 && busca.json && typeof busca.json === "object") {
    const data = (busca.json as { data?: { id?: string; deleted?: boolean }[] }).data
    const vivo = Array.isArray(data) ? data.find((c) => c?.id && c.deleted !== true) : undefined
    if (vivo?.id) return { ok: true, customerId: vivo.id }
  }

  const criado = await asaasFetch(conexao, "/customers", {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (criado.status === 200 && criado.json && typeof criado.json === "object") {
    const id = (criado.json as { id?: string }).id
    if (typeof id === "string" && id) return { ok: true, customerId: id }
  }
  console.error(`[asaas-cartao] POST /customers falhou: ${resumoSeguroDeErros(criado.status, criado.json)}`)
  return { ok: false }
}

export interface AssinaturaCartaoCriada {
  id: string
  status: string | null
  nextDueDate: string | null
  value: number | null
  /** Últimos 4 dígitos e bandeira, quando a Asaas devolve — é o ÚNICO pedaço
   *  do cartão que sobrevive à chamada. */
  creditCard: { creditCardNumber?: string | null; creditCardBrand?: string | null } | null
}

/** POST /v3/subscriptions com cartão. */
export async function criarAssinaturaCartaoAsaas(
  conexao: Conexao,
  body: AsaasAssinaturaCartaoBody,
): Promise<{ ok: true; assinatura: AssinaturaCartaoCriada } | { ok: false; httpStatus: number; json: unknown }> {
  const res = await asaasFetch(conexao, "/subscriptions", {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (res.status === 200 && res.json && typeof res.json === "object") {
    const o = res.json as Record<string, unknown>
    if (typeof o.id === "string" && o.id) {
      return {
        ok: true,
        assinatura: {
          id: o.id,
          status: typeof o.status === "string" ? o.status : null,
          nextDueDate: typeof o.nextDueDate === "string" ? o.nextDueDate : null,
          value: typeof o.value === "number" ? o.value : null,
          creditCard:
            o.creditCard && typeof o.creditCard === "object"
              ? (o.creditCard as AssinaturaCartaoCriada["creditCard"])
              : null,
        },
      }
    }
  }
  // Nada do request no log — só o resumo mascarado da RESPOSTA.
  console.error(`[asaas-cartao] POST /subscriptions recusado: ${resumoSeguroDeErros(res.status, res.json)}`)
  return { ok: false, httpStatus: res.status, json: res.json }
}

export interface PagamentoDaAssinatura {
  id: string
  status: string
  value: number | null
  netValue: number | null
  billingType: string | null
  /** Data em que a Asaas considera o pagamento pago — usada como `paidAt`. */
  confirmedDate: string | null
  clientPaymentDate: string | null
}

/**
 * Busca o pagamento que a Asaas já processou ao criar a assinatura (a
 * cobrança de cartão com `nextDueDate` = hoje é síncrona na maioria dos
 * casos). Usado SÓ pra ativação otimista: se a Asaas ainda não confirmou (ou
 * a chamada falha), a rota não credita nada — o webhook real ou o cron de
 * conciliação (`app/api/cron/renovacao`) fecham a conta depois.
 *
 * O `id` devolvido aqui é o MESMO paymentId que o webhook PAYMENT_CONFIRMED
 * vai carregar — é o que faz a dedupe de `lib/billing/apply.ts` (ref_id no
 * extrato) funcionar sem inventar um id sintético.
 */
export async function buscarPagamentoDaAssinatura(
  conexao: Conexao,
  subscriptionId: string,
): Promise<PagamentoDaAssinatura | null> {
  const res = await asaasFetch(
    conexao,
    `/payments?subscription=${encodeURIComponent(subscriptionId)}&limit=1`,
    { method: "GET" },
  )
  if (res.status !== 200 || !res.json || typeof res.json !== "object") return null
  const data = (res.json as { data?: Record<string, unknown>[] }).data
  const p = Array.isArray(data) ? data[0] : undefined
  if (!p || typeof p.id !== "string") return null
  return {
    id: p.id,
    status: typeof p.status === "string" ? p.status : "",
    value: typeof p.value === "number" ? p.value : null,
    netValue: typeof p.netValue === "number" ? p.netValue : null,
    billingType: typeof p.billingType === "string" ? p.billingType : null,
    confirmedDate: typeof p.confirmedDate === "string" ? p.confirmedDate : null,
    clientPaymentDate: typeof p.clientPaymentDate === "string" ? p.clientPaymentDate : null,
  }
}
