import { NextResponse } from 'next/server'
import { generateEditorialImage } from '@/lib/editorial/ai-images'

export const maxDuration = 120

/**
 * Endpoint atômico de geração de imagem editorial.
 *
 * Pode ser usado pela UI (regenerar uma imagem só) ou como webhook
 * por integrações externas (ex: o Claude pode ser instruído a
 * chamar este endpoint slide-a-slide).
 *
 * Body:
 * {
 *   prompt: string,                                 // obrigatório
 *   style?: 'cinematic' | 'editorial' | 'minimal' | 'sepia',
 *   aspectRatio?: '4:5' | '1:1' | '16:9' | '9:16'
 * }
 *
 * Resposta:
 * { success: true, url: string, ms: number }
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

    const url = await generateEditorialImage({ prompt, style, aspectRatio })
    const ms = Math.round(performance.now() - start)
    return NextResponse.json({ success: true, url, ms })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
