import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  debitTokens,
  getAvailableTokens,
  tokenCostForSinglePost,
  tokenCostForSinglePostImage,
  TOKEN_COST,
  type DebitMeta,
} from "@/lib/tokens"
import { logImageUsage } from "@/lib/generation/usage-log"
import {
  generateFreeSpec,
  generateFreeText,
  buildApprovedSpec,
} from "@/lib/single-posts/free-generate"
import { logGenerationUsage } from "@/lib/generation/usage-log"
import type { PostBrand } from "@/lib/single-posts/types"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"
import type { UsageStageRecord } from "@/lib/single-posts/free-generate"
import { capturarGeracaoBitmap } from "@/lib/fabrica/capture"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Débito best-effort. Nunca lança — tokens não quebram geração.
 *
 * O post único custa `tokenCostForSinglePost()` no TETO, cobrado em duas
 * parcelas conforme o que é realmente entregue:
 *   - texto + composição (`TOKEN_COST.singlePostText`) na etapa do Claude;
 *   - imagem (25 capa / 2 se caiu pro Flux / 0 se veio foto real do Wikimedia).
 *
 * Editar o post depois é sempre grátis — não há débito em edição.
 */
async function debitBestEffort(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
  amount: number,
  meta: DebitMeta,
): Promise<void> {
  if (!userId || amount <= 0) return
  try {
    const debit = await debitTokens(supabase, userId, amount, meta)
    if (!debit.ok) {
      // Peça já entregue e não cobrada. Quem impede isso de virar rotina é o
      // portão de saldo lá no POST, não este log.
      console.warn(
        `[post-unico/free-generate] débito de tokens falhou: user=${userId} ` +
          `amount=${amount} debited=${debit.debited}` +
          (debit.error ? ` (${debit.error})` : ""),
      )
    }
  } catch {
    // ignorado — tokens nunca quebram geração
  }
}

/**
 * Portão de saldo: 402 quando o usuário logado não tem o custo da etapa.
 *
 * Precisa existir porque o débito é ATÔMICO e roda DEPOIS da geração: saldo
 * curto não debita nada, e sem barrar antes a peça sairia de graça. Devolve
 * a resposta 402 pronta ou `null` quando pode seguir (inclusive sem sessão,
 * caso em que nada é cobrado).
 */
async function barrarSemSaldo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
  amount: number,
): Promise<NextResponse | null> {
  if (!userId || amount <= 0) return null
  const disponivel = await getAvailableTokens(supabase, userId)
  if (disponivel >= amount) return null
  return NextResponse.json(
    {
      error: "Tokens insuficientes para esta geração.",
      code: "sem_saldo",
      needed: amount,
      available: disponivel,
    },
    { status: 402 },
  )
}

/** Débito da imagem conforme a qualidade REAL entregue (null = foto real, grátis). */
function imageCost(quality: "normal" | "pro" | null): number {
  return quality ? tokenCostForSinglePostImage(quality) : 0
}

/**
 * Grava o custo de API de cada etapa. Best-effort igual ao débito: o log é
 * observabilidade de COGS, e uma tabela ausente (migration 0017 pendente) não
 * pode custar ao usuário a peça que ele já pagou.
 *
 * `tokensCharged` vai só na PRIMEIRA etapa de propósito — repetir o valor em
 * cada linha inflaria a receita ao somar a coluna, e é justamente a razão
 * dessas linhas existirem: cruzar COGS com o que foi cobrado.
 */
async function logUsageBestEffort(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stages: UsageStageRecord[],
  ctx: {
    userId?: string
    brandId?: string | null
    tokensCharged: number
    /** Imagem da Fal.ai gerada nesta chamada (null = foto real / sem imagem). */
    image?: { quality: "normal" | "pro" | null; costUsd: number }
  },
): Promise<void> {
  for (const [i, s] of stages.entries()) {
    await logGenerationUsage(supabase, {
      stage: s.stage,
      usage: s.usage,
      attempts: s.attempts,
      approvedOnAttempt: s.approvedOnAttempt,
      userId: ctx.userId ?? null,
      brandId: ctx.brandId ?? null,
      tokensCharged: i === 0 ? ctx.tokensCharged : 0,
    })
  }
  // Imagem (Fal.ai): até 22/08 não era gravada em lugar nenhum, e é o item
  // mais caro do post único. tokensCharged só vai aqui quando não houve
  // etapa de texto (modo só-imagem), pra não somar receita duas vezes.
  if (ctx.image && ctx.image.quality) {
    await logImageUsage(supabase, {
      stage: "image_post_unico",
      model:
        ctx.image.quality === "pro" ? "fal-ai/nano-banana-2" : "fal-ai/flux/schnell",
      costUsd: ctx.image.costUsd,
      userId: ctx.userId ?? null,
      brandId: ctx.brandId ?? null,
      tokensCharged: stages.length === 0 ? ctx.tokensCharged : 0,
    })
  }
}

/**
 * Fase 0 da fábrica: toda geração bitmap vira dado. Best-effort — jamais
 * atrasa ou quebra a resposta. Só captura quando saiu arte bitmap de verdade
 * (photo_url presente com qualidade "pro" = nano-banana).
 */
function capturar(
  body: RequestBody,
  userId: string | undefined,
  result: {
    photo_url: string | null
    image_quality: "normal" | "pro" | null
    image_cost_usd: number
    skeleton_id: string
    content: SkeletonContent | null
  },
): void {
  if (!result.photo_url || result.image_quality !== "pro") return
  void capturarGeracaoBitmap({
    brandId: body.brand.id ?? null,
    userId: userId ?? null,
    briefing: body.briefing?.trim() || null,
    niche: body.brand.profession ?? null,
    content: result.content,
    photoPrompt: body.photo_prompt ?? null,
    skeletonId: result.skeleton_id,
    artUrl: result.photo_url,
    imageCostUsd: result.image_cost_usd,
  })
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
    // Esta etapa cobra só a ARTE. Barra pelo TETO dela (imagem no modelo
    // caro): se a foto vier do Wikimedia o débito real é 0 e ninguém perde,
    // mas quem não tem os 25 não leva a arte de graça.
    const semSaldo = await barrarSemSaldo(
      supabase,
      user?.id,
      tokenCostForSinglePostImage("pro"),
    )
    if (semSaldo) return semSaldo

    try {
      const result = await buildApprovedSpec({
        brand: body.brand,
        skeletonId: body.skeleton_id,
        content: body.approved_content,
        photoPrompt: body.photo_prompt ?? null,
        photoEntity: body.image_entity ?? null,
        // Opcional neste modo (a validação de tamanho só vale pros modos que
        // geram texto), mas dá ao compositor o assunto do post.
        briefing: body.briefing?.trim() || null,
      })
      // Só a imagem: o texto já foi debitado na etapa text_only.
      const cobrado = imageCost(result.image_quality)
      await debitBestEffort(supabase, user?.id, cobrado, {
        kind: "debit_image",
        refType: "single_post",
        title: "Post único (arte)",
        meta: { image_quality: result.image_quality },
      })
      await logUsageBestEffort(supabase, result.usage_stages, {
        userId: user?.id,
        brandId: body.brand.id,
        tokensCharged: cobrado,
        image: { quality: result.image_quality, costUsd: result.image_cost_usd },
      })
      capturar(body, user?.id, result)
      return NextResponse.json({
        spec: result.spec,
        rationale: result.rationale,
        skeleton_id: result.skeleton_id,
        caption: result.caption,
        photo_url: result.photo_url,
        // Textos que estão na arte — alimenta a edição cirúrgica (modo bitmap).
        content: result.content,
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
    // Só texto: o custo é exato, sem estimativa.
    const semSaldo = await barrarSemSaldo(
      supabase,
      user?.id,
      TOKEN_COST.singlePostText,
    )
    if (semSaldo) return semSaldo

    try {
      const result = await generateFreeText({
        brand: body.brand,
        briefing: body.briefing.trim(),
        forceSkeletonId: body.skeleton_id ?? null,
        excludeSkeletonIds: body.exclude_skeleton_ids ?? [],
      })
      await debitBestEffort(supabase, user?.id, TOKEN_COST.singlePostText, {
        kind: "debit_single_post",
        refType: "single_post",
        title: `Post único (texto): ${body.briefing.trim().slice(0, 60)}`,
      })
      await logUsageBestEffort(supabase, result.usage_stages, {
        userId: user?.id,
        brandId: body.brand.id,
        tokensCharged: TOKEN_COST.singlePostText,
      })
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
  // Barra pelo TETO do post único (texto + arte no modelo caro): é o mesmo
  // número que o wizard mostra como "vai custar N tokens" antes de gerar,
  // então quem passou no preview passa aqui.
  const semSaldo = await barrarSemSaldo(supabase, user?.id, tokenCostForSinglePost())
  if (semSaldo) return semSaldo

  try {
    const result = await generateFreeSpec({
      brand: body.brand,
      briefing: body.briefing.trim(),
      forceSkeletonId: body.skeleton_id ?? null,
      excludeSkeletonIds: body.exclude_skeleton_ids ?? [],
    })
    // Gera texto + imagem numa tacada só → cobra as duas parcelas.
    const cobrado = TOKEN_COST.singlePostText + imageCost(result.image_quality)
    await debitBestEffort(supabase, user?.id, cobrado, {
      kind: "debit_single_post",
      refType: "single_post",
      title: `Post único: ${(body.briefing ?? "").trim().slice(0, 60)}`,
      meta: { image_quality: result.image_quality },
    })
    await logUsageBestEffort(supabase, result.usage_stages, {
      userId: user?.id,
      brandId: body.brand.id,
      tokensCharged: cobrado,
        image: { quality: result.image_quality, costUsd: result.image_cost_usd },
    })
    capturar(body, user?.id, result)
    return NextResponse.json({
      spec: result.spec,
      rationale: result.rationale,
      skeleton_id: result.skeleton_id,
      caption: result.caption,
      photo_url: result.photo_url,
      content: result.content,
      metrics: result.metrics,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido"
    console.error("[post-unico/free-generate]", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
