"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
  Loader2,
  Download,
  Wand2,
  Image as ImageIcon,
  Building2,
  Upload,
  Link as LinkIcon,
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
  Move,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react"
import { saveCarouselV2 } from "@/app/actions/carousel"
import { EditorSection as Section } from "@/components/editor/editor-section"
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
import { proxiedImageUrl } from "@/lib/proxy-image"
import {
  SlidePreview,
  type CarouselChrome,
  type PreviewSlide,
  type EditorialStyle,
} from "@/components/carousel/slide-preview"
import {
  EditableSlideCanvas,
  type EditorSelection,
  type MenuAction,
} from "@/components/carousel/editable-canvas"
import {
  EDITABLE_TYPE_LABEL,
  type EditableType,
  type ElementOverride,
} from "@/components/carousel/editable-overrides"
import { PublishToInstagram } from "@/components/instagram/publish-to-instagram"
import { PrepararAgendamento } from "@/components/instagram/preparar-agendamento"
import { renderNodeToPng, uploadPngDataUrl } from "@/lib/instagram/render-upload"
import {
  PanelTopBar,
  ElementsPanel,
  HistoryPanel,
  BlockEditorShell,
  type PanelMode,
  type HistoryEntry,
  type BlockTab,
} from "@/components/carousel/block-panel"
import {
  BLOCK_LIMIT,
  BLOCK_TYPE_LABEL,
  clampBlock,
  createBlock,
  slideDesignHeight,
  type BlockType,
  type SlideBlock,
} from "@/components/carousel/slide-blocks"
import { isLightColor } from "@/lib/color-contrast"

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
/** Degradês prontos pro fundo do slide (from → to, ângulo). */
const GRADIENT_PRESETS: { label: string; from: string; to: string; angle: number }[] = [
  { label: "Meia-noite", from: "#0B0B14", to: "#1E1B4B", angle: 160 },
  { label: "Oceano", from: "#0F172A", to: "#0E7490", angle: 150 },
  { label: "Brasa", from: "#1A0A0A", to: "#B91C1C", angle: 160 },
  { label: "Floresta", from: "#052E16", to: "#166534", angle: 150 },
  { label: "Pôr do sol", from: "#7C2D12", to: "#F59E0B", angle: 135 },
  { label: "Névoa", from: "#F8FAFC", to: "#CBD5E1", angle: 160 },
]

const BG_PRESETS: { label: string; value: string }[] = [
  { label: "Preto", value: "#0a0a0e" },
  { label: "Grafite", value: "#17161d" },
  { label: "Roxo", value: "#1668E3" },
  { label: "Índigo", value: "#0A1C3C" },
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
  { value: "cards", label: "Cards (MyPostFlow)" },
  { value: "perfil", label: "Perfil (post/tweet)" },
]

/** Propriedades do bloco selecionado — painel "Editar <tipo>" em abas, como o Elementor. */
function BlockProps({
  block,
  tab,
  textRef,
  accent,
  slideH,
  onPatch,
  onPickImage,
  onDuplicate,
  onDelete,
  onReorder,
  onApplyAll,
}: {
  block: SlideBlock
  tab: BlockTab
  textRef: React.RefObject<HTMLTextAreaElement | null>
  accent: string
  slideH: number
  onPatch: (patch: Partial<SlideBlock>) => void
  onPickImage: () => void
  onDuplicate: () => void
  onDelete: () => void
  onReorder: (dir: "front" | "back") => void
  onApplyAll: () => void
}) {
  const patch = (o: Record<string, unknown>) => onPatch(o as Partial<SlideBlock>)
  const choice = <T extends string>(
    label: string,
    options: Array<[T, string]>,
    value: T,
    onPick: (v: T) => void,
  ) => (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-text-secondary w-16 flex-shrink-0">{label}</span>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className={`h-7 px-2.5 rounded-md text-[11px] border transition-colors ${
            value === v
              ? "border-brand-500 text-brand-300 bg-brand-500/10"
              : "border-border-subtle text-text-muted hover:border-border-medium"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  )
  const colorRow = (label: string, value: string | undefined, key: string, fallback: string) => (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-secondary w-16 flex-shrink-0">{label}</span>
      <input
        type="color"
        value={value || fallback}
        onChange={(e) => patch({ [key]: e.target.value })}
        className="w-8 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer p-0.5 flex-shrink-0"
      />
      <Input
        value={value || ""}
        onChange={(e) => patch({ [key]: e.target.value || undefined })}
        placeholder={fallback}
        className="h-8 flex-1 font-mono text-[11px]"
      />
    </div>
  )
  const group = (title: string, children: React.ReactNode) => (
    <div className="space-y-3 pb-3 border-b border-white/[0.06] last:border-0">
      <div className="text-[11px] font-semibold text-white/80">{title}</div>
      {children}
    </div>
  )
  const isText = block.type === "heading" || block.type === "text"
  const hasText = isText || block.type === "pill" || block.type === "brand"

  // ── CONTEÚDO: o que o bloco mostra ──
  if (tab === "conteudo") {
    return (
      <div className="space-y-3">
        {(isText || block.type === "pill") &&
          group(
            BLOCK_TYPE_LABEL[block.type],
            <div>
              <Label className="text-xs">Texto</Label>
              <Textarea
                ref={textRef}
                value={block.text}
                rows={block.type === "pill" ? 1 : 4}
                onChange={(e) => patch({ text: e.target.value })}
                className="text-sm"
              />
            </div>,
          )}
        {block.type === "image" &&
          group(
            "Imagem",
            <>
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={onPickImage}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {block.url ? "Trocar imagem" : "Enviar imagem"}
              </Button>
              {choice(
                "Ajuste",
                [["cover", "Preencher"], ["contain", "Caber"]],
                block.fit ?? "cover",
                (f) => patch({ fit: f }),
              )}
              {block.url && (
                <>
                  <SliderRow label="Posição ←→" value={block.posX ?? 50} onChange={(v) => patch({ posX: v })} />
                  <SliderRow label="Posição ↑↓" value={block.posY ?? 50} onChange={(v) => patch({ posY: v })} />
                </>
              )}
            </>,
          )}
        {block.type === "brand" &&
          group(
            "Marca",
            <>
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={block.name} onChange={(e) => patch({ name: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">@handle</Label>
                <Input value={block.handle} onChange={(e) => patch({ handle: e.target.value })} className="h-8 text-sm" />
              </div>
              {choice(
                "Avatar",
                [["on", "Mostrar"], ["off", "Esconder"]],
                block.showAvatar === false ? "off" : "on",
                (v) => patch({ showAvatar: v === "on" }),
              )}
              {choice(
                "Selo",
                [["on", "Verificado"], ["off", "Sem selo"]],
                block.verified === false ? "off" : "on",
                (v) => patch({ verified: v === "on" }),
              )}
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={onPickImage}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {block.avatar ? "Trocar foto do avatar" : "Enviar foto do avatar"}
              </Button>
            </>,
          )}
        {block.type === "shape" &&
          group(
            "Forma",
            choice(
              "Forma",
              [["rect", "Retângulo"], ["circle", "Círculo"]],
              block.shape,
              (f) => patch({ shape: f }),
            ),
          )}
        {block.type === "pill" &&
          group(
            "Estilo da tag",
            choice(
              "Estilo",
              [["dark", "Escura"], ["light", "Clara"], ["accent", "Cor da marca"]],
              block.variant,
              (v) => patch({ variant: v, color: v === "accent" ? accent : undefined }),
            ),
          )}
        {block.type === "divider" && (
          <p className="text-[11px] text-text-muted">
            O divisor não tem conteúdo. Cor e espessura ficam na aba Estilo.
          </p>
        )}
      </div>
    )
  }

  // ── ESTILO: aparência ──
  if (tab === "estilo") {
    return (
      <div className="space-y-3">
        {hasText &&
          group(
            "Tipografia",
            <>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-secondary w-16 flex-shrink-0">Fonte</span>
                <select
                  value={block.font ?? ""}
                  onChange={(e) => patch({ font: e.target.value || undefined })}
                  className="h-8 flex-1 rounded-md border border-border-subtle bg-transparent text-[12px] px-2 text-text-primary"
                >
                  <option value="" className="bg-black">Fonte do carrossel</option>
                  {CAROUSEL_FONTS.map((f) => (
                    <option key={f.id} value={f.id} className="bg-black">
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              {isText && (
                <>
                  <SliderRow
                    label="Tamanho"
                    min={8}
                    max={72}
                    value={block.size ?? (block.type === "heading" ? 30 : 14)}
                    onChange={(v) => patch({ size: v })}
                  />
                  <SliderRow
                    label="Peso"
                    min={300}
                    max={900}
                    value={block.weight ?? (block.type === "heading" ? 800 : 500)}
                    onChange={(v) => patch({ weight: Math.round(v / 100) * 100 })}
                  />
                  {choice(
                    "Alinhar",
                    [["left", "Esq."], ["center", "Centro"], ["right", "Dir."]],
                    block.align ?? "left",
                    (a) => patch({ align: a }),
                  )}
                </>
              )}
            </>,
          )}
        {group(
          "Cores",
          <>
            {(isText || block.type === "brand" || block.type === "divider") &&
              colorRow("Cor", block.color, "color", block.type === "divider" ? accent : "#ffffff")}
            {isText && colorRow("Tarja", block.fill, "fill", "#000000")}
            {block.type === "shape" && (
              <>
                {colorRow("Preench.", block.fill, "fill", accent)}
                {colorRow("Borda", block.stroke, "stroke", "#ffffff")}
              </>
            )}
            {block.type === "pill" && block.variant === "accent" && colorRow("Cor", block.color, "color", accent)}
            <SliderRow
              label="Opacidade"
              min={10}
              max={100}
              value={Math.round((block.opacity ?? 1) * 100)}
              onChange={(v) => patch({ opacity: v === 100 ? undefined : v / 100 })}
            />
          </>,
        )}
        {group(
          "Efeitos",
          <>
            {choice(
              "Sombra",
              [["off", "Sem"], ["on", "Suave"]],
              block.shadow ? "on" : "off",
              (v) => patch({ shadow: v === "on" ? true : undefined }),
            )}
            {(block.type === "image" || (block.type === "shape" && block.shape === "rect") || isText) && (
              <SliderRow
                label="Cantos"
                min={0}
                max={block.type === "image" ? 200 : 120}
                value={block.radius ?? (block.type === "image" ? 12 : block.type === "shape" ? 16 : 0)}
                onChange={(v) => patch({ radius: v })}
              />
            )}
            {block.type === "divider" && (
              <SliderRow label="Espessura" min={1} max={20} value={block.thickness ?? 3} onChange={(v) => patch({ thickness: v })} />
            )}
          </>,
        )}
      </div>
    )
  }

  // ── AVANÇADO: geometria, ordem, ações ──
  return (
    <div className="space-y-3">
      {group(
        "Posição e tamanho",
        <>
          <div className="grid grid-cols-2 gap-2">
            <SliderRow label="X" min={0} max={420 - block.w} value={block.x} onChange={(v) => patch({ x: v })} />
            <SliderRow label="Y" min={0} max={slideH - block.h} value={block.y} onChange={(v) => patch({ y: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SliderRow label="Largura" min={16} max={420} value={block.w} onChange={(v) => patch({ w: v })} />
            <SliderRow label="Altura" min={16} max={slideH} value={block.h} onChange={(v) => patch({ h: v })} />
          </div>
          <SliderRow label="Rotação" min={-180} max={180} value={block.rot ?? 0} onChange={(v) => patch({ rot: v === 0 ? undefined : v })} />
        </>,
      )}
      {group(
        "Camada",
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onReorder("front")}>
            Trazer pra frente
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onReorder("back")}>
            Enviar pra trás
          </Button>
        </div>,
      )}
      {group(
        "Ações",
        <>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onApplyAll}>
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Aplicar em todos os slides
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Duplicar
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-red-400 hover:text-red-300" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Excluir
            </Button>
          </div>
        </>,
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
  handleInitials,
  chrome,
  format,
  width,
  active,
  fontClass,
  titleWeight,
  titleScale,
  bodyWeight,
  bodyScale,
}: {
  slide: PreviewSlide
  total: number
  template: "editorial" | "cinematic" | "hybrid"
  colors: string[]
  style: EditorialStyle
  handle: string
  brandName: string
  handleInitials?: string
  chrome: CarouselChrome
  format: "feed" | "stories"
  width: number
  active: boolean
  fontClass: string
  titleWeight?: number
  titleScale?: number
  bodyWeight?: number
  bodyScale?: number
}) {
  const REF_W = 420
  const s = width / REF_W
  const h = width * (format === "stories" ? 16 / 9 : 5 / 4)
  return (
    <div
      style={{ width, height: h }}
      className={`relative overflow-hidden rounded-xl bg-black transition-shadow text-left ${
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
          handleInitials={handleInitials}
          {...chrome}
          brandLabel={brandName}
          showDevBadges={false}
          format={format}
          titleWeight={titleWeight}
          titleScale={titleScale}
          bodyWeight={bodyWeight}
          bodyScale={bodyScale}
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
  /** Iniciais do avatar salvas. Vazio = deriva do handle. */
  initialAvatarInitials?: string
  /** Enfeites do carrossel salvos (avatar, dots, selo, rodapé). */
  initialChrome?: Partial<CarouselChrome>
  colors: string[]
  template?: "editorial" | "cinematic" | "hybrid"
  editorialStyle?: EditorialStyle
  /** Formato inicial do frame. Default "feed". */
  initialFormat?: "feed" | "stories"
  /** ID do carrossel salvo (quando reaberto da biblioteca) — habilita update in-place. */
  initialCarouselId?: string
  /** Tipografia salva (id da fonte, peso e escala do título e da descrição). */
  initialFont?: string
  initialTitleWeight?: number
  initialTitleScale?: number
  initialBodyWeight?: number
  initialBodyScale?: number
  /** Pauta (scheduled_posts) de origem — gravada no primeiro save (0023). */
  pautaId?: string | null
}

type ImageMode = "ai" | "unsplash" | "wikimedia"

export function CarouselEditor({
  initialSlides,
  initialTitle,
  caption,
  brandName,
  handle = "@brand",
  initialAvatarInitials,
  initialChrome,
  colors: initialColors,
  template = "editorial",
  editorialStyle = "auto",
  initialFormat = "feed",
  initialCarouselId,
  initialFont,
  initialTitleWeight,
  initialTitleScale,
  initialBodyWeight,
  initialBodyScale,
  pautaId,
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
  // Tipografia da descrição (subtítulo/corpo) — independente do título.
  const [bodyWeight, setBodyWeight] = useState<number | undefined>(
    initialBodyWeight,
  )
  const [bodyScale, setBodyScale] = useState<number | undefined>(
    initialBodyScale,
  )
  // Identidade Visual — paleta editável da marca [acento, escuro, claro].
  const [colors, setColors] = useState<string[]>(initialColors)
  const [paletteBusy, setPaletteBusy] = useState(false)
  // Handle editável — o @ que aparece nos slides. Vem do cadastro da marca
  // (instagram_handle) via props, mas o usuário pode corrigir aqui.
  const [handleValue, setHandleValue] = useState(handle)
  // Nome da marca e iniciais do avatar — editáveis. O nome aparece no estilo
  // "Perfil" (post de rede social) e nos rodapés; as iniciais preenchem o
  // círculo do avatar quando a marca não tem foto. Vazio = deriva do handle.
  const [brandValue, setBrandValue] = useState(brandName)
  const [avatarInitials, setAvatarInitials] = useState(
    initialAvatarInitials ?? "",
  )
  // Enfeites do carrossel: foto do avatar, dots de paginação, selo verificado e
  // rodapé. Tudo ligado por padrão — desligar é escolha do usuário.
  const [avatarUrl, setAvatarUrl] = useState(initialChrome?.handleAvatar ?? "")
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [showDots, setShowDots] = useState(initialChrome?.showDots !== false)
  const [showVerified, setShowVerified] = useState(
    initialChrome?.showVerified !== false,
  )
  const [showFooter, setShowFooter] = useState(
    initialChrome?.showFooter !== false,
  )
  const [footerLabel, setFooterLabel] = useState(
    initialChrome?.footerLabel ?? "",
  )
  const chrome: CarouselChrome = useMemo(
    () => ({
      handleAvatar: avatarUrl || undefined,
      showDots,
      showVerified,
      showFooter,
      // Campo vazio = usa o padrão do template ("2026 //"). Pra sumir de vez
      // com o rodapé existe o toggle — assim ninguém fica com campo em branco
      // sem entender por que o texto continua lá.
      footerLabel: footerLabel.trim() ? footerLabel : undefined,
    }),
    [avatarUrl, showDots, showVerified, showFooter, footerLabel],
  )

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
  // Export pausado porque a aba foi pro segundo plano (ver whenVisible).
  const [exportPaused, setExportPaused] = useState(false)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Autosave do rascunho em localStorage — backup local imediato pra não perder
  // o trabalho ao recarregar. A persistência de VERDADE é na nuvem via
  // saveCarouselV2 (auto ao gerar + botão "Salvar"), gravada em
  // editorial_carousels.carousel_data (JSONB, migration 0006 — já em prod). Todo
  // o estado editável (slides c/ bg/transform, cores, tipografia) vive nesse
  // JSONB, então não precisa de migration nova.
  useEffect(() => {
    try {
      localStorage.setItem(
        "syncpost_carousel_draft",
        JSON.stringify({
          slides,
          title,
          caption,
          brandName: brandValue,
          handle: handleValue,
          avatarInitials,
          chrome,
          colors,
          template,
          editorialStyle: style,
          ts: Date.now(),
        }),
      )
    } catch {
      // localStorage cheio/indisponível — ignora
    }
  }, [
    slides,
    title,
    caption,
    brandValue,
    handleValue,
    avatarInitials,
    chrome,
    colors,
    template,
    style,
  ])

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
    /** Rótulo humano da mudança (painel Histórico, estilo Elementor). */
    label: string
  }
  const historyRef = useRef<Snapshot[]>([])
  const histIndexRef = useRef(-1)
  const travelingRef = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  // Espelho da pilha pro painel Histórico (ref não re-renderiza).
  const [histEntries, setHistEntries] = useState<HistoryEntry[]>([])
  const [histCurrent, setHistCurrent] = useState(0)
  const syncHistoryUi = () => {
    setHistEntries(historyRef.current.map((h, i) => ({ label: h.label, index: i })))
    setHistCurrent(histIndexRef.current)
  }

  /** Descreve a diferença entre dois snapshots (1 frase curta). */
  function describeChange(prev: Snapshot, next: Snapshot): string {
    if (prev.title !== next.title) return "Título do carrossel"
    if (prev.style !== next.style) return "Estilo do post"
    if (prev.format !== next.format) return `Formato: ${next.format === "feed" ? "Feed" : "Stories"}`
    if (prev.slides.length < next.slides.length) return "Slide adicionado"
    if (prev.slides.length > next.slides.length) return "Slide removido"
    for (let i = 0; i < next.slides.length; i++) {
      const a = prev.slides[i]
      const b = next.slides[i]
      if (a === b) continue
      const n = `Slide ${String(i + 1).padStart(2, "0")}`
      if (a.title !== b.title) return `${n}: título`
      if (a.subtitle !== b.subtitle || a.body !== b.body) return `${n}: texto`
      if (a.cta_badge !== b.cta_badge) return `${n}: tag`
      if (a.highlight_words !== b.highlight_words) return `${n}: destaques`
      if (a.bg !== b.bg || a.bgGradient !== b.bgGradient) return `${n}: fundo`
      if (a.glow !== b.glow) return `${n}: glow`
      if (a.image !== b.image) {
        if (a.image.url !== b.image.url) return `${n}: imagem`
        return `${n}: enquadramento da foto`
      }
      if (a.blocks !== b.blocks) {
        const la = a.blocks?.length ?? 0
        const lb = b.blocks?.length ?? 0
        if (lb > la) {
          const added = b.blocks?.find((x) => !a.blocks?.some((y) => y.id === x.id))
          return `${n}: bloco ${added ? BLOCK_TYPE_LABEL[added.type].toLowerCase() : ""} adicionado`
        }
        if (lb < la) return `${n}: bloco excluído`
        const changed = b.blocks?.find((x, k) => x !== a.blocks?.[k])
        return `${n}: bloco ${changed ? BLOCK_TYPE_LABEL[changed.type].toLowerCase() : ""} editado`
      }
      if (a.el !== b.el) return `${n}: elemento ajustado`
      return `${n}: editado`
    }
    return "Edição"
  }

  useEffect(() => {
    if (travelingRef.current) {
      travelingRef.current = false
      return
    }
    const snap: Snapshot = { slides, title, style, format, label: "Carrossel gerado" }
    if (histIndexRef.current === -1) {
      historyRef.current = [snap]
      histIndexRef.current = 0
    } else {
      // corta a "cauda" de refazer e empurra o novo estado
      historyRef.current = historyRef.current.slice(0, histIndexRef.current + 1)
      snap.label = describeChange(historyRef.current[histIndexRef.current], snap)
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
    syncHistoryUi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    syncHistoryUi()
  }

  function redo() {
    if (histIndexRef.current >= historyRef.current.length - 1) return
    histIndexRef.current++
    applySnapshot(historyRef.current[histIndexRef.current])
    setCanUndo(true)
    setCanRedo(histIndexRef.current < historyRef.current.length - 1)
    setDirty(true)
    syncHistoryUi()
  }

  /** Painel Histórico: pula direto pra um estado da pilha. */
  function jumpToHistory(index: number) {
    if (index < 0 || index >= historyRef.current.length) return
    if (index === histIndexRef.current) return
    histIndexRef.current = index
    applySnapshot(historyRef.current[index])
    setCanUndo(index > 0)
    setCanRedo(index < historyRef.current.length - 1)
    setDirty(true)
    syncHistoryUi()
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

  // ── EDITOR CANVA-LIKE: seleção no canvas + sections controladas ─────────
  const [selection, setSelection] = useState<EditorSelection | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    estilo: true,
    conteudo: true,
    imagem: true,
  })
  const toggleSection = (id: string) =>
    setOpenSections((s) => ({ ...s, [id]: !s[id] }))
  const openSection = (id: string) =>
    setOpenSections((s) => (s[id] ? s : { ...s, [id]: true }))

  const titleInputRef = useRef<HTMLInputElement>(null)
  const subtitleInputRef = useRef<HTMLInputElement>(null)
  const badgeInputRef = useRef<HTMLInputElement>(null)
  const elementColorRef = useRef<HTMLInputElement>(null)

  // "Copiar estilo" (Ctrl+Alt+C/V, padrão Canva): cor + escala do elemento.
  const [styleClipboard, setStyleClipboard] = useState<ElementOverride | null>(
    null,
  )

  // Troca de slide/estilo/formato invalida as chaves dos elementos → limpa.
  useEffect(() => {
    setSelection(null)
  }, [selected, style, format])

  // ── PAINEL ESTILO ELEMENTOR: Elementos / Editar / Histórico ─────────────
  const [panelMode, setPanelMode] = useState<PanelMode>("editar")
  const [blockTab, setBlockTab] = useState<BlockTab>("conteudo")
  const blockTextRef = useRef<HTMLTextAreaElement>(null)
  // Bloco de imagem aguardando o file picker (image-replace num bloco).
  const blockImageTargetRef = useRef<string | null>(null)

  const designH = slideDesignHeight(format)
  const currentBlocks = slides[selected]?.blocks ?? []

  function setBlocks(updater: (list: SlideBlock[]) => SlideBlock[]) {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== selected) return s
        const next = updater(s.blocks ?? [])
        return { ...s, blocks: next.length ? next : undefined }
      }),
    )
  }

  /** Adiciona um bloco (no centro, ou centralizado em `at`) e abre o painel dele. */
  function addBlock(type: BlockType, at?: { x: number; y: number }) {
    const list = slides[selected]?.blocks ?? []
    if (list.length >= BLOCK_LIMIT) return
    const bg = slides[selected]?.bg
    const onDark = bg ? !isLightColor(bg) : style !== "minimal"
    const accent = colors[0] || "#1668E3"
    const z = list.reduce((m, b) => Math.max(m, b.z), 0) + 1
    const created = createBlock(type, {
        slideH: designH,
        z,
        accent,
        onDark,
        brand: {
          name: brandValue || "Sua marca",
          handle: handleValue || "@marca",
          avatar: avatarUrl || undefined,
          initials: avatarInitials || undefined,
        },
      })
    const b = clampBlock(
      at
        ? { ...created, x: Math.round(at.x - created.w / 2), y: Math.round(at.y - created.h / 2) }
        : created,
      designH,
    )
    setBlocks((l) => [...l, b])
    setSelection({ key: b.id, type: "block" })
    // Como no Elementor: soltou/adicionou → o painel vira "Editar <tipo>".
    setPanelMode("bloco")
    setBlockTab("conteudo")
    if (type === "image") {
      blockImageTargetRef.current = b.id
      window.setTimeout(() => fileInputRef.current?.click(), 80)
    }
  }

  function patchBlock(id: string, patch: Partial<SlideBlock>) {
    setBlocks((l) =>
      l.map((b) => (b.id === id ? clampBlock({ ...b, ...patch } as SlideBlock, designH) : b)),
    )
  }

  function deleteBlock(id: string) {
    setBlocks((l) => l.filter((b) => b.id !== id))
    setSelection((sel) => (sel?.key === id ? null : sel))
    setPanelMode((m) => (m === "bloco" ? "editar" : m))
  }

  function duplicateBlock(id: string) {
    const list = slides[selected]?.blocks ?? []
    const src = list.find((b) => b.id === id)
    if (!src || list.length >= BLOCK_LIMIT) return
    const z = list.reduce((m, b) => Math.max(m, b.z), 0) + 1
    const copy = clampBlock(
      { ...src, id: Math.random().toString(36).slice(2, 10), x: src.x + 16, y: src.y + 16, z },
      designH,
    )
    setBlocks((l) => [...l, copy])
    setSelection({ key: copy.id, type: "block" })
  }

  /** Copia o bloco pra TODOS os outros slides (mesma posição; ids novos). */
  function applyBlockToAll(id: string) {
    const src = slides[selected]?.blocks?.find((b) => b.id === id)
    if (!src) return
    setSlides((prev) =>
      prev.map((sl, i) => {
        if (i === selected) return sl
        const list = sl.blocks ?? []
        if (list.length >= BLOCK_LIMIT) return sl
        const z = list.reduce((m, b) => Math.max(m, b.z), 0) + 1
        const copy = { ...src, id: Math.random().toString(36).slice(2, 10), z }
        return { ...sl, blocks: [...list, copy] }
      }),
    )
  }

  function reorderBlock(id: string, dir: "front" | "back") {
    setBlocks((l) => {
      const zs = l.map((b) => b.z)
      const z = dir === "front" ? Math.max(...zs) + 1 : Math.min(...zs) - 1
      return l.map((b) => (b.id === id ? { ...b, z } : b))
    })
  }

  function scrollToSection(id: string) {
    // espera a section abrir (render) antes de rolar
    window.setTimeout(() => {
      document
        .getElementById(`sec-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 60)
  }

  /** Clique no canvas → seleciona e abre a section certa na sidebar. */
  function handleCanvasSelect(sel: EditorSelection | null) {
    setSelection(sel)
    if (!sel) {
      if (panelMode === "bloco") setPanelMode("editar")
      return
    }
    if (sel.type === "background") {
      if (panelMode === "bloco") setPanelMode("editar")
      openSection("fundo")
      scrollToSection("fundo")
    } else if (sel.type === "image") {
      openSection("imagem")
      scrollToSection("imagem")
    } else if (sel.type === "block") {
      setPanelMode("bloco")
    } else {
      if (panelMode === "bloco") setPanelMode("editar")
      openSection("elemento")
      openSection("conteudo")
      scrollToSection("elemento")
    }
  }

  /** Merge do override de UM elemento do slide atual (undefined limpa a chave). */
  function patchElement(key: string, patch: ElementOverride) {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== selected) return s
        const cur = { ...(s.el?.[key] ?? {}), ...patch }
        ;(Object.keys(cur) as (keyof ElementOverride)[]).forEach((k) => {
          if (cur[k] === undefined) delete cur[k]
        })
        const el = { ...(s.el ?? {}) }
        if (Object.keys(cur).length) el[key] = cur
        else delete el[key]
        return { ...s, el: Object.keys(el).length ? el : undefined }
      }),
    )
  }

  /** Ações do menu de botão direito do canvas. */
  function handleMenuAction(action: MenuAction, sel: EditorSelection) {
    switch (action) {
      case "edit-text":
        handleTextEdit(sel)
        break
      case "color":
        if (sel.type === "block") {
          setPanelMode("bloco")
          setBlockTab("estilo")
          break
        }
        openSection("elemento")
        scrollToSection("elemento")
        window.setTimeout(() => elementColorRef.current?.focus(), 140)
        break
      case "copy-style": {
        const o = slide.el?.[sel.key]
        setStyleClipboard({ color: o?.color, scale: o?.scale })
        break
      }
      case "paste-style":
        if (styleClipboard)
          patchElement(sel.key, {
            color: styleClipboard.color,
            scale: styleClipboard.scale,
          })
        break
      case "reset":
        patchElement(sel.key, {
          dx: undefined,
          dy: undefined,
          scale: undefined,
          color: undefined,
        })
        break
      case "image-replace":
        blockImageTargetRef.current = sel.type === "block" ? sel.key : null
        fileInputRef.current?.click()
        break
      case "block-duplicate":
        duplicateBlock(sel.key)
        break
      case "block-front":
        reorderBlock(sel.key, "front")
        break
      case "block-back":
        reorderBlock(sel.key, "back")
        break
      case "block-delete":
        deleteBlock(sel.key)
        break
      case "block-apply-all":
        applyBlockToAll(sel.key)
        break
      case "hide":
        patchElement(sel.key, { hidden: true })
        setSelection(null)
        break
      case "image-adjust":
        openSection("imagem")
        scrollToSection("imagem")
        break
      case "image-reset":
        patchImage({ posX: undefined, posY: undefined, zoom: undefined })
        break
      case "image-remove":
        patchImage({
          url: null,
          posX: undefined,
          posY: undefined,
          zoom: undefined,
        })
        break
      case "palette":
        void extractFromImage()
        break
      case "bg-color":
        openSection("fundo")
        scrollToSection("fundo")
        break
      case "bg-default":
        patchSlide({ bg: undefined })
        break
      case "slide-duplicate":
        duplicateSlide(selected)
        break
      case "slide-delete":
        deleteSlide(selected)
        break
    }
  }

  /** Duplo clique em texto no canvas → foca o campo certo na sidebar. */
  function handleTextEdit(sel: EditorSelection) {
    // Rodapé (marca/@handle/arrasta/contador) não tem campo próprio na
    // section de conteúdo — abre a identidade/elemento em vez do subtítulo.
    if (sel.type === "block") {
      setPanelMode("bloco")
      setBlockTab("conteudo")
      window.setTimeout(() => {
        blockTextRef.current?.focus()
        blockTextRef.current?.select()
      }, 140)
      return
    }
    if (sel.type === "meta") {
      openSection("elemento")
      scrollToSection("elemento")
      return
    }
    openSection("conteudo")
    scrollToSection("conteudo")
    window.setTimeout(() => {
      const ref =
        sel.type === "title"
          ? titleInputRef
          : sel.type === "badge"
            ? badgeInputRef
            : subtitleInputRef
      ref.current?.focus()
      ref.current?.select()
    }, 140)
  }

  const selectedOverride =
    selection &&
    selection.type !== "background" &&
    selection.type !== "image" &&
    selection.type !== "block"
      ? (slide.el?.[selection.key] ?? {})
      : null
  const hiddenKeys = Object.entries(slide.el ?? {})
    .filter(([, o]) => o.hidden)
    .map(([k]) => k)
  const selectedBlock =
    selection?.type === "block"
      ? (currentBlocks.find((b) => b.id === selection.key) ?? null)
      : null

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

  /** Upload da foto do avatar — mesmo endpoint das fotos de slide. */
  async function handleAvatarUpload(file: File) {
    setAvatarBusy(true)
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
      setAvatarUrl(data.url)
    } catch (err) {
      setImgError(
        err instanceof Error ? err.message : "erro no upload do avatar",
      )
    } finally {
      setAvatarBusy(false)
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
      const target = blockImageTargetRef.current
      blockImageTargetRef.current = null
      if (target) {
        const tb = slides[selected]?.blocks?.find((b) => b.id === target)
        if (tb?.type === "brand") patchBlock(target, { avatar: data.url } as Partial<SlideBlock>)
        else patchBlock(target, { url: data.url } as Partial<SlideBlock>)
      } else setImageUrl(data.url, "ai")
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
        // Sem isso a chave de cache do html-to-image ignora a query string, e
        // TODA imagem proxiada (/api/proxy-image?url=…) colide numa chave só —
        // o export repetia a 1a foto em todos os slides.
        includeQueryParams: true,
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
        // Origem só no insert: `saveCarouselV2` ignora quando `id` existe.
        pautaId,
        data: {
          _kind: "carousel-v2",
          slides,
          title,
          caption: caption ?? "",
          brandName: brandValue,
          handle: handleValue,
          avatarInitials,
          chrome,
          colors,
          template,
          editorialStyle: style,
          format,
          font,
          titleWeight,
          titleScale,
          bodyWeight,
          bodyScale,
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
      // Mesmo motivo do ZIP: o toPng não resolve com a aba escondida.
      await whenVisible()
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        // Sem isso a chave de cache do html-to-image ignora a query string, e
        // TODA imagem proxiada (/api/proxy-image?url=…) colide numa chave só —
        // o export repetia a 1a foto em todos os slides.
        includeQueryParams: true,
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

  /**
   * Espera a aba voltar a ficar visível.
   *
   * Necessário porque o próprio html-to-image depende de rAF: o createImage
   * dele (node_modules/html-to-image/lib/util.js) faz
   *   img.onload = () => img.decode().then(() => requestAnimationFrame(resolve))
   * e o browser CONGELA requestAnimationFrame em aba de segundo plano. Ou seja,
   * o toPng nunca resolve enquanto a aba está escondida — e isso não dá pra
   * blindar por fora, só esperando. Sem isso, quem clicava em "Baixar Todos" e
   * trocava de aba ficava presa em "Gerando…" pra sempre, sem erro nem arquivo.
   * Agora o export só pausa: ao voltar pra aba, ele continua de onde parou.
   */
  function whenVisible(): Promise<void> {
    if (!document.hidden) return Promise.resolve()
    setExportPaused(true)
    return new Promise((resolve) => {
      const onChange = () => {
        if (document.hidden) return
        document.removeEventListener("visibilitychange", onChange)
        setExportPaused(false)
        resolve()
      }
      document.addEventListener("visibilitychange", onChange)
    })
  }

  /**
   * Espera as <img> do preview carregarem DE VERDADE antes do html-to-image.
   * `img.complete` sozinho não basta: logo após trocar o `src` ele fica true
   * apontando pro frame anterior, e o export saía com a imagem errada (a do
   * slide 1 em todos). Aqui: (1) 2 frames pro React comitar o slide remontado,
   * (2) espera load/error de cada <img>, (3) força o decode (bitmap pronto).
   */
  async function waitPreviewImages(timeoutMs = 8000) {
    // 2 requestAnimationFrame: garante o commit do slide novo (remount via key).
    // Fallback por timer: com a aba em segundo plano o browser CONGELA o rAF.
    // Sem isso, trocar de aba durante o export travava o "Gerando…" pra sempre,
    // sem erro e sem download. Com a aba visível o rAF (~32ms) sempre vence.
    await new Promise<void>((r) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        r()
      }
      requestAnimationFrame(() => requestAnimationFrame(done))
      window.setTimeout(done, 300)
    })
    const imgs = Array.from(previewRef.current?.querySelectorAll("img") ?? [])
    await Promise.all(
      imgs.map(
        (im) =>
          new Promise<void>((resolve) => {
            if (im.complete && im.naturalWidth > 0) return resolve()
            let settled = false
            const done = () => {
              if (settled) return
              settled = true
              resolve()
            }
            im.addEventListener("load", done, { once: true })
            im.addEventListener("error", done, { once: true })
            window.setTimeout(done, timeoutMs)
          }),
      ),
    )
    // Decode explícito: sem ele o html-to-image pode desenhar o frame anterior.
    // Com corrida contra timer: em aba oculta o decode() pode nunca resolver, e
    // sem o limite o export ficava preso aqui (mesmo problema do rAF acima).
    await Promise.all(
      imgs.map((im) =>
        im.decode
          ? Promise.race([
              im.decode().catch(() => {}),
              new Promise<void>((r) => window.setTimeout(r, timeoutMs)),
            ])
          : Promise.resolve(),
      ),
    )
  }

  // Exporta TODOS os slides num único .zip. Percorre os slides no preview
  // visível (cada um renderiza no previewRef) e captura o PNG de cada.
  // Robusto: espera a imagem carregar de verdade (sem timer fixo) e um slide
  // com erro NÃO derruba o zip inteiro — ele é pulado e reportado no final.
  /**
   * Artes finais pra PUBLICAR no Instagram: mesmo percurso do ZIP (cada slide
   * renderizado no preview a 1080px), mas em vez de baixar, hospeda e devolve
   * as URLs públicas que a API da Meta exige. Antes disso o botão mandava a
   * foto de fundo crua (slide.image.url), sem título nem marca.
   * Diferente do ZIP, aqui um slide que falha derruba tudo: carrossel pela
   * metade no feed é pior que erro.
   */
  async function renderSlidesForPublish(): Promise<string[]> {
    if (!previewRef.current || slides.length === 0) return []
    const prevSelected = selected
    const urls: string[] = []
    try {
      for (let i = 0; i < slides.length; i++) {
        setSelected(i)
        await whenVisible()
        await waitPreviewImages()
        if (!previewRef.current) throw new Error("preview indisponível")
        const dataUrl = await renderNodeToPng(
          previewRef.current,
          1080,
          format === "stories" ? 1920 : 1350,
        )
        urls.push(await uploadPngDataUrl(dataUrl, `${slideFileName(slides[i], i)}.png`))
      }
      return urls
    } finally {
      setSelected(prevSelected)
      setExportPaused(false)
    }
  }

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
        // O toPng não avança com a aba escondida (rAF congelado); pausa aqui.
        await whenVisible()
        await waitPreviewImages()
        if (!previewRef.current) continue
        try {
          const dataUrl = await toPng(previewRef.current, {
            cacheBust: true,
            includeQueryParams: true,
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
      setExportPaused(false)
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
          getImageUrls={renderSlidesForPublish}
          imageCount={slides.length}
          caption={caption ?? ""}
        />
        {/* Guarda a arte final (os N slides, na ordem) pra publicacao
            automatica. Mesmo render do botao de publicar; a diferenca e que
            aqui o resultado fica salvo em vez de ser descartado. */}
        <PrepararAgendamento
          tipo="carousel"
          pecaId={savedId}
          getImageUrls={renderSlidesForPublish}
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
          {zipBusy ? (exportPaused ? "Pausado" : "Gerando…") : "Baixar Todos"}
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
                  {i === selected ? (
                    /* Slide ATIVO = canvas interativo Canva-like: hover mostra
                       os elementos, clique seleciona (e abre a section na
                       sidebar), arrasta move com limites, foto tem pan/zoom,
                       drop de arquivo troca a imagem. */
                    <EditableSlideCanvas
                      slide={s}
                      total={slides.length}
                      template={template}
                      colors={colors}
                      style={style}
                      handle={handleValue}
                      brandName={brandValue}
                      handleInitials={avatarInitials}
                      chrome={chrome}
                      format={format}
                      width={format === "stories" ? 340 : 420}
                      fontClass={fontClassById(font)}
                      titleWeight={titleWeight}
                      titleScale={titleScale}
                      bodyWeight={bodyWeight}
                      bodyScale={bodyScale}
                      selection={selection}
                      onSelect={handleCanvasSelect}
                      onOverride={patchElement}
                      onImagePan={(posX, posY) => patchImage({ posX, posY })}
                      onImageZoom={(zoom) =>
                        patchImage({ zoom: zoom === 100 ? undefined : zoom })
                      }
                      onImageFile={handleUpload}
                      onImagePick={() => fileInputRef.current?.click()}
                      onTextEdit={handleTextEdit}
                      onMenuAction={handleMenuAction}
                      hasStyleClipboard={styleClipboard !== null}
                      onBlockPatch={patchBlock}
                      onBlockDrop={(type, x, y) => addBlock(type, { x, y })}
                    />
                  ) : (
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    className="block text-left"
                    aria-label={`Selecionar slide ${i + 1}`}
                  >
                    <SlideCanvas
                      slide={s}
                      total={slides.length}
                      template={template}
                      colors={colors}
                      style={style}
                      handle={handleValue}
                      brandName={brandValue}
                      handleInitials={avatarInitials}
                      chrome={chrome}
                      format={format}
                      width={format === "stories" ? 340 : 420}
                      active={false}
                      fontClass={fontClassById(font)}
                      titleWeight={titleWeight}
                      titleScale={titleScale}
                      bodyWeight={bodyWeight}
                      bodyScale={bodyScale}
                    />
                  </button>
                  )}
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

          {/* Render OCULTO em tamanho de design (420px) pro export/captura de capa.
              `[&_.rounded-xl]:!rounded-none` zera o border-radius do slide SÓ neste
              render de export → o PNG 1080×1350 sai retângulo cheio, sem os cantos
              transparentes que viravam bordas brancas no Instagram. O filmstrip
              visível continua com cantos arredondados (chrome do editor). */}
          {/* O offscreen fica no WRAPPER, nunca no nó capturado. O html-to-image
              copia o computed style do nó raiz pro clone e joga esse clone dentro
              de um <foreignObject>; se o raiz carregasse `position:fixed;
              left:-9999px`, o conteúdo caía fora do viewBox do SVG e o PNG saía
              1080×1350 100% TRANSPARENTE (todos os slides do ZIP iguais e vazios).
              Com o ref num filho estático, o clone renderiza em 0,0. */}
          <div
            aria-hidden
            className="fixed -left-[9999px] top-0 pointer-events-none"
          >
          <div
            ref={previewRef}
            className="w-[420px] [&_.rounded-xl]:!rounded-none"
          >
            {/* key={selected}: REMONTA o preview a cada slide selecionado. Sem
                isso, o React reusava o mesmo <img> e ele guardava o BITMAP do
                slide anterior — no export em ZIP, o html-to-image capturava a
                imagem do slide 1 em todos (só o texto atualizava). Remontar
                garante um <img> novo, que waitPreviewImages espera carregar. */}
            <SlidePreview
              key={selected}
              slide={slide}
              totalSlides={slides.length}
              template={template}
              brandColors={colors}
              fontClass={fontClassById(font)}
              editorialStyle={style}
              handle={handleValue}
              handleInitials={avatarInitials}
              {...chrome}
              brandLabel={brandValue}
              showDevBadges={false}
              format={format}
              titleWeight={titleWeight}
              titleScale={titleScale}
              bodyWeight={bodyWeight}
              bodyScale={bodyScale}
            />
          </div>
          </div>
        </main>
      </div>

      {/* Sidebar de edição — coluna cheia à ESQUERDA (do topo ao fim) */}
      <aside className="order-1 w-[320px] flex-shrink-0 border-r border-white/10 bg-black p-4 space-y-3 h-full overflow-y-auto">
          <PanelTopBar
            mode={panelMode}
            onMode={setPanelMode}
            historyCount={histEntries.length}
          />
          {panelMode === "elementos" && (
            <ElementsPanel count={currentBlocks.length} onAdd={addBlock} />
          )}
          {panelMode === "historico" && (
            <HistoryPanel entries={histEntries} current={histCurrent} onJump={jumpToHistory} />
          )}
          {panelMode === "bloco" && selectedBlock && (
            <BlockEditorShell
              title={`Editar ${BLOCK_TYPE_LABEL[selectedBlock.type]}`}
              tab={blockTab}
              onTab={setBlockTab}
              onBack={() => {
                setPanelMode("editar")
                setSelection(null)
              }}
            >
              <BlockProps
                block={selectedBlock}
                tab={blockTab}
                textRef={blockTextRef}
                accent={colors[0] || "#1668E3"}
                slideH={designH}
                onPatch={(patch) => patchBlock(selectedBlock.id, patch)}
                onPickImage={() => {
                  blockImageTargetRef.current = selectedBlock.id
                  fileInputRef.current?.click()
                }}
                onDuplicate={() => duplicateBlock(selectedBlock.id)}
                onDelete={() => deleteBlock(selectedBlock.id)}
                onReorder={(dir) => reorderBlock(selectedBlock.id, dir)}
                onApplyAll={() => applyBlockToAll(selectedBlock.id)}
              />
            </BlockEditorShell>
          )}
          {panelMode === "bloco" && !selectedBlock && (
            <p className="text-xs text-text-muted px-1">
              Selecione um bloco no slide pra editar.
            </p>
          )}
          <div className={panelMode === "editar" ? "space-y-3" : "hidden"}>
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
              <Label className="text-xs mb-1.5 block">Peso do título</Label>
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

            {/* Descrição (subtítulo + corpo) — independente do título. */}
            <div className="pt-1 border-t border-border-subtle/60" />
            <SliderRow
              label="Tamanho da descrição"
              min={70}
              max={130}
              value={Math.round((bodyScale ?? 1) * 100)}
              onChange={(v) => setBodyScale(v / 100)}
            />
            <div>
              <Label className="text-xs mb-1.5 block">Peso da descrição</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setBodyWeight(w)}
                    className={`h-8 rounded text-xs transition-colors ${
                      bodyWeight === w
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
            {/* Perfil da marca — o que aparece no pill/avatar dos slides.
                Os três campos são independentes: o nome sai no estilo "Perfil"
                e nos rodapés, o @ no pill, e as iniciais no círculo do avatar
                (quando a marca não tem foto). Antes as iniciais eram sempre as
                2 primeiras letras do @ e não davam pra corrigir. */}
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Perfil da marca
            </p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Nome da marca</Label>
                <Input
                  value={brandValue}
                  onChange={(e) => setBrandValue(e.target.value)}
                  placeholder="Sua Marca"
                  className="h-9 mt-1.5"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <Label className="text-xs">Instagram (@)</Label>
                  <Input
                    value={handleValue}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      setHandleValue(v ? (v.startsWith("@") ? v : `@${v}`) : "")
                    }}
                    placeholder="@suamarca"
                    className="h-9 mt-1.5"
                  />
                </div>
                <div className="w-[92px] flex-shrink-0">
                  <Label className="text-xs">Iniciais</Label>
                  <Input
                    value={avatarInitials}
                    onChange={(e) =>
                      setAvatarInitials(e.target.value.slice(0, 3).toUpperCase())
                    }
                    placeholder={
                      handleValue.replace(/^@/, "").slice(0, 2).toUpperCase() ||
                      "MA"
                    }
                    maxLength={3}
                    className="h-9 mt-1.5 text-center uppercase"
                  />
                </div>
              </div>
              <p className="text-[10px] text-text-muted">
                Iniciais vazias = usa as 2 primeiras letras do @.
              </p>

              {/* Foto do avatar — quando existe, substitui as iniciais em todos
                  os pills/headers de perfil. */}
              <div className="flex items-center gap-2 pt-1">
                <span
                  className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/10 text-[11px] font-bold text-white"
                  aria-hidden
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxiedImageUrl(avatarUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    avatarInitials ||
                    handleValue.replace(/^@/, "").slice(0, 2).toUpperCase() ||
                    "MA"
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={avatarBusy}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarBusy ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {avatarUrl ? "Trocar foto" : "Foto do avatar"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl("")}
                    title="Remover foto (volta pras iniciais)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAvatarUpload(file)
                  e.target.value = ""
                }}
              />
            </div>

            {/* Enfeites do slide — o que antes era fixo no template. */}
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted pt-1">
              Enfeites do slide
            </p>
            <div className="space-y-2">
              {(
                [
                  {
                    label: "Dots de paginação",
                    on: showDots,
                    set: setShowDots,
                  },
                  {
                    label: "Selo verificado",
                    on: showVerified,
                    set: setShowVerified,
                  },
                  { label: "Rodapé (1/5)", on: showFooter, set: setShowFooter },
                ] as const
              ).map(({ label, on, set }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set(!on)}
                  className="w-full flex items-center justify-between text-xs px-2.5 h-9 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span>{label}</span>
                  <span
                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                      on ? "bg-brand-600 justify-end" : "bg-white/15"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white" />
                  </span>
                </button>
              ))}
              <div>
                <Label className="text-xs">Texto do canto (ano)</Label>
                <Input
                  value={footerLabel}
                  onChange={(e) => setFooterLabel(e.target.value)}
                  placeholder={`${new Date().getFullYear()} //`}
                  className="h-9 mt-1.5"
                />
              </div>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted pt-1">
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

          {/* Elemento selecionado no canvas (título/texto/tag) — cor, tamanho,
              posição fina e reset. Aparece só com algo selecionado. */}
          {selection &&
            selectedOverride !== null &&
            selection.type !== "background" &&
            selection.type !== "image" && (
              <Section
                icon={Move}
                title={`Elemento — ${EDITABLE_TYPE_LABEL[selection.type as EditableType]}`}
                id="sec-elemento"
                open={!!openSections.elemento}
                onToggle={() => toggleSection("elemento")}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedOverride.color || "#ffffff"}
                    onChange={(e) =>
                      patchElement(selection.key, { color: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                    title="Cor do texto"
                  />
                  <Input
                    ref={elementColorRef}
                    value={selectedOverride.color || ""}
                    onChange={(e) =>
                      patchElement(selection.key, {
                        color: e.target.value || undefined,
                      })
                    }
                    placeholder="Cor padrão do estilo"
                    className="h-8 flex-1 font-mono text-[11px]"
                  />
                </div>
                <SliderRow
                  label="Tamanho"
                  min={50}
                  max={180}
                  value={Math.round((selectedOverride.scale ?? 1) * 100)}
                  onChange={(v) =>
                    patchElement(selection.key, {
                      scale: v === 100 ? undefined : v / 100,
                    })
                  }
                />
                <SliderRow
                  label="Posição ←→"
                  min={-210}
                  max={210}
                  value={Math.round(selectedOverride.dx ?? 0)}
                  onChange={(v) =>
                    patchElement(selection.key, { dx: v === 0 ? undefined : v })
                  }
                />
                <SliderRow
                  label="Posição ↑↓"
                  min={-260}
                  max={260}
                  value={Math.round(selectedOverride.dy ?? 0)}
                  onChange={(v) =>
                    patchElement(selection.key, { dy: v === 0 ? undefined : v })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      patchElement(selection.key, { hidden: true })
                      setSelection(null)
                    }}
                    title="Esconde este elemento do layout (pra trocar por um bloco seu, por exemplo)"
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                    Ocultar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patchElement(selection.key, {
                        dx: undefined,
                        dy: undefined,
                        scale: undefined,
                        color: undefined,
                        hidden: undefined,
                      })
                    }
                  >
                    <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                    Restaurar
                  </Button>
                </div>
                <p className="text-[10px] text-text-muted">
                  Arraste o elemento direto no slide. O canto roxo redimensiona.
                  Esc desseleciona.
                </p>
              </Section>
            )}

          <Section
            icon={Type}
            title={`Conteúdo — Slide ${String(selected + 1).padStart(2, "0")}`}
            id="sec-conteudo"
            open={!!openSections.conteudo}
            onToggle={() => toggleSection("conteudo")}
          >
            {hiddenKeys.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-1.5">
                <div className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
                  <EyeOff className="w-3 h-3" /> Elementos ocultos neste slide
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hiddenKeys.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => patchElement(k, { hidden: undefined })}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/70 hover:text-white hover:border-white/30"
                      title="Mostrar de novo"
                    >
                      <Eye className="w-3 h-3" />
                      {EDITABLE_TYPE_LABEL[k.split("-")[0] as EditableType] ?? k}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input
                  ref={titleInputRef}
                  value={slide.title}
                  onChange={(e) => patchSlide({ title: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Subtítulo</Label>
                <Input
                  ref={subtitleInputRef}
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
                  ref={badgeInputRef}
                  value={slide.cta_badge || ""}
                  onChange={(e) => patchSlide({ cta_badge: e.target.value })}
                  placeholder="ESTUDO 01, NOVO, EDITORIAL…"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Texto curto exibido no topo do card. Deixe vazio pra usar o
                  padrão.
                </p>
              </div>

              {/* O @ (e agora nome + iniciais) mora em "Identidade Visual" —
                  é config da MARCA, não do slide. Ficava aqui e ninguém achava. */}
            </div>
          </Section>

          <Section
            icon={PaintBucket}
            title="Fundo do Slide"
            id="sec-fundo"
            open={!!openSections.fundo}
            onToggle={() => toggleSection("fundo")}
          >
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
            {/* Degradê: sobrepõe a cor sólida; o "from" define claro/escuro. */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-text-secondary">Degradê</span>
                {slide.bgGradient && (
                  <button
                    type="button"
                    onClick={() => patchSlide({ bgGradient: undefined })}
                    className="text-[11px] text-text-muted hover:text-text-primary"
                  >
                    Remover
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {GRADIENT_PRESETS.map((g) => {
                  const active =
                    slide.bgGradient?.from.toLowerCase() === g.from.toLowerCase() &&
                    slide.bgGradient?.to.toLowerCase() === g.to.toLowerCase()
                  return (
                    <button
                      key={g.label}
                      type="button"
                      title={g.label}
                      onClick={() => patchSlide({ bgGradient: { from: g.from, to: g.to, angle: g.angle } })}
                      style={{ backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` }}
                      className={`w-8 h-8 rounded-lg border transition-all ${
                        active
                          ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-black border-transparent"
                          : "border-white/15 hover:border-white/40"
                      }`}
                    />
                  )
                })}
              </div>
              {slide.bgGradient && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {(["from", "to"] as const).map((k) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={slide.bgGradient?.[k] ?? "#000000"}
                          onChange={(e) =>
                            patchSlide({ bgGradient: { ...slide.bgGradient!, [k]: e.target.value } })
                          }
                          className="w-8 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                          title={k === "from" ? "Cor inicial" : "Cor final"}
                        />
                        <Input
                          value={slide.bgGradient?.[k] ?? ""}
                          onChange={(e) =>
                            patchSlide({ bgGradient: { ...slide.bgGradient!, [k]: e.target.value } })
                          }
                          className="h-8 flex-1 font-mono text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                  <SliderRow
                    label="Ângulo"
                    min={0}
                    max={360}
                    value={slide.bgGradient.angle}
                    onChange={(v) => patchSlide({ bgGradient: { ...slide.bgGradient!, angle: v } })}
                  />
                </>
              )}
            </div>
            {(style === "gradient" || style === "seamless") && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-text-secondary w-16 flex-shrink-0">Glow</span>
                <input
                  type="color"
                  value={slide.glow || colors[0] || "#1668E3"}
                  onChange={(e) => patchSlide({ glow: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-border-subtle bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                  title="Cor do brilho radial"
                />
                <Input
                  value={slide.glow || ""}
                  onChange={(e) => patchSlide({ glow: e.target.value || undefined })}
                  placeholder="Cor da marca"
                  className="h-8 flex-1 font-mono text-[11px]"
                />
              </div>
            )}
            <p className="text-[10px] text-text-muted">
              Vale pra capa e pros slides de conteúdo. O texto ajusta o contraste
              sozinho pela cor inicial.
            </p>
          </Section>

          <Section
            icon={ImageIcon}
            title="Imagem do Slide"
            id="sec-imagem"
            open={!!openSections.imagem}
            onToggle={() => toggleSection("imagem")}
          >
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
            {exportPaused && (
              <p className="text-xs text-muted-foreground">
                Exportação pausada porque esta aba saiu de foco. Volte pra ela que ela
                continua sozinha.
              </p>
            )}

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
          </div>
      </aside>
    </div>
  )
}
