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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"

/** Conteúdo aprovável/editável que volta da geração text-only. */
export interface ApprovalDraft {
  skeletonId: string
  /** Título que vai NA imagem. */
  title: string
  /** Corpo / copy principal do post (vai na imagem). */
  body: string
  /** Legenda (caption) que a pessoa cola no Instagram. */
  caption: string
  /** Demais slots preservados (kicker, cta, stat, etc) — não editados aqui. */
  rawContent: SkeletonContent
  /** Prompt de foto preservado pra geração da arte. */
  photoPrompt: string | null
  /** Entidade real (lugar/pessoa/produto) — se houver, vira foto real (Wikipedia). */
  photoEntity?: string | null
}

export function ApprovalStep({
  draft,
  loading,
  error,
  onChange,
  onRegenerate,
  onBack,
  onApprove,
  approving,
}: {
  draft: ApprovalDraft | null
  loading: boolean
  error: string | null
  onChange: (patch: Partial<ApprovalDraft>) => void
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
          Revisar e aprovar
        </h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Confira como a IA entendeu o post. Edite o que quiser. A arte só é
          gerada depois que você aprovar.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border-subtle bg-background-tertiary/30 p-10 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
          <p className="text-sm text-text-secondary">
            Escrevendo o conteúdo com IA...
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
          {/* Título */}
          <Field
            icon={Type}
            label="Título do post"
            hint="Texto principal que aparece na imagem"
          >
            <Input
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Título que vai na arte"
              className="text-base font-semibold"
            />
          </Field>

          {/* Corpo */}
          <Field
            icon={AlignLeft}
            label="Corpo do conteúdo"
            hint="Texto de apoio que entra na arte do post"
          >
            <Textarea
              value={draft.body}
              onChange={(e) => onChange({ body: e.target.value })}
              placeholder="Corpo do post"
              rows={3}
              className="text-sm leading-relaxed resize-y"
            />
          </Field>

          {/* Legenda */}
          <Field
            icon={MessageSquareText}
            label="Legenda do Instagram"
            hint="Texto que você cola na publicação (caption + hashtags)"
          >
            <Textarea
              value={draft.caption}
              onChange={(e) => onChange({ caption: e.target.value })}
              placeholder="Legenda pro Instagram"
              rows={6}
              className="text-sm leading-relaxed resize-y"
            />
          </Field>

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
              disabled={approving || draft.title.trim().length === 0}
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

function Field({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Type
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background-tertiary/30 p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-brand-300" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
          {label}
        </p>
      </div>
      <p className="text-[11px] text-text-muted mb-2.5 ml-8">{hint}</p>
      {children}
    </div>
  )
}
