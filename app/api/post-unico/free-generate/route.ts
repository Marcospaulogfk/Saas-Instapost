import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { debitTokens, tokenCostForImage, TOKEN_COST } from "@/lib/tokens"
import {
  generateFreeSpec,
  generateFreeText,
  buildApprovedSpec,
} from "@/lib/single-posts/free-generate"
import type { PostBrand } from "@/lib/single-posts/types"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Débito best-effort. Nunca lança — tokens não quebram geração.
 *
 * O post único custa `tokenCostForSinglePost()` (29) no TETO, cobrado em duas
 * parcelas conforme o que é realmente entregue:
 *   - texto (4) na etapa que chama o Claude;
 *   - imagem (25 capa / 2 se caiu pro Flux / 0 se veio foto real do Wikimedia).
 *
 * Editar o post depois é sempre grátis — não há débito em edição.
 */
async function debitBestEffort(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
  amount: number,
): Promise<void> {
  if (!userId || amount <= 0) return
  try {
    await debitTokens(supabase, userId, amount)
  } catch {
    // ignorado — tokens nunca quebram geração
  }
}

/** Débito da imagem conforme a qualidade REAL entregue (null = foto real, grátis). */
function imageCost(quality: "normal" | "pro" | null): number {
  return quality ? tokenCostForImage(quality) : 0
}

interface RequestBody {
  brand: PostBrand
  briefing?: string
  skeleton_id?: string | null
  /** IDs já usados em gerações anteriores — IA evita repetir */
  exclude_skeleton_ids?: string[]
  /** Se true, gera SÓ texto (content + caption) sem chamar o Flux. */
  text_only?: boolean
  /**
   * Conteúdo já aprovado pelo usuário. Quando presente, NÃO regenera o texto:
   * só gera a foto (via photo_prompt) e monta o design.
   */
  approved_content?: SkeletonContent
  /** photo_prompt preservado da etapa de texto (usado com approved_content). */
  photo_prompt?: string | null
  /** Entidade real preservada da etapa de texto → vira foto real (Wikipedia). */
  image_entity?: string | null
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

  // Auth OPCIONAL: sem sessão a geração roda igual, só não debita tokens.
  // O modelo da imagem NÃO depende mais do plano — é papel de capa pra todos.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ---- Modo: conteúdo já aprovado → só monta design + foto (sem regenerar texto)
  if (body.approved_content) {
    if (!body.skeleton_id) {
      return NextResponse.json(
        { error: "skeleton_id obrigatório no modo aprovado" },
        { status: 400 },
      )
    }
    try {
      const result = await buildApprovedSpec({
        brand: body.brand,
        skeletonId: body.skeleton_id,
        content: body.approved_content,
        photoPrompt: body.photo_prompt ?? null,
        photoEntity: body.image_entity ?? null,
      })
      // Só a imagem: o texto já foi debitado na etapa text_only.
      await debitBestEffort(supabase, user?.id, imageCost(result.image_quality))
      return NextResponse.json({
        spec: result.spec,
        rationale: result.rationale,
        skeleton_id: result.skeleton_id,
        caption: result.caption,
        photo_url: result.photo_url,
        metrics: result.metrics,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro desconhecido"
      console.error("[post-unico/free-generate:approved]", err)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // Os modos abaixo precisam de briefing
  if (!body?.briefing || body.briefing.trim().length < 5) {
    return NextResponse.json(
      { error: "briefing muito curto (mín 5 chars)" },
      { status: 400 },
    )
  }

  // ---- Modo: text-only → gera só content + caption (etapa de aprovação)
  if (body.text_only) {
    try {
      const result = await generateFreeText({
        brand: body.brand,
        briefing: body.briefing.trim(),
        forceSkeletonId: body.skeleton_id ?? null,
        excludeSkeletonIds: body.exclude_skeleton_ids ?? [],
      })
      await debitBestEffort(supabase, user?.id, TOKEN_COST.textOnly)
      return NextResponse.json({
        skeleton_id: result.skeleton_id,
        content: result.content,
        caption: result.caption,
        photo_prompt: result.photo_prompt,
        image_entity: result.image_entity,
        rationale: result.rationale,
        metrics: result.metrics,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro desconhecido"
      console.error("[post-unico/free-generate:text]", err)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  // ---- Modo padrão: gera tudo (texto + foto + design)
  try {
    const result = await generateFreeSpec({
      brand: body.brand,
      briefing: body.briefing.trim(),
      forceSkeletonId: body.skeleton_id ?? null,
      excludeSkeletonIds: body.exclude_skeleton_ids ?? [],
    })
    // Gera texto + imagem numa tacada só → cobra as duas parcelas.
    await debitBestEffort(
      supabase,
      user?.id,
      TOKEN_COST.textOnly + imageCost(result.image_quality),
    )
    return NextResponse.json({
      spec: result.spec,
      rationale: result.rationale,
      skeleton_id: result.skeleton_id,
      caption: result.caption,
      photo_url: result.photo_url,
      metrics: result.metrics,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/free-generate]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
