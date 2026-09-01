import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// =====================================================================
// GET /api/webhooks/websync-os/leads?since=<ISO>&limit=<n>   (01/09/2026)
//
// O WebSync-OS (CRM) puxa quem se cadastrou no Nexus Content pra alimentar
// o funil do lado de lá: e-mail, status de assinatura, o que a pessoa
// respondeu no onboarding e de onde ela veio (first_touch, 0027). Sem
// filtro de dono: `public.users` é a base global de contas do produto, não
// uma tabela por cliente como `brands`.
//
// Mesma autenticação dos outros webhooks desta pasta: segredo próprio no
// header, sem sessão. `since` é opcional e serve pra sincronização
// incremental (o CRM manda o created_at do último lead que já puxou).
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const LIMIT_PADRAO = 50
const LIMIT_MAXIMO = 100

interface Lead {
  id: string
  email: string | null
  created_at: string
  subscription_status: string
  objetivo_uso: string | null
  first_touch: Record<string, string> | null
}

export async function GET(req: Request) {
  const expected = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!expected) {
    console.error("[websync-os/leads] WEBSYNC_WEBHOOK_SECRET ausente no ambiente")
    return NextResponse.json({ error: "webhook não configurado" }, { status: 503 })
  }
  const provided = req.headers.get(SECRET_HEADER)
  if (!provided || provided !== expected) {
    console.warn("[websync-os/leads] secret inválido")
    return NextResponse.json({ error: "não autorizado" }, { status: 401 })
  }

  const url = new URL(req.url)

  // Limit fora do formato ou fora da faixa cai no padrão, não vira erro:
  // o consumidor é um job de sincronização, não um usuário digitando.
  const limitBruto = Number(url.searchParams.get("limit"))
  const limit =
    Number.isFinite(limitBruto) && limitBruto > 0
      ? Math.min(Math.trunc(limitBruto), LIMIT_MAXIMO)
      : LIMIT_PADRAO

  // `since` inválido é ignorado (busca sem filtro de data), não é erro 400:
  // o CRM manda o valor que guardou da última sincronização, e um valor
  // ruim aqui não pode travar a rota pro dia inteiro.
  const sinceBruto = url.searchParams.get("since")
  const since =
    sinceBruto && !Number.isNaN(Date.parse(sinceBruto)) ? sinceBruto : null

  const admin = createAdminClient()
  let query = admin
    .from("users")
    .select("id, email, created_at, subscription_status, objetivo_uso, first_touch")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (since) {
    query = query.gte("created_at", since)
  }

  const { data, error } = await query
  if (error) {
    console.error("[websync-os/leads] falha ao ler leads:", error.message)
    return NextResponse.json({ error: "falha ao ler leads" }, { status: 500 })
  }

  const leads: Lead[] = (data ?? []) as Lead[]
  console.log(`[websync-os/leads] ${leads.length} lead(s) devolvido(s)`)
  return NextResponse.json({ leads })
}
