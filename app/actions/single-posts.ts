"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { PostContent } from "@/lib/single-posts/types"

export interface SinglePostInput {
  brand_id: string
  template_id: string
  title: string
  raw_brief?: string | null
  content: PostContent
}

export type CreateSinglePostResult =
  | { ok: true; postId: string }
  | { ok: false; error: string }

export async function createSinglePost(
  input: SinglePostInput,
): Promise<CreateSinglePostResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("id", input.brand_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!brand) return { ok: false, error: "Marca não encontrada." }

  const { data, error } = await supabase
    .from("single_posts")
    .insert({
      brand_id: input.brand_id,
      template_id: input.template_id,
      title: input.title.trim() || "Post sem título",
      raw_brief: input.raw_brief?.trim() || null,
      content: input.content,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/posts-unicos")
  revalidatePath("/dashboard")
  return { ok: true, postId: data.id }
}

export interface SinglePostUpdate {
  title?: string
  raw_brief?: string | null
  content?: PostContent
  rendered_image_url?: string | null
  status?: "draft" | "exported" | "archived"
}

export type UpdateSinglePostResult = { ok: true } | { ok: false; error: string }

export async function updateSinglePost(
  postId: string,
  patch: SinglePostUpdate,
): Promise<UpdateSinglePostResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const updateBody: Record<string, unknown> = {}
  if (patch.title !== undefined) updateBody.title = patch.title.trim()
  if (patch.raw_brief !== undefined) updateBody.raw_brief = patch.raw_brief?.trim() || null
  if (patch.content !== undefined) updateBody.content = patch.content
  if (patch.rendered_image_url !== undefined)
    updateBody.rendered_image_url = patch.rendered_image_url
  if (patch.status !== undefined) updateBody.status = patch.status

  if (Object.keys(updateBody).length === 0) return { ok: true }

  const { error } = await supabase
    .from("single_posts")
    .update(updateBody)
    .eq("id", postId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/posts-unicos")
  revalidatePath(`/dashboard/posts-unicos/${postId}`)
  return { ok: true }
}

export type DeleteSinglePostResult = { ok: true } | { ok: false; error: string }

export async function deleteSinglePost(
  postId: string,
): Promise<DeleteSinglePostResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Você precisa estar logado." }

  const { error } = await supabase.from("single_posts").delete().eq("id", postId)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/posts-unicos")
  revalidatePath("/dashboard")
  return { ok: true }
}
