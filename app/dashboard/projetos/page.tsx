import { listAllProjects, listBrands } from "@/lib/data/queries"
import { listCarouselsV2 } from "@/app/actions/carousel"
import { listSinglePosts } from "@/lib/single-posts/queries"
import { ProjectsList } from "./projects-list"

export default async function ProjetosPage() {
  const [projects, brands, carousels, singlePosts] = await Promise.all([
    listAllProjects(),
    listBrands(),
    listCarouselsV2(),
    listSinglePosts(),
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
      singlePosts={singlePosts.map((p) => ({
        id: p.id,
        title: p.title,
        brand_name: p.brand_name,
        rendered_image_url: p.rendered_image_url,
        created_at: p.created_at,
        // O briefing e a legenda ja vinham da query e eram descartados aqui.
        // Alimentam "Prompt usado / Recriar" e "Copiar legenda" no card.
        raw_brief: p.raw_brief,
        caption:
          typeof (p.content as { caption?: unknown } | null)?.caption === "string"
            ? ((p.content as { caption: string }).caption)
            : null,
      }))}
      brands={brands.map((b) => ({ id: b.id, name: b.name }))}
    />
  )
}
