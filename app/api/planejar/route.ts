import { NextResponse } from "next/server"
import { requireUser, getBrandById } from "@/lib/data/queries"
import { generateEditorialPlan } from "@/lib/generation/claude"
import { getProximasDatas, type DataComemorativa } from "@/lib/datas-comemorativas"
import { toISODate } from "@/lib/planejar"

export const runtime = "nodejs"
export const maxDuration = 60

interface RequestBody {
  brandId: string
  /** Resumo da conversa do chat (perguntas + respostas concatenadas). */
  conversationBrief: string
  /** Quantos dias planejar a partir de hoje (7 = semana, 30 = mês). */
  horizonDays?: number
  /** Quantas ideias gerar. */
  count?: number
}

export async function POST(req: Request) {
  // Garante usuário logado (e respeita DEV_MODE).
  await requireUser()

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "JSON inválido no body" }, { status: 400 })
  }

  if (!body.brandId) {
    return NextResponse.json(
      { error: "brandId é obrigatório" },
      { status: 400 },
    )
  }

  // getBrandById já filtra por user_id — protege contra acesso cruzado.
  const brand = await getBrandById(body.brandId)
  if (!brand) {
    return NextResponse.json(
      { error: "Marca não encontrada ou sem acesso." },
      { status: 404 },
    )
  }

  const horizonDays = clamp(body.horizonDays ?? 7, 3, 60)
  const count = clamp(body.count ?? 5, 1, 20)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + horizonDays - 1)

  // Datas comemorativas dentro da janela (pra IA aproveitar ganchos sazonais).
  const relevantDates = getProximasDatas(today, 60)
    .filter((d) => d.date <= end)
    .map((d: DataComemorativa & { date: Date }) => ({
      nome: d.nome,
      data: toISODate(d.date),
    }))

  try {
    const { data, metrics } = await generateEditorialPlan({
      brandName: brand.name,
      description: brand.description ?? "",
      targetAudience: brand.target_audience ?? "",
      toneOfVoice: brand.tone_of_voice ?? "",
      visualStyle: brand.visual_style ?? "",
      mainObjective: brand.main_objective ?? "engage",
      conversationBrief: body.conversationBrief ?? "",
      startDate: toISODate(today),
      endDate: toISODate(end),
      count,
      relevantDates,
    })

    // Defesa: garante que datas fiquem dentro da janela (clamp).
    const startISO = toISODate(today)
    const endISO = toISODate(end)
    const ideias = data.ideias.map((i) => ({
      ...i,
      data: clampDate(i.data, startISO, endISO),
    }))

    return NextResponse.json({ resumo: data.resumo, ideias, metrics })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Falha ao gerar plano: ${message}` },
      { status: 502 },
    )
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function clampDate(value: string, min: string, max: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}
