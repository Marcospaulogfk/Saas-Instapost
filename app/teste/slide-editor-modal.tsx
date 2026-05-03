"use client"

import { useEffect, useRef, useState } from "react"
import {
  Loader2,
  RefreshCw,
  Upload,
  Link as LinkIcon,
  X,
  ImageOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { PreviewSlide } from "@/components/carousel/slide-preview"

export interface EditableSlide extends PreviewSlide {
  // herda tudo de PreviewSlide
}

interface SlideEditorModalProps {
  slide: EditableSlide
  totalSlides: number
  onSave: (updated: EditableSlide) => void
  onClose: () => void
}

/**
 * Modal de edição de slide (sandbox /teste — sem persistência).
 * Permite editar texto + trocar imagem (regenerar via prompt, upload, URL).
 */
export function SlideEditorModal({
  slide,
  totalSlides,
  onSave,
  onClose,
}: SlideEditorModalProps) {
  const [draft, setDraft] = useState<EditableSlide>(slide)
  const [imagePrompt, setImagePrompt] = useState("")
  const [imgError, setImgError] = useState<string | null>(null)
  const [busy, setBusy] = useState<"regen" | "upload" | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Esc fecha
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  function setImageUrl(url: string) {
    setDraft((d) => ({
      ...d,
      image: { ...d.image, url, error: null, source: d.image.source ?? "ai" },
    }))
  }

  async function handleRegenerate() {
    if (!imagePrompt.trim()) {
      setImgError("Cole um prompt antes de regenerar.")
      return
    }
    setBusy("regen")
    setImgError(null)
    try {
      const res = await fetch("/api/editorial/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, aspectRatio: "4:5" }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "erro")
      setImageUrl(data.url)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro")
    } finally {
      setBusy(null)
    }
  }

  async function handleUpload(file: File) {
    setBusy("upload")
    setImgError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/editorial/upload-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "erro")
      setImageUrl(data.url)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro")
    } finally {
      setBusy(null)
    }
  }

  function handleUrlSubmit() {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    if (!/^https?:\/\//.test(trimmed)) {
      setImgError("URL precisa começar com http:// ou https://")
      return
    }
    setImageUrl(trimmed)
    setUrlDraft("")
    setShowUrlInput(false)
    setImgError(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-tiny uppercase tracking-wider text-muted-foreground mb-1">
              Editar slide {slide.order_index + 1} / {totalSlides}
            </p>
            <h2 className="text-lg font-semibold line-clamp-1">{draft.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Texto */}
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Subtítulo</Label>
              <Input
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              />
            </div>

            <div>
              <Label>Body (descrição)</Label>
              <Textarea
                value={draft.body || ""}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={3}
                placeholder="Texto do corpo do slide. Suporta **bold inline** e \\n\\n pra parágrafos."
              />
            </div>

            <div>
              <Label>Palavras destacadas (vírgulas separam)</Label>
              <Input
                value={(draft.highlight_words || []).join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    highlight_words: e.target.value
                      .split(",")
                      .map((w) => w.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="GIGANTE, CARROSSEL"
              />
            </div>

            <div>
              <Label>Tag/categoria (cta_badge)</Label>
              <Input
                value={draft.cta_badge || ""}
                onChange={(e) => setDraft({ ...draft, cta_badge: e.target.value })}
                placeholder="Editorial, Tutorial, etc."
              />
            </div>
          </div>

          {/* Imagem */}
          <div className="space-y-3 pt-3 border-t border-border">
            <Label>Imagem</Label>

            <div className="flex items-start gap-4">
              <div
                className="w-28 h-36 rounded-md overflow-hidden border border-border bg-muted flex-shrink-0 flex items-center justify-center"
                style={{ aspectRatio: "4/5" }}
              >
                {draft.image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.image.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  placeholder="Prompt pra regenerar (em inglês, ex: cinematic photo of...)"
                  className="text-xs resize-none"
                />

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={busy !== null}
                  >
                    {busy === "regen" ? (
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
                  >
                    {busy === "upload" ? (
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
                        if (e.key === "Enter") {
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

                {imgError && (
                  <p className="text-xs text-destructive">{imgError}</p>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ""
              }}
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(draft)
              onClose()
            }}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
