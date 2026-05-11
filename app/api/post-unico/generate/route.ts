import { NextResponse } from "next/server"
import { getTemplate } from "@/lib/single-posts/catalog"
import { generatePostContent, pickBestTemplate } from "@/lib/single-posts/generate"
import type { PostBrand, PostCategory } from "@/lib/single-posts/types"

export const runtime = "nodejs"
export const maxDuration = 60

interface RequestBody {
  brand: PostBrand
  /** ID do template OU "auto" pra deixar a IA escolher */
  templateId: string
  rawContent: string
  /** Hint opcional de categoria quando templateId é "auto" */
  categoryHint?: PostCategory | null
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body?.brand?.id) {
    return NextResponse.json({ error: "brand obrigatória" }, { status: 400 })
  }
  if (!body?.templateId) {
    return NextResponse.json({ error: "templateId obrigatório" }, { status: 400 })
  }
  if (!body?.rawContent || body.rawContent.trim().length < 5) {
    return NextResponse.json(
      { error: "rawContent muito curto (mín 5 chars)" },
      { status: 400 },
    )
  }

  // Modo auto — IA local escolhe o melhor template baseado no briefing
  let template = body.templateId === "auto"
    ? pickBestTemplate(body.brand, body.rawContent.trim(), body.categoryHint)
    : getTemplate(body.templateId)

  if (!template) {
    return NextResponse.json(
      { error: `template ${body.templateId} não encontrado` },
      { status: 404 },
    )
  }

  try {
    const result = await generatePostContent(
      body.brand,
      template,
      body.rawContent.trim(),
    )
    return NextResponse.json({
      content: result.content,
      photo_url: result.photo_url,
      metrics: result.metrics,
      template_id: template.id,
      auto_picked: body.templateId === "auto",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/generate]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
