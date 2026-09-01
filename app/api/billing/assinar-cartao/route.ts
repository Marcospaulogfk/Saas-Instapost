// =====================================================================
// app/api/billing/assinar-cartao/route.ts
// CHECKOUT TRANSPARENTE — o cartão é digitado no NOSSO app e a assinatura
// nasce direto na API da Asaas, sem página hospedada no meio.
//
// Por que existe (CEO, 01/09/2026): teste grátis estilo Canva (sem cartão no
// cadastro — o trial de 45 tokens já nasce pelo trigger do banco) e, quando o
// usuário decide assinar de verdade, checkout transparente em vez de
// redirect. O hospedado (`/api/billing/checkout`, `iniciarCheckout`) continua
// vivo como FALLBACK, oferecido pela UI se esta rota responder 503.
//
// Fluxo:
//   1. Sessão obrigatória + rate limit (em memória — ver lib/billing/memory-
//      rate-limit.ts) + validação do corpo.
//   2. Valida os dados do cartão (Luhn/CPF/validade) SEM gastar chamada.
//   3. Garante o cliente Asaas do usuário (externalReference = userId, reusa
//      entre assinaturas/upgrades).
//   4. POST /v3/subscriptions com `creditCard` + `creditCardHolderInfo` +
//      `remoteIp`. `nextDueDate` = HOJE — cobrança imediata (o trial já foi
//      dado no cadastro, esta rota é o caminho de quem está PAGANDO).
//   5. Ativação otimista: busca o pagamento que a Asaas processou de forma
//      síncrona (`GET /payments?subscription=`) e, se já veio CONFIRMED/
//      RECEIVED, aplica um evento `payment_confirmed` sintético pelo MESMO
//      código do webhook (`lib/billing/apply.ts`) — com o paymentId REAL, o
//      que faz o webhook de verdade (que chega depois) cair no `already` do
//      extrato e não creditar em dobro. Se a Asaas ainda não confirmou (ou a
//      busca falha), a rota NÃO credita — o webhook real ou o cron diário
//      (`app/api/cron/renovacao`) fecham a conta. Trocar de plano já cancela
//      a assinatura anterior sozinho: é o `switchedSubscription` que já
//      existe dentro de `onPaymentConfirmed`, nenhum código novo aqui.
//
// SEGURANÇA — NÃO NEGOCIÁVEL: número e CVV passam por aqui em memória e só.
// Nunca em log (nem de erro), nunca no banco, nunca na resposta.
// =====================================================================

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isBillingCycle, isPaidPlan, priceFor, type BillingCycle, type PaidPlan } from "@/lib/billing/plans"
import { encodeReference, type BillingEvent } from "@/lib/billing/types"
import { billingConfigured } from "@/lib/billing"
import { applyBillingEvent } from "@/lib/billing/apply"
import {
  buildAsaasClienteBody,
  buildAssinaturaCartaoBody,
  traduzirErroAsaas,
  validarDadosCartao,
  hojeSaoPaulo,
} from "@/lib/billing/asaas-cartao"
import {
  garantirClienteAsaas,
  criarAssinaturaCartaoAsaas,
  buscarPagamentoDaAssinatura,
} from "@/lib/billing/asaas-cartao-api"
import { checkMemoryRateLimit } from "@/lib/billing/memory-rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** 5 tentativas a cada 10min por usuário: um dono real erra dígito 2–3
 *  vezes; quem precisa de mais está testando cartão roubado na nossa conta. */
const CARTAO_LIMIT = { limit: 5, windowSeconds: 600 }

const bodySchema = z.object({
  plan: z.string(),
  cycle: z.string(),
  cartao: z.object({
    numero: z.string().min(12).max(30),
    nome: z.string().min(1).max(100),
    validadeMes: z.string().min(1).max(2),
    validadeAno: z.string().min(2).max(4),
    cvv: z.string().min(3).max(4),
    cpfCnpj: z.string().min(11).max(20),
    cep: z.string().min(8).max(10),
    enderecoNumero: z.string().min(1).max(10),
    celular: z.string().min(10).max(16),
  }),
})

/** IP do COMPRADOR (exigência antifraude da Asaas). `x-real-ip` é o mais
 *  confiável quando o proxy o seta; senão o primeiro IP de `x-forwarded-for`
 *  (o mais próximo do cliente na cadeia). */
function remoteIpFrom(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim()
  if (real) return real
  const xff = headers.get("x-forwarded-for")
  const first = xff?.split(",")[0]?.trim()
  return first || "0.0.0.0"
}

function formatPriceBr(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "dados_invalidos", message: "Confira os campos do cartão — algum deles veio incompleto." },
      { status: 400 },
    )
  }
  const { plan: planoBruto, cycle: cicloBruto, cartao } = parsed.data
  if (!isPaidPlan(planoBruto) || !isBillingCycle(cicloBruto)) {
    return NextResponse.json({ error: "plano_invalido" }, { status: 400 })
  }
  const plan: PaidPlan = planoBruto
  const cycle: BillingCycle = cicloBruto

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: "nao_autenticado", message: "Entre na sua conta para assinar." },
      { status: 401 },
    )
  }

  const rl = checkMemoryRateLimit(`cartao:${user.id}`, CARTAO_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "muitas_tentativas",
        message: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo — nada foi cobrado.",
      },
      { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } },
    )
  }

  if (!billingConfigured()) {
    return NextResponse.json(
      {
        error: "checkout_unavailable",
        message: "Assinatura por cartão temporariamente indisponível. Tente novamente em instantes.",
      },
      { status: 503 },
    )
  }

  const hoje = hojeSaoPaulo()
  const validacao = validarDadosCartao(cartao, hoje)
  if (!validacao.ok) {
    return NextResponse.json(
      { error: "dados_invalidos", message: "Alguns campos precisam de atenção.", campos: validacao.erros },
      { status: 400 },
    )
  }

  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "checkout_unavailable",
        message: "Assinatura por cartão temporariamente indisponível. Tente novamente em instantes.",
      },
      { status: 503 },
    )
  }
  const conexao = { apiKey, asaasEnv: process.env.ASAAS_ENV }

  const emailTitular = user.email?.trim()
  if (!emailTitular) {
    return NextResponse.json(
      { error: "nao_autenticado", message: "Entre na sua conta para assinar." },
      { status: 401 },
    )
  }
  const nomeConta =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    validacao.dados.nome

  // Afiliado (cookie) — módulo atrás de flag; nunca derruba o checkout. Sem
  // split de wallet aqui (fica só no checkout hospedado): a comissão em
  // tokens/atribuição sai igual, via externalReference.
  let affiliateCode: string | null = null
  try {
    const { AFILIADOS_HABILITADO } = await import("@/lib/features")
    if (AFILIADOS_HABILITADO) {
      const { lerCodigoAfiliadoDoCookie } = await import("@/app/actions/afiliados")
      affiliateCode = (await lerCodigoAfiliadoDoCookie()) ?? null
    }
  } catch {
    affiliateCode = null
  }

  try {
    const cliente = await garantirClienteAsaas(
      conexao,
      buildAsaasClienteBody({
        userId: user.id,
        nome: nomeConta,
        cpfCnpj: validacao.dados.cpfCnpj,
        email: emailTitular,
        celular: validacao.dados.celular,
      }),
    )
    if (!cliente.ok) {
      return NextResponse.json(
        {
          error: "checkout_unavailable",
          message: "Não conseguimos falar com o processador de pagamento agora. Tente de novo em instantes — nada foi cobrado.",
        },
        { status: 503 },
      )
    }

    const externalReference = encodeReference({ userId: user.id, plan, cycle, affiliateCode })
    const criada = await criarAssinaturaCartaoAsaas(
      conexao,
      buildAssinaturaCartaoBody({
        plan,
        cycle,
        externalReference,
        customerId: cliente.customerId,
        today: hoje,
        dados: validacao.dados,
        emailTitular,
        remoteIp: remoteIpFrom(req.headers),
      }),
    )
    if (!criada.ok) {
      const erro = traduzirErroAsaas(criada.httpStatus, criada.json)
      return NextResponse.json({ error: erro.tipo, message: erro.message }, { status: erro.httpStatus })
    }

    // Ativação otimista: só se a Asaas já confirmou o pagamento síncrono.
    // Falhar aqui NUNCA derruba a resposta — a assinatura já existe na
    // Asaas; o webhook real ou o cron de renovação fecham a conta.
    try {
      const pagamento = await buscarPagamentoDaAssinatura(conexao, criada.assinatura.id)
      if (pagamento && (pagamento.status === "CONFIRMED" || pagamento.status === "RECEIVED")) {
        const evento: Extract<BillingEvent, { type: "payment_confirmed" }> = {
          type: "payment_confirmed",
          eventId: `optimistic:${pagamento.id}`,
          paymentId: pagamento.id,
          subscriptionId: criada.assinatura.id,
          customerId: cliente.customerId,
          checkoutId: null,
          externalReference,
          value: pagamento.value ?? priceFor(plan, cycle).total,
          netValue: pagamento.netValue,
          billingType: pagamento.billingType ?? "CREDIT_CARD",
          paidAt: pagamento.confirmedDate ?? pagamento.clientPaymentDate ?? new Date().toISOString(),
        }
        await applyBillingEvent(evento, { synthetic: true, source: "assinar-cartao", subscriptionId: criada.assinatura.id })
      }
    } catch (err) {
      console.error(
        `[billing/assinar-cartao] ativação otimista falhou — o webhook real ou o cron devem fechar a assinatura ${criada.assinatura.id}`,
        err,
      )
    }

    return NextResponse.json({
      ok: true,
      plan,
      cycle,
      priceBr: formatPriceBr(priceFor(plan, cycle).total),
      cartao: {
        bandeira: criada.assinatura.creditCard?.creditCardBrand ?? null,
        final: criada.assinatura.creditCard?.creditCardNumber ?? null,
      },
    })
  } catch (err) {
    console.error("[billing/assinar-cartao] falha inesperada", err)
    return NextResponse.json(
      { error: "billing_indisponivel", message: "Não foi possível concluir agora — nada foi cobrado. Tente de novo em instantes." },
      { status: 503 },
    )
  }
}
