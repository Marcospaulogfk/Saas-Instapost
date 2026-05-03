import { NextRequest } from 'next/server'
import { generateCompleteCarousel } from '@/lib/editorial/generator'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const topic = sp.get('topic') || ''
  const brandName = sp.get('brandName') || 'SYNCPOST'
  const handle = sp.get('handle') || '@SYNCPOST_'
  const tone = (sp.get('tone') || 'direto') as 'profissional' | 'casual' | 'direto'
  const audience = sp.get('audience') || 'criadores de conteúdo'
  const desiredSlides = sp.get('desiredSlides')
    ? Number(sp.get('desiredSlides'))
    : undefined

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        )
      }

      try {
        const carousel = await generateCompleteCarousel({
          topic,
          brandInfo: { name: brandName, handle },
          tone,
          targetAudience: audience,
          desiredSlides,
          onProgress: (step, current, total) => {
            sendEvent('progress', { step, current, total })
          },
        })

        sendEvent('complete', { carousel })
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'erro desconhecido'
        sendEvent('error', { message })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
