import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { planTokensFor, type Plan } from "@/lib/tokens"

export const runtime = "nodejs"

// =====================================================================
// Webhook Cakto → SyncPost  (ESQUELETO — ver ESTRATEGIA-MONETIZACAO.md §8.6)
//
// Recebe eventos da Cakto (compra aprovada / assinatura renovada /
// cancelada / reembolso) e credita tokens / atualiza subscription_status.
//
// Estado atual: FUNCIONAL o suficiente pra receber, validar o secret e
// logar. A escrita real no banco está como TODO (marcada abaixo) pra não
// mexer em produção sem OK — mas o mapa plano→tokens já usa lib/tokens.ts.
//
// Segurança: valida o header do secret contra CAKTO_WEBHOOK_SECRET.
// =====================================================================

const SECRET_HEADER = "x-cakto-secret"

/** Eventos que a Cakto envia (nomes reais a confirmar no painel). */
type CaktoEvent =
  | "purchase.approved" // compra aprovada (1ª fatura ou top-up)
  | "subscription.renewed" // renovação recorrente
  | "subscription.canceled" // cancelamento
  | "refund.issued" // reembolso / chargeback

interface CaktoWebhookPayload {
  event: CaktoEvent | string
  // Campos abaixo são um chute do formato — ajustar quando o payload real
  // da Cakto estiver disponível.
  data?: {
    /** e-mail do comprador — usado pra achar o user no Supabase. */
    customer_email?: string
    /** slug/id da oferta comprada (starter | pro | studio | topup_*). */
    offer?: string
    /** plano normalizado, se a Cakto mandar. */
    plan?: string
    /** quantidade de tokens (usado em top-ups avulsos). */
    tokens?: number
    [key: string]: unknown
  }
}

/** Normaliza o slug de oferta da Cakto para um Plan conhecido. */
function planFromOffer(offer: string | undefined): Plan | null {
  if (!offer) return null
  const o = offer.toLowerCase()
  if (o.includes("studio")) return "studio"
  if (o.includes("pro")) return "pro"
  if (o.includes("starter")) return "starter"
  return null
}

export async function POST(req: Request) {
  // 1) Validação do secret ------------------------------------------------
  const expected = process.env.CAKTO_WEBHOOK_SECRET
  if (!expected) {
    console.error("[cakto] CAKTO_WEBHOOK_SECRET ausente no ambiente")
    return NextResponse.json(
      { error: "webhook não configurado" },
      { status: 503 },
    )
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[cakto] secret inválido no webhook")
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  // 2) Parse do payload ---------------------------------------------------
  let payload: CaktoWebhookPayload
  try {
    payload = (await req.json()) as CaktoWebhookPayload
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const event = payload.event
  const data = payload.data ?? {}
  const plan = (data.plan as Plan | undefined) ?? planFromOffer(data.offer)
  const planTokens = planTokensFor(plan)

  console.log(
    `[cakto] evento=${event} email=${data.customer_email ?? "?"} ` +
      `plano=${plan ?? "?"} tokens_plano=${planTokens} tokens_topup=${data.tokens ?? 0}`,
  )

  // 3) Switch nos eventos -------------------------------------------------
  // NOTA: a escrita real está como TODO. `admin` já está pronto pra usar.
  // Descomentar quando o CEO aprovar mexer no banco de produção.
  // const admin = createAdminClient()
  void createAdminClient // referência intencional (evita import "não usado" no lint)

  switch (event) {
    case "purchase.approved": {
      // TODO(cakto): compra aprovada (1ª fatura OU top-up avulso).
      //  - achar user por customer_email
      //  - se for plano (starter/pro/studio):
      //      subscription_status = 'active'
      //      plan_credits_monthly = planTokens
      //      plan_credits_used_this_month = 0
      //      credits = planTokens        (reseta saldo do ciclo)
      //  - se for top-up (data.tokens):
      //      credits = credits + data.tokens   (NÃO reseta o ciclo)
      break
    }
    case "subscription.renewed": {
      // TODO(cakto): renovação recorrente.
      //      subscription_status = 'active'
      //      plan_credits_monthly = planTokens
      //      plan_credits_used_this_month = 0
      //      credits = planTokens        (recarrega o saldo do mês)
      break
    }
    case "subscription.canceled": {
      // TODO(cakto): cancelamento.
      //      subscription_status = 'canceled'
      //      (manter saldo restante até o fim do ciclo, se aplicável)
      break
    }
    case "refund.issued": {
      // TODO(cakto): reembolso / chargeback.
      //      subscription_status = 'canceled'
      //      credits = 0  (ou estornar os tokens do pedido reembolsado)
      break
    }
    default: {
      console.warn(`[cakto] evento não tratado: ${event}`)
      // 200 mesmo assim: não queremos que a Cakto fique reenviando.
      return NextResponse.json({ ok: true, ignored: true })
    }
  }

  return NextResponse.json({ ok: true })
}
