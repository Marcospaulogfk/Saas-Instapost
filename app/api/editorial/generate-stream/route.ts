import { NextRequest } from 'next/server'
import { generateCompleteCarousel } from '@/lib/editorial/generator'
import { getActiveBrandIdFromCookie } from '@/lib/active-brand'
import { getBrandById, listBrands } from '@/lib/data/queries'

export const maxDuration = 300

/**
 * Carrega o contexto da marca ativa (best-effort). Se falhar por qualquer
 * motivo (sem login, sem marca, etc.) retorna null e a geração segue só com
 * os params do form — nunca quebra a geração por causa disso.
 */
async function loadActiveBrandContext() {
  try {
    const activeId = await getActiveBrandIdFromCookie()
    const brand = activeId
      ? await getBrandById(activeId)
      : (await listBrands())[0] ?? null
    if (!brand) return null
    return {
      name: brand.name,
      handle: brand.instagram_handle || '',
      audience: brand.target_audience || '',
      context: {
        description: brand.description,
        visualStyle: brand.visual_style,
        toneOfVoice: brand.tone_of_voice,
        mainObjective: brand.main_objective,
        brandColors: brand.brand_colors,
      },
    }
  } catch (err) {
    console.warn('⚠️ [Editorial] Não foi possível carregar marca ativa:', err)
    return null
  }
}

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

  // Contexto rico da marca ativa (melhora copy + imagens). Best-effort.
  const activeBrand = await loadActiveBrandContext()

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
          brandInfo: {
            name: activeBrand?.name || brandName,
            handle: activeBrand?.handle || handle,
            // brandColor fica pra depois (decisão de cor adiada pelo fundador);
            // por ora segue o roxo SyncPost default na renderização.
          },
          tone,
          targetAudience: activeBrand?.audience || audience,
          desiredSlides,
          brandContext: activeBrand?.context,
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
