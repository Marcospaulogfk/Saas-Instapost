"use server"

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
