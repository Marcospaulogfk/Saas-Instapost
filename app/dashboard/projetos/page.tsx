import { listAllProjects, listBrands } from "@/lib/data/queries"
import { listCarouselsV2 } from "@/app/actions/carousel"
import { ProjectsList } from "./projects-list"

export default async function ProjetosPage() {
  const [projects, brands, carousels] = await Promise.all([
    listAllProjects(),
    listBrands(),
    listCarouselsV2(),
  ])

  return (
    <ProjectsList
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        created_at: p.created_at,
        brand: p.brand,
      }))}
      carousels={carousels}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
    />
  )
}
