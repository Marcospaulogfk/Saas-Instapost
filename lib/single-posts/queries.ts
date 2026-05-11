import { requireUser } from "@/lib/data/queries"
import type { PostContent } from "./types"

export interface SinglePostRecord {
  id: string
  brand_id: string
  brand_name: string
  template_id: string
  title: string
  raw_brief: string | null
  content: PostContent
  rendered_image_url: string | null
  status: "draft" | "exported" | "archived"
  created_at: string
  updated_at: string
}

interface RawSinglePostRow {
  id: string
  brand_id: string
  template_id: string
  title: string
  raw_brief: string | null
  content: unknown
  rendered_image_url: string | null
  status: string
  created_at: string
  updated_at: string
  brand: { id: string; name: string } | { id: string; name: string }[] | null
}

function unwrapBrand(brand: RawSinglePostRow["brand"]): { id: string; name: string } {
  if (Array.isArray(brand)) return brand[0] ?? { id: "", name: "" }
  if (brand && typeof brand === "object") return brand
  return { id: "", name: "" }
}

function rowToRecord(row: RawSinglePostRow): SinglePostRecord {
  const brand = unwrapBrand(row.brand)
  return {
    id: row.id,
    brand_id: row.brand_id,
    brand_name: brand.name,
    template_id: row.template_id,
    title: row.title,
    raw_brief: row.raw_brief,
    content: (row.content as PostContent) ?? {},
    rendered_image_url: row.rendered_image_url,
    status: row.status as SinglePostRecord["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function listSinglePosts(): Promise<SinglePostRecord[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("single_posts")
    .select(
      "id, brand_id, template_id, title, raw_brief, content, rendered_image_url, status, created_at, updated_at, brand:brands!inner(id, name)",
    )
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return (data as unknown as RawSinglePostRow[]).map(rowToRecord)
}

export async function getSinglePost(id: string): Promise<SinglePostRecord | null> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("single_posts")
    .select(
      "id, brand_id, template_id, title, raw_brief, content, rendered_image_url, status, created_at, updated_at, brand:brands!inner(id, name)",
    )
    .eq("id", id)
    .maybeSingle()
  if (error || !data) return null
  return rowToRecord(data as unknown as RawSinglePostRow)
}
