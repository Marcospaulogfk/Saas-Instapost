import { notFound } from "next/navigation"
import { getBrandById, listProjectsByBrand } from "@/lib/data/queries"
import { listCarouselsV2 } from "@/app/actions/carousel"
import { listSinglePostsByBrand } from "@/lib/single-posts/queries"
import { BrandDetail } from "./brand-detail"

export default async function MarcaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [brand, projects, allCarousels, singlePostRecords] = await Promise.all([
    getBrandById(id),
    listProjectsByBrand(id),
    listCarouselsV2(),
    listSinglePostsByBrand(id),
  ])
  if (!brand) notFound()

  // Carrosséis guardam a marca por NOME (não têm brand_id) — filtra pelo
  // nome da marca desta página. Sem isso a marca mostrava "zero conteúdo"
  // mesmo com carrosséis criados nela (feedback do cliente).
  const brandName = brand.name.trim().toLowerCase()
  const carousels = allCarousels.filter(
    (c) => (c.brand_name ?? "").trim().toLowerCase() === brandName,
  )

  const singlePosts = singlePostRecords.map((p) => ({
    id: p.id,
    title: p.title,
    rendered_image_url: p.rendered_image_url,
    created_at: p.created_at,
  }))

  return (
    <BrandDetail
      brand={brand}
      projects={projects}
      carousels={carousels}
      singlePosts={singlePosts}
    />
  )
}
