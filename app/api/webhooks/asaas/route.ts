// =====================================================================
// app/api/webhooks/asaas/route.ts
// Recebe os eventos do Asaas. Valida o token (header asaas-access-token vs
// ASAAS_WEBHOOK_TOKEN), traduz pra BillingEvent e aplica (lib/billing/apply).
//
// Sempre responde 200 pra evento processado/duplicado/ignorado: o Asaas
// reenvia em qualquer status != 2xx e PAUSA a fila em falhas repetidas.
// Erro de processamento devolve 500 de propósito, pra ele reenviar.
//
// Rota pública no middleware (/api/webhooks). Eventos a habilitar no painel:
// PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_REFUNDED,
// PAYMENT_CHARGEBACK_REQUESTED, PAYMENT_SPLIT_DONE, CHECKOUT_PAID,
// SUBSCRIPTION_DELETED, SUBSCRIPTION_INACTIVATED.
// =====================================================================

import { NextResponse } from "next/server"
import { getBilling } from "@/lib/billing"
import { applyBillingEvent } from "@/lib/billing/apply"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const raw = await req.text()
  const billing = getBilling()

  let event
  try {
    event = billing.parseWebhook(req.headers, raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const status = msg.includes("token") ? 401 : 400
    console.warn("[webhooks/asaas] rejeitado:", msg)
    return NextResponse.json({ ok: false, error: msg }, { status })
  }

  let rawJson: unknown = null
  try {
    rawJson = JSON.parse(raw)
  } catch {
    rawJson = { raw }
  }

  try {
    const result = await applyBillingEvent(event, rawJson)
    return NextResponse.json({ ok: true, result, type: event.type })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[webhooks/asaas] falha ao aplicar", event.type, msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
