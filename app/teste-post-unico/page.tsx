"use client"

import { PostUnicoEditor } from "@/components/single-posts/editor"
import { DEMO_BRAND, DEMO_CONTENT } from "@/lib/single-posts/demo"

export default function TestePostUnicoPage() {
  return (
    <PostUnicoEditor
      initialBrand={DEMO_BRAND}
      initialTemplateId="profissional-01-retrato-titulo-bottom"
      initialContent={DEMO_CONTENT["profissional-01-retrato-titulo-bottom"] ?? {}}
      hydrateFromSession
    />
  )
}
