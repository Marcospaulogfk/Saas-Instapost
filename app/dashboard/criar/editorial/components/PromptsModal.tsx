'use client'

import { useEffect } from 'react'
import { X, FileText } from 'lucide-react'
import type { EditorialCarousel } from '@/components/templates/editorial/editorial.types'

interface PromptsModalProps {
  carousel: EditorialCarousel
  onClose: () => void
}

/**
 * Modal de debug — mostra todos os imagePrompts do carrossel + URL gerada de
 * cada imagem. Útil pra entender por que a IA gerou certas imagens.
 */
export function PromptsModal({ carousel, onClose }: PromptsModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-background-secondary border border-border-medium rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-display font-semibold text-text-primary">
              Prompts de imagem
            </h2>
            <span className="text-xs text-text-muted ml-2">
              (debug — ver o que a IA pediu pro Fal)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {carousel.slides.map((slide, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border-subtle bg-background-tertiary/40 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-primary">
                  Slide {slide.pageNumber}{' '}
                  <span className="text-text-muted font-normal">
                    · {slide.layoutType}
                    {slide.variant ? ` (${slide.variant})` : ''}
                  </span>
                </p>
                <span className="text-xs text-text-muted">
                  {slide.imagePrompts?.length || 0} prompt(s) ·{' '}
                  {slide.images?.length || 0} imagem(ns)
                </span>
              </div>

              {!slide.imagePrompts || slide.imagePrompts.length === 0 ? (
                <p className="text-xs text-text-muted italic">
                  Sem imagens neste slide.
                </p>
              ) : (
                <div className="space-y-3">
                  {slide.imagePrompts.map((prompt, pidx) => (
                    <div key={pidx} className="space-y-2">
                      <div className="flex items-start gap-3">
                        {/* Miniatura se já gerou */}
                        {slide.images?.[pidx] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slide.images[pidx]}
                            alt={`Prompt ${pidx + 1}`}
                            className="w-16 h-20 object-cover rounded border border-border-subtle flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                            Prompt #{pidx + 1}
                          </p>
                          <p className="text-xs text-text-primary leading-relaxed font-mono bg-background/40 p-2 rounded border border-border-subtle/50 whitespace-pre-wrap break-words">
                            {prompt}
                          </p>
                          {slide.images?.[pidx] && (
                            <p className="text-[10px] text-text-muted mt-1 truncate">
                              <a
                                href={slide.images[pidx]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                              >
                                {slide.images[pidx]}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border-subtle bg-background-tertiary/20">
          <p className="text-xs text-text-muted">
            Esc fecha. Pra editar um prompt e regerar a imagem específica, use o painel
            lateral do editor (aba Visual).
          </p>
        </div>
      </div>
    </div>
  )
}
