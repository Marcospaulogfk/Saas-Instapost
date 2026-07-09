import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImagesForSlide } from '@/lib/editorial/ai-images'
import { getUserPlan } from '@/lib/generation/image'
import { debitTokens, tokenCostForImage } from '@/lib/tokens'
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

    const results = await generateImagesForSlide(body.slide, plan)

    // Débito best-effort: soma o custo de cada imagem pela sua qualidade.
    if (user && results.length) {
      const total = results.reduce((sum, r) => sum + tokenCostForImage(r.quality), 0)
      try {
        await debitTokens(supabase, user.id, total)
      } catch {
        // ignorado — tokens nunca quebram geração
      }
    }

    return NextResponse.json({ success: true, images: results.map((r) => r.url) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
