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
  /** Miniatura da arte (PNG no Storage) — alimenta os cartoes da biblioteca. */
  rendered_image_url?: string | null
  /**
   * Pauta (scheduled_posts) que originou o post, quando ele nasceu do Pipeline
   * do calendario. E o que permite o CRM saber que a pauta virou arte
   * (migration 0023 + GET /api/webhooks/websync-os/status).
   */
  scheduled_post_id?: string | null
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
      rendered_image_url: input.rendered_image_url ?? null,
      // A coluna so entra no insert quando ha pauta de origem. Assim o save
      // avulso continua identico ao de antes da 0023 e nao depende dela: se a
      // migration ainda nao rodou no ambiente, quem quebra e so o caminho
      // novo, nao a Biblioteca inteira.
      ...(input.scheduled_post_id
        ? { scheduled_post_id: input.scheduled_post_id }
        : {}),
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: error.message }

  // /dashboard/projetos e a "Biblioteca" do menu — ficava de fora da
  // revalidacao, entao o post recem-criado so aparecia la depois de um reload
  // forcado.
  revalidatePath("/dashboard/projetos")
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

  revalidatePath("/dashboard/projetos")
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

  revalidatePath("/dashboard/projetos")
  revalidatePath("/dashboard/posts-unicos")
  revalidatePath("/dashboard")
  return { ok: true }
}
