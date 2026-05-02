"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface BrandInput {
  name: string
  description: string
  website_url?: string | null
  instagram_handle?: string | null
  target_audience: string
  tone_of_voice: string
  visual_style: string
  main_objective: "sell" | "inform" | "engage" | "community"
  brand_colors: string[]
  logo_url?: string | null
}

export type CreateBrandResult =
  | { ok: true; brandId: string }
  | { ok: false; error: string }

export async function createBrand(
  input: BrandInput,
): Promise<CreateBrandResult> {
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

  return { ok: true, brandId: data.id }
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
