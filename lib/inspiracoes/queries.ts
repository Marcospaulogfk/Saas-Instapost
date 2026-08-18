// =====================================================================
// lib/inspiracoes/queries.ts
// Leitura das fontes próprias de inspiração. Server-only.
//
// Segue o padrão de lib/data/queries.ts: o client vem do Supabase server e a
// RLS (0016) é quem garante ownership — as queries filtram por marca só pra
// não trazer o que não interessa, nunca como controle de acesso.
// =====================================================================

import { requireUser, getProfile } from "@/lib/data/queries"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  custoDaRodada,
  gratisRestantes,
  type CotaInspiracao,
} from "./custo"
import type {
  FonteInspiracao,
  FontePayload,
  IdeiaInspiracao,
} from "./tipos"

const COLUNAS_FONTE =
  "id, brand_id, kind, value, label, payload, last_generated_at, created_at"

const COLUNAS_IDEIA =
  "id, source_id, brand_id, badge, title, angle, format, objective, execution_tip, briefing, source_ref, used_at, created_at"

/**
 * Início do dia corrente no fuso de São Paulo (UTC-3), em ISO.
 *
 * A cota é "por dia" na cabeça do usuário brasileiro, não "nas últimas 24h" —
 * e o servidor roda em UTC. Sem este ajuste, o limite viraria à meia-noite de
 * Londres, ou seja, às 21h aqui.
 */
export function inicioDoDiaBR(agora = new Date()): string {
  const OFFSET_MIN = -3 * 60
  const local = new Date(agora.getTime() + OFFSET_MIN * 60_000)
  local.setUTCHours(0, 0, 0, 0)
  return new Date(local.getTime() - OFFSET_MIN * 60_000).toISOString()
}

function normalizePayload(raw: unknown): FontePayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return raw as FontePayload
}

/** Fontes cadastradas numa marca, mais recentes primeiro. */
export async function listFontes(
  brandId: string,
): Promise<FonteInspiracao[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("inspiration_sources")
    .select(`${COLUNAS_FONTE}, inspiration_ideas(count)`)
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((f) => ({
    id: f.id,
    brand_id: f.brand_id,
    kind: f.kind,
    value: f.value,
    label: f.label ?? null,
    payload: normalizePayload(f.payload),
    last_generated_at: f.last_generated_at ?? null,
    created_at: f.created_at,
    ideias_count: f.inspiration_ideas?.[0]?.count ?? 0,
  }))
}

/** Ideias geradas pra marca (todas as fontes), mais recentes primeiro. */
export async function listIdeias(
  brandId: string,
  limit = 40,
): Promise<IdeiaInspiracao[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("inspiration_ideas")
    .select(COLUNAS_IDEIA)
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data as unknown as IdeiaInspiracao[]
}

/**
 * Quantas rodadas de geração o usuário já fez hoje.
 *
 * Conta em `inspiration_runs`, NÃO em `inspiration_ideas`: apagar as ideias
 * não pode devolver cota.
 */
export async function contarRodadasHoje(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("inspiration_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", inicioDoDiaBR())
  // Erro de leitura NÃO pode liberar geração infinita: assume cota cheia.
  if (error) return Number.MAX_SAFE_INTEGER
  return count ?? 0
}

/**
 * Cota + saldo pra UI mostrar o custo ANTES de gerar.
 * Nunca lança: sem sessão devolve o estado neutro (custo cheio, saldo null).
 */
export async function getCotaInspiracao(): Promise<CotaInspiracao> {
  try {
    const { supabase, user } = await requireUser()
    const rodadasHoje = await contarRodadasHoje(supabase, user.id)
    const { profile } = await getProfile()
    return {
      rodadasHoje,
      gratisRestantes: gratisRestantes(rodadasHoje),
      custoProxima: custoDaRodada(rodadasHoje),
      saldo: profile?.credits ?? null,
    }
  } catch {
    return {
      rodadasHoje: 0,
      gratisRestantes: 0,
      custoProxima: custoDaRodada(Number.MAX_SAFE_INTEGER),
      saldo: null,
    }
  }
}
