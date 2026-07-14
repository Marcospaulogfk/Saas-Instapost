import { notFound } from "next/navigation"
import { getSinglePost } from "@/lib/single-posts/queries"
import { getBrandById } from "@/lib/data/queries"
import { getTemplate } from "@/lib/single-posts/catalog"
import { generateMonogram } from "@/lib/single-posts/palette"
import { PostUnicoEditor } from "@/components/single-posts/editor"
import { FreePostViewer } from "@/components/single-posts/free-post-viewer"
import type { PostBrand } from "@/lib/single-posts/types"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

export default async function PostUnicoEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getSinglePost(id)
  if (!post) notFound()

  // Post salvo do editor LIVRE (/teste): content carrega o spec inteiro.
  // Renderiza o viewer dedicado em vez do editor de templates.
  const freeContent = post.content as unknown as {
    _free_spec?: FreePostSpec
    _font_preset?: string
    _format?: "post" | "story"
  }
  if (post.template_id.startsWith("free:") && freeContent?._free_spec) {
    return (
      <FreePostViewer
        title={post.title}
        spec={freeContent._free_spec}
        fontPreset={freeContent._font_preset ?? "editorial"}
        format={freeContent._format === "story" ? "story" : "post"}
      />
    )
  }

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
