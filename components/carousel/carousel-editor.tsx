"use client"

import { useEffect, useRef, useState } from "react"
import { Inter } from "next/font/google"
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Building2,
  Upload,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
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
import {
  SlidePreview,
  type PreviewSlide,
  type EditorialStyle,
} from "@/components/carousel/slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

const STYLE_OPTIONS: { value: EditorialStyle; label: string }[] = [
  { value: "auto", label: "Auto (alternado)" },
  { value: "wesley", label: "Wesley (dark/impacto)" },
  { value: "brandsdecoded", label: "Brandsdecoded (editorial)" },
  { value: "bolo", label: "Bolo (lista cream)" },
  { value: "mypostflow", label: "MyPostFlow" },
]

export interface CarouselEditorProps {
  initialSlides: PreviewSlide[]
  initialTitle: string
  caption?: string
  brandName: string
  handle?: string
  colors: string[]
  template?: "editorial" | "cinematic" | "hybrid"
  editorialStyle?: EditorialStyle
}

type ImageMode = "ai" | "unsplash" | "wikimedia"

export function CarouselEditor({
  initialSlides,
  initialTitle,
  caption,
  brandName,
  handle = "@brand",
  colors,
  template = "editorial",
  editorialStyle = "auto",
}: CarouselEditorProps) {
  const [slides, setSlides] = useState<PreviewSlide[]>(initialSlides)
  const [selected, setSelected] = useState(0)
  const [title, setTitle] = useState(initialTitle)
  const [style, setStyle] = useState<EditorialStyle>(editorialStyle)
  const [format, setFormat] = useState<"feed" | "stories">("feed")

  const [imageQuery, setImageQuery] = useState("")
  const [imgBusy, setImgBusy] = useState<ImageMode | "upload" | null>(null)
  const [imgError, setImgError] = useState<string | null>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState("")
  const [exporting, setExporting] = useState(false)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Autosave do rascunho em localStorage — não perde o trabalho ao recarregar.
  // (Persistência em nuvem/biblioteca depende de migration no Supabase — pendente de OK.)
  useEffect(() => {
    try {
      localStorage.setItem(
        "syncpost_carousel_draft",
        JSON.stringify({
          slides,
          title,
          caption,
          brandName,
          handle,
          colors,
          template,
          editorialStyle: style,
          ts: Date.now(),
        }),
      )
    } catch {
      // localStorage cheio/indisponível — ignora
    }
  }, [slides, title, caption, brandName, handle, colors, template, style])

  const slide = slides[selected]

  function patchSlide(patch: Partial<PreviewSlide>) {
    setSlides((prev) =>
      prev.map((s, i) => (i === selected ? { ...s, ...patch } : s)),
    )
  }

  function setImageUrl(url: string, source: PreviewSlide["image"]["source"]) {
    setSlides((prev) =>
      prev.map((s, i) =>
        i === selected
          ? { ...s, image: { ...s.image, url, source, error: null } }
          : s,
      ),
    )
  }

  async function generateImage(mode: ImageMode) {
    const q = imageQuery.trim()
    if (!q) {
      setImgError(
        mode === "wikimedia"
          ? "Digite o nome da empresa/pessoa"
          : "Descreva a imagem ou cole uma busca",
      )
      return
    }
    setImgBusy(mode)
    setImgError(null)
    try {
      const res = await fetch("/api/post-unico/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt: q, query: q }),
      })
      const data = await res.json()
      if (!res.ok || !data?.url) {
        setImgError(data?.error ?? "falha ao gerar imagem")
        return
      }
      setImageUrl(data.url, data.source ?? mode)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setImgBusy(null)
    }
  }

  async function handleUpload(file: File) {
    setImgBusy("upload")
    setImgError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/editorial/upload-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "erro no upload")
      setImageUrl(data.url, "ai")
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro no upload")
    } finally {
      setImgBusy(null)
    }
  }

  function handleUrlSubmit() {
    const u = urlDraft.trim()
    if (!/^https?:\/\//.test(u)) {
      setImgError("URL precisa começar com http:// ou https://")
      return
    }
    setImageUrl(u, "ai")
    setUrlDraft("")
    setShowUrl(false)
    setImgError(null)
  }

  async function handleExport() {
    if (!previewRef.current) return
    setExporting(true)
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        canvasWidth: 1080,
        canvasHeight: format === "stories" ? 1920 : 1350,
        pixelRatio: 1,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${(title || "carrossel").replace(/[^a-z0-9-]+/gi, "-")}-slide-${selected + 1}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro no export")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do carrossel"
            className="font-semibold h-9 max-w-xs"
          />
          <span className="text-xs text-text-muted whitespace-nowrap">
            · {brandName} · {slides.length} slides
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            Exportar slide
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* Preview + navegação */}
        <main className="p-6 flex flex-col items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 w-full max-w-[420px] justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelected((s) => Math.max(0, s - 1))}
              disabled={selected === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-text-secondary tabular-nums">
              Slide {selected + 1} / {slides.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelected((s) => Math.min(slides.length - 1, s + 1))}
              disabled={selected === slides.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div
            ref={previewRef}
            className={`w-full rounded-xl overflow-hidden bg-black ${
              format === "stories" ? "max-w-[300px]" : "max-w-[420px]"
            }`}
          >
            <SlidePreview
              slide={slide}
              totalSlides={slides.length}
              template={template}
              brandColors={colors}
              fontClass={inter.className}
              editorialStyle={style}
              handle={handle}
              format={format}
            />
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto w-full max-w-[420px] pb-2">
            {slides.map((s, i) => (
              <button
                key={s.order_index}
                type="button"
                onClick={() => setSelected(i)}
                className={`flex-shrink-0 w-12 rounded-md overflow-hidden border-2 transition-colors ${
                  i === selected
                    ? "border-brand-500"
                    : "border-border-subtle hover:border-border-medium"
                }`}
                style={{ aspectRatio: "4/5" }}
              >
                <div className="pointer-events-none w-full h-full origin-top-left">
                  {s.image.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-background-tertiary flex items-center justify-center text-[10px] text-text-muted">
                      {i + 1}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* Sidebar de edição do slide selecionado */}
        <aside className="border-l border-border bg-background-secondary p-5 space-y-5 lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
          {/* Estilo visual do carrossel (aplica a todos os slides) */}
          <div>
            <Label className="text-xs">Estilo / módulo do carrossel</Label>
            <Select
              value={style}
              onValueChange={(v) => setStyle(v as EditorialStyle)}
            >
              <SelectTrigger className="h-9 mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-text-muted mt-1">
              Troca capa, tipografia e composição dos slides.
            </p>
          </div>

          {/* Formato: Feed (4:5) ou Stories (9:16) */}
          <div>
            <Label className="text-xs">Formato</Label>
            <div className="grid grid-cols-2 gap-1 mt-1.5 p-1 rounded-lg bg-background-tertiary/40 border border-border-subtle">
              <button
                type="button"
                onClick={() => setFormat("feed")}
                className={`h-8 rounded-md text-xs font-medium transition-colors ${
                  format === "feed"
                    ? "bg-brand-600 text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Feed 4:5
              </button>
              <button
                type="button"
                onClick={() => setFormat("stories")}
                className={`h-8 rounded-md text-xs font-medium transition-colors ${
                  format === "stories"
                    ? "bg-brand-600 text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Stories 9:16
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Estica o mesmo conteúdo pro formato vertical de stories (1080×1920).
            </p>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Editar slide {selected + 1}
            </p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input
                  value={slide.title}
                  onChange={(e) => patchSlide({ title: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Subtítulo</Label>
                <Input
                  value={slide.subtitle}
                  onChange={(e) => patchSlide({ subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Corpo</Label>
                <Textarea
                  value={slide.body || ""}
                  onChange={(e) => patchSlide({ body: e.target.value })}
                  rows={3}
                  placeholder="Texto do slide. Suporta **bold** e \n\n."
                />
              </div>
              <div>
                <Label className="text-xs">Palavras destacadas (vírgula)</Label>
                <Input
                  value={(slide.highlight_words || []).join(", ")}
                  onChange={(e) =>
                    patchSlide({
                      highlight_words: e.target.value
                        .split(",")
                        .map((w) => w.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="GIGANTE, VIRAL"
                />
              </div>
              <div>
                <Label className="text-xs">Badge (tag)</Label>
                <Input
                  value={slide.cta_badge || ""}
                  onChange={(e) => patchSlide({ cta_badge: e.target.value })}
                  placeholder="ESTUDO 01, NOVO…"
                />
              </div>
            </div>
          </div>

          {/* Imagem */}
          <div className="pt-4 border-t border-border-subtle space-y-3">
            <Label className="text-xs">Imagem do slide</Label>
            <div className="flex items-start gap-3">
              <div
                className="w-20 rounded-md overflow-hidden border border-border bg-background-tertiary flex-shrink-0 flex items-center justify-center"
                style={{ aspectRatio: "4/5" }}
              >
                {slide.image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.image.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Textarea
                  value={imageQuery}
                  onChange={(e) => setImageQuery(e.target.value)}
                  rows={2}
                  placeholder="Prompt (IA), busca (Unsplash) ou nome da empresa/pessoa (Foto real)"
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => generateImage("ai")}
                disabled={imgBusy !== null}
              >
                {imgBusy === "ai" ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3 mr-1" />
                )}
                IA
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => generateImage("unsplash")}
                disabled={imgBusy !== null}
              >
                {imgBusy === "unsplash" ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <ImageIcon className="w-3 h-3 mr-1" />
                )}
                Unsplash
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => generateImage("wikimedia")}
                disabled={imgBusy !== null}
                title="Foto/logo real de empresa ou pessoa (Wikipedia)"
              >
                {imgBusy === "wikimedia" ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Building2 className="w-3 h-3 mr-1" />
                )}
                Foto real
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={imgBusy !== null}
              >
                {imgBusy === "upload" ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 mr-1" />
                )}
                Upload
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowUrl((v) => !v)}
              >
                <LinkIcon className="w-3 h-3 mr-1" />
                URL
              </Button>
            </div>

            {showUrl && (
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

            {imgError && <p className="text-xs text-destructive">{imgError}</p>}

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

          {caption && (
            <div className="pt-4 border-t border-border-subtle">
              <Label className="text-xs">Legenda do Instagram</Label>
              <p className="text-xs text-text-secondary whitespace-pre-wrap mt-1.5 leading-relaxed">
                {caption}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
