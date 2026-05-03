'use client'

import { useRef, useState } from 'react'
import { RefreshCw, Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ImageSlotProps {
  index: number
  imageUrl?: string
  prompt: string
  onPromptChange: (prompt: string) => void
  onImageChange: (url: string) => void
  onRemoveImage: () => void
}

/**
 * Slot por imagem do slide. Permite editar prompt + 3 ações:
 * - Regenerar (chama /api/editorial/generate-image com o prompt atual)
 * - Upload (file picker -> /api/editorial/upload-image)
 * - Colar URL (input externo)
 */
export function ImageSlot({
  index,
  imageUrl,
  prompt,
  onPromptChange,
  onImageChange,
  onRemoveImage,
}: ImageSlotProps) {
  const [busy, setBusy] = useState<'regen' | 'upload' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleRegenerate() {
    if (!prompt.trim()) {
      setError('Prompt vazio.')
      return
    }
    setBusy('regen')
    setError(null)
    try {
      const res = await fetch('/api/editorial/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio: '4:5' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'erro')
      onImageChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro')
    } finally {
      setBusy(null)
    }
  }

  async function handleUpload(file: File) {
    setBusy('upload')
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/editorial/upload-image', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'erro')
      onImageChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro')
    } finally {
      setBusy(null)
    }
  }

  function handleUrlSubmit() {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    if (!/^https?:\/\//.test(trimmed)) {
      setError('URL precisa começar com http:// ou https://')
      return
    }
    onImageChange(trimmed)
    setUrlDraft('')
    setShowUrlInput(false)
    setError(null)
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-background-secondary/40 p-3 space-y-3">
      <div className="flex items-start gap-3">
        {/* Miniatura */}
        <div className="relative w-20 h-24 rounded-md overflow-hidden bg-background-tertiary border border-border-subtle flex-shrink-0">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Imagem ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={onRemoveImage}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center backdrop-blur-sm"
                aria-label="Remover imagem"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-text-muted text-center px-1">
              sem imagem
            </div>
          )}
        </div>

        {/* Prompt + ações */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">
              Imagem {index + 1}
            </p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Prompt da imagem (ex: cinematic photo of...)"
            className="w-full min-h-[56px] p-2 rounded bg-background-secondary/80 border border-border-subtle text-text-primary text-xs resize-none focus:border-purple-600/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={busy !== null}
          className="border-border-medium text-xs"
        >
          {busy === 'regen' ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
          )}
          Gerar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy !== null}
          className="border-border-medium text-xs"
        >
          {busy === 'upload' ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1" />
          )}
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput((v) => !v)}
          className="border-border-medium text-xs"
        >
          <LinkIcon className="w-3.5 h-3.5 mr-1" />
          URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="text-xs h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUrlSubmit()
              }
            }}
          />
          <Button type="button" size="sm" onClick={handleUrlSubmit}>
            OK
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
