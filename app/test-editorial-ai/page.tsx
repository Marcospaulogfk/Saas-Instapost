'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'

const layouts: Record<string, React.ComponentType<{ slide: EditorialSlide; scale?: number }>> = {
  capa: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/01-CapaLayout').then(
        (m) => m.CapaLayout,
      ),
    { ssr: false },
  ),
  problema: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/02-ProblemaLayout').then(
        (m) => m.ProblemaLayout,
      ),
    { ssr: false },
  ),
  demo: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/03-DemoLayout').then(
        (m) => m.DemoLayout,
      ),
    { ssr: false },
  ),
  novidade: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/04-NovidadeLayout').then(
        (m) => m.NovidadeLayout,
      ),
    { ssr: false },
  ),
  prova: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/05-ProvaLayout').then(
        (m) => m.ProvaLayout,
      ),
    { ssr: false },
  ),
  'texto-foto': dynamic(
    () =>
      import('@/components/templates/editorial/layouts/06-TextoFotoLayout').then(
        (m) => m.TextoFotoLayout,
      ),
    { ssr: false },
  ),
  sepia: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/07-SepiaLayout').then(
        (m) => m.SepiaLayout,
      ),
    { ssr: false },
  ),
  serif: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/08-SerifLayout').then(
        (m) => m.SerifLayout,
      ),
    { ssr: false },
  ),
  cta: dynamic(
    () =>
      import('@/components/templates/editorial/layouts/09-CtaLayout').then(
        (m) => m.CtaLayout,
      ),
    { ssr: false },
  ),
}

interface CarouselResponse {
  totalSlides: number
  brandName: string
  handle: string
  topic: string
  slides: EditorialSlide[]
  createdAt: string
}

export default function TestEditorialAIPage() {
  const [topic, setTopic] = useState('5 erros que matam carrossel no Instagram')
  const [carousel, setCarousel] = useState<CarouselResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setCarousel(null)
    const start = performance.now()
    try {
      const res = await fetch('/api/test-editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'erro desconhecido')
        return
      }
      setCarousel(data.carousel)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro de rede')
    } finally {
      setElapsedMs(Math.round(performance.now() - start))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-zinc-900">Test Editorial AI</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Gera carrossel completo via Anthropic Claude + Fal.ai. Pode levar 30-90s.
        </p>

        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema do carrossel"
            className="flex-1 p-3 border border-zinc-300 rounded text-zinc-900 bg-white"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || topic.trim().length < 5}
            className="bg-purple-600 text-white px-6 py-3 rounded font-medium disabled:opacity-50 hover:bg-purple-700 transition-colors"
          >
            {loading ? 'Gerando…' : 'Gerar Carrossel'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {carousel && (
          <div className="mb-4 p-3 bg-white border border-zinc-200 rounded text-sm text-zinc-600">
            <strong>{carousel.totalSlides} slides</strong> ·{' '}
            {elapsedMs !== null && <>gerados em {(elapsedMs / 1000).toFixed(1)}s</>}
          </div>
        )}

        {carousel && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {carousel.slides.map((slide, idx) => {
              const Layout = layouts[slide.layoutType]
              if (!Layout) {
                return (
                  <div key={idx} className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    Layout desconhecido: {slide.layoutType}
                  </div>
                )
              }
              return (
                <div key={idx} className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-zinc-500 mb-2">
                    Slide {slide.pageNumber} — <strong>{slide.layoutType}</strong>
                    {slide.variant && <> ({slide.variant})</>}
                  </p>
                  <div className="border border-zinc-200">
                    <Layout slide={slide} scale={0.4} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
