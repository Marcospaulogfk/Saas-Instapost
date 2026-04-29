import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const DEV_MODE_ENABLED =
  process.env.DEV_MODE === "true" &&
  process.env.NODE_ENV !== "production"
const DEV_USER_ID = process.env.DEV_USER_ID

export type Profile = {
  credits: number
  subscription_status: string
  plan_credits_monthly: number
  plan_credits_used_this_month: number
  trial_used: boolean
}

export type BrandSummary = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  brand_colors: string[]
  default_template: string | null
  default_font: string | null
  created_at: string
  project_count: number
}

export type Brand = BrandSummary & {
  website_url: string | null
  instagram_handle: string | null
  target_audience: string | null
  tone_of_voice: string | null
  visual_style: string | null
  main_objective: string | null
}

export type ProjectWithBrand = {
  id: string
  title: string
  creation_mode: "ai" | "manual"
  objective: string
  status: string
  created_at: string
  brand: { id: string; name: string }
}

export type ProjectSummary = Omit<ProjectWithBrand, "brand">

function normalizeColors(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((c): c is string => typeof c === "string")
}

function unwrapBrand(value: unknown): { id: string; name: string } {
  if (Array.isArray(value)) return value[0] ?? { id: "", name: "" }
  if (value && typeof value === "object") return value as { id: string; name: string }
  return { id: "", name: "" }
}

export const requireUser = cache(async () => {
  if (DEV_MODE_ENABLED) {
    if (!DEV_USER_ID) {
      throw new Error(
        "DEV_MODE ativo mas DEV_USER_ID nao configurado em .env.local. Pegue seu UUID em Supabase Dashboard > Authentication > Users e cole.",
      )
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase.auth.admin.getUserById(DEV_USER_ID)
    if (error || !data?.user) {
      throw new Error(
        `DEV_MODE ativo mas user ${DEV_USER_ID} nao existe em auth.users. Confirme o UUID e rode 'node scripts/seed-dev-user.mjs'.`,
      )
    }
    return { supabase, user: data.user }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { supabase, user }
})

export const getProfile = cache(async () => {
  const { supabase, user } = await requireUser()
  const { data } = await supabase
    .from("users")
    .select(
      "credits, subscription_status, plan_credits_monthly, plan_credits_used_this_month, trial_used",
    )
    .eq("id", user.id)
    .single()
  return { user, profile: (data as Profile | null) ?? null }
})

export const listBrands = cache(async (): Promise<BrandSummary[]> => {
  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from("brands")
    .select(
      "id, name, description, logo_url, brand_colors, default_template, default_font, created_at, projects(count)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data.map((b: any) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    logo_url: b.logo_url,
    brand_colors: normalizeColors(b.brand_colors),
    default_template: b.default_template ?? null,
    default_font: b.default_font ?? null,
    created_at: b.created_at,
    project_count: b.projects?.[0]?.count ?? 0,
  }))
})

export async function getProjectWithSlides(projectId: string) {
  const { supabase } = await requireUser()

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, title, template, font_family, created_at, brand:brands!inner(id, name, brand_colors)",
    )
    .eq("id", projectId)
    .maybeSingle()

  if (projErr || !project) return null

  const rawBrand = project.brand as
    | { id: string; name: string; brand_colors: unknown }
    | Array<{ id: string; name: string; brand_colors: unknown }>
  const brandObj = Array.isArray(rawBrand) ? rawBrand[0] : rawBrand
  if (!brandObj) return null

  const { data: slides, error: slidesErr } = await supabase
    .from("slides")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true })

  if (slidesErr) return null

  return {
    project: {
      id: project.id as string,
      title: project.title as string,
      template: project.template as string,
      font_family: project.font_family as string,
      created_at: project.created_at as string,
    },
    brand: {
      id: brandObj.id,
      name: brandObj.name,
      brand_colors: normalizeColors(brandObj.brand_colors),
    },
    slides: slides ?? [],
  }
}

export async function listRecentProjects(
  limit: number = 6,
): Promise<ProjectWithBrand[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, creation_mode, objective, status, created_at, brand:brands!inner(id, name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map((p: any) => ({
    id: p.id,
    title: p.title,
    creation_mode: p.creation_mode,
    objective: p.objective,
    status: p.status,
    created_at: p.created_at,
    brand: unwrapBrand(p.brand),
  }))
}

export async function listAllProjects(): Promise<ProjectWithBrand[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, creation_mode, objective, status, created_at, brand:brands!inner(id, name)",
    )
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data.map((p: any) => ({
    id: p.id,
    title: p.title,
    creation_mode: p.creation_mode,
    objective: p.objective,
    status: p.status,
    created_at: p.created_at,
    brand: unwrapBrand(p.brand),
  }))
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from("brands")
    .select("*, projects(count)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    logo_url: data.logo_url,
    brand_colors: normalizeColors(data.brand_colors),
    created_at: data.created_at,
    website_url: data.website_url,
    instagram_handle: data.instagram_handle,
    target_audience: data.target_audience,
    tone_of_voice: data.tone_of_voice,
    visual_style: data.visual_style,
    main_objective: data.main_objective,
    project_count: data.projects?.[0]?.count ?? 0,
  }
}

export async function listProjectsByBrand(
  brandId: string,
): Promise<ProjectSummary[]> {
  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, creation_mode, objective, status, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data as ProjectSummary[]
}

export async function getDashboardCounts() {
  const { supabase, user } = await requireUser()
  const [brandsRes, projectsRes] = await Promise.all([
    supabase
      .from("brands")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("projects").select("*", { count: "exact", head: true }),
  ])
  return {
    brandsCount: brandsRes.count ?? 0,
    projectsCount: projectsRes.count ?? 0,
  }
}
