"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Clock,
  DollarSign,
  RefreshCw,
  Save,
  Download,
  Image as ImageIcon,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PostPreview } from "./post-preview"
import { POST_TEMPLATES, getTemplate } from "@/lib/single-posts/catalog"
import { DEMO_CONTENT } from "@/lib/single-posts/demo"
import type { PostBrand, PostContent } from "@/lib/single-posts/types"
import { createSinglePost, updateSinglePost } from "@/app/actions/single-posts"

interface EditorProps {
  initialBrand: PostBrand
  initialTemplateId: string
  initialContent: PostContent
  initialTitle?: string
  initialRawBrief?: string
  postId?: string | null
  hydrateFromSession?: boolean
}

interface PendingPayload {
  brand: PostBrand
  templateId: string
  rawContent: string
  autoRun?: boolean
}

interface GenerationMetrics {
  ms: number
  costUsd: number
  inputTokens: number
  outputTokens: number
}

type ImageSlot = "image_url" | "image_2_url" | "image_3_url" | "product_image_url"

const IMAGE_SLOT_LABELS: Record<ImageSlot, string> = {
  image_url: "Imagem principal",
  image_2_url: "Imagem 2",
  image_3_url: "Imagem 3",
  product_image_url: "Produto (PNG)",
}

const ARRAY_FIELDS = new Set([
  "title_lines",
  "highlight_words",
  "pill_lines",
  "checklist",
])
const LONG_FIELDS = new Set(["body"])
const HIDDEN_FIELDS = new Set([
  "image_url",
  "image_2_url",
  "image_3_url",
  "product_image_url",
  "image_prompt",
])

export function PostUnicoEditor({
  initialBrand,
  initialTemplateId,
  initialContent,
  initialTitle = "",
  initialRawBrief = "",
  postId: initialPostId = null,
  hydrateFromSession = false,
}: EditorProps) {
  const router = useRouter()
  const [brand, setBrand] = useState<PostBrand>(initialBrand)
  const [templateId, setTemplateId] = useState<string>(initialTemplateId)
  const [content, setContent] = useState<PostContent>(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [rawBrief, setRawBrief] = useState(initialRawBrief)
  const [postId, setPostId] = useState<string | null>(initialPostId)

  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null)

  const [imageLoadingSlot, setImageLoadingSlot] = useState<ImageSlot | null>(null)
  const [imagePromptDraft, setImagePromptDraft] = useState("")

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const autoRunRef = useRef(false)

  function setField<K extends keyof PostContent>(key: K, value: PostContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  function loadDemoFor(id: string) {
    setTemplateId(id)
    setContent(DEMO_CONTENT[id] ?? {})
  }

  async function runGeneration(payload: {
    brand: PostBrand
    templateId: string
    rawContent: string
  }) {
    setGenerateError(null)
    setGenerating(true)
    setMetrics(null)
    try {
      const res = await fetch("/api/post-unico/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenerateError(data.error ?? "erro desconhecido")
        return
      }
      // Se foi auto-picked, atualiza o templateId pro escolhido
      const finalTemplateId = data.template_id ?? payload.templateId
      if (finalTemplateId !== templateId) {
        setTemplateId(finalTemplateId)
      }
      setContent((prev) => ({
        ...DEMO_CONTENT[finalTemplateId],
        ...data.content,
        // preservar imagens existentes
        image_url: prev.image_url ?? data.content.image_url ?? null,
        image_2_url: prev.image_2_url ?? data.content.image_2_url ?? null,
        image_3_url: prev.image_3_url ?? data.content.image_3_url ?? null,
        product_image_url: prev.product_image_url ?? data.content.product_image_url ?? null,
      }))
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
      setGenerateError(message)
    } finally {
      setGenerating(false)
    }
  }

  function handleManualRun() {
    if (!rawBrief.trim() || rawBrief.trim().length < 10) {
      setGenerateError("Briefing precisa ter pelo menos 10 caracteres")
      return
    }
    void runGeneration({ brand, templateId, rawContent: rawBrief.trim() })
  }

  async function generateImageForSlot(slot: ImageSlot, mode: "ai" | "unsplash") {
    const promptOrQuery = imagePromptDraft.trim()
    if (mode === "ai" && !promptOrQuery) {
      setGenerateError("Descreva a imagem desejada antes de gerar")
      return
    }
    setImageLoadingSlot(slot)
    setGenerateError(null)
    try {
      const res = await fetch("/api/post-unico/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt: promptOrQuery,
          query: promptOrQuery,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setGenerateError(data.error ?? "falha ao gerar imagem")
        return
      }
      setField(slot, data.url)
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de rede"
      setGenerateError(message)
    } finally {
      setImageLoadingSlot(null)
    }
  }

  async function handleSave() {
    setSaveStatus(null)
    setSaving(true)
    try {
      if (!brand.id || brand.id.startsWith("demo-") || brand.id === "demo") {
        setSaveStatus(
          "Esse é um sandbox de demo. Crie pelo /dashboard/criar/post-unico pra salvar.",
        )
        return
      }
      const computedTitle =
        title.trim() ||
        content.title ||
        content.title_lines?.[0] ||
        rawBrief.slice(0, 60) ||
        "Post sem título"

      if (postId) {
        const result = await updateSinglePost(postId, {
          title: computedTitle,
          raw_brief: rawBrief || null,
          content,
        })
        if (!result.ok) {
          setSaveStatus(`Erro: ${result.error}`)
          return
        }
        setSaveStatus("Atualizado")
      } else {
        const result = await createSinglePost({
          brand_id: brand.id,
          template_id: templateId,
          title: computedTitle,
          raw_brief: rawBrief || null,
          content,
        })
        if (!result.ok) {
          setSaveStatus(`Erro: ${result.error}`)
          return
        }
        setPostId(result.postId)
        setSaveStatus("Salvo")
        router.replace(`/dashboard/posts-unicos/${result.postId}`)
      }
    } finally {
      setSaving(false)
    }
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
      const filename = `${(title || templateId).replace(/[^a-z0-9-]+/gi, "-")}.png`
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro no export"
      setGenerateError(message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (!hydrateFromSession) return
    if (autoRunRef.current) return
    if (typeof window === "undefined") return
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem("syncpost_pending_post_unico")
    } catch {
      return
    }
    if (!raw) return
    try {
      sessionStorage.removeItem("syncpost_pending_post_unico")
    } catch {}
    let parsed: PendingPayload | null = null
    try {
      parsed = JSON.parse(raw) as PendingPayload
    } catch {
      return
    }
    if (!parsed?.brand || !parsed?.templateId) return
    autoRunRef.current = true

    // se templateId for "auto", usa o primeiro como placeholder até a API resolver
    const initialTpl =
      parsed.templateId === "auto"
        ? POST_TEMPLATES[0].id
        : parsed.templateId

    setBrand(parsed.brand)
    setTemplateId(initialTpl)
    setRawBrief(parsed.rawContent ?? "")
    setContent(DEMO_CONTENT[initialTpl] ?? {})

    if (parsed.autoRun && parsed.rawContent) {
      void runGeneration({
        brand: parsed.brand,
        templateId: parsed.templateId, // mantém "auto" se foi assim
        rawContent: parsed.rawContent.trim(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const template = getTemplate(templateId)
  const requiredFields = template?.required_fields ?? []
  const optionalFields = template?.optional_fields ?? []
  const allTextFields = Array.from(
    new Set([...requiredFields, ...optionalFields].filter((f) => !HIDDEN_FIELDS.has(f))),
  )
  const imageSlots: ImageSlot[] = (template?.required_fields ?? [])
    .concat(template?.optional_fields ?? [])
    .filter((f): f is ImageSlot =>
      ["image_url", "image_2_url", "image_3_url", "product_image_url"].includes(f),
    )

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do post"
            className="font-semibold h-9 max-w-xs"
          />
          <span className="text-xs text-text-muted whitespace-nowrap">
            · {brand.name}
          </span>
          {metrics && (
            <span className="text-xs text-text-muted flex items-center gap-2">
              <Clock className="w-3 h-3" /> {(metrics.ms / 1000).toFixed(1)}s
              <DollarSign className="w-3 h-3" /> {metrics.costUsd.toFixed(4)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && <span className="text-xs text-text-muted">{saveStatus}</span>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {postId ? "Atualizar" : "Salvar"}
          </Button>
          <Button type="button" size="sm" onClick={handleExport} disabled={exporting}>
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
            <Label>Template</Label>
            <Select value={templateId} onValueChange={loadDemoFor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {template && (
              <p className="text-[11px] text-text-muted">{template.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Briefing pra IA</Label>
            <Textarea
              value={rawBrief}
              onChange={(e) => setRawBrief(e.target.value)}
              rows={4}
              placeholder="Descreva o post — a IA estrutura nos campos abaixo"
            />
            <Button
              type="button"
              onClick={handleManualRun}
              disabled={generating || rawBrief.trim().length < 10}
              className="w-full"
              variant="outline"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerar com IA
                </>
              )}
            </Button>
          </div>

          {generateError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive whitespace-pre-wrap">
              {generateError}
            </div>
          )}

          {imageSlots.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" />
                Imagens
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Prompt (IA) ou query (Unsplash)</Label>
                <Textarea
                  value={imagePromptDraft}
                  onChange={(e) => setImagePromptDraft(e.target.value)}
                  rows={2}
                  placeholder="Ex: professional fitness portrait, natural light"
                  className="text-sm"
                />
              </div>
              {imageSlots.map((slot) => (
                <div key={slot} className="space-y-1.5">
                  <Label className="text-xs">{IMAGE_SLOT_LABELS[slot]}</Label>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => generateImageForSlot(slot, "ai")}
                      disabled={imageLoadingSlot === slot}
                    >
                      {imageLoadingSlot === slot ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3 mr-1" />
                      )}
                      IA
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => generateImageForSlot(slot, "unsplash")}
                      disabled={imageLoadingSlot === slot}
                    >
                      {imageLoadingSlot === slot ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3 h-3 mr-1" />
                      )}
                      Unsplash
                    </Button>
                  </div>
                  <Input
                    value={(content[slot] as string) ?? ""}
                    onChange={(e) => setField(slot, e.target.value || null)}
                    placeholder="ou cole uma URL"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-3 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Campos do template
            </p>
            {allTextFields.map((field) => {
              const required = requiredFields.includes(field)
              return (
                <FieldEditor
                  key={field}
                  field={field}
                  required={required}
                  value={content[field]}
                  onChange={(v) => setField(field, v as never)}
                />
              )
            })}
          </div>
        </aside>

        <main className="p-6 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-md">
            <div ref={previewRef} className="bg-black rounded-xl overflow-hidden">
              <PostPreview
                templateId={templateId}
                brand={brand}
                content={content}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
              <span>{template?.label}</span>
              <span>1080 × 1350 · 4:5</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

interface FieldEditorProps {
  field: string
  required: boolean
  value: unknown
  onChange: (v: unknown) => void
}

function FieldEditor({ field, required, value, onChange }: FieldEditorProps) {
  const label = field.replace(/_/g, " ")
  if (ARRAY_FIELDS.has(field)) {
    const arr = Array.isArray(value) ? (value as string[]) : []
    return (
      <div className="space-y-1.5">
        <Label className="text-xs capitalize">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          value={arr.join(" | ")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="separa com |"
          className="text-sm"
        />
      </div>
    )
  }
  if (LONG_FIELDS.has(field)) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs capitalize">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs capitalize">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
    </div>
  )
}
