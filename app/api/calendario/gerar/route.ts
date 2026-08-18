import { NextResponse } from "next/server"
import { requireUser, getActiveBrand, getBrandById } from "@/lib/data/queries"
import { getProximasDatas } from "@/lib/datas-comemorativas"
import { toISODate } from "@/lib/planejar"
import { getInspiracoesParaMarca } from "@/lib/inspiracoes"
import { listScheduledPosts } from "@/app/actions/scheduled-posts"
import { distribuirDatas, totalDeSlots } from "@/lib/pautas/agenda"
import { gerarPautas, type SlotPauta } from "@/lib/pautas/gerar"
import {
  type CalendarioConfig,
  type GerarCalendarioResponse,
  type PautaPeriodo,
  type PautaRede,
} from "@/lib/pautas/types"

export const runtime = "nodejs"
export const maxDuration = 60

// =====================================================================
// POST /api/calendario/gerar — Calendario Inteligente.
//
// GRATUITO POR DESIGN: esta rota NAO debita token nenhum. Nao ha chamada a
// debitTokens() aqui, e nao deve haver. A pauta e a isca do funil — o
// usuario enche o calendario de graca e paga so quando aperta "Gerar post"
// numa pauta (29 tokens, cobrados no wizard de criacao).
//
// Se um dia isso precisar de teto, o limite certo e de VOLUME (quantas
// geracoes por dia), nao de token — cobrar aqui mata o gancho.
// =====================================================================

interface RequestBody extends Partial<CalendarioConfig> {
  /** Opcional: sem ele, usa a marca ativa do cookie. */
  brandId?: string
}

const REDES: PautaRede[] = ["instagram", "facebook", "linkedin"]

export async function POST(req: Request) {
  await requireUser()

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "JSON inválido no body" }, { status: 400 })
  }

  // getBrandById filtra por user_id; getActiveBrand resolve pelo cookie.
  const brand = body.brandId
    ? await getBrandById(body.brandId)
    : await getActiveBrand()
  if (!brand) {
    return NextResponse.json(
      { error: "Nenhuma marca encontrada. Crie uma marca antes de planejar." },
      { status: 404 },
    )
  }

  const periodo: PautaPeriodo = body.periodo === "mes" ? "mes" : "semana"
  const rede: PautaRede = REDES.includes(body.rede as PautaRede)
    ? (body.rede as PautaRede)
    : "instagram"
  const diasSemana = Array.isArray(body.diasSemana) ? body.diasSemana : []
  const postsPorSemana = Number(body.postsPorSemana ?? 3)

  // A grade sai do codigo, nao da IA (ver lib/pautas/agenda.ts).
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const datas = distribuirDatas(hoje, periodo, postsPorSemana, diasSemana)
  if (datas.length === 0) {
    return NextResponse.json(
      { error: "Escolha pelo menos um dia da semana." },
      { status: 400 },
    )
  }

  // Efemerides que caem exatamente nos dias da grade — viram gancho pra IA.
  const horizonte = totalDeSlots(periodo, postsPorSemana)
  const efemerides = new Map<string, string>()
  for (const d of getProximasDatas(hoje, Math.max(20, horizonte * 2))) {
    const iso = toISODate(d.date)
    if (!efemerides.has(iso)) efemerides.set(iso, d.nome)
  }

  const slots: SlotPauta[] = datas.map((data) => ({
    data,
    efemeride: efemerides.get(data),
  }))

  // "Baseado nas suas inspiracoes": o catalogo ja curado pro nicho/objetivo
  // da marca (lib/inspiracoes.ts) entra como direcao editorial. So titulo e
  // descricao — o briefing longo de cada inspiracao estouraria o prompt sem
  // acrescentar direcao.
  const inspiracoes = getInspiracoesParaMarca(
    {
      name: brand.name,
      description: brand.description,
      target_audience: brand.target_audience,
      tone_of_voice: brand.tone_of_voice,
      main_objective: brand.main_objective,
    },
    8,
  ).map((i) => ({ titulo: i.titulo, descricao: i.descricao }))

  // Evita sugerir de novo o que ja esta no calendario (ideias antigas viram
  // repeticao obvia e queimam a confianca na feature).
  const existentes = await listScheduledPosts(brand.id)
  const evitarTitulos = existentes.slice(-40).map((p) => p.title)

  try {
    const { pautas } = await gerarPautas({
      brandName: brand.name,
      description: brand.description ?? "",
      targetAudience: brand.target_audience ?? "",
      toneOfVoice: brand.tone_of_voice ?? "",
      mainObjective: brand.main_objective ?? "engage",
      rede,
      slots,
      inspiracoes,
      evitarTitulos,
    })

    const payload: GerarCalendarioResponse = { pautas, tokensCobrados: 0 }
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Falha ao gerar o calendário: ${message}` },
      { status: 502 },
    )
  }
}
