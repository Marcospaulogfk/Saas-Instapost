'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentType } from 'react'
import type {
  EditorialCarousel,
  EditorialSlide,
} from '@/components/templates/editorial/editorial.types'
import { Button } from '@/components/ui/button'

type LayoutComponent = ComponentType<{ slide: EditorialSlide; scale?: number }>

const layoutComponents: Record<string, LayoutComponent> = {
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

interface CarouselPreviewProps {
  carousel: EditorialCarousel
  selectedIdx: number
  onSelectSlide: (idx: number) => void
}

export function CarouselPreview({
  carousel,
  selectedIdx,
  onSelectSlide,
}: CarouselPreviewProps) {
  const handlePrev = () => {
    if (selectedIdx > 0) onSelectSlide(selectedIdx - 1)
  }
  const handleNext = () => {
    if (selectedIdx < carousel.slides.length - 1) onSelectSlide(selectedIdx + 1)
  }

  return (
    <div className="h-full flex flex-col bg-background-tertiary relative">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-text-primary truncate">
            {carousel.topic}
          </h2>
          <p className="text-sm text-text-secondary">
            {carousel.slides.length} slides · Editorial
            {carousel.createdAt && (
              <>
                {' '}
                ·{' '}
                <span className="text-text-muted">
                  Criado{' '}
                  {new Date(carousel.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={selectedIdx === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm text-text-secondary px-2 tabular-nums">
            {selectedIdx + 1} / {carousel.slides.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={selectedIdx === carousel.slides.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Slide visível em scale 0.5 */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <motion.div
          key={selectedIdx}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          {(() => {
            const slide = carousel.slides[selectedIdx]
            const Layout = layoutComponents[slide.layoutType]
            if (!Layout) return null
            return <Layout slide={slide} scale={0.5} />
          })()}
        </motion.div>
      </div>

      {/* Thumbnails */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {carousel.slides.map((slide, idx) => {
            const Layout = layoutComponents[slide.layoutType]
            if (!Layout) return null
            return (
              <button
                key={idx}
                onClick={() => onSelectSlide(idx)}
                className={`flex-shrink-0 transition-all rounded ${
                  idx === selectedIdx
                    ? 'ring-2 ring-purple-600 ring-offset-2 ring-offset-background-tertiary'
                    : 'opacity-50 hover:opacity-100'
                }`}
                style={{ width: 108, height: 135 }}
                aria-label={`Slide ${idx + 1}`}
              >
                <Layout slide={slide} scale={0.1} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Slides em fullsize hidden — usados pelo exporter pra capturar PNG/JPG */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -99999,
          top: -99999,
          width: 1080,
          height: 1350 * carousel.slides.length,
          pointerEvents: 'none',
        }}
      >
        {carousel.slides.map((slide, idx) => {
          const Layout = layoutComponents[slide.layoutType]
          if (!Layout) return null
          return (
            <div
              key={`fullsize-${idx}`}
              data-slide-fullsize={String(idx + 1)}
              style={{ width: 1080, height: 1350 }}
            >
              <Layout slide={slide} scale={1} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
