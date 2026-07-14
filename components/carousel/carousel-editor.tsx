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
  Save,
  Check,
  Undo2,
  Redo2,
  ArrowLeft,
} from "lucide-react"
import { saveCarouselV2 } from "@/app/actions/carousel"
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
import { PublishToInstagram } from "@/components/instagram/publish-to-instagram"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

/** Nome de arquivo a partir do título do slide (NN- pra manter ordem no zip). */
function slideFileName(s: PreviewSlide, i: number): string {
  const idx = String(i + 1).padStart(2, "0")
  const slug = (s.title || "")
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
  return slug ? `${idx}-${slug}` : `slide-${idx}`
}

const STYLE_OPTIONS: { value: EditorialStyle; label: string }[] = [
  { value: "auto", label: "Auto (alternado)" },
  { value: "wesley", label: "Wesley (dark/impacto)" },
  { value: "brandsdecoded", label: "Revista (editorial)" },
  { value: "bolo", label: "Bolo (lista cream)" },
  { value: "mypostflow", label: "MyPostFlow" },
  { value: "gradient", label: "Gradiente (dark/vibrante)" },
  { value: "minimal", label: "Minimal (branco/clean)" },
  { value: "seamless", label: "Seamless (panorâmico)" },
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
  /** Formato inicial do frame. Default "feed". */
  initialFormat?: "feed" | "stories"
  /** ID do carrossel salvo (quando reaberto da biblioteca) — habilita update in-place. */
  initialCarouselId?: string
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
  initialFormat = "feed",
  initialCarouselId,
}: CarouselEditorProps) {
  const [slides, setSlides] = useState<PreviewSlide[]>(initialSlides)
  const [selected, setSelected] = useState(0)
  const [title, setTitle] = useState(initialTitle)
  const [style, setStyle] = useState<EditorialStyle>(editorialStyle)
  const [format, setFormat] = useState<"feed" | "stories">(initialFormat)
  // Handle editável — o @ que aparece nos slides. Vem do cadastro da marca
  // (instagram_handle) via props, mas o usuário pode corrigir aqui.
  const [handleValue, setHandleValue] = useState(handle)

  // Salvar na biblioteca (Supabase). savedId liga o próximo save a um update.
  const [savedId, setSavedId] = useState<string | undefined>(initialCarouselId)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  // Auto-salva na biblioteca assim que um carrossel NOVO é gerado (sem id
  // prévio). Antes só salvava no clique manual, então o carrossel gerado não
  // aparecia na Biblioteca.
  const autoSavedRef = useRef(false)
  useEffect(() => {
    if (autoSavedRef.current || initialCarouselId || !initialSlides.length) return
    autoSavedRef.current = true
    void handleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [imageQuery, setImageQuery] = useState("")
  const [imgBusy, setImgBusy] = useState<ImageMode | "upload" | null>(null)
  const [imgError, setImgError] = useState<string | null>(null)
  const [showUrl, setShowUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState("")
  const [exporting, setExporting] = useState(false)
  const [zipBusy, setZipBusy] = useState(false)

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
          handle: handleValue,
          colors,
          template,
          editorialStyle: style,
          ts: Date.now(),
        }),
      )
    } catch {
      // localStorage cheio/indisponível — ignora
    }
  }, [slides, title, caption, brandName, handleValue, colors, template, style])

  const slide = slides[selected]

  // ── HISTÓRICO DE EDIÇÃO (undo/redo) ────────────────────────────────────
  // Snapshot do conteúdo editável (slides/título/estilo/formato). Cada mudança
  // empurra um estado na pilha; Desfazer/Refazer navegam por ela. `traveling`
  // evita que aplicar um snapshot (setState) gere um novo push (loop).
  type Snapshot = {
    slides: PreviewSlide[]
    title: string
    style: EditorialStyle
    format: "feed" | "stories"
  }
  const historyRef = useRef<Snapshot[]>([])
  const histIndexRef = useRef(-1)
  const travelingRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    if (travelingRef.current) {
      travelingRef.current = false
      return
    }
    const snap: Snapshot = { slides, title, style, format }
    if (histIndexRef.current === -1) {
      historyRef.current = [snap]
      histIndexRef.current = 0
    } else {
      // corta a "cauda" de refazer e empurra o novo estado
      historyRef.current = historyRef.current.slice(0, histIndexRef.current + 1)
      historyRef.current.push(snap)
      histIndexRef.current = historyRef.current.length - 1
      // limita a pilha (memória)
      if (historyRef.current.length > 120) {
        historyRef.current.shift()
        histIndexRef.current--
      }
    }
    setCanUndo(histIndexRef.current > 0)
    setCanRedo(histIndexRef.current < historyRef.current.length - 1)
  }, [slides, title, style, format])

  function applySnapshot(s: Snapshot) {
    travelingRef.current = true
    setSlides(s.slides)
    setTitle(s.title)
    setStyle(s.style)
    setFormat(s.format)
    setSelected((sel) => Math.min(sel, s.slides.length - 1))
  }

  function undo() {
    if (histIndexRef.current <= 0) return
    histIndexRef.current--
    applySnapshot(historyRef.current[histIndexRef.current])
    setCanUndo(histIndexRef.current > 0)
    setCanRedo(true)
  }

  function redo() {
    if (histIndexRef.current >= historyRef.current.length - 1) return
    histIndexRef.current++
    applySnapshot(historyRef.current[histIndexRef.current])
    setCanUndo(true)
    setCanRedo(histIndexRef.current < historyRef.current.length - 1)
  }

  // Atalhos: Ctrl/Cmd+Z = desfazer · Ctrl/Cmd+Shift+Z (ou Ctrl+Y) = refazer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  async function handleSave() {
    setSaveBusy(true)
    setImgError(null)
    try {
      const res = await saveCarouselV2({
        id: savedId,
        data: {
          _kind: "carousel-v2",
          slides,
          title,
          caption: caption ?? "",
          brandName,
          handle: handleValue,
          colors,
          template,
          editorialStyle: style,
          format,
        },
      })
      if (!res.ok) {
        setImgError(res.error || "erro ao salvar")
        return
      }
      setSavedId(res.id)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2500)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro ao salvar")
    } finally {
      setSaveBusy(false)
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
        canvasHeight: format === "stories" ? 1920 : 1350,
        pixelRatio: 1,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `${slideFileName(slide, selected)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro no export")
    } finally {
      setExporting(false)
    }
  }

  /** Espera as <img> dentro do preview terminarem de carregar (até timeoutMs). */
  async function waitPreviewImages(timeoutMs = 6000) {
    const started = Date.now()
    // primeiro dá um tick pro React renderizar o slide selecionado
    await new Promise((r) => setTimeout(r, 120))
    while (Date.now() - started < timeoutMs) {
      const imgs = Array.from(
        previewRef.current?.querySelectorAll("img") ?? [],
      )
      const pending = imgs.filter((im) => !im.complete)
      if (pending.length === 0) return
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  // Exporta TODOS os slides num único .zip. Percorre os slides no preview
  // visível (cada um renderiza no previewRef) e captura o PNG de cada.
  // Robusto: espera a imagem carregar de verdade (sem timer fixo) e um slide
  // com erro NÃO derruba o zip inteiro — ele é pulado e reportado no final.
  async function handleExportAllZip() {
    if (!previewRef.current || slides.length === 0) return
    setZipBusy(true)
    setImgError(null)
    const prevSelected = selected
    const failed: number[] = []
    try {
      const { toPng } = await import("html-to-image")
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (let i = 0; i < slides.length; i++) {
        setSelected(i)
        await waitPreviewImages()
        if (!previewRef.current) continue
        try {
          const dataUrl = await toPng(previewRef.current, {
            cacheBust: true,
            canvasWidth: 1080,
            canvasHeight: format === "stories" ? 1920 : 1350,
            pixelRatio: 1,
          })
          const base64 = dataUrl.split(",")[1]
          zip.file(`${slideFileName(slides[i], i)}.png`, base64, {
            base64: true,
          })
        } catch (slideErr) {
          console.error(`[zip] slide ${i + 1} falhou`, slideErr)
          failed.push(i + 1)
        }
      }
      if (failed.length === slides.length) {
        throw new Error(
          "Nenhum slide pôde ser exportado. Recarregue a página e tente de novo.",
        )
      }
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${(title || "carrossel").replace(/[^a-z0-9-]+/gi, "-")}-carrossel.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      if (failed.length > 0) {
        setImgError(
          `ZIP gerado, mas ${failed.length} slide(s) falharam (${failed.join(", ")}). Exporte-os individualmente.`,
        )
      }
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "erro no export do zip")
    } finally {
      setSelected(prevSelected)
      setZipBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar — FIXA no topo (sticky) pra os botões de ação (Salvar, Baixar
          ZIP, Exportar) nunca sumirem ao rolar a página. Em telas estreitas os
          botões quebram linha (flex-wrap) em vez de transbordar pra fora. */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Voltar pra biblioteca"
            aria-label="Voltar pra biblioteca"
          >
            <a href="/dashboard/projetos">
              <ArrowLeft className="w-4 h-4" />
            </a>
          </Button>
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
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Histórico de edição: Desfazer / Refazer (Ctrl+Z / Ctrl+Shift+Z) */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={redo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Shift+Z)"
            aria-label="Refazer"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={saveOk ? "outline" : "default"}
            size="sm"
            onClick={handleSave}
            disabled={saveBusy}
          >
            {saveBusy ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : saveOk ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saveBusy
              ? "Salvando…"
              : saveOk
                ? "Salvo!"
                : savedId
                  ? "Salvar alterações"
                  : "Salvar na biblioteca"}
          </Button>
          <PublishToInstagram
            imageUrls={slides
              .map((s) => s.image.url)
              .filter((u): u is string => !!u)}
            caption={caption ?? ""}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportAllZip}
            disabled={zipBusy || exporting}
          >
            {zipBusy ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            {zipBusy ? "Gerando ZIP…" : "Baixar carrossel (ZIP)"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={exporting || zipBusy}
          >
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
              handle={handleValue}
              brandLabel={brandName}
              showDevBadges={false}
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

          {/* Handle do Instagram — aparece nas pills de todos os slides */}
          <div>
            <Label className="text-xs">Handle do Instagram (@)</Label>
            <Input
              value={handleValue}
              onChange={(e) => {
                const v = e.target.value.trim()
                setHandleValue(v ? (v.startsWith("@") ? v : `@${v}`) : "")
              }}
              placeholder="@suamarca"
              className="h-9 mt-1.5"
            />
            <p className="text-[10px] text-text-muted mt-1">
              O @ exibido nos slides. Vem do cadastro da marca — edite se precisar.
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
                <Label className="text-xs">
                  Tag do slide (canto superior direito)
                </Label>
                <Input
                  value={slide.cta_badge || ""}
                  onChange={(e) => patchSlide({ cta_badge: e.target.value })}
                  placeholder="ESTUDO 01, NOVO, EDITORIAL…"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Texto curto exibido no topo do card. Deixe vazio pra usar o
                  padrão.
                </p>
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
                  placeholder="Prompt (IA) ou nome da pessoa (Foto real)"
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                onClick={() => generateImage("wikimedia")}
                disabled={imgBusy !== null}
                title="Foto real de uma pessoa (Wikipedia)"
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
