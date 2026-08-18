// =====================================================================
// lib/indicacao/queries.ts
// Acesso a dados do programa INDIQUE E GANHE.
//
// Segue o padrão de lib/data/queries.ts: `requireUser()` resolve a sessão
// (e o bypass de DEV_MODE), o client normal é usado sempre — quem filtra
// por dono é a RLS da 0014, não um `.eq("user_id", ...)` à mão.
// =====================================================================

import { cache } from "react"
import { requireUser } from "@/lib/data/queries"
import type { StatusIndicacao } from "./config"

export type IndicadoRow = {
  id: string
  /** E-mail já mascarado no banco — o indicador nunca vê o e-mail real. */
  emailMascarado: string | null
  status: StatusIndicacao
  tokensGanhos: number
  criadoEm: string
  convertidoEm: string | null
}

export type MeuVinculo = {
  status: StatusIndicacao
  tokensPrevistos: number
  criadoEm: string
}

export type PainelIndicacao = {
  codigo: string | null
  /** Saldo do balde permanente (`users.referral_credits`). */
  saldoIndicacao: number
  indicados: IndicadoRow[]
  totalConvertidos: number
  totalPendentes: number
  tokensGanhos: number
  /** Preenchido quando EU fui indicado por alguém. */
  meuVinculo: MeuVinculo | null
}

/**
 * Carrega tudo que a página /dashboard/indicacao precisa.
 *
 * O código é criado sob demanda (`get_or_create_referral_code`): usuário
 * antigo, criado antes desta feature, ganha o dele no primeiro acesso —
 * sem precisar de backfill ter rodado.
 */
export const getPainelIndicacao = cache(async (): Promise<PainelIndicacao> => {
  const { supabase, user } = await requireUser()

  const [codigoRes, perfilRes, indicadosRes, vinculoRes] = await Promise.all([
    supabase.rpc("get_or_create_referral_code", { p_user_id: user.id }),
    supabase
      .from("users")
      .select("referral_credits")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("referrals")
      .select(
        "id, referred_email_masked, status, tokens_referrer, created_at, qualified_at",
      )
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("status, tokens_referred, created_at")
      .eq("referred_id", user.id)
      .maybeSingle(),
  ])

  const codigo =
    typeof codigoRes.data === "string" && codigoRes.data.length > 0
      ? codigoRes.data
      : null

  const saldoIndicacao =
    (perfilRes.data as { referral_credits?: number } | null)
      ?.referral_credits ?? 0

  const indicados: IndicadoRow[] = (indicadosRes.data ?? []).map((r: any) => ({
    id: r.id,
    emailMascarado: r.referred_email_masked ?? null,
    status: (r.status ?? "pending") as StatusIndicacao,
    tokensGanhos: r.tokens_referrer ?? 0,
    criadoEm: r.created_at,
    convertidoEm: r.qualified_at ?? null,
  }))

  const totalConvertidos = indicados.filter((i) => i.status === "qualified").length
  const totalPendentes = indicados.filter((i) => i.status === "pending").length
  const tokensGanhos = indicados.reduce((acc, i) => acc + i.tokensGanhos, 0)

  const vinculoRaw = vinculoRes.data as
    | { status: string; tokens_referred: number; created_at: string }
    | null

  return {
    codigo,
    saldoIndicacao,
    indicados,
    totalConvertidos,
    totalPendentes,
    tokensGanhos,
    meuVinculo: vinculoRaw
      ? {
          status: (vinculoRaw.status ?? "pending") as StatusIndicacao,
          tokensPrevistos: vinculoRaw.tokens_referred ?? 0,
          criadoEm: vinculoRaw.created_at,
        }
      : null,
  }
})
