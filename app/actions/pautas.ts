"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { PautaGerada, PautaRede } from "@/lib/pautas/types"

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

/**
 * Persiste as pautas do Calendario Inteligente como scheduled_posts.
 *
 * Elas entram como status 'ideia' e source 'ia': e a primeira coluna do
 * pipeline (ideias da IA -> em criacao -> prontos -> agendados). Nenhum token
 * e debitado aqui — salvar pauta e de graca, igual gerar.
 */
export async function salvarPautas(
  brandId: string,
  pautas: PautaGerada[],
  rede: PautaRede,
): Promise<Result<{ inserted: number }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }
  if (!pautas.length) return { ok: false, error: "Nenhuma pauta pra salvar." }

  // Confere ownership antes de inserir (a RLS ja barra, mas o erro fica
  // legivel em vez de "new row violates row-level security policy").
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!brand) return { ok: false, error: "Marca não encontrada." }

  const base = pautas.map((p) => ({
    brand_id: brandId,
    title: p.titulo,
    description: p.descricao || null,
    format: p.formato,
    objective: p.objetivo,
    scheduled_date: p.data,
    status: "ideia" as const,
    source: "ia" as const,
  }))

  const comColunasNovas = base.map((row, i) => ({
    ...row,
    network: rede,
    rationale: pautas[i]?.motivo || null,
  }))

  let { error, count } = await supabase
    .from("scheduled_posts")
    .insert(comColunasNovas, { count: "exact" })

  // A migration 0013 (network/rationale) pode nao ter sido aplicada ainda no
  // banco em que este build roda. Em vez de derrubar a feature inteira por
  // duas colunas opcionais, degrada: salva a pauta sem elas. A UI ja trata
  // network/rationale como opcionais.
  if (error && colunaInexistente(error.message)) {
    const retry = await supabase
      .from("scheduled_posts")
      .insert(base, { count: "exact" })
    error = retry.error
    count = retry.count
  }

  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/calendario")
  return { ok: true, data: { inserted: count ?? base.length } }
}

/** PGRST204 = coluna ausente no schema cache do PostgREST. */
function colunaInexistente(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes("network") ||
    m.includes("rationale") ||
    m.includes("column") ||
    m.includes("schema cache")
  )
}
