import { NextResponse } from 'next/server'
import { generateCompleteCarousel } from '@/lib/editorial/generator'

export const maxDuration = 300 // 5 min — geração com IA pode demorar

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const carousel = await generateCompleteCarousel({
      topic: body.topic || '5 erros que matam carrossel no Instagram',
      brandInfo: {
        name: body.brandName || 'SYNCPOST',
        handle: body.handle || '@SYNCPOST_',
      },
      tone: body.tone || 'direto',
      targetAudience: body.targetAudience || 'criadores de conteúdo',
      desiredSlides: body.desiredSlides,
    })

    return NextResponse.json({ success: true, carousel })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
