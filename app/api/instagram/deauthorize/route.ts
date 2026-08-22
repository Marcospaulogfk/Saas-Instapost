import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseSignedRequest } from "@/lib/instagram/signed-request"

export const runtime = "nodejs"

/**
 * Callback de DESAUTORIZAÇÃO da Meta: o usuário removeu o SyncPost em
 * "Apps e sites" do Instagram. Apagamos a conexão (token incluso) na hora.
 *
 * Rota pública (sem sessão): quem chama é a Meta, e a autenticidade vem do
 * HMAC do signed_request com o App Secret. Registrada no painel em
 * Configurações do login da empresa → URL de retorno de desautorização.
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
  return NextResponse.json({ ok: true })
}
