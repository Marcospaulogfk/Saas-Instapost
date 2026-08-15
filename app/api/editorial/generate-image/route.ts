import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEditorialImageForRole } from '@/lib/editorial/ai-images'
import { debitTokens, tokenCostForImage } from '@/lib/tokens'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Endpoint atômico de geração de imagem editorial (carrossel).
 *
 * O modelo é escolhido pelo PAPEL do slide, não pelo plano: capa → Nano
 * Banana 2, miolo → Flux Schnell. Todo mundo recebe a mesma capa.
 *
 * O débito usa a qualidade EFETIVA, não a pedida: se o Nano Banana 2 falhar
 * e a capa cair pro Schnell, o usuário paga 2 tokens em vez de 25 — ele
 * recebeu uma imagem de miolo, paga preço de miolo.
 *
 * Best-effort e PÚBLICO: sem sessão não debita e nada quebra.
 *
 * Body:
 * {
 *   prompt: string,                                 // obrigatório
 *   role?: 'cover' | 'slide',                       // default 'slide'
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

    // Capa só quando o caller pede explicitamente — default é miolo, o
    // caminho barato. Um caller esquecido gera imagem de 2 tokens, não de 25.
    const role: 'cover' | 'slide' = body?.role === 'cover' ? 'cover' : 'slide'

    // Auth OPCIONAL: sem sessão, gera e não debita.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { url, quality } = await generateEditorialImageForRole(
      { prompt, style, aspectRatio },
      role,
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
