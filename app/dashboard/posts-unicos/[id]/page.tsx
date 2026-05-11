import { notFound } from "next/navigation"
import { getSinglePost } from "@/lib/single-posts/queries"
import { getBrandById } from "@/lib/data/queries"
import { getTemplate } from "@/lib/single-posts/catalog"
import { generateMonogram } from "@/lib/single-posts/palette"
import { PostUnicoEditor } from "@/components/single-posts/editor"
import type { PostBrand } from "@/lib/single-posts/types"

export default async function PostUnicoEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getSinglePost(id)
  if (!post) notFound()

  const template = getTemplate(post.template_id)
  if (!template) notFound()

  const brand = await getBrandById(post.brand_id)
  if (!brand) notFound()

  const editorBrand: PostBrand = {
    id: brand.id,
    name: brand.name,
    monogram: generateMonogram(brand.name),
    profession: brand.description ?? "",
    brand_colors: brand.brand_colors,
    logo_url: brand.logo_url,
    phone: null,
    website: brand.website_url,
    instagram_handle: brand.instagram_handle,
    tagline: null,
  }

  return (
    <PostUnicoEditor
      initialBrand={editorBrand}
      initialTemplateId={post.template_id}
      initialContent={post.content}
      initialTitle={post.title}
      initialRawBrief={post.raw_brief ?? ""}
      postId={post.id}
    />
  )
}
