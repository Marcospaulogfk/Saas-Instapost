import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImagesForSlide } from '@/lib/editorial/ai-images'
import { getUserPlan } from '@/lib/generation/image'
import { debitTokens, getAvailableTokens, tokenCostForImage, tokenCostForRole } from '@/lib/tokens'
import { logImageUsage } from '@/lib/generation/usage-log'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Regenera as imagens de um slide respeitando o PLANO (Pro/Studio → Nano
 * Banana Pro; demais → Flux Pro) e debitando tokens por imagem gerada
 * (best-effort, só se logado). Mantém o contrato `images: string[]`.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slide?: EditorialSlide }
    if (!body?.slide) {
      return NextResponse.json({ success: false, error: 'slide ausente' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const plan = await getUserPlan(supabase)

    // Portão de saldo antes de chamar a Fal.ai. A conta é a mesma que
    // generateImagesForSlide vai fazer: uma imagem por prompt do slide, no
    // preço do PAPEL (capa 20 / miolo 2). É estimativa só porque uma capa que
    // cai pro Flux acaba custando menos, nunca mais. Sem o portão, o débito
    // atômico lá embaixo não debita nada e as imagens saem de graça.
    const nImagens = body.slide.imagePrompts?.length ?? 0
    if (user && nImagens > 0) {
      const custoEstimado =
        nImagens * tokenCostForRole(body.slide.layoutType === 'capa' ? 'cover' : 'slide')
      const saldoDisponivel = await getAvailableTokens(supabase, user.id)
      if (saldoDisponivel < custoEstimado) {
        return NextResponse.json(
          {
            error: 'Tokens insuficientes para esta geração.',
            code: 'sem_saldo',
            needed: custoEstimado,
            available: saldoDisponivel,
          },
          { status: 402 },
        )
      }
    }

    const results = await generateImagesForSlide(body.slide, plan)

    // Débito best-effort: soma o custo de cada imagem pela sua qualidade.
    if (user && results.length) {
      const total = results.reduce((sum, r) => sum + tokenCostForImage(r.quality), 0)
      try {
        const debit = await debitTokens(supabase, user.id, total, {
          kind: 'debit_image',
          refType: 'editorial_slide',
          title: `Imagens regeradas (${results.length})`,
        })
        if (!debit.ok) {
          // Imagens entregues sem cobrar.
          console.warn(
            `[editorial/regenerate-images] débito de tokens falhou: user=${user.id} ` +
              `amount=${total} debited=${debit.debited}` +
              (debit.error ? ` (${debit.error})` : ''),
          )
        }
      } catch {
        // ignorado — tokens nunca quebram geração
      }
    }
    // Medidor de COGS por imagem (22/08). Best-effort.
    for (const r of results) {
      await logImageUsage(supabase, {
        stage: r.quality === 'pro' ? 'image_cover' : 'image_slide',
        model: r.model,
        costUsd: r.costUsd,
        userId: user?.id ?? null,
        tokensCharged: user ? tokenCostForImage(r.quality) : 0,
      })
    }

    return NextResponse.json({ success: true, images: results.map((r) => r.url) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
