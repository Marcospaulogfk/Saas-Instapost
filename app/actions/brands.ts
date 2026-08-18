"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiveBrand } from "@/lib/data/queries"
import {
  clearActiveBrandCookie,
  getActiveBrandIdFromCookie,
  writeActiveBrandCookie,
} from "@/lib/active-brand"
import { brandLimitMessage, checkBrandLimit } from "@/lib/brands/limits"
import { buildCopyName } from "@/lib/brands/copy-name"

export interface BrandInput {
  name: string
  description: string
  website_url?: string | null
  instagram_handle?: string | null
  target_audience: string
  tone_of_voice: string
  visual_style: string
  /**
   * Objetivo(s) da marca. Multi-select do onboarding chega como valores
   * separados por vírgula (ex: "sell,engage") — o primeiro é o principal.
   * A coluna no banco é text.
   */
  main_objective: string
  brand_colors: string[]
  logo_url?: string | null
}

export type CreateBrandResult =
  | { ok: true; brandId: string }
  /**
   * `limitReached` deixa a UI diferenciar "estourou o plano" (mostra upgrade)
   * de erro real. Quem só lê `error` continua funcionando: a mensagem do
   * limite já é auto-explicativa.
   */
  | { ok: false; error: string; limitReached?: boolean }

export async function createBrand(
  input: BrandInput,
): Promise<CreateBrandResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        ok: false,
        error: "Voce precisa estar logado pra cadastrar uma marca.",
      }
    }

    // Guard idempotente: cliques repetidos no "Finalizar" não devem duplicar
    // a marca. Se já existe uma com o mesmo nome pro mesmo usuário criada nos
    // últimos 2 minutos, reaproveita em vez de inserir de novo.
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: recent } = await supabase
      .from("brands")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", input.name)
      .gte("created_at", twoMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recent) {
      await writeActiveBrandCookie(recent.id)
      revalidatePath("/dashboard")
      return { ok: true, brandId: recent.id }
    }

    // GATE DE PLANO (server-side): a UI já esconde o botão quando estourou,
    // mas o servidor é a regra — o onboarding é uma rota pública logada e a
    // action pode ser chamada direto. Fica DEPOIS do guard idempotente porque
    // reaproveitar uma marca recém-criada não cria marca nova.
    const limit = await checkBrandLimit(supabase, user.id)
    if (!limit.canCreate) {
      return { ok: false, error: brandLimitMessage(limit), limitReached: true }
    }

    const { data, error } = await supabase
      .from("brands")
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description || null,
        website_url: input.website_url || null,
        instagram_handle: input.instagram_handle || null,
        target_audience: input.target_audience || null,
        tone_of_voice: input.tone_of_voice || null,
        visual_style: input.visual_style || null,
        main_objective: input.main_objective,
        brand_colors: input.brand_colors,
        logo_url: input.logo_url || null,
        default_font: "inter",
        default_template: "cinematic",
      })
      .select("id")
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    // A marca recém-criada vira a marca ativa (senão o dashboard podia cair
    // no fallback de outra marca da lista).
    await writeActiveBrandCookie(data.id)
    revalidatePath("/dashboard")

    return { ok: true, brandId: data.id }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.message
          ? err.message
          : "Erro inesperado ao salvar a marca. Tente novamente.",
    }
  }
}

export interface BrandUpdate {
  name?: string
  description?: string | null
  website_url?: string | null
  instagram_handle?: string | null
  target_audience?: string | null
  tone_of_voice?: string | null
  visual_style?: string | null
  main_objective?: "sell" | "inform" | "engage" | "community"
  brand_colors?: string[]
  logo_url?: string | null
  default_template?: string | null
  default_font?: string | null
}

export type UpdateBrandResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateBrand(
  brandId: string,
  input: BrandUpdate,
): Promise<UpdateBrandResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Voce precisa estar logado." }
  }

  // Sanitiza: strings vazias viram null pra campos opcionais
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) {
    const trimmed = input.name.trim()
    if (!trimmed) return { ok: false, error: "Nome da marca não pode ficar vazio." }
    patch.name = trimmed
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null
  if (input.website_url !== undefined) patch.website_url = input.website_url?.trim() || null
  if (input.instagram_handle !== undefined) {
    patch.instagram_handle = input.instagram_handle?.trim().replace(/^@/, "") || null
  }
  if (input.target_audience !== undefined) patch.target_audience = input.target_audience?.trim() || null
  if (input.tone_of_voice !== undefined) patch.tone_of_voice = input.tone_of_voice?.trim() || null
  if (input.visual_style !== undefined) patch.visual_style = input.visual_style?.trim() || null
  if (input.main_objective !== undefined) patch.main_objective = input.main_objective
  if (input.brand_colors !== undefined) patch.brand_colors = input.brand_colors
  if (input.logo_url !== undefined) patch.logo_url = input.logo_url?.trim() || null
  if (input.default_template !== undefined) patch.default_template = input.default_template
  if (input.default_font !== undefined) patch.default_font = input.default_font

  if (Object.keys(patch).length === 0) {
    return { ok: true }
  }

  const { error } = await supabase
    .from("brands")
    .update(patch)
    .eq("id", brandId)
    .eq("user_id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/dashboard/marcas/${brandId}`)
  revalidatePath("/dashboard/marcas")
  revalidatePath("/dashboard")
  return { ok: true }
}

export type DuplicateBrandResult =
  | { ok: true; brandId: string; name: string }
  | { ok: false; error: string; limitReached?: boolean }

/**
 * Duplica uma marca existente ("Cópia de X").
 *
 * Caso de uso do ICP: a agência atende clientes parecidos (mesmo nicho, mesmo
 * tom) e não quer refazer o onboarding inteiro pra cada um — duplica, troca o
 * nome e as cores, e segue.
 *
 * Copia identidade CRIATIVA (descrição, público, tom, estilo, objetivo, cores,
 * logo, template e fonte padrão) e NÃO copia identidade de CONTA
 * (instagram_handle e website_url ficam vazios de propósito): herdar o @ do
 * cliente antigo é o caminho mais curto pra publicar no perfil errado.
 *
 * Respeita o mesmo teto de plano da criação — duplicar é criar.
 */
export async function duplicateBrand(
  brandId: string,
): Promise<DuplicateBrandResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Voce precisa estar logado." }

    const limit = await checkBrandLimit(supabase, user.id)
    if (!limit.canCreate) {
      return { ok: false, error: brandLimitMessage(limit), limitReached: true }
    }

    const { data: source, error: sourceError } = await supabase
      .from("brands")
      .select(
        "name, description, target_audience, tone_of_voice, visual_style, main_objective, brand_colors, logo_url, default_template, default_font",
      )
      .eq("id", brandId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (sourceError || !source) {
      return { ok: false, error: "Marca nao encontrada." }
    }

    // Nomes já usados na conta, pra não gerar duas "Cópia de X" iguais.
    const { data: siblings } = await supabase
      .from("brands")
      .select("name")
      .eq("user_id", user.id)

    const name = buildCopyName(
      source.name ?? "",
      (siblings ?? []).map((b: { name: string | null }) => b.name ?? ""),
    )

    const { data, error } = await supabase
      .from("brands")
      .insert({
        user_id: user.id,
        name,
        description: source.description ?? null,
        website_url: null,
        instagram_handle: null,
        target_audience: source.target_audience ?? null,
        tone_of_voice: source.tone_of_voice ?? null,
        visual_style: source.visual_style ?? null,
        main_objective: source.main_objective ?? null,
        brand_colors: source.brand_colors ?? [],
        logo_url: source.logo_url ?? null,
        default_template: source.default_template ?? "cinematic",
        default_font: source.default_font ?? "inter",
      })
      .select("id, name")
      .single()

    if (error) return { ok: false, error: error.message }

    // NÃO troca a marca ativa: quem duplica está organizando a conta, não
    // começando a criar conteúdo — trocar o contexto do dashboard por baixo
    // seria surpresa. A cópia abre pelo card da lista.
    revalidatePath("/dashboard/marcas")
    revalidatePath("/dashboard")

    return { ok: true, brandId: data.id, name: data.name }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.message
          ? err.message
          : "Erro inesperado ao duplicar a marca. Tente novamente.",
    }
  }
}

export type DeleteBrandResult =
  | { ok: true; deletedProjects: number }
  | { ok: false; error: string }

export async function deleteBrand(brandId: string): Promise<DeleteBrandResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Voce precisa estar logado." }

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brandId)

  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", brandId)
    .eq("user_id", user.id)

  if (error) return { ok: false, error: error.message }

  const activeId = await getActiveBrandIdFromCookie()
  if (activeId === brandId) {
    await clearActiveBrandCookie()
  }

  revalidatePath("/dashboard/marcas")
  revalidatePath("/dashboard/projetos")
  revalidatePath("/dashboard")
  return { ok: true, deletedProjects: projectCount ?? 0 }
}

export type SetActiveBrandResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Versão "lite" da marca ativa pra usar em client components (wizard).
 * Devolve só os campos que a geração precisa, ou null se não houver marca.
 */
export interface ActiveBrandLite {
  id: string
  name: string
  brand_colors: string[]
  instagram_handle: string | null
  // Campos usados pelo wizard pra recomendação/personalização (podem vir null).
  main_objective: string | null
  tone_of_voice: string | null
  target_audience: string | null
  description: string | null
}

export async function getActiveBrandLite(): Promise<ActiveBrandLite | null> {
  const brand = await getActiveBrand()
  if (!brand) return null
  return {
    id: brand.id,
    name: brand.name,
    brand_colors: brand.brand_colors ?? [],
    instagram_handle: brand.instagram_handle ?? null,
    main_objective: brand.main_objective ?? null,
    tone_of_voice: brand.tone_of_voice ?? null,
    target_audience: brand.target_audience ?? null,
    description: brand.description ?? null,
  }
}

export async function setActiveBrand(
  brandId: string,
): Promise<SetActiveBrandResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Voce precisa estar logado." }

  const { data, error } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: "Marca nao encontrada." }
  }

  await writeActiveBrandCookie(brandId)
  revalidatePath("/dashboard")
  return { ok: true }
}
