import { notFound } from "next/navigation"
import { getProjectWithSlides } from "@/lib/data/queries"
import { ProjectPreview } from "./project-preview"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProjectWithSlides(id)
  if (!data) notFound()
  return (
    <ProjectPreview
      project={data.project}
      brand={data.brand}
      slides={data.slides}
    />
  )
}
