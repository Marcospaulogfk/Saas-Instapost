"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Copy, Download, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import { applyFontPreset } from "@/lib/single-posts/font-presets"
import { POST_FORMATS, type PostFormat } from "@/lib/single-posts/formats"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

// =====================================================================
// Viewer de post único salvo em MODO LIVRE (free-spec) — posts criados
// no editor /teste e salvos na biblioteca com template_id "free:*".
// Preview fiel + export PNG. (Edição completa continua no /teste; aqui
// é visualizar e baixar.)
// =====================================================================

interface FreePostViewerProps {
  title: string
  spec: FreePostSpec
  fontPreset: string
  format: PostFormat
  /** Legenda salva junto com o post (com hashtags). */
  caption?: string
  /** Id do post — habilita o botao de reabrir no editor. */
  postId?: string
}

export function FreePostViewer({
  title,
  spec,
  fontPreset,
  format,
  caption,
  postId,
}: FreePostViewerProps) {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const finalSpec = applyFontPreset(spec, fontPreset)

  async function copyCaption() {
    if (!caption) return
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Nao consegui copiar - selecione o texto e copie manualmente.")
    }
  }

  async function handleExport() {
    if (!previewRef.current) return
    setExporting(true)
    setError(null)
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        includeQueryParams: true,
        canvasWidth: 1080,
        canvasHeight: (POST_FORMATS[format] ?? POST_FORMATS.post).height,
        pixelRatio: 1,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${(title || "post").replace(/[^a-z0-9-]+/gi, "-")}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro no export")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href="/dashboard/projetos">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="text-xs">Biblioteca</span>
            </Link>
          </Button>
          <h1 className="font-semibold truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {postId && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/editor/post-unico?post=${postId}`}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Link>
            </Button>
          )}
          <Button
          type="button"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 mr-1.5" />
          )}
          Exportar PNG
          </Button>
        </div>
      </div>

      <main className="p-6 flex flex-col items-center gap-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div
          ref={previewRef}
          style={{ maxWidth: (POST_FORMATS[format] ?? POST_FORMATS.post).previewMaxWidth }}
          className="w-full rounded-xl overflow-hidden bg-black"
        >
          <FreePostRenderer spec={finalSpec} format={format} />
        </div>
        {caption && (
          <div className="w-full max-w-[440px] space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">Legenda</p>
              <button
                type="button"
                onClick={copyCaption}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-lg border border-border bg-background-secondary/40 p-3 text-xs leading-relaxed text-text-secondary">
              {caption}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
