import { listAllProjects, listBrands } from "@/lib/data/queries"
import { ProjectsList } from "./projects-list"

export default async function ProjetosPage() {
  const [projects, brands] = await Promise.all([
    listAllProjects(),
    listBrands(),
  ])

  return (
    <ProjectsList
      projects={projects.map((p) => ({
        id: p.id,
        title: p.title,
        created_at: p.created_at,
        brand: p.brand,
      }))}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
    />
  )
}
