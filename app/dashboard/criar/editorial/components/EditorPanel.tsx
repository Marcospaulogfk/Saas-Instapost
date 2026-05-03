'use client'

import { useState } from 'react'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Type, Image as ImageIcon, Palette, Plus, X } from 'lucide-react'
import { ImageSlot } from './ImageSlot'

interface EditorPanelProps {
  slide: EditorialSlide
  onUpdate: (updates: Partial<EditorialSlide>) => void
  /** Mantido pra compat (não usado — agora cada imagem regenera individualmente). */
  onRegenerate?: () => Promise<void>
}

const TABS = [
  { id: 'text' as const, label: 'Texto', icon: Type },
  { id: 'visual' as const, label: 'Visual', icon: ImageIcon },
  { id: 'colors' as const, label: 'Cores', icon: Palette },
]

const VARIANT_OPTIONS: Record<string, string[]> = {
  demo: ['auto', 'single', 'comparison', 'process'],
  novidade: ['auto', 'text-only', 'single-large', 'pair', 'grid-three'],
  prova: ['numeric', 'single-print', 'multiple-prints', 'logo-cloud'],
  'texto-foto': ['text-only', 'image-bottom', 'image-middle', 'image-bg'],
  cta: ['auto', 'text-only', 'product-mockup', 'human-photo', 'composition'],
}

export function EditorPanel({ slide, onUpdate }: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'visual' | 'colors'>('text')
  const isFlexible = !!VARIANT_OPTIONS[slide.layoutType]

  function updateImageAt(idx: number, url: string) {
    const newImages = [...(slide.images || [])]
    newImages[idx] = url
    onUpdate({ images: newImages })
  }

  function updatePromptAt(idx: number, prompt: string) {
    const newPrompts = [...(slide.imagePrompts || [])]
    newPrompts[idx] = prompt
    onUpdate({ imagePrompts: newPrompts })
  }

  function removeImageAt(idx: number) {
    const newImages = [...(slide.images || [])]
    newImages.splice(idx, 1)
    onUpdate({ images: newImages })
  }

  function addImageSlot() {
    const newPrompts = [...(slide.imagePrompts || []), '']
    onUpdate({ imagePrompts: newPrompts })
  }

  // Quantos slots: max(images.length, imagePrompts.length, default 1 quando layout aceita imagem)
  const layoutAcceptsImages = ![
    'problema',
    'serif',
  ].includes(slide.layoutType)
  const slotCount = Math.max(
    slide.images?.length || 0,
    slide.imagePrompts?.length || 0,
    layoutAcceptsImages ? 1 : 0,
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <p className="text-tiny uppercase tracking-wider text-text-secondary mb-1">
          Editando slide {slide.pageNumber}
        </p>
        <p className="text-sm font-medium text-text-primary">
          Layout {slide.layoutType}
          {slide.variant && (
            <span className="text-text-secondary"> · {slide.variant}</span>
          )}
        </p>
      </div>

      <div className="flex border-b border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-purple-300 border-b-2 border-purple-600'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'text' && (
          <div className="space-y-4">
            <FieldLabel>Tag</FieldLabel>
            <Input
              value={slide.tag || ''}
              onChange={(e) => onUpdate({ tag: e.target.value })}
              placeholder="O PROBLEMA"
            />

            <div>
              <FieldLabel>Título (uma linha por linha)</FieldLabel>
              {slide.title.map((line, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={line}
                    onChange={(e) => {
                      const newTitle = [...slide.title]
                      newTitle[idx] = e.target.value
                      onUpdate({ title: newTitle })
                    }}
                    placeholder={`Linha ${idx + 1}`}
                  />
                  {slide.title.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onUpdate({ title: slide.title.filter((_, i) => i !== idx) })
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ title: [...slide.title, ''] })}
                className="w-full mt-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar linha
              </Button>
            </div>

            <div>
              <FieldLabel>Palavras destacadas (separadas por vírgula)</FieldLabel>
              <Input
                value={slide.highlightWords.join(', ')}
                onChange={(e) =>
                  onUpdate({
                    highlightWords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="MATAM, CARROSSEL"
              />
            </div>

            <div>
              <FieldLabel>Body text</FieldLabel>
              <textarea
                value={slide.body || ''}
                onChange={(e) => onUpdate({ body: e.target.value })}
                className="w-full min-h-[100px] p-3 rounded-lg bg-background-secondary/60 border border-border-subtle text-text-primary text-sm resize-none focus:border-purple-600/50 focus:outline-none"
                placeholder="Texto secundário do slide"
              />
            </div>

            {(slide.layoutType === 'capa' || slide.subtitle !== undefined) && (
              <div>
                <FieldLabel>Subtítulo</FieldLabel>
                <Input
                  value={slide.subtitle || ''}
                  onChange={(e) => onUpdate({ subtitle: e.target.value })}
                  placeholder="→ E como evitar todos eles"
                />
              </div>
            )}

            <div>
              <FieldLabel>Callout (caixa preta)</FieldLabel>
              <Input
                value={slide.callout || ''}
                onChange={(e) => onUpdate({ callout: e.target.value })}
                placeholder="Esse foi feito no SyncPost."
              />
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="space-y-4">
            <div>
              <FieldLabel>Posição do título</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {(['top', 'middle', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => onUpdate({ titlePosition: pos })}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      (slide.titlePosition || 'middle') === pos
                        ? 'border-purple-600 bg-purple-600/10 text-purple-300'
                        : 'border-border-subtle bg-background-secondary/40 text-text-secondary hover:border-border-medium hover:text-text-primary'
                    }`}
                  >
                    {pos === 'top' ? 'Topo' : pos === 'middle' ? 'Meio' : 'Base'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                Varia entre slides pra dar dinamismo (não use a mesma 3+ vezes).
              </p>
            </div>

            {isFlexible && (
              <div>
                <FieldLabel>Variante do layout</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {VARIANT_OPTIONS[slide.layoutType].map((variant) => (
                    <button
                      key={variant}
                      onClick={() => onUpdate({ variant })}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        slide.variant === variant
                          ? 'border-purple-600 bg-purple-600/10 text-purple-300'
                          : 'border-border-subtle bg-background-secondary/40 text-text-secondary hover:border-border-medium hover:text-text-primary'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {layoutAcceptsImages && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Imagens</FieldLabel>
                  <button
                    type="button"
                    onClick={addImageSlot}
                    className="text-[11px] text-purple-300 hover:text-purple-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: slotCount }).map((_, idx) => (
                    <ImageSlot
                      key={idx}
                      index={idx}
                      imageUrl={slide.images?.[idx]}
                      prompt={slide.imagePrompts?.[idx] || ''}
                      onPromptChange={(p) => updatePromptAt(idx, p)}
                      onImageChange={(url) => updateImageAt(idx, url)}
                      onRemoveImage={() => removeImageAt(idx)}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-text-muted mt-3">
                  Cada imagem pode ser regenerada pela IA, enviada do seu computador
                  ou colada via URL.
                </p>
              </div>
            )}

            {!layoutAcceptsImages && !isFlexible && (
              <p className="text-xs text-text-muted">
                Esse layout não usa imagens.
              </p>
            )}
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div>
              <FieldLabel>Cor de marca (highlight)</FieldLabel>
              <input
                type="color"
                value={slide.brandInfo.brandColor || '#7C3AED'}
                onChange={(e) =>
                  onUpdate({
                    brandInfo: { ...slide.brandInfo, brandColor: e.target.value },
                  })
                }
                className="w-full h-12 rounded cursor-pointer bg-transparent border border-border-medium"
              />
              <Input
                value={slide.brandInfo.brandColor || '#7C3AED'}
                onChange={(e) =>
                  onUpdate({
                    brandInfo: { ...slide.brandInfo, brandColor: e.target.value },
                  })
                }
                className="mt-2"
              />
            </div>

            <div>
              <FieldLabel>Background</FieldLabel>
              <select
                value={slide.background || 'dark'}
                onChange={(e) =>
                  onUpdate({
                    background: e.target.value as EditorialSlide['background'],
                  })
                }
                className="w-full p-3 rounded-lg bg-background-secondary/60 border border-border-subtle text-text-primary text-sm focus:border-purple-600/50 focus:outline-none"
              >
                <option value="dark">Preto</option>
                <option value="cream">Bege claro</option>
                <option value="white">Branco</option>
                <option value="photo">Foto fullscreen</option>
              </select>
              <p className="text-[11px] text-text-muted mt-2">
                Paleta SyncPost: apenas preto e branco. Distribua entre os slides.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
      {children}
    </label>
  )
}
