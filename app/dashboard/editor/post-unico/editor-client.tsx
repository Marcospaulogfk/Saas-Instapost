"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Download, Loader2, RefreshCw, Save, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSpecEditor } from "@/lib/single-posts/use-spec-editor"
import { applyFontPreset, FONT_PRESETS } from "@/lib/single-posts/font-presets"
import { exportSpecToPng, isRealBrandId, saveSinglePost } from "@/lib/single-posts/save"
import { tokenCostForSinglePost } from "@/lib/tokens"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"
import type { PostBrand } from "@/lib/single-posts/types"

/** Payload que o wizard grava no sessionStorage antes de redirecionar. */
interface PendingPayload {
  kind: "skeleton" | "template"
  brand: PostBrand
  briefing?: string
  rawContent?: string
  autoRun?: boolean
}

const STORAGE_KEY = "syncpost_pending_post_unico"

interface Props {
  brands: PostBrand[]
  balance: number
}

export function EditorClient({ brands, balance }: Props) {
  const router = useRouter()
  const cost = tokenCostForSinglePost()

  const [brand, setBrand] = useState<PostBrand | null>(brands[0] ?? null)
  const [briefing, setBriefing] = useState("")
  const [spec, setSpec] = useState<FreePostSpec | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [skeletonId, setSkeletonId] = useState<string | null>(null)
  const [usedIds, setUsedIds] = useState<string[]>([])
  const [fontPreset, setFontPreset] = useState("editorial")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const bootstrapped = useRef(false)

  const finalSpec = spec ? applyFontPreset(spec, fontPreset) : null

  const { canvas, panel, containerRef, setSelectedPath } = useSpecEditor(
    finalSpec,
    (next) => setSpec(next),
    { format: "post" },
  )

  const generate = useCallback(
    async (b: PostBrand, brief: string, excludeIds: string[]) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/post-unico/free-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: b,
            briefing: brief.trim(),
            skeleton_id: null,
            exclude_skeleton_ids: excludeIds.slice(-3),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "erro desconhecido")
          return
        }
        setSpec(data.spec)
        setPhotoUrl(data.photo_url ?? null)
        setSkeletonId(data.skeleton_id ?? null)
        if (data.skeleton_id) setUsedIds((prev) => [...prev, data.skeleton_id])
        // Novo post gerado = novo registro na biblioteca no próximo save.
        setSavedId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "erro na geração")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Recebe o briefing do wizard e gera de uma vez. Roda só na 1ª montagem.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    let payload: PendingPayload | null = null
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) payload = JSON.parse(raw) as PendingPayload
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // sem payload — o usuário chegou direto no editor
    }
    if (!payload) return
    const brief = (payload.briefing ?? payload.rawContent ?? "").trim()
    const b = brands.find((x) => x.id === payload.brand?.id) ?? payload.brand ?? brands[0]
    if (b) setBrand(b)
    if (brief) setBriefing(brief)
    if (b && brief && payload.autoRun) void generate(b, brief, [])
  }, [brands, generate])

  async function handleExport() {
    if (!previewRef.current) return
    setExporting(true)
    setSelectedPath(null)
    await new Promise((r) => setTimeout(r, 60)) // deixa a UI de edição sumir
    try {
      await exportSpecToPng(previewRef.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro no export")
    } finally {
      setExporting(false)
    }
  }

  async function handleSave() {
    if (!spec || !brand) return
    setSaving(true)
    setError(null)
    const res = await saveSinglePost({
      brandId: brand.id,
      spec,
      skeletonId,
      briefing,
      fontPreset,
      format: "post",
      photoUrl,
      savedId,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setSavedId(res.postId)
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2500)
    router.refresh()
  }

  const canSave = !!spec && !!brand && isRealBrandId(brand.id) && !saving
  const insufficient = balance < cost

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* ── Canvas ────────────────────────────────────────────────────── */}
      <main className="space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/dashboard/criar/post-unico" aria-label="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-h2 font-display font-bold text-text-primary truncate">
              Editor de post único
            </h1>
            <p className="text-xs text-text-muted">
              Arraste qualquer bloco pra mover. Editar é grátis e ilimitado.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div
          ref={containerRef}
          className="rounded-xl border border-border-subtle bg-background-secondary/40 p-6 flex justify-center"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Escrevendo a copy e gerando a arte…</p>
            </div>
          ) : finalSpec ? (
            <div
              ref={previewRef}
              className={exporting ? "[&_*]:!outline-none [&_*]:!cursor-default" : ""}
            >
              {canvas}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <Sparkles className="w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-secondary">
                Nada gerado ainda.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/criar/post-unico">Criar um post</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* ── Painel ────────────────────────────────────────────────────── */}
      <aside className="space-y-5">
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1"
            size="sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saveOk ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saveOk ? "Salvo" : savedId ? "Atualizar" : "Salvar"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!spec || exporting}
            variant="outline"
            size="sm"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>

        {spec && (
          <Button
            onClick={() => brand && briefing && generate(brand, briefing, usedIds)}
            disabled={loading || insufficient || !brand || !briefing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Gerar outra versão ({cost} tokens)
          </Button>
        )}

        {insufficient && (
          <p className="text-[11px] text-red-400">
            Saldo insuficiente pra gerar de novo ({balance} de {cost}).{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              Fazer upgrade
            </Link>
          </p>
        )}

        {spec && (
          <div className="space-y-2">
            <Label className="text-sm text-text-secondary">Tipografia</Label>
            <Select value={fontPreset} onValueChange={setFontPreset}>
              <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background-tertiary border-border-medium">
                {FONT_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {spec && (
          <div className="rounded-lg border border-border-subtle bg-background-secondary/40 p-3">
            {panel}
          </div>
        )}
      </aside>
    </div>
  )
}
