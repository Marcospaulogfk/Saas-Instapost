// =====================================================================
// /dashboard/admin/fabrica — o chão de fábrica, visível.
//
// Duas vistas num painel só (visão do Marcos, 26/08):
//  - PRODUÇÃO: o que os usuários estão gerando (posts únicos capturados,
//    posts salvos e carrosséis), com thumb, marca e custo;
//  - FÁBRICA: a esteira de conversão bitmap → template editável, por
//    estágio, com as ações de operar (converter, revisar, promover).
//
// 404 fora de ADMIN_EMAILS, como as demais páginas admin.
// =====================================================================

import { notFound } from "next/navigation"
import { Factory } from "lucide-react"
import { isAdminUser } from "@/lib/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { FabricaClient, type GenRow, type PostRow, type CarouselRow } from "./fabrica-client"

export const metadata = { title: "Admin: fábrica" }
export const dynamic = "force-dynamic"

export default async function FabricaPage() {
  if (!(await isAdminUser())) notFound()

  const admin = createAdminClient()
  const [gensQ, postsQ, carrosseisQ, brandsQ] = await Promise.all([
    admin
      .from("post_generations")
      .select(
        "id, brand_id, briefing, niche, skeleton_id, fal_art_url, art_url, clean_url, image_cost_usd, pipeline_status, conversion, promoted_post_id, single_post_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(80),
    admin
      .from("single_posts")
      .select("id, title, brand_id, rendered_image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(24),
    admin
      .from("editorial_carousels")
      .select("id, topic, brand_name, created_at, cover:carousel_data->>coverImageUrl")
      .order("created_at", { ascending: false })
      .limit(24),
    admin.from("brands").select("id, name"),
  ])

  const brandName = new Map<string, string>(
    ((brandsQ.data ?? []) as { id: string; name: string }[]).map((b) => [b.id, b.name]),
  )
  const gens = ((gensQ.data ?? []) as GenRow[]).map((g) => ({
    ...g,
    brand_name: g.brand_id ? (brandName.get(g.brand_id) ?? null) : null,
  }))
  const posts = ((postsQ.data ?? []) as PostRow[]).map((p) => ({
    ...p,
    brand_name: p.brand_id ? (brandName.get(p.brand_id) ?? null) : null,
  }))
  const carrosseis = (carrosseisQ.data ?? []) as CarouselRow[]

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto pb-24 lg:pb-8 space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="nv-tile nv-tile-purple w-10 h-10">
            <Factory className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <h1 className="text-2xl font-bold" style={{ color: "var(--nv-text)" }}>
            Fábrica de templates
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--nv-text-muted)" }}>
          Cada geração dos usuários vira matéria-prima aqui: bitmap capturado →
          clean plate → extração → composição → sua revisão → template na
          biblioteca. Converter custa ~US$ 0,15-0,35 por peça (clean plate com
          até 3 tentativas + 3 chamadas de visão).
        </p>
      </div>
      <FabricaClient gens={gens} posts={posts} carrosseis={carrosseis} />
    </div>
  )
}
