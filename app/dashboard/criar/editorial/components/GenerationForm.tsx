'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles } from 'lucide-react'

export interface GenerationFormData {
  topic: string
  brandName: string
  handle: string
  tone: 'profissional' | 'casual' | 'direto'
  audience: string
}

interface GenerationFormProps {
  onGenerate: (data: GenerationFormData) => void
  disabled?: boolean
}

const TONE_OPTIONS = [
  { id: 'profissional', label: 'Profissional' },
  { id: 'casual', label: 'Casual' },
  { id: 'direto', label: 'Direto' },
] as const

export function GenerationForm({ onGenerate, disabled }: GenerationFormProps) {
  const [topic, setTopic] = useState('')
  const [brandName, setBrandName] = useState('SYNCPOST')
  const [handle, setHandle] = useState('@SYNCPOST_')
  const [tone, setTone] = useState<'profissional' | 'casual' | 'direto'>('direto')
  const [audience, setAudience] = useState('criadores de conteúdo')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (topic.trim().length < 10) {
      setError('Tema precisa ter pelo menos 10 caracteres.')
      return
    }
    setError(null)
    onGenerate({ topic: topic.trim(), brandName, handle, tone, audience })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
            Tema do carrossel
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: 5 erros que iniciantes cometem ao criar carrosséis no Instagram. Foco em design e copywriting."
            className="w-full min-h-[120px] p-4 rounded-lg bg-background-secondary/60 border border-border-subtle text-text-primary placeholder:text-text-muted focus:border-purple-600/50 focus:shadow-glow-sm focus:outline-none resize-none"
            maxLength={500}
            disabled={disabled}
          />
          <p className="text-xs text-text-muted mt-2">{topic.length}/500 caracteres</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
              Nome da marca
            </label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value.toUpperCase())}
              placeholder="SYNCPOST"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
              Handle
            </label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@SYNCPOST_"
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
            Tom de voz
          </label>
          <div className="flex gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTone(opt.id)}
                disabled={disabled}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  tone === opt.id
                    ? 'border-purple-600 bg-purple-600/10 text-purple-300'
                    : 'border-border-subtle bg-background-secondary/40 text-text-secondary hover:border-border-medium hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-tiny uppercase tracking-wider text-text-secondary mb-2 block">
            Público-alvo
          </label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ex: criadores de conteúdo, profissionais liberais, empresas..."
            disabled={disabled}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full group" disabled={disabled}>
          <Sparkles className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
          Gerar carrossel com IA
        </Button>
      </form>
    </Card>
  )
}
