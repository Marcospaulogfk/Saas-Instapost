"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  PlanoIdeia,
  PostFormato,
  PostObjetivo,
  PostStatus,
  ScheduledPost,
} from "@/lib/planejar"

type Result<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/**
 * Persiste um plano editorial inteiro (lista de ideias) como scheduled_posts
 * vinculados a uma marca. A RLS garante ownership via brand.
 */
export async function saveEditorialPlan(
  brandId: string,
  ideias: PlanoIdeia[],
): Promise<Result<{ inserted: number }>> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }
  if (!ideias.length) return { ok: false, error: "Nenhuma ideia pra salvar." }

  // Confere que a marca é do usuário antes de inserir.
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!brand) return { ok: false, error: "Marca não encontrada." }

  const rows = ideias.map((i) => ({
    brand_id: brandId,
    title: i.titulo,
    description: i.descricao || null,
    format: i.formato,
    objective: i.objetivo,
    scheduled_date: i.data,
    status: "ideia" as PostStatus,
    source: "ia" as const,
  }))

  const { error, count } = await supabase
    .from("scheduled_posts")
    .insert(rows, { count: "exact" })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/calendario")
  revalidatePath("/dashboard/planejar")
  return { ok: true, data: { inserted: count ?? rows.length } }
}

/** Cria um item manual no calendário. */
export async function createScheduledPost(input: {
  brandId: string
  title: string
  scheduledDate: string
  format: PostFormato
  objective?: PostObjetivo
}): Promise<Result<{ id: string }>> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }
  if (!input.title.trim()) return { ok: false, error: "Título obrigatório." }

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", input.brandId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!brand) return { ok: false, error: "Marca não encontrada." }

  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert({
      brand_id: input.brandId,
      title: input.title.trim(),
      format: input.format,
      objective: input.objective ?? "engage",
      scheduled_date: input.scheduledDate,
      status: "ideia",
      source: "manual",
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/calendario")
  return { ok: true, data: { id: data.id } }
}

/** Lista os scheduled_posts da marca (ordenados por data). */
export async function listScheduledPosts(
  brandId: string,
): Promise<ScheduledPost[]> {
  const { supabase, user } = await getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("scheduled_posts")
    .select(
      "id, brand_id, title, description, format, objective, scheduled_date, status, source, project_id, created_at",
    )
    .eq("brand_id", brandId)
    .order("scheduled_date", { ascending: true })

  if (error || !data) return []
  return data as ScheduledPost[]
}

/**
 * Lista os scheduled_posts da marca ATIVA (resolve a marca via cookie).
 * Usado pelo calendário, que é client-side e não conhece o brandId.
 */
export async function listActiveScheduledPosts(): Promise<{
  brandId: string | null
  brandName: string | null
  posts: ScheduledPost[]
}> {
  const { getActiveBrand } = await import("@/lib/data/queries")
  const brand = await getActiveBrand()
  if (!brand) return { brandId: null, brandName: null, posts: [] }
  const posts = await listScheduledPosts(brand.id)
  return { brandId: brand.id, brandName: brand.name, posts }
}

export async function updateScheduledPostStatus(
  id: string,
  status: PostStatus,
): Promise<Result> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { error } = await supabase
    .from("scheduled_posts")
    .update({ status })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard/calendario")
  return { ok: true }
}

export async function deleteScheduledPost(id: string): Promise<Result> {
  const { supabase, user } = await getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { error } = await supabase.from("scheduled_posts").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard/calendario")
  return { ok: true }
}
