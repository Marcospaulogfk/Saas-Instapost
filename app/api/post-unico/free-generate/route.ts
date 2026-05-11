import { NextResponse } from "next/server"
import { generateFreeSpec } from "@/lib/single-posts/free-generate"
import type { PostBrand } from "@/lib/single-posts/types"

export const runtime = "nodejs"
export const maxDuration = 60

interface RequestBody {
  brand: PostBrand
  briefing: string
  skeleton_id?: string | null
  /** IDs já usados em gerações anteriores — IA evita repetir */
  exclude_skeleton_ids?: string[]
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
  if (!body?.briefing || body.briefing.trim().length < 5) {
    return NextResponse.json(
      { error: "briefing muito curto (mín 5 chars)" },
      { status: 400 },
    )
  }

  try {
    const result = await generateFreeSpec({
      brand: body.brand,
      briefing: body.briefing.trim(),
      forceSkeletonId: body.skeleton_id ?? null,
      excludeSkeletonIds: body.exclude_skeleton_ids ?? [],
    })
    return NextResponse.json({
      spec: result.spec,
      rationale: result.rationale,
      skeleton_id: result.skeleton_id,
      photo_url: result.photo_url,
      metrics: result.metrics,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/free-generate]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
