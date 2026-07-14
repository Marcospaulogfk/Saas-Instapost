"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import { applyFontPreset } from "@/lib/single-posts/font-presets"
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
  format: "post" | "story"
}

export function FreePostViewer({
  title,
  spec,
  fontPreset,
  format,
}: FreePostViewerProps) {
  const previewRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finalSpec = applyFontPreset(spec, fontPreset)

  async function handleExport() {
    if (!previewRef.current) return
    setExporting(true)
    setError(null)
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        canvasWidth: 1080,
        canvasHeight: format === "story" ? 1920 : 1350,
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

      <main className="p-6 flex flex-col items-center gap-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div
          ref={previewRef}
          className={`w-full rounded-xl overflow-hidden bg-black ${
            format === "story" ? "max-w-[320px]" : "max-w-[440px]"
          }`}
        >
          <FreePostRenderer spec={finalSpec} format={format} />
        </div>
        <p className="text-[11px] text-text-muted max-w-md text-center">
          Post salvo do editor livre. Pra reeditar o layout, crie uma nova
          variação em Criar conteúdo — as edições aqui ficam disponíveis em
          breve.
        </p>
      </main>
    </div>
  )
}
