import { NextResponse } from "next/server"
import { requireUser } from "@/lib/data/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import { agendarGeracao } from "@/lib/websync/gerar-arte"

export const runtime = "nodejs"
export const maxDuration = 300

// =====================================================================
// POST /api/calendario/pauta-pronta  { id }
//
// O botão "Gerar post" do Pipeline, para a pauta que JÁ CHEGOU COM A COPY
// PRONTA do CRM (Slide N: + Legenda:). Essa copy é do dono: o que ele
// escreveu não passa por IA de texto, só é diagramado. Mandar a pauta pelo
// wizard faria o modelo reescrever slide e legenda a partir de um briefing,
// e o post sairia diferente do que o dono aprovou no CRM.
//
// É o mesmo motor da Ponte (agendarGeracao). A única IA que roda ali é a
// imagem da capa, quando o CRM não mandou foto. Sem débito de tokens de
// texto, porque não há texto gerado.
// =====================================================================

export async function POST(req: Request) {
  const { user } = await requireUser()

  let id = ""
  try {
    const corpo = (await req.json()) as { id?: unknown }
    id = typeof corpo.id === "string" ? corpo.id : ""
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  if (!id) return NextResponse.json({ error: "informe o id da pauta" }, { status: 400 })

  // O dono da brand é conferido dentro de agendarGeracao (brands.user_id).
  const arte = await agendarGeracao(createAdminClient(), user.id, id, {})
  return NextResponse.json({ ok: true, arte })
}
