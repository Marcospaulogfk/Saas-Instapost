"use client"

import {
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Type,
  AlignLeft,
  MessageSquareText,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClaudeSlide } from "@/lib/generation/claude"

/**
 * Roteiro aprovável/editável do carrossel (gerado text-only).
 * Espelha o ApprovalDraft do post-único, mas com N slides.
 */
export interface CarouselDraft {
  projectTitle: string
  /** Slides do roteiro — só o texto. As imagens são geradas após aprovar. */
  slides: ClaudeSlide[]
  /** Legenda do Instagram (caption + hashtags). */
  caption: string
}

export function CarouselApprovalStep({
  draft,
  loading,
  error,
  onSlideChange,
  onCaptionChange,
  onRegenerate,
  onBack,
  onApprove,
  approving,
}: {
  draft: CarouselDraft | null
  loading: boolean
  error: string | null
  onSlideChange: (index: number, patch: Partial<ClaudeSlide>) => void
  onCaptionChange: (caption: string) => void
  onRegenerate: () => void
  onBack: () => void
  onApprove: () => void
  approving: boolean
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-semibold uppercase tracking-wider mb-3">
          <Check className="w-3 h-3" />
          Etapa de aprovação
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 tracking-tight">
          Revisar o roteiro
        </h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Confira o texto de cada slide e a legenda. Edite o que quiser. As
          imagens só são geradas depois que você aprovar.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border-subtle bg-background-tertiary/30 p-10 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
          <p className="text-sm text-text-secondary">
            Escrevendo o roteiro com IA...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Tentar de novo
          </Button>
        </div>
      )}

      {!loading && !error && draft && (
        <div className="space-y-4">
          {draft.projectTitle && (
            <p className="text-xs text-text-muted text-center -mt-2 mb-1">
              {draft.slides.length} slides · {draft.projectTitle}
            </p>
          )}

          {/* Slides */}
          {draft.slides.map((slide, i) => (
            <div
              key={slide.order_index ?? i}
              className="rounded-2xl border border-border-subtle bg-background-tertiary/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-3.5 h-3.5 text-brand-300" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Slide {i + 1}
                  {i === 0 && (
                    <span className="ml-1.5 text-[10px] font-medium text-text-muted normal-case">
                      (capa)
                    </span>
                  )}
                  {i === draft.slides.length - 1 && draft.slides.length > 1 && (
                    <span className="ml-1.5 text-[10px] font-medium text-text-muted normal-case">
                      (CTA)
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-3">
                {/* Título */}
                <div>
                  <p className="text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
                    <Type className="w-3 h-3" />
                    Título
                  </p>
                  <Input
                    value={slide.title}
                    onChange={(e) =>
                      onSlideChange(i, { title: e.target.value })
                    }
                    placeholder="Título do slide"
                    className="text-sm font-semibold"
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <p className="text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
                    <AlignLeft className="w-3 h-3" />
                    Subtítulo
                  </p>
                  <Input
                    value={slide.subtitle ?? ""}
                    onChange={(e) =>
                      onSlideChange(i, { subtitle: e.target.value })
                    }
                    placeholder="Complemento (opcional)"
                    className="text-sm"
                  />
                </div>

                {/* Corpo */}
                <div>
                  <p className="text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
                    <AlignLeft className="w-3 h-3" />
                    Corpo
                  </p>
                  <Textarea
                    value={slide.body ?? ""}
                    onChange={(e) => onSlideChange(i, { body: e.target.value })}
                    placeholder="Texto de apoio (opcional)"
                    rows={2}
                    className="text-sm leading-relaxed resize-y"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Legenda */}
          <div className="rounded-2xl border border-border-subtle bg-background-tertiary/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquareText className="w-3.5 h-3.5 text-brand-300" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Legenda do Instagram
              </p>
            </div>
            <p className="text-[11px] text-text-muted mb-2.5 ml-8">
              Texto que você cola na publicação (caption + hashtags)
            </p>
            <Textarea
              value={draft.caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Legenda pro Instagram"
              rows={6}
              className="text-sm leading-relaxed resize-y"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={approving}
              className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Gerar outra versão
            </button>
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" onClick={onBack} disabled={approving}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Voltar
            </Button>
            <Button
              onClick={onApprove}
              disabled={
                approving ||
                draft.slides.length === 0 ||
                draft.slides.every((s) => s.title.trim().length === 0)
              }
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 min-w-[180px]"
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Aprovar e criar arte
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
