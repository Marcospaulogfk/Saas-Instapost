"use client"

import { useEffect, useRef, useState } from "react"
import {
  Loader2,
  Wand2,
  Download,
  Code2,
  Clock,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import { DEMO_BRAND } from "@/lib/single-posts/demo"
import type { PostBrand } from "@/lib/single-posts/types"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

interface PendingPayload {
  brand: PostBrand
  briefing: string
  autoRun?: boolean
}

interface Metrics {
  ms: number
  costUsd: number
  inputTokens: number
  outputTokens: number
}

export default function TestePostUnicoFreePage() {
  const [brand, setBrand] = useState<PostBrand>(DEMO_BRAND)
  const [briefing, setBriefing] = useState("")
  const [spec, setSpec] = useState<FreePostSpec | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showSpec, setShowSpec] = useState(false)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const autoRunRef = useRef(false)

  async function runGeneration(payload: { brand: PostBrand; briefing: string }) {
    setError(null)
    setGenerating(true)
    setMetrics(null)
    try {
      const res = await fetch("/api/post-unico/free-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "erro desconhecido")
        return
      }
      setSpec(data.spec)
      if (data.metrics) {
        setMetrics({
          ms: data.metrics.ms,
          costUsd: data.metrics.costUsd,
          inputTokens: data.metrics.inputTokens,
          outputTokens: data.metrics.outputTokens,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de rede"
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  function handleManualRun() {
    if (briefing.trim().length < 10) {
      setError("Briefing precisa ter pelo menos 10 caracteres")
      return
    }
    void runGeneration({ brand, briefing: briefing.trim() })
  }

  async function handleExport() {
    if (!previewRef.current) return
    setExporting(true)
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        canvasWidth: 1080,
        canvasHeight: 1350,
        pixelRatio: 1,
      })
      const filename = `freestyle-${Date.now()}.png`
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro no export"
      setError(message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (autoRunRef.current) return
    if (typeof window === "undefined") return
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem("syncpost_pending_post_unico_free")
    } catch {
      return
    }
    if (!raw) return
    try {
      sessionStorage.removeItem("syncpost_pending_post_unico_free")
    } catch {}
    let parsed: PendingPayload | null = null
    try {
      parsed = JSON.parse(raw) as PendingPayload
    } catch {
      return
    }
    if (!parsed?.brand || !parsed?.briefing) return
    autoRunRef.current = true
    setBrand(parsed.brand)
    setBriefing(parsed.briefing)
    if (parsed.autoRun) {
      void runGeneration({ brand: parsed.brand, briefing: parsed.briefing })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Code2 className="w-4 h-4 text-lime" />
          <span className="text-sm font-semibold">
            Modo Dev — Layout Livre
          </span>
          <span className="text-xs text-text-muted whitespace-nowrap">
            · {brand.name}
          </span>
          {metrics && (
            <span className="text-xs text-text-muted flex items-center gap-2">
              <Clock className="w-3 h-3" /> {(metrics.ms / 1000).toFixed(1)}s
              <DollarSign className="w-3 h-3" /> {metrics.costUsd.toFixed(4)}
              <span>
                {metrics.inputTokens}↓ {metrics.outputTokens}↑
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSpec((v) => !v)}
          >
            {showSpec ? "Esconder JSON" : "Ver JSON"}
          </Button>
          <Button type="button" size="sm" onClick={handleExport} disabled={exporting || !spec}>
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            Exportar PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[calc(100vh-57px)]">
        <aside className="border-r border-border p-6 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <Label>Briefing</Label>
            <Textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              rows={5}
              placeholder="Descreva o que a marca quer comunicar..."
            />
            <Button
              type="button"
              onClick={handleManualRun}
              disabled={generating || briefing.trim().length < 10}
              className="w-full bg-lime text-zinc-950 hover:bg-lime/90"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  IA improvisando...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {spec ? "Gerar nova variação" : "Gerar layout"}
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive whitespace-pre-wrap">
              {error}
            </div>
          )}

          {spec?.rationale && (
            <div className="rounded-lg border border-lime/30 bg-lime/5 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-lime font-bold">
                Conceito da IA
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {spec.rationale}
              </p>
            </div>
          )}

          {showSpec && spec && (
            <div className="rounded-lg border border-border-subtle bg-background-secondary p-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2">
                FreePostSpec (debug)
              </p>
              <pre className="text-[10px] text-text-secondary overflow-auto max-h-96 font-mono leading-relaxed">
                {JSON.stringify(spec, null, 2)}
              </pre>
            </div>
          )}

          <div className="rounded-lg border border-border-subtle bg-background-secondary/40 p-3 text-[11px] text-text-muted">
            <p className="font-medium text-text-secondary mb-1">Sobre esse modo</p>
            <p>
              A IA recebe o briefing + os princípios visuais dos 20 templates e
              produz um spec JSON descrevendo blocos com posicionamento absoluto.
              Cada geração é única.
            </p>
            <p className="mt-2">
              Sem persistência por enquanto — só preview + export. Conforme
              evolui, a gente coleta os layouts que funcionam pra alimentar
              novos templates.
            </p>
          </div>
        </aside>

        <main className="p-6 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-md">
            {spec ? (
              <div ref={previewRef} className="bg-black rounded-xl overflow-hidden">
                <FreePostRenderer spec={spec} />
              </div>
            ) : (
              <div className="aspect-[4/5] w-full rounded-xl border-2 border-dashed border-border bg-background-secondary/40 flex items-center justify-center text-center p-8">
                <div className="space-y-3 text-text-muted">
                  <Wand2 className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-sm">
                    {generating
                      ? "IA improvisando layout..."
                      : "Descreva o briefing à esquerda e clique em Gerar"}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
              <span>1080 × 1350 · 4:5</span>
              {spec && (
                <span>
                  {spec.blocks.length} block{spec.blocks.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
