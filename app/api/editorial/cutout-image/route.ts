import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publicImageUrl, removeBackground } from '@/lib/generation/cutout'
import { debitTokens, getAvailableTokens, TOKEN_COST } from '@/lib/tokens'
import { logImageUsage } from '@/lib/generation/usage-log'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Recorta o fundo de uma foto do carrossel ("Recortar fundo" no editor).
 *
 * Exige login (custa dinheiro na Fal). Cobra TOKEN_COST.imageCutout depois de
 * entregar, best-effort, igual às imagens: falha no débito nunca derruba o
 * recorte.
 *
 * Body: { url: string }   (URL pública da foto; o embrulho do proxy é aceito)
 * Resposta: { success: true, url: string, ms: number }
 *           { success: false, error: string }
 */
export async function POST(request: Request) {
  const start = performance.now()
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const url = publicImageUrl(String(body?.url ?? ''))
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Essa foto ainda não está salva na nuvem. Envie ou gere a foto de novo e tente.',
        },
        { status: 400 },
      )
    }

    const custo = TOKEN_COST.imageCutout
    const saldo = await getAvailableTokens(supabase, user.id)
    if (saldo < custo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tokens insuficientes para recortar o fundo.',
          code: 'sem_saldo',
          needed: custo,
          available: saldo,
        },
        { status: 402 },
      )
    }

    const result = await removeBackground(url)

    try {
      const debit = await debitTokens(supabase, user.id, custo, {
        kind: 'debit_image',
        refType: 'editorial_slide',
        title: 'Fundo da foto recortado',
      })
      if (!debit.ok) {
        console.warn(
          `[editorial/cutout-image] débito falhou: user=${user.id} amount=${custo}` +
            (debit.error ? ` (${debit.error})` : ''),
        )
      }
    } catch {
      // tokens nunca quebram o recorte
    }
    await logImageUsage(supabase, {
      stage: 'image_edit',
      model: result.model,
      costUsd: result.costUsd,
      userId: user.id,
      tokensCharged: custo,
      durationMs: result.ms,
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      ms: Math.round(performance.now() - start),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json(
      { success: false, error: `Não deu pra recortar o fundo: ${message}` },
      { status: 500 },
    )
  }
}
