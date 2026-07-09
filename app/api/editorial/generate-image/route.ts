import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEditorialImageForPlan } from '@/lib/editorial/ai-images'
import { getUserPlan } from '@/lib/generation/image'
import { debitTokens, tokenCostForImage } from '@/lib/tokens'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Endpoint atômico de geração de imagem editorial (carrossel).
 *
 * Respeita o PLANO (igual ao post único): Pro/Studio geram com Nano Banana
 * Pro (fallback Flux Pro); trial/starter usam Flux Pro. Debita tokens por
 * imagem conforme a qualidade EFETIVA (pro=20, normal=5) — best-effort, só
 * se houver sessão. Endpoint segue PÚBLICO: sem login o plano vira "trial"
 * (Flux) e nada quebra nem debita.
 *
 * Body:
 * {
 *   prompt: string,                                 // obrigatório
 *   style?: 'cinematic' | 'editorial' | 'minimal' | 'sepia',
 *   aspectRatio?: '4:5' | '1:1' | '16:9' | '9:16'
 * }
 *
 * Resposta:
 * { success: true, url: string, ms: number, quality: 'normal' | 'pro' }
 * { success: false, error: string }
 */
export async function POST(request: Request) {
  const start = performance.now()
  try {
    const body = await request.json().catch(() => ({}))
    const prompt = (body?.prompt ?? '').trim()
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'prompt é obrigatório' },
        { status: 400 },
      )
    }
    const style = body?.style as
      | 'cinematic'
      | 'editorial'
      | 'minimal'
      | 'sepia'
      | undefined
    const aspectRatio = body?.aspectRatio as
      | '4:5'
      | '1:1'
      | '16:9'
      | '9:16'
      | undefined

    // Auth OPCIONAL: deriva o plano se houver sessão, senão "trial" (Flux).
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const plan = await getUserPlan(supabase)

    const { url, quality } = await generateEditorialImageForPlan(
      { prompt, style, aspectRatio },
      plan,
    )

    // Débito best-effort (só se logado). Nunca bloqueia a geração.
    if (user) {
      try {
        await debitTokens(supabase, user.id, tokenCostForImage(quality))
      } catch {
        // ignorado — tokens nunca quebram geração
      }
    }

    const ms = Math.round(performance.now() - start)
    return NextResponse.json({ success: true, url, ms, quality })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
