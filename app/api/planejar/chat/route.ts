import { NextResponse } from "next/server"
import { requireUser, getBrandById } from "@/lib/data/queries"
import { planejarChatTurn } from "@/lib/generation/claude"

export const runtime = "nodejs"
export const maxDuration = 60

// =====================================================================
// POST /api/planejar/chat — turno do chat conversacional do Planejar.
//
// Antes o "bot" era um roteiro fixo de 4 perguntas (não reagia a nada).
// Agora cada turno passa pela IA: ela responde ao que o cliente disse,
// pergunta só o que falta e sinaliza quando o briefing está completo
// (action "generate" + brief pronto pro /api/planejar).
// =====================================================================

interface RequestBody {
  brandId: string
  messages: Array<{ role: "user" | "assistant"; text: string }>
}

export async function POST(req: Request) {
  await requireUser()

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "JSON inválido no body" }, { status: 400 })
  }

  if (!body.brandId) {
    return NextResponse.json({ error: "brandId é obrigatório" }, { status: 400 })
  }
  const brand = await getBrandById(body.brandId)
  if (!brand) {
    return NextResponse.json(
      { error: "Marca não encontrada ou sem acesso." },
      { status: 404 },
    )
  }

  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is { role: "user" | "assistant"; text: string } =>
            !!m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.text === "string" &&
            m.text.trim().length > 0,
        )
        .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }))
    : []

  try {
    const { data } = await planejarChatTurn({
      brandName: brand.name,
      description: brand.description ?? "",
      targetAudience: brand.target_audience ?? "",
      toneOfVoice: brand.tone_of_voice ?? "",
      mainObjective: brand.main_objective ?? "",
      messages,
    })
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Falha no chat: ${message}` },
      { status: 502 },
    )
  }
}
