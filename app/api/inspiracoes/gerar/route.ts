import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { debitTokens } from "@/lib/tokens"
import { contarRodadasHoje } from "@/lib/inspiracoes/queries"
import { custoDaRodada, gratisRestantes } from "@/lib/inspiracoes/custo"
import { gerarIdeiasDaFonte } from "@/lib/inspiracoes/gerar-ideias"
import type { ContextoMarca } from "@/lib/inspiracoes/gerar-ideias"
import type { FonteKind, FontePayload } from "@/lib/inspiracoes/tipos"

export const runtime = "nodejs"
// Fonte de palavra-chave faz busca web antes de responder — o teto de 45s do
// /api/extract-content não dá conta.
export const maxDuration = 90

/**
 * Gera pautas a partir de uma fonte cadastrada pelo usuário.
 *
 * Ordem deliberada: a COTA é conferida antes de qualquer chamada paga, e o
 * débito de token acontece DEPOIS de a geração dar certo — o usuário nunca
 * paga por uma rodada que falhou.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  let body: { sourceId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  const sourceId = body.sourceId?.trim()
  if (!sourceId) {
    return NextResponse.json({ error: "sourceId ausente" }, { status: 400 })
  }

  // --- fonte (RLS já limita ao dono) ---
  const { data: fonte } = await supabase
    .from("inspiration_sources")
    .select("id, brand_id, kind, value, payload")
    .eq("id", sourceId)
    .maybeSingle()
  if (!fonte) {
    return NextResponse.json({ error: "Fonte não encontrada" }, { status: 404 })
  }

  // --- marca (contexto que faz a pauta ser "dessa marca") ---
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, description, target_audience, tone_of_voice, main_objective")
    .eq("id", fonte.brand_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!brand) {
    return NextResponse.json({ error: "Marca não encontrada" }, { status: 404 })
  }

  // --- cota + preço (antes de gastar qualquer centavo) ---
  const rodadasHoje = await contarRodadasHoje(supabase, user.id)
  const custo = custoDaRodada(rodadasHoje)

  if (custo > 0) {
    const { data: profile } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .maybeSingle()
    const saldo = profile?.credits ?? 0
    if (saldo < custo) {
      return NextResponse.json(
        {
          error: `Suas gerações grátis de hoje acabaram. Cada rodada extra custa ${custo} tokens e você tem ${saldo}.`,
          code: "sem_saldo",
        },
        { status: 402 },
      )
    }
  }

  // --- geração ---
  const contexto: ContextoMarca = {
    name: brand.name as string,
    description: (brand.description as string | null) ?? null,
    target_audience: (brand.target_audience as string | null) ?? null,
    tone_of_voice: (brand.tone_of_voice as string | null) ?? null,
    main_objective: (brand.main_objective as string | null) ?? null,
  }

  let resultado
  try {
    resultado = await gerarIdeiasDaFonte(
      {
        kind: fonte.kind as FonteKind,
        value: fonte.value as string,
        payload: (fonte.payload ?? {}) as FontePayload,
      },
      contexto,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[inspiracoes/gerar]", msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // --- persistência ---
  const linhas = resultado.ideias.map((i) => ({
    source_id: fonte.id,
    brand_id: fonte.brand_id,
    badge: i.badge,
    title: i.title,
    angle: i.angle || null,
    format: i.format,
    objective: i.objective,
    execution_tip: i.execution_tip || null,
    briefing: i.briefing,
    source_ref: i.source_ref ?? null,
  }))

  const { data: inseridas, error: erroInsert } = await supabase
    .from("inspiration_ideas")
    .insert(linhas)
    .select(
      "id, source_id, brand_id, badge, title, angle, format, objective, execution_tip, briefing, source_ref, used_at, created_at",
    )
  if (erroInsert) {
    return NextResponse.json({ error: erroInsert.message }, { status: 500 })
  }

  await supabase
    .from("inspiration_sources")
    .update({
      payload: resultado.payload,
      last_generated_at: new Date().toISOString(),
    })
    .eq("id", fonte.id)

  // O run é o que sustenta a cota — gravado mesmo quando a rodada foi grátis.
  await supabase.from("inspiration_runs").insert({
    user_id: user.id,
    brand_id: fonte.brand_id,
    source_id: fonte.id,
    ideas_count: linhas.length,
    tokens_charged: custo,
  })

  // Débito best-effort (mesma semântica dos outros endpoints: não desfaz a
  // entrega se falhar).
  if (custo > 0) {
    try {
      await debitTokens(supabase, user.id, custo)
    } catch {
      // silencioso de propósito — ver lib/tokens.ts
    }
  }

  const rodadasDepois = rodadasHoje + 1
  return NextResponse.json({
    ideias: inseridas ?? [],
    grounded: resultado.grounded,
    cota: {
      rodadasHoje: rodadasDepois,
      gratisRestantes: gratisRestantes(rodadasDepois),
      custoProxima: custoDaRodada(rodadasDepois),
    },
    tokensCobrados: custo,
  })
}
