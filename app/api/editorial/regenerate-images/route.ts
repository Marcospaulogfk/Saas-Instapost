import { NextResponse } from 'next/server'
import { generateImagesForSlide } from '@/lib/editorial/ai-images'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slide?: EditorialSlide }
    if (!body?.slide) {
      return NextResponse.json({ success: false, error: 'slide ausente' }, { status: 400 })
    }
    const images = await generateImagesForSlide(body.slide)
    return NextResponse.json({ success: true, images })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
