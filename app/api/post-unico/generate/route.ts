import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserPlan } from "@/lib/generation/image"
import {
  debitTokens,
  getAvailableTokens,
  tokenCostForSinglePostImage,
  TOKEN_COST,
} from "@/lib/tokens"
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

  // Auth OPCIONAL: deriva o plano se houver sessão, senão "trial" (Flux).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const plan = await getUserPlan(supabase)

  // -------------------------------------------------------------------
  // Portão de saldo (só pra quem está logado; sem sessão nada é cobrado).
  //
  // Sem isto a peça sai de graça: o débito é atômico e roda DEPOIS da
  // geração, então saldo curto = nada debitado e nada bloqueado.
  // O custo é ESTIMADO por baixo: o texto é certo, mas quantas imagens o
  // template vai gerar (e em que qualidade) só se sabe depois. Cobra-se o
  // piso: texto + uma imagem na qualidade mais barata quando o template pede
  // foto. O débito real, mais adiante, pode ser maior.
  // -------------------------------------------------------------------
  if (user) {
    const custoMinimo =
      TOKEN_COST.singlePostText +
      (template.needs_photo ? tokenCostForSinglePostImage("normal") : 0)
    const saldoDisponivel = await getAvailableTokens(supabase, user.id)
    if (saldoDisponivel < custoMinimo) {
      return NextResponse.json(
        {
          error: "Tokens insuficientes para esta geração.",
          code: "sem_saldo",
          needed: custoMinimo,
          available: saldoDisponivel,
        },
        { status: 402 },
      )
    }
  }

  try {
    const result = await generatePostContent(
      body.brand,
      template,
      body.rawContent.trim(),
      plan,
    )

    // Débito best-effort por qualidade real (só se logado). Nunca bloqueia.
    if (user) {
      try {
        const imageTokens =
          result.image_counts.normal * tokenCostForSinglePostImage("normal") +
          result.image_counts.pro * tokenCostForSinglePostImage("pro")
        const tokensToDebit = TOKEN_COST.singlePostText + imageTokens
        const debit = await debitTokens(supabase, user.id, tokensToDebit, {
          kind: "debit_single_post",
          refType: "single_post",
          refId: null,
          title: "Post único",
        })
        if (!debit.ok) {
          // Peça entregue sem cobrar (o portão usa o piso do custo).
          console.warn(
            `[post-unico/generate] débito de tokens falhou: user=${user.id} ` +
              `amount=${tokensToDebit} debited=${debit.debited}` +
              (debit.error ? ` (${debit.error})` : ""),
          )
        }
      } catch {
        // ignorado — tokens nunca quebram geração
      }
    }

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
