// =====================================================================
// app/api/cron/renovacao/route.ts
// Job diário: rede de segurança do webhook (lib/billing/apply.ts →
// runRenewalSweep). Credita quem pagou e a gente perdeu o evento; fecha
// assinatura cancelada; rebaixa atraso com mais de 5 dias.
//
// Segurança: header `authorization: Bearer ${CRON_SECRET}` (ou ?secret=).
// Agendar na Coolify (cron do container) ou em qualquer cron externo:
//   0 6 * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
//     https://app.nexuscontentai.com.br/api/cron/renovacao
// Rota pública no middleware (/api/cron) só com o segredo.
// =====================================================================

import { NextResponse } from "next/server"
import { runRenewalSweep } from "@/lib/billing/apply"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization") ?? ""
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(req.url)
  return url.searchParams.get("secret") === secret
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: "nao_autorizado" }, { status: 401 })
  }
  try {
    const out = await runRenewalSweep()
    return NextResponse.json({ ok: true, ...out })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[cron/renovacao]", msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export const POST = GET
