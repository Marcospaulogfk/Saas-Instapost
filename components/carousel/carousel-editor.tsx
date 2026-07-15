"use client"

import { memo, useEffect, useRef, useState } from "react"
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Building2,
  Upload,
  Link as LinkIcon,
  ChevronRight,
  Save,
  Check,
  Undo2,
  Redo2,
  ArrowLeft,
  Trash2,
  Copy,
  Bookmark,
  Type,
  RectangleVertical,
  Smartphone,
  Baseline,
  PaintBucket,
  Palette,
} from "lucide-react"
import { saveCarouselV2 } from "@/app/actions/carousel"
import { Logo } from "@/components/brand/logo"
import { CAROUSEL_FONTS, fontClassById } from "./carousel-fonts"
import { extractPalette } from "@/lib/carousel/extract-palette"
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

/** Cores de fundo predefinidas pro slide (swatches). */
const BG_PRESETS: { label: string; value: string }[] = [
  { label: "Preto", value: "#0a0a0e" },
  { label: "Grafite", value: "#17161d" },
  { label: "Roxo", value: "#7320E6" },
  { label: "Índigo", value: "#1D0846" },
  { label: "Verde", value: "#0f2e26" },
  { label: "Vinho", value: "#3a0a1e" },
  { label: "Navy", value: "#0f1e3a" },
  { label: "Creme", value: "#FAF8F5" },
  { label: "Branco", value: "#FFFFFF" },
]

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

/** Seção colapsável (accordion) do editor lateral. */
function Section({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-white/[0.04] transition-colors"
      >
        <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <span className="text-[13px] font-medium text-text-primary flex-1 truncate">
          {title}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-border-subtle">
          {children}
        </div>
      )}
    </div>
  )
}

/** Slider com rótulo + valor (posição/zoom da imagem). */
function SliderRow({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-brand-600 cursor-pointer"
      />
    </div>
  )
}

/** Render de UM slide (escalado) pro filmstrip. Largura fixa → escala simples. */
const SlideCanvas = memo(function SlideCanvas({
  slide,
  total,
  template,
  colors,
  style,
  handle,
  brandName,
  format,
  width,
  active,
  fontClass,
  titleWeight,
  titleScale,
}: {
  slide: PreviewSlide
  total: number
  template: "editorial" | "cinematic" | "hybrid"
  colors: string[]
  style: EditorialStyle
  handle: string
  brandName: string
  format: "feed" | "stories"
  width: number
  active: boolean
  fontClass: string
  titleWeight?: number
  titleScale?: number
}) {
  const REF_W = 420
  const s = width / REF_W
  const h = width * (format === "stories" ? 16 / 9 : 5 / 4)
  return (
    <div
      style={{ width, height: h }}
      className={`relative overflow-hidden rounded-xl bg-black transition-shadow ${
        active
          ? "ring-2 ring-brand-500 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)]"
          : "ring-1 ring-white/10 hover:ring-white/25"
      }`}
    >
      <div
        style={{
          width: REF_W,
          transformOrigin: "top left",
          transform: `scale(${s})`,
        }}
      >
        <SlidePreview
          slide={slide}
          totalSlides={total}
          template={template}
          brandColors={colors}
          fontClass={fontClass}
          editorialStyle={style}
          handle={handle}
          brandLabel={brandName}
          showDevBadges={false}
          format={format}
          titleWeight={titleWeight}
          titleScale={titleScale}
        />
      </div>
    </div>
  )
})

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
  /** Tipografia salva (id da fonte, peso e escala do título). */
  initialFont?: string
  initialTitleWeight?: number
  initialTitleScale?: number
}

type ImageMode = "ai" | "unsplash" | "wikimedia"

export function CarouselEditor({
  initialSlides,
  initialTitle,
  caption,
  brandName,
  handle = "@brand",
  colors: initialColors,
  template = "editorial",
  editorialStyle = "auto",
  initialFormat = "feed",
  initialCarouselId,
  initialFont,
  initialTitleWeight,
  initialTitleScale,
}: CarouselEditorProps) {
  const [slides, setSlides] = useState<PreviewSlide[]>(initialSlides)
  const [selected, setSelected] = useState(0)
  const [title, setTitle] = useState(initialTitle)
  const [style, setStyle] = useState<EditorialStyle>(editorialStyle)
  const [format, setFormat] = useState<"feed" | "stories">(initialFormat)
  // Tipografia (fonte + peso + escala do título).
  const [font, setFont] = useState<string>(initialFont ?? "inter")
  const [titleWeight, setTitleWeight] = useState<number | undefined>(
    initialTitleWeight,
  )
  const [titleScale, setTitleScale] = useState<number | undefined>(
    initialTitleScale,
  )
  // Identidade Visual — paleta editável da marca [acento, escuro, claro].
  const [colors, setColors] = useState<string[]>(initialColors)
  const [paletteBusy, setPaletteBusy] = useState(false)
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
      setDirty(true)
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
    setDirty(true)
  }

  function redo() {
    if (histIndexRef.current >= historyRef.current.length - 1) return
    histIndexRef.current++
    applySnapshot(historyRef.current[histIndexRef.current])
    setCanUndo(true)
    setCanRedo(histIndexRef.current < historyRef.current.length - 1)
    setDirty(true)
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

  function patchImage(patch: Partial<PreviewSlide["image"]>) {
    setSlides((prev) =>
      prev.map((s, i) =>
        i === selected ? { ...s, image: { ...s.image, ...patch } } : s,
      ),
    )
  }

  // Identidade Visual: editar uma cor da paleta ou extrair da imagem do slide.
  function setColor(i: number, val: string) {
    setColors((prev) => prev.map((c, idx) => (idx === i ? val : c)))
  }
  async function extractFromImage() {
    const url = slide.image.url
    if (!url) {
      setImgError("Este slide não tem imagem pra extrair cores.")
      return
    }
    setPaletteBusy(true)
    setImgError(null)
    try {
      const pal = await extractPalette(url)
      setColors((prev) => pal.concat(prev.slice(pal.length)))
    } finally {
      setPaletteBusy(false)
    }
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

  // "dirty" = houve alteração não salva. Controla se Salvar/Desfazer aparecem.
  const [dirty, setDirty] = useState(false)

  // ── Gerência de slides (add / duplicar / deletar) — o histórico pega de graça
  //    porque tudo passa por setSlides. order_index é reindexado pra ficar único.
  function reindex(list: PreviewSlide[]): PreviewSlide[] {
    return list.map((s, i) => ({ ...s, order_index: i }))
  }
  function duplicateSlide(i: number) {
    setSlides((list) =>
      reindex([...list.slice(0, i + 1), { ...list[i] }, ...list.slice(i + 1)]),
    )
    setSelected(i + 1)
  }
  function deleteSlide(i: number) {
    if (slides.length <= 1) return
    setSlides((list) => reindex(list.filter((_, idx) => idx !== i)))
    setSelected((s) => Math.max(0, Math.min(s, slides.length - 2)))
  }

  /**
   * Gera a CAPA: snapshot do slide 1 JÁ COMPOSTO (texto+marca), reusando o mesmo
   * pipeline do export (setSelected + waitPreviewImages + html-to-image → upload).
   * Best-effort: se falhar, o save continua e a capa cai na foto de fundo.
   */
  async function captureCover(): Promise<string | null> {
    if (!previewRef.current || slides.length === 0) return null
    const prevSelected = selected
    try {
      const { toPng } = await import("html-to-image")
      if (selected !== 0) setSelected(0)
      await waitPreviewImages()
      if (!previewRef.current) return null
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        canvasWidth: 540,
        canvasHeight: format === "stories" ? 960 : 675,
        pixelRatio: 1,
      })
      const blob = await (await fetch(dataUrl)).blob()
      const fd = new FormData()
      fd.append("file", new File([blob], "cover.png", { type: "image/png" }))
      const res = await fetch("/api/editorial/upload-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      return data.success ? (data.url as string) : null
    } catch {
      return null
    } finally {
      if (prevSelected !== 0) setSelected(prevSelected)
    }
  }

  async function handleSave() {
    setSaveBusy(true)
    setImgError(null)
    try {
      const coverImageUrl = await captureCover()
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
          font,
          titleWeight,
          titleScale,
          coverImageUrl: coverImageUrl ?? undefined,
        },
      })
      if (!res.ok) {
        setImgError(res.error || "erro ao salvar")
        return
      }
      setSavedId(res.id)
      setSaveOk(true)
      setDirty(false)
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
    // Editor em TELA CHEIA por cima do dashboard (cobre a sidebar de navegação)
    // — a sidebar vira o editor, sem ficar com duas. "Voltar" fecha o overlay.
    <div className="fixed inset-0 z-50 bg-background flex overflow-hidden">
      {/* Coluna direita (toolbar + slides). A sidebar fica ANTES (order-1). */}
      <div className="order-2 flex-1 min-w-0 flex flex-col">
      {/* Toolbar de topo (ações sempre visíveis) */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-2 flex-wrap">
        {/* Formato do post (feed/stories) — no topo, estilo Studio */}
        <Select
          value={format}
          onValueChange={(v) => setFormat(v as "feed" | "stories")}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feed">
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Feed 4:5
              </span>
            </SelectItem>
            <SelectItem value="stories">
              <span className="flex items-center gap-2">
                <RectangleVertical className="w-4 h-4" />
                Stories 9:16
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
        {/* Desfazer/Refazer e Salvar só aparecem depois de uma alteração. */}
        {(canUndo || canRedo) && (
          <>
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
          </>
        )}
        {dirty && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saveBusy}
          >
            {saveBusy ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saveBusy ? "Salvando…" : "Salvar alterações"}
          </Button>
        )}
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
          {zipBusy ? "Gerando…" : "Baixar Todos"}
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
          Baixar Slide
        </Button>
        </div>
      </div>

        {/* Área central: filmstrip horizontal (estilo Studio) */}
        <main className="min-w-0 flex-1 flex flex-col overflow-hidden">
          {/* Filmstrip: centrado na vertical, alinhado à esquerda (próximo espia) */}
          <div className="flex-1 overflow-auto p-6 flex items-center">
            <div className="flex gap-5 items-center w-max">
              {slides.map((s, i) => (
                <div key={s.order_index} className="relative group flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    className="block"
                    aria-label={`Selecionar slide ${i + 1}`}
                  >
                    <SlideCanvas
                      slide={s}
                      total={slides.length}
                      template={template}
                      colors={colors}
                      style={style}
                      handle={handleValue}
                      brandName={brandName}
                      format={format}
                      width={format === "stories" ? 340 : 420}
                      active={i === selected}
                      fontClass={fontClassById(font)}
                      titleWeight={titleWeight}
                      titleScale={titleScale}
                    />
                  </button>
                  <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-black/60 text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => duplicateSlide(i)}
                      className="w-6 h-6 rounded-md bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
                      title="Duplicar slide"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSlide(i)}
                      disabled={slides.length <= 1}
                      className="w-6 h-6 rounded-md bg-black/60 text-white hover:bg-red-500/80 disabled:opacity-40 flex items-center justify-center"
                      title="Excluir slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Render OCULTO em tamanho de design (420px) pro export/captura de capa. */}
          <div
            ref={previewRef}
            aria-hidden
            className="fixed -left-[9999px] top-0 w-[420px] pointer-events-none"
          >
            <SlidePreview
              slide={slide}
              totalSlides={slides.length}
              template={template}
              brandColors={colors}
              fontClass={fontClassById(font)}
              editorialStyle={style}
              handle={handleValue}
              brandLabel={brandName}
              showDevBadges={false}
              format={format}
              titleWeight={titleWeight}
              titleScale={titleScale}
            />
          </div>
        </main>
      </div>

      {/* Sidebar de edição — coluna cheia à ESQUERDA (do topo ao fim) */}
      <aside className="order-1 w-[320px] flex-shrink-0 border-r border-white/10 bg-black p-4 space-y-3 h-full overflow-y-auto">
          <div className="px-1 pb-5">
            <Logo size={28} />
          </div>
          <a
            href="/dashboard/projetos"
            className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary px-1 pb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para Dashboard
          </a>

          <Section icon={Bookmark} title="Estilo do Post" defaultOpen>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setStyle(o.value)}
                  title={o.label}
                  className={`h-9 rounded-lg text-xs font-medium px-2 truncate transition-colors ${
                    style === o.value
                      ? "bg-brand-600 text-white"
                      : "border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium"
                  }`}
                >
                  {o.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </Section>

          <Section icon={Baseline} title="Tipografia">
            <div>
              <Label className="text-xs mb-1.5 block">Fonte</Label>
              <div className="grid grid-cols-2 gap-2">
                {CAROUSEL_FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFont(f.id)}
                    className={`h-9 rounded-lg text-[13px] px-2 truncate transition-colors ${f.className} ${
                      font === f.id
                        ? "bg-brand-600 text-white"
                        : "border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <SliderRow
              label="Tamanho do título"
              min={70}
              max={130}
              value={Math.round((titleScale ?? 1) * 100)}
              onChange={(v) => setTitleScale(v / 100)}
            />
            <div>
              <Label className="text-xs mb-1.5 block">Peso da fonte</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTitleWeight(w)}
                    className={`h-8 rounded text-xs transition-colors ${
                      titleWeight === w
                        ? "bg-brand-600 text-white"
                        : "border border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section icon={Palette} title="Identidade Visual">
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Cores da marca
            </p>
            <div className="space-y-2">
              {[
                { label: "Acento", i: 0 },
                { label: "Escuro (fundo)", i: 1 },
                { label: "Claro (texto)", i: 2 },
              ].map(({ label, i }) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[i] || "#000000"}
                    onChange={(e) => setColor(i, e.target.value)}
                    className="w-8 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                    title={label}
                  />
                  <Input
                    value={colors[i] || ""}
                    onChange={(e) => setColor(i, e.target.value)}
                    className="h-8 flex-1 font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-text-muted w-[86px] flex-shrink-0">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={extractFromImage}
              disabled={paletteBusy || !slide.image.url}
            >
              {paletteBusy ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
              )}
              Extrair paleta da imagem
            </Button>
            <p className="text-[10px] text-text-muted">
              Extrai as cores dominantes da foto do slide atual e aplica na marca.
            </p>
          </Section>

          <Section
            icon={Type}
            title={`Conteúdo — Slide ${String(selected + 1).padStart(2, "0")}`}
            defaultOpen
          >
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

              <div>
                <Label className="text-xs">Instagram (@)</Label>
                <Input
                  value={handleValue}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    setHandleValue(
                      v ? (v.startsWith("@") ? v : `@${v}`) : "",
                    )
                  }}
                  placeholder="@suamarca"
                  className="h-9 mt-1.5"
                />
              </div>
            </div>
          </Section>

          <Section icon={PaintBucket} title="Fundo do Slide">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patchSlide({ bg: undefined })}
                title="Padrão do estilo"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[8px] font-medium transition-colors ${
                  !slide.bg
                    ? "border-brand-500 ring-1 ring-brand-500 text-brand-300"
                    : "border-border-subtle text-text-muted hover:border-border-medium"
                }`}
              >
                Auto
              </button>
              {BG_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => patchSlide({ bg: p.value })}
                  title={p.label}
                  style={{ backgroundColor: p.value }}
                  className={`w-8 h-8 rounded-lg border transition-all ${
                    (slide.bg || "").toLowerCase() === p.value.toLowerCase()
                      ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-black border-transparent"
                      : "border-white/15 hover:border-white/40"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={slide.bg || "#0a0a0e"}
                onChange={(e) => patchSlide({ bg: e.target.value })}
                className="w-9 h-9 rounded-lg border border-border-subtle bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                title="Cor personalizada"
              />
              <Input
                value={slide.bg || ""}
                onChange={(e) => patchSlide({ bg: e.target.value || undefined })}
                placeholder="Padrão do estilo"
                className="h-9 flex-1 font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-text-muted">
              Aplica em slides de texto (sem foto). O texto ajusta o contraste
              sozinho.
            </p>
          </Section>

          <Section icon={ImageIcon} title="Imagem do Slide" defaultOpen>
            <div className="space-y-3">
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

            {slide.image.url && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-text-secondary">
                    Ajuste da foto
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      patchImage({
                        url: null,
                        posX: undefined,
                        posY: undefined,
                        zoom: undefined,
                      })
                    }
                    className="text-[11px] text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
                <SliderRow
                  label="Posição ←→"
                  value={slide.image.posX ?? 50}
                  onChange={(v) => patchImage({ posX: v })}
                />
                <SliderRow
                  label="Posição ↑↓"
                  value={slide.image.posY ?? 20}
                  onChange={(v) => patchImage({ posY: v })}
                />
                <SliderRow
                  label="Zoom"
                  min={100}
                  max={250}
                  value={slide.image.zoom ?? 100}
                  onChange={(v) => patchImage({ zoom: v })}
                />
              </div>
            )}

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
          </Section>
      </aside>
    </div>
  )
}
