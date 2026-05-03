'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import type {
  EditorialCarousel,
  EditorialSlide,
} from '@/components/templates/editorial/editorial.types'
import { GenerationForm, type GenerationFormData } from './components/GenerationForm'
import { CarouselPreview } from './components/CarouselPreview'
import { EditorPanel } from './components/EditorPanel'
import { ExportMenu } from './components/ExportMenu'
import { loadCarouselAction } from '@/app/actions/editorial'

type Step = 'form' | 'loading-saved' | 'generating' | 'editing'

export default function CriarEditorialPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CriarEditorialInner />
    </Suspense>
  )
}

function CriarEditorialInner() {
  const searchParams = useSearchParams()
  const carouselId = searchParams.get('id')

  const [step, setStep] = useState<Step>(carouselId ? 'loading-saved' : 'form')
  const [carousel, setCarousel] = useState<EditorialCarousel | null>(null)
  const [progress, setProgress] = useState({ step: 'Iniciando…', current: 0 })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0)
  const [savedId, setSavedId] = useState<string | null>(carouselId)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Carrega carrossel existente quando vier ?id=
  useEffect(() => {
    if (!carouselId) return
    let cancelled = false
    ;(async () => {
      const result = await loadCarouselAction(carouselId)
      if (cancelled) return
      if (result.ok) {
        setCarousel(result.carousel)
        setStep('editing')
      } else {
        setErrorMsg(result.error)
        setStep('form')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [carouselId])

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  function handleGenerate(formData: GenerationFormData) {
    setStep('generating')
    setErrorMsg(null)
    setProgress({ step: 'Iniciando…', current: 0 })

    const params = new URLSearchParams({
      topic: formData.topic,
      brandName: formData.brandName,
      handle: formData.handle,
      tone: formData.tone,
      audience: formData.audience,
    })

    const es = new EventSource(`/api/editorial/generate-stream?${params.toString()}`)
    eventSourceRef.current = es

    es.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data)
        setProgress({ step: data.step, current: data.current })
      } catch {
        // ignore
      }
    })

    es.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data)
        setCarousel(data.carousel)
        setSelectedSlideIdx(0)
        setSavedId(null)
        setStep('editing')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'erro de parsing')
        setStep('form')
      } finally {
        es.close()
      }
    })

    es.addEventListener('error', (event) => {
      try {
        const raw = (event as MessageEvent).data
        if (raw) {
          const data = JSON.parse(raw)
          setErrorMsg(data.message || 'Erro na geração')
        } else {
          setErrorMsg('Conexão interrompida durante a geração.')
        }
      } catch {
        setErrorMsg('Erro inesperado na geração.')
      }
      setStep('form')
      es.close()
    })
  }

  function handleSlideUpdate(updates: Partial<EditorialSlide>) {
    if (!carousel) return
    const newSlides = carousel.slides.map((s, i) =>
      i === selectedSlideIdx ? { ...s, ...updates } : s,
    )
    setCarousel({ ...carousel, slides: newSlides })
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto py-12 px-6 max-w-3xl"
          >
            <h1 className="text-h1 font-display font-bold text-text-primary mb-2">
              Criar carrossel <span className="gradient-text">editorial</span>
            </h1>
            <p className="text-text-secondary mb-8">
              Em 3 minutos, do conceito ao carrossel pronto pra postar.
            </p>
            {errorMsg && (
              <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                {errorMsg}
              </div>
            )}
            <GenerationForm onGenerate={handleGenerate} />
          </motion.div>
        )}

        {step === 'loading-saved' && (
          <motion.div
            key="loading-saved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center"
          >
            <div className="flex items-center gap-3 text-text-secondary">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando carrossel salvo…
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center px-6"
          >
            <div className="text-center max-w-md w-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-purple shadow-glow-lg flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-h2 font-display font-semibold text-text-primary mb-3">
                Criando seu carrossel
              </h2>
              <p className="text-text-secondary mb-6">{progress.step}</p>
              <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-lime shadow-[0_0_8px_rgba(209,254,23,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.current}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-text-muted mt-2 tabular-nums">
                {progress.current}%
              </p>
            </div>
          </motion.div>
        )}

        {step === 'editing' && carousel && (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen"
          >
            <div className="flex-1 overflow-hidden min-w-0">
              <CarouselPreview
                carousel={carousel}
                selectedIdx={selectedSlideIdx}
                onSelectSlide={setSelectedSlideIdx}
              />
            </div>

            <div className="w-96 border-l border-border-subtle bg-background-secondary overflow-y-auto flex-shrink-0 flex flex-col">
              <div className="flex-1">
                <EditorPanel
                  slide={carousel.slides[selectedSlideIdx]}
                  onUpdate={handleSlideUpdate}
                />
              </div>
              <div className="p-4 border-t border-border-subtle">
                <ExportMenu
                  carousel={carousel}
                  existingId={savedId}
                  onSaved={(id) => setSavedId(id)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
