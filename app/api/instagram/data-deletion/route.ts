import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseSignedRequest } from "@/lib/instagram/signed-request"

export const runtime = "nodejs"

/**
 * Callback de EXCLUSÃO DE DADOS da Meta (exigido pro App Review). O usuário
 * pediu, pelo Instagram, que o app apague os dados dele. Apagamos a conexão
 * (token + ids) de forma síncrona e devolvemos, como a Meta exige, uma URL de
 * acompanhamento e um código de confirmação.
 *
 * Só os dados DO INSTAGRAM são apagados aqui: a conta SyncPost e o conteúdo
 * criado nela continuam (são do usuário, não da Meta). Apagar a conta inteira
 * é pelo app, em Configurações.
 */
export async function POST(req: Request) {
  const secret = process.env.INSTAGRAM_APP_SECRET
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 })

  const form = await req.formData().catch(() => null)
  const signed = form?.get("signed_request")
  const payload = typeof signed === "string" ? parseSignedRequest(signed, secret) : null
  if (!payload) return NextResponse.json({ error: "invalid signed_request" }, { status: 400 })

  const admin = createAdminClient()
  await admin.from("instagram_connections").delete().eq("ig_user_id", payload.user_id)

  // Código determinístico por usuário+instante: a exclusão é imediata, então a
  // página de status só precisa reconhecer o código, não consultar fila.
  const code = createHash("sha256")
    .update(`${payload.user_id}:${payload.issued_at}:${secret}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase()

  const origin = new URL(req.url).origin
  return NextResponse.json({
    url: `${origin}/instagram/exclusao-de-dados?codigo=${code}`,
    confirmation_code: code,
  })
}
