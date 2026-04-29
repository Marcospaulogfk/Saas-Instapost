import { notFound } from "next/navigation"
import { getBrandById, listProjectsByBrand } from "@/lib/data/queries"
import { BrandDetail } from "./brand-detail"

export default async function MarcaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [brand, projects] = await Promise.all([
    getBrandById(id),
    listProjectsByBrand(id),
  ])
  if (!brand) notFound()
  return <BrandDetail brand={brand} projects={projects} />
}
