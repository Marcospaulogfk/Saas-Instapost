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
    // Mesmo shell do editor de carrossel: TELA CHEIA por cima do dashboard.
    // A sidebar do editor substitui a de navegação — sem ficar com duas.
    <div className="fixed inset-0 z-50 bg-background flex overflow-hidden">
      {/* Coluna direita (toolbar + canvas). A sidebar fica ANTES (order-1). */}
      <div className="order-2 flex-1 min-w-0 flex flex-col">
        {/* Toolbar de topo — ações sempre visíveis */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-text-primary">Post único</span>
          <span className="text-[11px] text-text-muted">1080 × 1350px</span>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {spec && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => brand && briefing && generate(brand, briefing, usedIds)}
                disabled={loading || insufficient || !brand || !briefing}
                title={`Gera outra versão por ${cost} tokens`}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Outra versão ({cost})
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!spec || exporting}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Exportar PNG
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!canSave}>
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : saveOk ? (
                <Check className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              {saveOk ? "Salvo" : savedId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Área do canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-3"
        >
          {error && (
            <div className="w-full max-w-[440px] rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Escrevendo a copy e gerando a arte…</p>
            </div>
          ) : finalSpec ? (
            <div
              ref={previewRef}
              /* Largura EXPLÍCITA é obrigatória: o renderizador usa
                 container-type:inline-size + aspect-ratio, então sem largura do
                 pai ele colapsa pra 0×0 — o post some e, pior, o auto-detach
                 mede zero e embaralha as posições de todos os blocos. */
              className={`w-full max-w-[440px] ${
                exporting ? "[&_*]:!outline-none [&_*]:!cursor-default" : ""
              }`}
            >
              {canvas}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <Sparkles className="w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-secondary">Nada gerado ainda.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/criar">Criar um post</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar de edição — coluna cheia à ESQUERDA */}
      <aside className="order-1 w-[320px] flex-shrink-0 border-r border-white/10 bg-black p-4 space-y-4 h-full overflow-y-auto">
        <Link
          href="/dashboard/projetos"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary px-1 pb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Dashboard
        </Link>

        {insufficient && (
          <p className="text-[11px] text-danger px-1">
            Saldo insuficiente pra gerar de novo ({balance} de {cost}).{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              Fazer upgrade
            </Link>
          </p>
        )}

        {spec && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-text-secondary">Adicionar ao canvas</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {TEXT_STYLES.map((st) => (
                  <Button
                    key={st.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px]"
                    onClick={() => setSpec(addTextBlock(spec, st.id))}
                  >
                    <Type className="w-3 h-3 mr-1" />
                    {st.label}
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
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-text-secondary">Tipografia</Label>
              <Select value={fontPreset} onValueChange={setFontPreset}>
                <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-tertiary border-border-medium">
                  {FONT_PRESETS.map((fp) => (
                    <SelectItem key={fp.id} value={fp.id}>
                      {fp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              {panel}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-text-secondary">Legenda</Label>
                <button
                  type="button"
                  onClick={copyCaption}
                  disabled={!caption}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary disabled:opacity-40"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
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
                Vai junto com o post ao salvar. Editar não custa tokens.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
