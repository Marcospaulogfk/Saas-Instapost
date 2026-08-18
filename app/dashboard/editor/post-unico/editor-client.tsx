"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Save,
  Sparkles,
  Square,
  Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  addImageBlock,
  addShapeBlock,
  addTextBlock,
  TEXT_STYLES,
} from "@/lib/single-posts/add-block"
import { tokenCostForSinglePost } from "@/lib/tokens"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"
import type { PostBrand } from "@/lib/single-posts/types"

/**
 * Payload que os wizards gravam no sessionStorage antes de redirecionar.
 *
 * - `skeleton`: so o briefing — o editor gera texto e imagem.
 * - `approved`: o texto ja foi gerado e aprovado no passo 5 do /dashboard/criar.
 *   O editor NAO regenera a copy: manda o conteudo aprovado e so monta o design
 *   com a foto. O texto ja foi cobrado na etapa text_only, entao aqui so a
 *   imagem e debitada.
 */
interface PendingPayload {
  kind: "skeleton" | "approved" | "template"
  brand: PostBrand
  briefing?: string
  rawContent?: string
  autoRun?: boolean
  // --- modo approved ---
  skeletonId?: string
  approvedContent?: Record<string, unknown>
  caption?: string
  photoPrompt?: string | null
  photoEntity?: string | null
}

const STORAGE_KEY = "syncpost_pending_post_unico"

/** Post salvo carregado da biblioteca para reedicao (`?post=<id>`). */
export interface InitialPost {
  id: string
  brandId: string
  spec: FreePostSpec
  fontPreset: string
  caption: string
  briefing: string
  skeletonId: string | null
}

interface Props {
  brands: PostBrand[]
  balance: number
  initialPost?: InitialPost | null
}

export function EditorClient({ brands, balance, initialPost }: Props) {
  const router = useRouter()
  const cost = tokenCostForSinglePost()

  const [brand, setBrand] = useState<PostBrand | null>(
    (initialPost && brands.find((b) => b.id === initialPost.brandId)) ??
      brands[0] ??
      null,
  )
  const [briefing, setBriefing] = useState(initialPost?.briefing ?? "")
  const [caption, setCaption] = useState(initialPost?.caption ?? "")
  const [copied, setCopied] = useState(false)
  const [spec, setSpec] = useState<FreePostSpec | null>(initialPost?.spec ?? null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [skeletonId, setSkeletonId] = useState<string | null>(
    initialPost?.skeletonId ?? null,
  )
  const [usedIds, setUsedIds] = useState<string[]>([])
  const [fontPreset, setFontPreset] = useState(initialPost?.fontPreset ?? "editorial")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(initialPost?.id ?? null)
  const [saveOk, setSaveOk] = useState(false)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
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
        setCaption(typeof data.caption === "string" ? data.caption : "")
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

  /**
   * Conteudo ja aprovado no wizard → nao regenera a copy, so monta o design e
   * a foto. Espelha o modo `approved_content` da rota.
   */
  const buildApproved = useCallback(
    async (p: PendingPayload) => {
      if (!p.brand || !p.skeletonId || !p.approvedContent) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/post-unico/free-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: p.brand,
            skeleton_id: p.skeletonId,
            approved_content: p.approvedContent,
            photo_prompt: p.photoPrompt ?? null,
            image_entity: p.photoEntity ?? null,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "erro desconhecido")
          return
        }
        setSpec(data.spec)
        // A legenda aprovada no wizard vence a que volta da rota.
        setCaption(p.caption ?? (typeof data.caption === "string" ? data.caption : ""))
        setPhotoUrl(data.photo_url ?? null)
        setSkeletonId(data.skeleton_id ?? p.skeletonId)
        setSavedId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "erro na geração")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Recebe o payload do wizard e monta o post. Roda só na 1ª montagem.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    // Reedicao de post salvo: o estado ja veio do servidor, nada a fazer.
    if (initialPost) return
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
    if (!payload.autoRun) return
    // Texto ja aprovado no wizard → so monta o design (nao recobra o texto).
    if (payload.kind === "approved" && payload.approvedContent) {
      void buildApproved(payload)
      return
    }
    if (b && brief) void generate(b, brief, [])
  }, [brands, generate, buildApproved, initialPost])

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
      caption,
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

  /**
   * Imagem local vira camada. Fica como data URL enquanto edita; o save
   * re-hospeda no Storage antes de persistir (maybeUploadDataUrl).
   */
  function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // permite re-selecionar o mesmo arquivo
    if (!file || !spec) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande (max 5MB).")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null
      if (url) setSpec((cur) => (cur ? addImageBlock(cur, url) : cur))
    }
    reader.onerror = () => setError("Nao consegui ler a imagem.")
    reader.readAsDataURL(file)
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Não consegui copiar — selecione o texto e copie manualmente.")
    }
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

        {/* Adicionar ao canvas — o spec ja suportava esses blocos, faltava a UI. */}
        {spec && (
          <div className="space-y-2">
            <Label className="text-sm text-text-secondary">Adicionar ao canvas</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {TEXT_STYLES.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => setSpec(addTextBlock(spec, s.id))}
                >
                  <Type className="w-3 h-3 mr-1" />
                  {s.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-3 h-3 mr-1" />
                Imagem
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                onClick={() => setSpec(addShapeBlock(spec, "rounded"))}
              >
                <Square className="w-3 h-3 mr-1" />
                Forma
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddImage}
            />
            <p className="text-[10px] text-text-muted">
              O bloco nasce no centro. Arraste pra posicionar, clique pra editar.
            </p>
          </div>
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

        {/* Legenda do Instagram — vinha sendo gerada e descartada. */}
        {spec && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-text-secondary">Legenda</Label>
              <button
                type="button"
                onClick={copyCaption}
                disabled={!caption}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary disabled:opacity-40"
              >
                {copied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={8}
              placeholder="A legenda gerada aparece aqui."
              className="bg-background-secondary/60 border-border-subtle text-xs leading-relaxed"
            />
            <p className="text-[10px] text-text-muted">
              Vai junto com o post quando você salva. Editar não custa tokens.
            </p>
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
