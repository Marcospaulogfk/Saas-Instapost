"use client"

import { useEffect, useRef, useState } from "react"
import {
  Inter,
  Bebas_Neue,
  Playfair_Display,
  Montserrat,
  Anton,
  Archivo_Black,
  Space_Grotesk,
} from "next/font/google"
import {
  Loader2,
  Sparkles,
  Clock,
  DollarSign,
  Pencil,
  GalleryHorizontal,
  Square,
  Wand2,
  RefreshCw,
  Download,
  ArrowLeft,
  Save,
  Check,
} from "lucide-react"
import { createSinglePost, updateSinglePost } from "@/app/actions/single-posts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  SlidePreview,
  type PreviewSlide,
  type EditorialStyle,
} from "@/components/carousel/slide-preview"
import { CarouselLightbox } from "@/components/carousel/carousel-lightbox"
import { SlideEditorModal } from "./slide-editor-modal"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import { PostPreview } from "@/components/single-posts/post-preview"
import { SKELETONS } from "@/lib/single-posts/skeletons"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"
import { buildTemplateSpec } from "@/lib/single-posts/template-specs"
import { POST_TEMPLATES, CATEGORY_LABELS } from "@/lib/single-posts/catalog"
import { DEMO_CONTENT } from "@/lib/single-posts/demo"
import {
  FONT_PRESETS,
  applyFontPreset,
} from "@/lib/single-posts/font-presets"
import type { FreePostSpec, FreeBlock } from "@/lib/single-posts/free-spec"
import type { PostBrand, PostContent } from "@/lib/single-posts/types"
import { generateMonogram } from "@/lib/single-posts/palette"
import type { ClaudeSlide } from "@/lib/generation/claude"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["900"] })
const montserrat = Montserrat({ subsets: ["latin"], weight: ["900"] })
const anton = Anton({ subsets: ["latin"], weight: "400" })
const archivo = Archivo_Black({ subsets: ["latin"], weight: "400" })
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["700"] })

const FONTS = {
  inter_black: { label: "Inter Black", className: inter.className },
  bebas_neue: { label: "Bebas Neue", className: bebas.className },
  playfair: { label: "Playfair Display", className: playfair.className },
  montserrat_black: {
    label: "Montserrat Black",
    className: montserrat.className,
  },
  anton: { label: "Anton", className: anton.className },
  archivo_black: { label: "Archivo Black", className: archivo.className },
  space_grotesk: { label: "Space Grotesk", className: grotesk.className },
} as const
type FontKey = keyof typeof FONTS

const OBJECTIVES = [
  { value: "sell", label: "Vender", description: "AIDA + CTA" },
  { value: "inform", label: "Informar", description: "Lista + autoridade" },
  { value: "engage", label: "Engajar", description: "Pergunta + storytelling" },
  {
    value: "community",
    label: "Comunidade",
    description: "Vulnerabilidade + chamado",
  },
] as const

const TEMPLATES = [
  { value: "editorial", label: "Editorial", description: "Magazine, premium (4:5)" },
  { value: "cinematic", label: "Cinematic", description: "Dramático, viral (4:5)" },
  { value: "hybrid", label: "Stories", description: "Stories Instagram (9:16)" },
] as const

const EDITORIAL_STYLES = [
  { value: "auto", label: "Auto (legacy)", description: "Cover + splits alternados" },
  { value: "bolo", label: "Bolo (lista)", description: "Lista de ideias numeradas" },
  { value: "gradient", label: "Gradiente (dark)", description: "Dark vibrante com glow do accent" },
  { value: "minimal", label: "Minimal (branco)", description: "Suíço: tipografia gigante + hairlines" },
  { value: "seamless", label: "Seamless (panorâmico)", description: "Linha contínua atravessa os slides" },
  { value: "notes", label: "Notes (nativo)", description: "Screenshot do app Notas" },
] as const
type EditorialStyleKey = (typeof EDITORIAL_STYLES)[number]["value"]

const MODES = [
  { value: "all_ai", label: "Tudo IA", description: "Flux Schnell em tudo" },
  {
    value: "smart_mix",
    label: "Misto Inteligente",
    description: "Claude decide por slide",
  },
  { value: "all_unsplash", label: "Tudo Unsplash", description: "Custo zero" },
] as const

interface ResultMetrics {
  claude: {
    ms: number
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
    costUsd: number
  }
  images: { totalCostUsd: number; parallelMs: number }
  total: { ms: number; costUsd: number }
}

interface ApiSlide extends PreviewSlide {
  image: PreviewSlide["image"] & {
    prompt: string | null
    unsplashQuery: string | null
    ms: number
    costUsd: number
  }
}

interface ApiResult {
  project_title: string
  slides: ApiSlide[]
  metrics: ResultMetrics
}

const DEFAULTS = {
  topic: "10 sinais de que voce esta construindo um produto que ninguem quer",
  objective: "inform" as const,
  tone: "Direto, autoral, com toque de humor seco. Frases curtas. Sem rodeio.",
  audience:
    "Devs e founders early-stage, 25-40 anos, focados em construir produto",
  visualStyle: "Cinematografico, alto contraste, editorial dark",
  colors: ["#E84D1E", "#1A1A1A", "#FAF8F5"],
  template: "cinematic" as const,
  font: "inter_black" as FontKey,
  nSlides: 5 as const,
  mode: "all_ai" as const,
}

export default function TestePage() {
  const [topic, setTopic] = useState(DEFAULTS.topic)
  const [objective, setObjective] = useState<typeof DEFAULTS.objective>(
    DEFAULTS.objective,
  )
  const [tone, setTone] = useState(DEFAULTS.tone)
  const [audience, setAudience] = useState(DEFAULTS.audience)
  const [visualStyle, setVisualStyle] = useState(DEFAULTS.visualStyle)
  const [colors, setColors] = useState(DEFAULTS.colors)
  const [template, setTemplate] = useState<typeof DEFAULTS.template>(
    DEFAULTS.template,
  )
  const [editorialStyle, setEditorialStyle] = useState<EditorialStyleKey>("auto")
  const [handle, setHandle] = useState<string>("@brand")
  const [lightBg, setLightBg] = useState<string>("#FAF8F5")
  const [darkBg, setDarkBg] = useState<string>("#0A0A0A")
  const [font, setFont] = useState<FontKey>(DEFAULTS.font)
  const [nSlides, setNSlides] = useState<number>(DEFAULTS.nSlides)
  const [mode, setMode] = useState<typeof DEFAULTS.mode>(DEFAULTS.mode)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApiResult | null>(null)
  // Legenda do carrossel aprovada no wizard (mostrada junto do resultado).
  const [carouselCaption, setCarouselCaption] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [activeBrandName, setActiveBrandName] = useState<string | null>(null)
  const autoRunStartedRef = useRef(false)

  // ===== Modo Post Único =====
  type Mode = "carrossel" | "post-unico"
  const [pageMode, setPageMode] = useState<Mode>("carrossel")
  // Mobile bottom-nav: qual painel está aberto (em telas <lg)
  type MobilePanel = "preview" | "form" | "editor"
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("preview")
  const [singlePostBriefing, setSinglePostBriefing] = useState("")
  const [singlePostSkeleton, setSinglePostSkeleton] = useState<string>("auto")
  const [singlePostSpec, setSinglePostSpec] = useState<FreePostSpec | null>(null)
  const [singlePostPhotoUrl, setSinglePostPhotoUrl] = useState<string | null>(null)
  const [singlePostSkeletonPicked, setSinglePostSkeletonPicked] = useState<string | null>(null)
  const [singlePostRationale, setSinglePostRationale] = useState<string | null>(null)
  const [singlePostLoading, setSinglePostLoading] = useState(false)
  const [singlePostError, setSinglePostError] = useState<string | null>(null)
  const [singlePostMetrics, setSinglePostMetrics] = useState<{
    ms: number
    totalCostUsd: number
  } | null>(null)
  const [singlePostUsedIds, setSinglePostUsedIds] = useState<string[]>([])
  // Modo template (curado): templateId ativo + content estruturado
  const [singlePostTemplateId, setSinglePostTemplateId] = useState<string | null>(null)
  const [singlePostTemplateContent, setSinglePostTemplateContent] =
    useState<PostContent | null>(null)
  const [singlePostBrand, setSinglePostBrand] = useState<PostBrand | null>(null)
  // Tipografia + formato + edit
  const [singlePostFontPreset, setSinglePostFontPreset] = useState<string>("editorial")
  const [singlePostFormat, setSinglePostFormat] = useState<"post" | "story">("post")
  const [singlePostSelectedPath, setSinglePostSelectedPath] = useState<string | null>(null)
  const [singlePostExporting, setSinglePostExporting] = useState(false)
  // Salvar na biblioteca (single_posts). savedId liga saves seguintes a update.
  const [singlePostSaving, setSinglePostSaving] = useState(false)
  const [singlePostSavedId, setSinglePostSavedId] = useState<string | null>(null)
  const [singlePostSaveOk, setSinglePostSaveOk] = useState(false)
  const singlePostPreviewRef = useRef<HTMLDivElement | null>(null)
  const lastAutoDetachedSpecRef = useRef<FreePostSpec | null>(null)

  // Normaliza cor pra hex 7-char aceito pelo <input type="color">.
  // Rejeita rgba/named colors — devolve "#000000" se não for hex 7-char.
  function normalizeHex(c: string): string {
    if (!c) return "#000000"
    const trimmed = c.trim()
    if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed
    if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
      const [r, g, b] = trimmed.slice(1)
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return "#000000"
  }

  // Detecta o tipo da opção selecionada
  function detectMode(id: string): "auto" | "skeleton" | "template" {
    if (id === "auto") return "auto"
    if (SKELETONS.some((s) => s.meta.id === id)) return "skeleton"
    return "template"
  }

  // Aplica font preset no spec atual (memoized via state derived)
  const finalSpec = singlePostSpec
    ? applyFontPreset(singlePostSpec, singlePostFontPreset)
    : null

  // Walk spec recursivo pra extrair texts editáveis (path → text)
  function collectEditableTexts(
    blocks: FreeBlock[],
    pathPrefix: string = "",
  ): Array<{ path: string; text: string; preview: string; kind: string }> {
    const out: Array<{ path: string; text: string; preview: string; kind: string }> = []
    blocks.forEach((b, i) => {
      const path = pathPrefix ? `${pathPrefix}.${i}` : String(i)
      if (b.type === "text") {
        out.push({ path, text: b.text, preview: b.text.slice(0, 50), kind: "text" })
      } else if (b.type === "pill") {
        out.push({ path, text: b.text, preview: `[pill] ${b.text}`, kind: "pill" })
      } else if (b.type === "card" || b.type === "stack") {
        out.push(...collectEditableTexts(b.children, path))
      }
    })
    return out
  }

  // Atualiza um text num path do spec — imutável
  function updateSpecText(
    blocks: FreeBlock[],
    path: string,
    newText: string,
  ): FreeBlock[] {
    const [head, ...rest] = path.split(".").map(Number)
    return blocks.map((b, i) => {
      if (i !== head) return b
      if (rest.length === 0) {
        if (b.type === "text") return { ...b, text: newText }
        if (b.type === "pill") return { ...b, text: newText }
        return b
      }
      if (b.type === "card" || b.type === "stack") {
        return { ...b, children: updateSpecText(b.children, rest.join("."), newText) }
      }
      return b
    })
  }

  function handleSpecTextEdit(path: string, newText: string) {
    if (!singlePostSpec) return
    setSinglePostSpec({
      ...singlePostSpec,
      blocks: updateSpecText(singlePostSpec.blocks, path, newText),
    })
  }

  // Patch genérico em block — text/pill aceitam font_size_scale/text_align, qualquer aceita position
  function updateSpecBlockPatch(
    blocks: FreeBlock[],
    path: string,
    patch: Record<string, unknown>,
  ): FreeBlock[] {
    const [head, ...rest] = path.split(".").map(Number)
    return blocks.map((b, i) => {
      if (i !== head) return b
      if (rest.length === 0) {
        return { ...b, ...patch } as FreeBlock
      }
      if (b.type === "card" || b.type === "stack") {
        return {
          ...b,
          children: updateSpecBlockPatch(b.children, rest.join("."), patch),
        }
      }
      return b
    })
  }

  function handleSpecBlockPatch(path: string, patch: Record<string, unknown>) {
    if (!singlePostSpec) return
    setSinglePostSpec({
      ...singlePostSpec,
      blocks: updateSpecBlockPatch(singlePostSpec.blocks, path, patch),
    })
  }

  // Drag-to-move handler — recebe nova position e sobrescreve no bloco
  function handleSpecPositionChange(
    path: string,
    position: { left: string; top: string; width: string },
  ) {
    if (!singlePostSpec) return
    setSinglePostSpec({
      ...singlePostSpec,
      blocks: updateSpecBlockPatch(singlePostSpec.blocks, path, {
        position: {
          left: position.left,
          top: position.top,
          width: position.width,
        },
      }),
    })
  }

  // Detach all: explode TODOS os stacks/cards do spec. Cada filho vira top-level.
  // Posições calculadas via DOM (preserva onde aparecem visualmente).
  function handleDetachAllGroups() {
    if (!singlePostSpec) return
    if (!singlePostPreviewRef.current) return
    const containerEl = singlePostPreviewRef.current.querySelector(
      ".relative.aspect-\\[4\\/5\\], .relative.aspect-\\[9\\/16\\]",
    ) as HTMLElement | null
    if (!containerEl) return
    const containerRect = containerEl.getBoundingClientRect()

    type Detached = { block: FreeBlock; path: string }
    const detached: Detached[] = []

    function walk(blocks: FreeBlock[], pathPrefix: string): FreeBlock[] {
      return blocks.flatMap((b, i) => {
        const path = pathPrefix ? `${pathPrefix}.${i}` : String(i)
        if (b.type === "stack" || b.type === "card") {
          // Cards e stacks com bg são "cards visuais": ficam ATÔMICOS (preservam
          // fundo/padding/shadow, movíveis como unidade). Só explode stack de
          // layout (sem bg) — textos internos seguem editáveis pelo painel
          // (collectEditableTexts recursa nos children).
          if (b.type === "card" || (b.type === "stack" && b.bg)) {
            return [b]
          }
          // walk recursivamente nos children — eles podem ter sub-stacks
          for (let j = 0; j < b.children.length; j++) {
            const child = b.children[j]
            const childPath = `${path}.${j}`
            const flowEl = singlePostPreviewRef.current!.querySelector(
              `[data-flow-path="${childPath}"]`,
            ) as HTMLElement | null
            if (!flowEl) continue
            const r = flowEl.getBoundingClientRect()
            // child stack/card aninhado: solta o GRUPO inteiro como bloco top-level
            // posicionado (não some). Filhos-folha viram blocos individuais.
            detached.push({
              block: {
                ...child,
                position: {
                  left: `${(((r.left - containerRect.left) / containerRect.width) * 100).toFixed(1)}cqw`,
                  top: `${(((r.top - containerRect.top) / containerRect.width) * 100).toFixed(1)}cqw`,
                  width: `${((r.width / containerRect.width) * 100).toFixed(1)}cqw`,
                },
                z: (child.z ?? 5) + 1,
              },
              path: childPath,
            })
          }
          // Remove o stack/card depois de pegar children
          return [] as FreeBlock[]
        }
        return [b]
      })
    }

    const remaining = walk(singlePostSpec.blocks, "")
    if (detached.length === 0) return
    setSinglePostSpec({
      ...singlePostSpec,
      blocks: [...remaining, ...detached.map((d) => d.block)],
    })
    setSinglePostSelectedPath(null)
  }

  // Auto-switch pra "preview" no bottom-nav quando um post é gerado (UX mobile)
  useEffect(() => {
    if (singlePostSpec || singlePostTemplateId) {
      setMobilePanel("preview")
    }
  }, [singlePostSpec, singlePostTemplateId])

  // Loading: também switcha pra preview pra user ver o spinner
  useEffect(() => {
    if (singlePostLoading || loading) setMobilePanel("preview")
  }, [singlePostLoading, loading])

  // Auto-switch quando carrossel termina
  useEffect(() => {
    if (result) setMobilePanel("preview")
  }, [result])

  // Auto-detach: quando novo spec gerado, automaticamente solta todos grupos
  // após DOM render (preserva posição visual via medição). User edita já com tudo solto.
  useEffect(() => {
    if (!singlePostSpec) return
    if (lastAutoDetachedSpecRef.current === singlePostSpec) return
    // Só dispara pra stacks de layout (sem bg). Cards e stacks-com-bg ficam
    // atômicos e não precisam de detach.
    const hasGroups = singlePostSpec.blocks.some(
      (b) => b.type === "stack" && !b.bg,
    )
    if (!hasGroups) {
      lastAutoDetachedSpecRef.current = singlePostSpec
      return
    }
    lastAutoDetachedSpecRef.current = singlePostSpec
    // Aguarda DOM render do stack antes de medir
    const timer = setTimeout(() => {
      handleDetachAllGroups()
    }, 120)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singlePostSpec])

  // Excluir um bloco — top-level ou child de stack/card
  function handleDeleteBlock(path: string) {
    if (!singlePostSpec) return
    const segments = path.split(".").map(Number)
    if (segments.length === 1) {
      setSinglePostSpec({
        ...singlePostSpec,
        blocks: singlePostSpec.blocks.filter((_, i) => i !== segments[0]),
      })
      setSinglePostSelectedPath(null)
      return
    }
    function removeFromTree(blocks: FreeBlock[], depth: number): FreeBlock[] {
      const idx = segments[depth]
      return blocks.map((b, i) => {
        if (i !== idx) return b
        if (b.type === "card" || b.type === "stack") {
          if (depth === segments.length - 2) {
            const childIdx = segments[segments.length - 1]
            return {
              ...b,
              children: b.children.filter((_, j) => j !== childIdx),
            } as FreeBlock
          }
          return { ...b, children: removeFromTree(b.children, depth + 1) }
        }
        return b
      })
    }
    setSinglePostSpec({
      ...singlePostSpec,
      blocks: removeFromTree(singlePostSpec.blocks, 0),
    })
    setSinglePostSelectedPath(null)
  }

  // Detach: tira um bloco de dentro de um stack/card e move pra top-level com position absolute.
  // Usa medição visual (DOM) pra preservar onde o bloco aparece no preview.
  function handleDetachBlock(path: string) {
    if (!singlePostSpec) return
    if (!path.includes(".")) return // já é top-level
    const containerEl = singlePostPreviewRef.current?.querySelector(
      ".relative.aspect-\\[4\\/5\\], .relative.aspect-\\[9\\/16\\]",
    ) as HTMLElement | null
    const flowEl = singlePostPreviewRef.current?.querySelector(
      `[data-flow-path="${path}"]`,
    ) as HTMLElement | null
    if (!containerEl || !flowEl) return

    const containerRect = containerEl.getBoundingClientRect()
    const flowRect = flowEl.getBoundingClientRect()
    const leftCqw = ((flowRect.left - containerRect.left) / containerRect.width) * 100
    const topCqw = ((flowRect.top - containerRect.top) / containerRect.width) * 100
    const widthCqw = (flowRect.width / containerRect.width) * 100

    // Acha e remove o child do stack/card; pega referência do block
    const segments = path.split(".").map(Number)
    const detachedRef: { block: FreeBlock | null } = { block: null }

    function removeFromTree(blocks: FreeBlock[], depth: number): FreeBlock[] {
      const idx = segments[depth]
      return blocks.map((b, i) => {
        if (i !== idx) return b
        if (depth === segments.length - 1) {
          // Esse é o pai imediato — não vai cair aqui pq depth aponta pra child final
          return b
        }
        if (b.type === "card" || b.type === "stack") {
          if (depth === segments.length - 2) {
            // pai imediato do child detachado
            const childIdx = segments[segments.length - 1]
            const child = b.children[childIdx]
            if (child) {
              detachedRef.block = child
              const newChildren = b.children.filter((_, j) => j !== childIdx)
              return { ...b, children: newChildren } as FreeBlock
            }
            return b
          }
          return { ...b, children: removeFromTree(b.children, depth + 1) }
        }
        return b
      })
    }

    const newBlocks = removeFromTree(singlePostSpec.blocks, 0)
    if (!detachedRef.block) return

    // Aplica position absoluta calculada do DOM no bloco detachado
    const detached: FreeBlock = {
      ...detachedRef.block,
      position: {
        left: `${leftCqw.toFixed(1)}cqw`,
        top: `${topCqw.toFixed(1)}cqw`,
        width: `${widthCqw.toFixed(1)}cqw`,
      },
      z: (detachedRef.block.z ?? 5) + 1,
    }

    setSinglePostSpec({
      ...singlePostSpec,
      blocks: [...newBlocks, detached],
    })
    // Seleciona o detachado pra user notar
    setSinglePostSelectedPath(String(newBlocks.length))
  }

  // Trocar foto de fundo do spec (Unsplash ou IA regen)
  function handleSpecBgPhotoChange(newUrl: string) {
    if (!singlePostSpec) return
    const bg = singlePostSpec.background
    if (bg.kind === "photo") {
      setSinglePostSpec({
        ...singlePostSpec,
        background: { ...bg, photo_url: newUrl },
      })
    } else {
      // se não era foto, vira foto agora (mantém overlay default)
      setSinglePostSpec({
        ...singlePostSpec,
        background: {
          kind: "photo",
          photo_url: newUrl,
          photo_overlay: {
            color: "#000000",
            opacity: 0,
            direction: "to top",
            start: 0.4,
          },
        },
      })
    }
  }

  // Estado do "Trocar foto" panel
  const [bgPhotoTab, setBgPhotoTab] = useState<"ai" | "unsplash" | "upload">(
    "unsplash",
  )
  const [bgAiPrompt, setBgAiPrompt] = useState("")
  const [bgAiLoading, setBgAiLoading] = useState(false)
  const [bgAiError, setBgAiError] = useState<string | null>(null)
  const [bgUnsplashQuery, setBgUnsplashQuery] = useState("")
  const [bgUnsplashLoading, setBgUnsplashLoading] = useState(false)
  const [bgUnsplashResults, setBgUnsplashResults] = useState<
    Array<{ id: string; thumbUrl: string; fullUrl: string; photographerName: string }>
  >([])
  const [bgUnsplashError, setBgUnsplashError] = useState<string | null>(null)
  const [bgUploadError, setBgUploadError] = useState<string | null>(null)
  const [bgUploadLoading, setBgUploadLoading] = useState(false)
  const bgUploadInputRef = useRef<HTMLInputElement | null>(null)

  function handleBgUpload(file: File) {
    setBgUploadError(null)
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    const MAX_BYTES = 5 * 1024 * 1024 // 5MB
    if (!ALLOWED.includes(file.type)) {
      setBgUploadError("Tipo inválido — use JPG, PNG ou WebP.")
      return
    }
    if (file.size > MAX_BYTES) {
      setBgUploadError(
        `Arquivo grande demais (${(file.size / 1024 / 1024).toFixed(1)}MB). Máx 5MB.`,
      )
      return
    }
    setBgUploadLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleSpecBgPhotoChange(reader.result)
      }
      setBgUploadLoading(false)
    }
    reader.onerror = () => {
      setBgUploadError("Falha ao ler o arquivo.")
      setBgUploadLoading(false)
    }
    reader.readAsDataURL(file)
  }

  async function regenBgWithAi() {
    if (bgAiPrompt.trim().length < 5) {
      setBgAiError("Prompt precisa ter pelo menos 5 chars")
      return
    }
    setBgAiError(null)
    setBgAiLoading(true)
    try {
      const res = await fetch("/api/post-unico/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ai", prompt: bgAiPrompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBgAiError(data.error ?? "erro desconhecido")
        return
      }
      handleSpecBgPhotoChange(data.url)
    } catch (err) {
      setBgAiError(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setBgAiLoading(false)
    }
  }

  async function searchBgUnsplash() {
    if (bgUnsplashQuery.trim().length < 2) {
      setBgUnsplashError("Busca precisa ter pelo menos 2 chars")
      return
    }
    setBgUnsplashError(null)
    setBgUnsplashLoading(true)
    try {
      const res = await fetch("/api/post-unico/unsplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: bgUnsplashQuery.trim(), perPage: 12 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBgUnsplashError(data.error ?? "erro desconhecido")
        return
      }
      setBgUnsplashResults(data.results ?? [])
    } catch (err) {
      setBgUnsplashError(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setBgUnsplashLoading(false)
    }
  }

  // Lê block num path (pra UI mostrar valor atual)
  function getBlockAtPath(blocks: FreeBlock[], path: string): FreeBlock | null {
    const [head, ...rest] = path.split(".").map(Number)
    const b = blocks[head]
    if (!b) return null
    if (rest.length === 0) return b
    if (b.type === "card" || b.type === "stack") {
      return getBlockAtPath(b.children, rest.join("."))
    }
    return null
  }

  function handleTemplateContentEdit(field: keyof PostContent, value: unknown) {
    if (!singlePostTemplateContent) return
    setSinglePostTemplateContent({
      ...singlePostTemplateContent,
      [field]: value,
    })
  }

  async function runSinglePostGeneration(override?: {
    briefing?: string
    skeleton?: string
    brand?: PostBrand
  }) {
    const briefing = override?.briefing ?? singlePostBriefing
    const skeletonChoice = override?.skeleton ?? singlePostSkeleton
    if (briefing.trim().length < 10) {
      setSinglePostError("Briefing precisa ter pelo menos 10 caracteres")
      return
    }
    setSinglePostError(null)
    setSinglePostLoading(true)
    // Limpa preview anterior
    setSinglePostSpec(null)
    setSinglePostTemplateContent(null)
    setSinglePostTemplateId(null)
    setSinglePostMetrics(null)

    // Monta brand — se passou override usa, senão deriva do estado
    const brand: PostBrand = override?.brand ?? {
      id: "teste-sandbox",
      name: activeBrandName ?? "Marca Demo",
      monogram: generateMonogram(activeBrandName ?? "Marca Demo"),
      profession: audience,
      brand_colors: colors,
      logo_url: null,
      phone: null,
      website: null,
      instagram_handle: handle.replace(/^@/, ""),
      tagline: null,
    }
    setSinglePostBrand(brand)

    const mode = detectMode(skeletonChoice)

    try {
      if (mode === "template") {
        // Modo template curado — usa /api/post-unico/generate
        const res = await fetch("/api/post-unico/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand,
            templateId: skeletonChoice,
            rawContent: briefing.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setSinglePostError(data.error ?? "erro desconhecido")
          return
        }
        const tid = data.template_id ?? skeletonChoice
        const tcontent = {
          ...DEMO_CONTENT[tid],
          ...data.content,
        }
        const tphoto = data.photo_url ?? null
        setSinglePostPhotoUrl(tphoto)
        setSinglePostSkeletonPicked(tid)
        setSinglePostRationale(null)
        setSinglePostMetrics({
          ms: data.metrics.ms,
          totalCostUsd: data.metrics.totalCostUsd ?? data.metrics.costUsd,
        })
        // Unificação: se o template já tem spec editável, renderiza pelo editor
        // livre (mover/fonte/tamanho por elemento). Senão, cai no PostPreview.
        const tspec = buildTemplateSpec(tid, tcontent, brand, tphoto)
        if (tspec) {
          setSinglePostSpec(tspec)
        } else {
          setSinglePostTemplateId(tid)
          setSinglePostTemplateContent(tcontent)
        }
      } else {
        // Modo skeleton (auto ou específico) — usa /api/post-unico/free-generate
        const res = await fetch("/api/post-unico/free-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand,
            briefing: briefing.trim(),
            skeleton_id: mode === "skeleton" ? skeletonChoice : null,
            exclude_skeleton_ids:
              mode === "auto" ? singlePostUsedIds.slice(-3) : [],
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setSinglePostError(data.error ?? "erro desconhecido")
          return
        }
        setSinglePostSpec(data.spec)
        setSinglePostPhotoUrl(data.photo_url ?? null)
        setSinglePostSkeletonPicked(data.skeleton_id ?? null)
        setSinglePostRationale(data.rationale ?? null)
        if (mode === "auto" && data.skeleton_id) {
          setSinglePostUsedIds((prev) =>
            prev.includes(data.skeleton_id) ? prev : [...prev, data.skeleton_id],
          )
        }
        setSinglePostMetrics({
          ms: data.metrics.ms,
          totalCostUsd: data.metrics.totalCostUsd ?? data.metrics.costUsd,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de rede"
      setSinglePostError(message)
    } finally {
      setSinglePostLoading(false)
    }
  }

  // Monta o design a partir de conteúdo JÁ aprovado no wizard (sem regenerar texto).
  async function runSinglePostApproved(args: {
    brand: PostBrand
    skeletonId: string
    content: SkeletonContent
    photoPrompt?: string | null
    photoEntity?: string | null
  }) {
    setSinglePostError(null)
    setSinglePostLoading(true)
    setSinglePostSpec(null)
    setSinglePostTemplateContent(null)
    setSinglePostTemplateId(null)
    setSinglePostMetrics(null)

    const brand = args.brand
    setSinglePostBrand(brand)
    if (typeof brand.name === "string") setActiveBrandName(brand.name)
    if (Array.isArray(brand.brand_colors) && brand.brand_colors.length === 3) {
      setColors(brand.brand_colors)
    }
    if (typeof brand.instagram_handle === "string") {
      setHandle(`@${brand.instagram_handle}`)
    }

    try {
      const res = await fetch("/api/post-unico/free-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          skeleton_id: args.skeletonId,
          approved_content: args.content,
          photo_prompt: args.photoPrompt ?? null,
          image_entity: args.photoEntity ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSinglePostError(data.error ?? "erro desconhecido")
        return
      }
      setSinglePostSpec(data.spec)
      setSinglePostPhotoUrl(data.photo_url ?? null)
      setSinglePostSkeletonPicked(data.skeleton_id ?? null)
      setSinglePostRationale(data.rationale ?? null)
      setSinglePostMetrics({
        ms: data.metrics.ms,
        totalCostUsd: data.metrics.totalCostUsd ?? data.metrics.costUsd,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de rede"
      setSinglePostError(message)
    } finally {
      setSinglePostLoading(false)
    }
  }

  async function handleSinglePostExport() {
    if (!singlePostPreviewRef.current) return
    // Esconde UI de edição (outlines roxo, cursor) durante export
    setSinglePostExporting(true)
    setSinglePostSelectedPath(null)
    // Aguarda re-render
    await new Promise((r) => setTimeout(r, 60))
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(singlePostPreviewRef.current, {
        cacheBust: true,
        canvasWidth: 1080,
        canvasHeight: 1350,
        pixelRatio: 1,
      })
      const filename = `post-unico-${Date.now()}.png`
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro no export"
      setSinglePostError(message)
    } finally {
      setSinglePostExporting(false)
    }
  }

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  /** Primeiro texto do spec livre — vira o título do post na biblioteca. */
  function titleFromSpec(spec: FreePostSpec | null): string {
    if (!spec) return ""
    const stack = [...spec.blocks]
    while (stack.length) {
      const b = stack.shift()!
      if (b.type === "text" && b.text.trim()) return b.text.trim().slice(0, 80)
      if (b.type === "card" || b.type === "stack") stack.push(...b.children)
    }
    return ""
  }

  /**
   * Foto em data URL (upload local) → sobe pro Supabase Storage antes de
   * persistir. Guardar base64 de até 5MB dentro do JSONB incharia o banco.
   * Em falha, mantém a data URL (salvar nunca quebra por causa disso).
   */
  async function maybeUploadDataUrl(url: string): Promise<string> {
    if (!url.startsWith("data:")) return url
    try {
      const blob = await (await fetch(url)).blob()
      const fd = new FormData()
      fd.append(
        "file",
        new File([blob], "upload.png", { type: blob.type || "image/png" }),
      )
      const res = await fetch("/api/editorial/upload-image", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (data?.success && typeof data.url === "string") return data.url
    } catch {}
    return url
  }

  /**
   * Salva o post único na biblioteca (tabela single_posts).
   * - Modo template: content estruturado (abre no editor completo depois).
   * - Modo livre (skeleton/free-spec): guarda o spec inteiro em content
   *   (template_id "free:<skeleton>") — a biblioteca renderiza pelo spec.
   */
  async function handleSinglePostSave() {
    const brandId = singlePostBrand?.id
    if (!brandId || !UUID_RE.test(brandId)) {
      setSinglePostError(
        "Pra salvar na biblioteca, gere o post a partir de uma marca sua (Dashboard → Criar conteúdo).",
      )
      return
    }
    const isTemplate = !!(singlePostTemplateId && singlePostTemplateContent)
    if (!isTemplate && !singlePostSpec) {
      setSinglePostError("Nada pra salvar ainda — gere um post primeiro.")
      return
    }
    setSinglePostSaving(true)
    setSinglePostError(null)
    try {
      const title =
        (isTemplate
          ? (singlePostTemplateContent?.title ?? "")
          : titleFromSpec(singlePostSpec)) ||
        singlePostBriefing.trim().slice(0, 60) ||
        "Post único"
      // Foto de fundo em data URL (upload local) → re-hospeda no Storage.
      let specToSave = singlePostSpec
      if (
        !isTemplate &&
        specToSave &&
        specToSave.background.kind === "photo" &&
        specToSave.background.photo_url?.startsWith("data:")
      ) {
        const hosted = await maybeUploadDataUrl(specToSave.background.photo_url)
        specToSave = {
          ...specToSave,
          background: { ...specToSave.background, photo_url: hosted },
        }
      }
      const content = isTemplate
        ? (singlePostTemplateContent as PostContent)
        : ({
            _free_spec: specToSave,
            _font_preset: singlePostFontPreset,
            _format: singlePostFormat,
            _photo_url: singlePostPhotoUrl,
          } as unknown as PostContent)
      const templateId = isTemplate
        ? (singlePostTemplateId as string)
        : `free:${singlePostSkeletonPicked ?? singlePostSkeleton ?? "auto"}`

      if (singlePostSavedId) {
        const res = await updateSinglePost(singlePostSavedId, {
          title,
          raw_brief: singlePostBriefing || null,
          content,
        })
        if (!res.ok) {
          setSinglePostError(res.error)
          return
        }
      } else {
        const res = await createSinglePost({
          brand_id: brandId,
          template_id: templateId,
          title,
          raw_brief: singlePostBriefing || null,
          content,
        })
        if (!res.ok) {
          setSinglePostError(res.error)
          return
        }
        setSinglePostSavedId(res.postId)
      }
      setSinglePostSaveOk(true)
      setTimeout(() => setSinglePostSaveOk(false), 2500)
    } catch (err) {
      setSinglePostError(err instanceof Error ? err.message : "erro ao salvar")
    } finally {
      setSinglePostSaving(false)
    }
  }

  interface GeneratePayload {
    topic: string
    objective: typeof DEFAULTS.objective
    tone: string
    audience: string
    visualStyle: string
    colors: string[]
    template: typeof DEFAULTS.template
    font: FontKey
    nSlides: number
    mode: typeof DEFAULTS.mode
  }

  async function runGeneration(payload: GeneratePayload) {
    setError(null)
    setResult(null)
    setLoading(true)
    setLoadingMessage("Escrevendo copy com Claude...")

    const interval = setInterval(() => {
      setLoadingMessage((prev) => {
        if (prev.includes("Claude")) return "Gerando imagens..."
        if (prev.includes("imagens")) return "Buscando fotos..."
        return "Finalizando..."
      })
    }, 7000)

    try {
      const res = await fetch("/api/teste-gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "erro desconhecido")
      } else {
        setResult(data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de rede"
      setError(message)
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  /**
   * Roteiro já aprovado no wizard → NÃO regenera o texto. Só gera as IMAGENS
   * (uma por slide, via image_prompt) e monta o resultado no mesmo formato que
   * o renderizador consome. Espelha runSinglePostApproved, mas pro carrossel.
   */
  async function runCarouselApproved(args: {
    projectTitle: string
    slides: ClaudeSlide[]
    caption: string
    mode: typeof DEFAULTS.mode
  }) {
    setError(null)
    setResult(null)
    setCarouselCaption(args.caption || null)
    setLoading(true)
    setLoadingMessage("Gerando imagens do carrossel...")

    const start = performance.now()
    const interval = setInterval(() => {
      setLoadingMessage((prev) =>
        prev.includes("imagens") ? "Finalizando arte..." : "Gerando imagens...",
      )
    }, 7000)

    try {
      const enriched: ApiSlide[] = await Promise.all(
        args.slides.map(async (slide, i) => {
          const base: ApiSlide = {
            order_index: typeof slide.order_index === "number" ? slide.order_index : i,
            title: slide.title,
            highlight_words: slide.highlight_words ?? [],
            subtitle: slide.subtitle ?? "",
            body: slide.body,
            cta_badge: slide.cta_badge,
            image: {
              url: null,
              source: null,
              attribution: null,
              error: null,
              prompt: slide.image_prompt ?? null,
              unsplashQuery: slide.unsplash_query ?? null,
              ms: 0,
              costUsd: 0,
            },
          }
          const prompt = (slide.image_prompt ?? "").trim()
          const entity = (slide.image_entity ?? "").trim()

          // 1) Se o slide é sobre uma entidade real (empresa/pessoa/marca),
          //    tenta foto/logo real na Wikipedia antes de cair pra IA.
          if (entity) {
            try {
              const wRes = await fetch("/api/post-unico/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "wikimedia", query: entity }),
              })
              const wData = await wRes.json()
              if (wRes.ok && wData?.url) {
                base.image.url = wData.url
                base.image.source = "wikimedia"
                // atribuição do Wikimedia tem shape próprio; sem overlay de crédito por ora
                base.image.attribution = null
                base.image.ms = wData.ms ?? 0
                return base
              }
              // sem foto na Wikipedia → segue pro fallback de IA abaixo
            } catch {
              // erro na busca → segue pro fallback de IA abaixo
            }
          }

          // 2) Fallback: imagem gerada por IA com o image_prompt.
          if (!prompt) return base
          try {
            const res = await fetch("/api/editorial/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt, aspectRatio: "4:5" }),
            })
            const data = await res.json()
            if (!res.ok || !data?.success) {
              base.image.error = data?.error ?? "falha ao gerar imagem"
              return base
            }
            base.image.url = data.url
            base.image.source = "ai"
            base.image.ms = data.ms ?? 0
            return base
          } catch (err) {
            base.image.error =
              err instanceof Error ? err.message : "erro de rede"
            return base
          }
        }),
      )

      const totalMs = performance.now() - start
      setResult({
        project_title: args.projectTitle || "Carrossel",
        slides: enriched,
        metrics: {
          claude: {
            ms: 0,
            inputTokens: 0,
            outputTokens: 0,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
            costUsd: 0,
          },
          images: { totalCostUsd: 0, parallelMs: totalMs },
          total: { ms: totalMs, costUsd: 0 },
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao montar carrossel")
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  function onGenerate() {
    void runGeneration({
      topic,
      objective,
      tone,
      audience,
      visualStyle,
      colors,
      template,
      font,
      nSlides,
      mode,
    })
  }

  useEffect(() => {
    if (autoRunStartedRef.current) return
    if (typeof window === "undefined") return

    // Primeiro: payload de post-único vindo do /dashboard/criar/post-unico
    let postUnicoRaw: string | null = null
    try {
      postUnicoRaw = sessionStorage.getItem("syncpost_pending_post_unico")
    } catch {}
    if (postUnicoRaw) {
      try {
        sessionStorage.removeItem("syncpost_pending_post_unico")
      } catch {}
      try {
        const p = JSON.parse(postUnicoRaw)
        if (p && typeof p === "object" && p.brand) {
          autoRunStartedRef.current = true
          setPageMode("post-unico")
          if (typeof p.brand.name === "string") setActiveBrandName(p.brand.name)
          if (Array.isArray(p.brand.brand_colors) && p.brand.brand_colors.length === 3) {
            setColors(p.brand.brand_colors)
          }
          if (typeof p.brand.instagram_handle === "string") {
            setHandle(`@${p.brand.instagram_handle}`)
          }
          // Conteúdo já aprovado no wizard → monta design + foto sem regenerar texto
          if (p.kind === "approved" && p.approvedContent && typeof p.skeletonId === "string") {
            setSinglePostBriefing(typeof p.briefing === "string" ? p.briefing : "")
            setSinglePostSkeleton(p.skeletonId)
            if (p.autoRun) {
              void runSinglePostApproved({
                brand: p.brand as PostBrand,
                skeletonId: p.skeletonId,
                content: p.approvedContent,
                photoPrompt: typeof p.photoPrompt === "string" ? p.photoPrompt : null,
                photoEntity: typeof p.photoEntity === "string" ? p.photoEntity : null,
              })
            }
            return
          }
          const briefing = (p.kind === "template" ? p.rawContent : p.briefing) as string
          const skeleton = p.kind === "template" && typeof p.templateId === "string"
            ? p.templateId
            : "auto"
          if (typeof briefing === "string") setSinglePostBriefing(briefing)
          setSinglePostSkeleton(skeleton)
          if (p.autoRun && typeof briefing === "string" && briefing.trim().length >= 10) {
            // Passa override pra evitar dependência de state async
            void runSinglePostGeneration({
              briefing,
              skeleton,
              brand: p.brand as PostBrand,
            })
          }
        }
      } catch {}
      return
    }

    let raw: string | null = null
    try {
      raw = sessionStorage.getItem("syncpost_pending_generation")
    } catch {
      return
    }
    if (!raw) return
    try {
      sessionStorage.removeItem("syncpost_pending_generation")
    } catch {}
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    if (!parsed || typeof parsed !== "object") return
    autoRunStartedRef.current = true

    // Roteiro aprovado no wizard → só gera imagens (não regenera o texto).
    if (parsed.kind === "approved" && Array.isArray(parsed.slides)) {
      setPageMode("carrossel")
      if (typeof parsed.brandName === "string" && parsed.brandName) {
        setActiveBrandName(parsed.brandName)
      }
      const approvedColors = Array.isArray(parsed.colors)
        ? parsed.colors.filter((c: unknown): c is string => typeof c === "string").slice(0, 3)
        : null
      if (approvedColors && approvedColors.length === 3) setColors(approvedColors)
      if (parsed.autoRun) {
        void runCarouselApproved({
          projectTitle: typeof parsed.projectTitle === "string" ? parsed.projectTitle : "",
          slides: parsed.slides as ClaudeSlide[],
          caption: typeof parsed.caption === "string" ? parsed.caption : "",
          mode,
        })
      }
      return
    }

    const sanitizedColors = Array.isArray(parsed.colors)
      ? parsed.colors.filter((c: unknown): c is string => typeof c === "string").slice(0, 3)
      : DEFAULTS.colors
    const colorsFinal =
      sanitizedColors.length === 3
        ? sanitizedColors
        : [...sanitizedColors, ...DEFAULTS.colors].slice(0, 3)

    const next: GeneratePayload = {
      topic: typeof parsed.topic === "string" && parsed.topic.length >= 10 ? parsed.topic : DEFAULTS.topic,
      objective: ["sell", "inform", "engage", "community"].includes(parsed.objective)
        ? parsed.objective
        : DEFAULTS.objective,
      tone: typeof parsed.tone === "string" && parsed.tone.trim() ? parsed.tone : DEFAULTS.tone,
      audience:
        typeof parsed.audience === "string" && parsed.audience.trim()
          ? parsed.audience
          : DEFAULTS.audience,
      visualStyle:
        typeof parsed.visualStyle === "string" && parsed.visualStyle.trim()
          ? parsed.visualStyle
          : DEFAULTS.visualStyle,
      colors: colorsFinal,
      template: ["editorial", "cinematic", "hybrid"].includes(parsed.template)
        ? parsed.template
        : DEFAULTS.template,
      font: parsed.font in FONTS ? (parsed.font as FontKey) : DEFAULTS.font,
      nSlides:
        Number.isInteger(parsed.nSlides) && parsed.nSlides >= 3 && parsed.nSlides <= 20
          ? parsed.nSlides
          : DEFAULTS.nSlides,
      mode: ["all_ai", "smart_mix", "all_unsplash"].includes(parsed.mode)
        ? parsed.mode
        : DEFAULTS.mode,
    }

    setTopic(next.topic)
    setObjective(next.objective)
    setTone(next.tone)
    setAudience(next.audience)
    setVisualStyle(next.visualStyle)
    setColors(next.colors)
    setTemplate(next.template)
    setFont(next.font)
    setNSlides(next.nSlides)
    setMode(next.mode)
    if (typeof parsed.brandName === "string" && parsed.brandName) {
      setActiveBrandName(parsed.brandName)
    }

    if (parsed.autoRun) {
      void runGeneration(next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fontEntry = FONTS[font]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            asChild
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 shrink-0"
            title="Voltar pro dashboard"
            aria-label="Voltar pro dashboard"
          >
            <a href="/dashboard">
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </a>
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold leading-tight truncate">
              <span className="hidden sm:inline">
                {pageMode === "carrossel" ? "Editor de carrossel" : "Editor de post único"}
              </span>
              <span className="sm:hidden">
                {pageMode === "carrossel" ? "Carrossel" : "Post único"}
              </span>
              {activeBrandName && (
                <span className="ml-1.5 sm:ml-2 text-text-muted font-normal text-[11px] sm:text-sm">
                  · {activeBrandName}
                </span>
              )}
            </h1>
            <p className="hidden sm:block text-[11px] text-muted-foreground">
              Salve na biblioteca pra não perder o que criou.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
        {pageMode === "post-unico" && (singlePostSpec || singlePostTemplateId) && (
          <>
          <Button
            type="button"
            onClick={handleSinglePostSave}
            disabled={singlePostSaving}
            size="sm"
            variant={singlePostSaveOk ? "outline" : "default"}
            className="h-8 shrink-0"
          >
            {singlePostSaving ? (
              <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" />
            ) : singlePostSaveOk ? (
              <Check className="w-4 h-4 sm:mr-1.5 text-emerald-500" />
            ) : (
              <Save className="w-4 h-4 sm:mr-1.5" />
            )}
            <span className="hidden sm:inline">
              {singlePostSaving
                ? "Salvando…"
                : singlePostSaveOk
                  ? "Salvo!"
                  : singlePostSavedId
                    ? "Salvar alterações"
                    : "Salvar na biblioteca"}
            </span>
          </Button>
          <Button
            type="button"
            onClick={handleSinglePostExport}
            disabled={singlePostExporting}
            size="sm"
            className="h-8 bg-primary text-white hover:bg-primary/90 shrink-0"
          >
            <Download className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">
              {singlePostExporting ? "Exportando..." : "Exportar PNG"}
            </span>
          </Button>
          </>
        )}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-background-secondary/60 border border-border-subtle">
          <button
            type="button"
            onClick={() => setPageMode("carrossel")}
            className={`flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
              pageMode === "carrossel"
                ? "bg-brand-600 text-[#0e0e0e]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <GalleryHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Carrossel</span>
          </button>
          <button
            type="button"
            onClick={() => setPageMode("post-unico")}
            className={`flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 px-2 sm:px-3 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
              pageMode === "post-unico"
                ? "bg-lime text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Post único</span>
          </button>
        </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 min-h-[calc(100vh-65px)] pb-16 lg:pb-0 ${
          pageMode === "post-unico"
            ? "lg:grid-cols-[380px_1fr_340px]"
            : "lg:grid-cols-[400px_1fr]"
        }`}
      >
        {pageMode === "carrossel" ? (
        <aside
          className={`${mobilePanel === "form" ? "block" : "hidden lg:block"} lg:border-r border-border p-4 sm:p-6 pb-20 lg:pb-6 space-y-5 overflow-y-auto`}
        >
          <div className="space-y-2">
            <Label>Tema do carrossel</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="Sobre o que vai ser o carrossel?"
            />
          </div>

          <CardChoiceGroup
            label="Objetivo"
            options={OBJECTIVES}
            value={objective}
            onChange={(v) => setObjective(v as typeof DEFAULTS.objective)}
          />

          <div className="space-y-2">
            <Label>Tom de voz</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Estilo visual</Label>
            <Input
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cores da marca (3)</Label>
            <div className="flex gap-2">
              {colors.map((c, i) => (
                <div key={i} className="flex-1 space-y-1">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => {
                      const next = [...colors]
                      next[i] = e.target.value
                      setColors(next)
                    }}
                    className="w-full h-10 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <p className="text-[10px] font-mono text-center text-muted-foreground">
                    {c.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <CardChoiceGroup
            label="Template"
            options={TEMPLATES}
            value={template}
            onChange={(v) => setTemplate(v as typeof DEFAULTS.template)}
          />

          {template === "editorial" && (
            <>
              <div className="space-y-2">
                <Label>Estilo Editorial</Label>
                <select
                  value={editorialStyle}
                  onChange={(e) => setEditorialStyle(e.target.value as EditorialStyleKey)}
                  className="w-full h-9 rounded-md bg-transparent border border-border px-3 text-sm"
                >
                  {EDITORIAL_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} — {s.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Handle (pills/avatar)</Label>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@brand"
                />
              </div>

              {editorialStyle === "auto" && (
                <div className="space-y-2">
                  <Label>Cores de fundo dos splits (auto)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <input
                        type="color"
                        value={lightBg}
                        onChange={(e) => setLightBg(e.target.value)}
                        className="w-full h-10 rounded border border-border bg-transparent cursor-pointer"
                      />
                      <p className="text-[10px] font-mono text-center text-muted-foreground">
                        claro · {lightBg.toUpperCase()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <input
                        type="color"
                        value={darkBg}
                        onChange={(e) => setDarkBg(e.target.value)}
                        className="w-full h-10 rounded border border-border bg-transparent cursor-pointer"
                      />
                      <p className="text-[10px] font-mono text-center text-muted-foreground">
                        escuro · {darkBg.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Splits alternam entre claro e escuro pra dar variedade visual.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Tipografia</Label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value as FontKey)}
              className="w-full h-9 rounded-md bg-transparent border border-border px-3 text-sm"
            >
              {Object.entries(FONTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Número de slides</Label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNSlides(n)}
                  className={`h-9 rounded-md border text-sm font-medium ${
                    n === nSlides
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <CardChoiceGroup
            label="Modo de geração"
            options={MODES}
            value={mode}
            onChange={(v) => setMode(v as typeof DEFAULTS.mode)}
          />

          <Button
            type="button"
            onClick={onGenerate}
            disabled={loading || topic.trim().length < 10}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {loadingMessage || "Gerando..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar carrossel
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive whitespace-pre-wrap font-mono">
              {error}
            </div>
          )}
        </aside>
        ) : (
        <aside
          className={`${mobilePanel === "form" ? "block" : "hidden lg:block"} lg:border-r border-border p-4 sm:p-6 pb-20 lg:pb-6 space-y-5 overflow-y-auto`}
        >
          <div className="space-y-2">
            <Label>Briefing</Label>
            <Textarea
              value={singlePostBriefing}
              onChange={(e) => setSinglePostBriefing(e.target.value)}
              rows={5}
              placeholder="Ex: vagas abertas pra instrutor de muay thai, 30% off em planos no mês da transformação, comunicado de feriado..."
            />
            <p className="text-[11px] text-muted-foreground">
              Mín 10 caracteres. A IA escolhe o skeleton e gera o conteúdo (incluindo foto via Fal.ai quando faz sentido).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            <select
              value={singlePostSkeleton}
              onChange={(e) => setSinglePostSkeleton(e.target.value)}
              className="w-full h-9 rounded-md bg-background-secondary border border-border px-3 text-sm text-text-primary"
              style={{ colorScheme: "dark" }}
            >
              <option value="auto">⚡ Auto (skeleton aleatório)</option>
              <optgroup label="── Skeletons (modo livre) ──">
                {SKELETONS.map((s) => (
                  <option key={s.meta.id} value={s.meta.id}>
                    {s.meta.name}
                  </option>
                ))}
              </optgroup>
              {Object.entries(
                POST_TEMPLATES.reduce<Record<string, typeof POST_TEMPLATES>>(
                  (acc, t) => {
                    acc[t.category] ??= []
                    acc[t.category].push(t)
                    return acc
                  },
                  {},
                ),
              ).map(([cat, items]) => (
                <optgroup key={cat} label={`── ${CATEGORY_LABELS[cat] ?? cat} ──`}>
                  {items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              <strong>Skeletons</strong> = layouts livres com flow dinâmico.{" "}
              <strong>Categorias</strong> = templates curados com layout fixo.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Cores da marca (3)</Label>
            <div className="flex gap-2">
              {colors.map((c, i) => (
                <div key={i} className="flex-1 space-y-1">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => {
                      const next = [...colors]
                      next[i] = e.target.value
                      setColors(next)
                    }}
                    className="w-full h-10 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <p className="text-[10px] font-mono text-center text-muted-foreground">
                    {c.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Handle</Label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@brand"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipografia</Label>
            <select
              value={singlePostFontPreset}
              onChange={(e) => setSinglePostFontPreset(e.target.value)}
              className="w-full h-9 rounded-md bg-background-secondary border border-border px-3 text-sm text-text-primary"
              style={{ colorScheme: "dark" }}
            >
              {FONT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              {FONT_PRESETS.find((p) => p.id === singlePostFontPreset)
                ?.description}{" "}
              · só skeletons (templates curados ignoram)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSinglePostFormat("post")}
                className={`h-9 rounded-md border text-xs font-medium ${
                  singlePostFormat === "post"
                    ? "border-brand-500 bg-brand-500/10 text-brand-300"
                    : "border-border text-muted-foreground hover:border-brand-500/40"
                }`}
              >
                Post 4:5
              </button>
              <button
                type="button"
                onClick={() => setSinglePostFormat("story")}
                className={`h-9 rounded-md border text-xs font-medium ${
                  singlePostFormat === "story"
                    ? "border-brand-500 bg-brand-500/10 text-brand-300"
                    : "border-border text-muted-foreground hover:border-brand-500/40"
                }`}
              >
                Story 9:16
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {singlePostFormat === "post"
                ? "1080×1350 (feed Instagram)"
                : "1080×1920 (Stories/Reels)"}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void runSinglePostGeneration()}
            disabled={singlePostLoading || singlePostBriefing.trim().length < 10}
            className="w-full h-11 bg-lime text-white hover:bg-lime/90"
          >
            {singlePostLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                IA improvisando...
              </>
            ) : singlePostSpec ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar nova variação
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Gerar post único
              </>
            )}
          </Button>

          {singlePostError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive whitespace-pre-wrap">
              {singlePostError}
            </div>
          )}

          {singlePostMetrics && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <Clock className="w-3 h-3" />
                {(singlePostMetrics.ms / 1000).toFixed(1)}s
                <DollarSign className="w-3 h-3" />
                {singlePostMetrics.totalCostUsd.toFixed(4)}
              </div>
              {singlePostSkeletonPicked && (
                <div className="font-mono text-[10px]">
                  Skeleton: {singlePostSkeletonPicked}
                </div>
              )}
              {singlePostPhotoUrl && (
                <div className="text-lime text-[10px]">✓ Foto Flux Schnell</div>
              )}
              {singlePostSkeleton === "auto" && singlePostUsedIds.length > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-[10px]">
                    Já usados: {singlePostUsedIds.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSinglePostUsedIds([])}
                    className="text-[10px] text-brand-400 hover:text-brand-300"
                  >
                    limpar histórico
                  </button>
                </div>
              )}
            </div>
          )}

          {singlePostRationale && (
            <div className="rounded-lg border border-lime/30 bg-lime/5 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-lime font-bold">
                Conceito da IA
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">
                {singlePostRationale}
              </p>
            </div>
          )}

          {(singlePostSpec || singlePostTemplateId) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSinglePostExport}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PNG
            </Button>
          )}
        </aside>
        )}

        {pageMode === "carrossel" ? (
        <main
          className={`${mobilePanel === "preview" ? "block" : "hidden lg:block"} p-4 sm:p-6 pb-20 lg:pb-6 overflow-y-auto`}
        >
          {!result && !loading && (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>
                  Configure os parâmetros à esquerda e clique em &quot;Gerar
                  carrossel&quot;.
                </p>
                <p className="text-xs mt-1">
                  Sandbox descartável. Pra salvar no banco use{" "}
                  <a href="/dashboard/criar/ia" className="text-primary underline">
                    /dashboard/criar/ia
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-lg font-medium">{loadingMessage}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  ~10-30s no total. Imagens em paralelo.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{result.project_title}</h2>
                <MetricsBar metrics={result.metrics} />
              </div>

              {carouselCaption && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Legenda do Instagram
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(carouselCaption)
                      }}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {carouselCaption}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {result.slides.map((slide) => (
                  <div key={slide.order_index} className="space-y-2 group">
                    <div className="relative">
                      <div
                        className="cursor-zoom-in transition-transform hover:scale-[1.02]"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("a, button")) {
                            return
                          }
                          setLightboxIndex(slide.order_index)
                        }}
                      >
                        <SlidePreview
                          slide={slide}
                          totalSlides={result.slides.length}
                          template={template}
                          brandColors={colors}
                          fontClass={fontEntry.className}
                          editorialStyle={editorialStyle as EditorialStyle}
                          handle={handle}
                          lightBg={lightBg}
                          darkBg={darkBg}
                          showDevBadges
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingIndex(slide.order_index)
                        }}
                        className="absolute top-2 right-2 z-30 px-2.5 py-1 rounded-md bg-white/95 text-black text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-white"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                    </div>
                    <details className="text-[10px] text-muted-foreground bg-card rounded p-2 border border-border">
                      <summary className="cursor-pointer font-medium select-none">
                        Slide {slide.order_index + 1} — debug
                      </summary>
                      <div className="space-y-1 mt-2 font-mono">
                        <p>
                          <span className="text-foreground">source:</span>{" "}
                          {slide.image.source ?? "FAILED"}
                        </p>
                        <p>
                          <span className="text-foreground">ms:</span>{" "}
                          {slide.image.ms.toFixed(0)}
                        </p>
                        <p>
                          <span className="text-foreground">cost:</span> $
                          {slide.image.costUsd.toFixed(4)}
                        </p>
                        {slide.image.prompt && (
                          <p className="break-words">
                            <span className="text-foreground">prompt:</span>{" "}
                            {slide.image.prompt}
                          </p>
                        )}
                        {slide.image.unsplashQuery && (
                          <p>
                            <span className="text-foreground">query:</span>{" "}
                            {slide.image.unsplashQuery}
                          </p>
                        )}
                        {slide.image.error && (
                          <p className="text-destructive break-words">
                            <span className="text-foreground">erro:</span>{" "}
                            {slide.image.error}
                          </p>
                        )}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        ) : (
        <main
          className={`${mobilePanel === "preview" ? "flex" : "hidden lg:flex"} p-3 sm:p-6 pb-20 lg:pb-6 overflow-y-auto items-start justify-center`}
        >
          <div className="w-full max-w-[420px] sm:max-w-md lg:max-w-[440px]">
            {finalSpec ? (
              <div ref={singlePostPreviewRef} className="bg-black rounded-xl overflow-hidden">
                <FreePostRenderer
                  spec={finalSpec}
                  format={singlePostFormat}
                  editable={!singlePostExporting}
                  selectedPath={singlePostSelectedPath}
                  onSelectBlock={setSinglePostSelectedPath}
                  onPositionChange={handleSpecPositionChange}
                />
              </div>
            ) : singlePostTemplateId && singlePostTemplateContent && singlePostBrand ? (
              <div ref={singlePostPreviewRef} className="bg-black rounded-xl overflow-hidden">
                <PostPreview
                  templateId={singlePostTemplateId}
                  brand={singlePostBrand}
                  content={singlePostTemplateContent}
                  format={singlePostFormat}
                  fontPreset={singlePostFontPreset}
                />
              </div>
            ) : (
              <div className="aspect-[4/5] w-full rounded-xl border-2 border-dashed border-border bg-background-secondary/40 flex items-center justify-center text-center p-8">
                <div className="space-y-3 text-text-muted">
                  <Wand2 className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-sm">
                    {singlePostLoading
                      ? "IA improvisando layout + gerando foto..."
                      : "Descreva o briefing à esquerda e clique em Gerar"}
                  </p>
                </div>
              </div>
            )}
            {(singlePostSkeletonPicked || singlePostTemplateId) && (
              <div className="mt-2 rounded-md bg-card border border-border px-3 py-2">
                <p className="text-[11px] font-mono text-brand-400 leading-tight">
                  {singlePostTemplateId ?? singlePostSkeletonPicked}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {singlePostSpec
                    ? `Skeleton (livre) · ${singlePostSpec.blocks.length} blocks · 1080×1350`
                    : "Template curado · 1080×1350"}
                </p>
              </div>
            )}
          </div>
        </main>
        )}

        {pageMode === "post-unico" && (
          <aside
            className={`${mobilePanel === "editor" ? "block" : "hidden lg:block"} lg:border-l border-border p-4 sm:p-5 pb-20 lg:pb-5 space-y-3 overflow-y-auto bg-background-secondary/20`}
          >
            <div className="flex items-center gap-1.5 pb-2 border-b border-border">
              <Pencil className="w-3.5 h-3.5 text-brand-400" />
              <p className="text-[11px] uppercase tracking-wider text-text-secondary font-bold">
                Editor
              </p>
            </div>

            {singlePostSpec && (
              <p className="text-[10px] text-brand-300 bg-brand-950/30 border border-brand-900/40 rounded px-2 py-1.5">
                <span className="font-semibold">Dica:</span> clique e arraste qualquer
                bloco no preview pra reposicionar. Os contornos tracejados marcam o que
                pode ser arrastado.
                {singlePostSelectedPath && (
                  <span className="block mt-1 text-text-muted font-mono">
                    selecionado: {singlePostSelectedPath}
                  </span>
                )}
              </p>
            )}

            {!singlePostSpec && !singlePostTemplateId && (
              <p className="text-xs text-text-muted py-8 text-center">
                Gere um post pra começar a editar.
              </p>
            )}

            {/* Trocar foto de fundo */}
            {singlePostSpec && singlePostSpec.background.kind === "photo" && (
              <div className="space-y-2 pb-2 border-b border-border-subtle">
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                  Foto de fundo
                </p>
                {singlePostSpec.background.photo_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setBgPhotoTab("upload")
                      bgUploadInputRef.current?.click()
                    }}
                    title="Clique pra trocar a foto (upload do seu dispositivo)"
                    className="group relative block w-full h-24 rounded-md border border-border-subtle overflow-hidden"
                  >
                    <img
                      src={singlePostSpec.background.photo_url}
                      alt="Foto atual"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 bg-black/0 group-hover:bg-black/55 transition">
                      <Download className="w-3.5 h-3.5 rotate-180" /> Trocar (upload)
                    </span>
                  </button>
                )}
                {/* Input de upload sempre montado — permite acionar pela miniatura acima */}
                <input
                  ref={bgUploadInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleBgUpload(file)
                    e.target.value = ""
                  }}
                />
                <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-background-secondary/40 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setBgPhotoTab("unsplash")}
                    className={`text-[10px] h-6 rounded transition-colors ${
                      bgPhotoTab === "unsplash"
                        ? "bg-brand-600 text-[#0e0e0e]"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Unsplash
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgPhotoTab("ai")}
                    className={`text-[10px] h-6 rounded transition-colors ${
                      bgPhotoTab === "ai"
                        ? "bg-brand-600 text-[#0e0e0e]"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    IA
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgPhotoTab("upload")}
                    className={`text-[10px] h-6 rounded transition-colors ${
                      bgPhotoTab === "upload"
                        ? "bg-brand-600 text-[#0e0e0e]"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Upload
                  </button>
                </div>

                {bgPhotoTab === "unsplash" && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      <Input
                        value={bgUnsplashQuery}
                        onChange={(e) => setBgUnsplashQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            void searchBgUnsplash()
                          }
                        }}
                        placeholder="ex: lawyer office, gym interior"
                        className="text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void searchBgUnsplash()}
                        disabled={bgUnsplashLoading}
                        className="h-8 px-2 text-xs"
                      >
                        {bgUnsplashLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Buscar"
                        )}
                      </Button>
                    </div>
                    {bgUnsplashError && (
                      <p className="text-[10px] text-destructive">{bgUnsplashError}</p>
                    )}
                    {bgUnsplashResults.length > 0 && (
                      <div className="grid grid-cols-3 gap-1">
                        {bgUnsplashResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSpecBgPhotoChange(p.fullUrl)}
                            title={`Foto de ${p.photographerName}`}
                            className="relative aspect-[3/4] rounded overflow-hidden border border-border-subtle hover:border-brand-500 transition-colors"
                          >
                            <img
                              src={p.thumbUrl}
                              alt={p.photographerName}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {bgUnsplashResults.length === 0 && !bgUnsplashLoading && (
                      <p className="text-[10px] text-text-muted">
                        Digite uma busca em inglês e aperte enter.
                      </p>
                    )}
                  </div>
                )}

                {bgPhotoTab === "ai" && (
                  <div className="space-y-2">
                    <Textarea
                      value={bgAiPrompt}
                      onChange={(e) => setBgAiPrompt(e.target.value)}
                      placeholder="Prompt em INGLÊS — assunto + iluminação + mood. Ex: professional lawyer portrait, dramatic side lighting, dark navy backdrop, editorial photography"
                      rows={3}
                      className="text-xs"
                    />
                    {bgAiError && (
                      <p className="text-[10px] text-destructive">{bgAiError}</p>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void regenBgWithAi()}
                      disabled={bgAiLoading}
                      className="w-full h-8 text-xs"
                    >
                      {bgAiLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        "Gerar nova imagem"
                      )}
                    </Button>
                    <p className="text-[9px] text-text-muted">
                      Flux Schnell · ~3-6s · ~$0.003 por geração
                    </p>
                  </div>
                )}

                {bgPhotoTab === "upload" && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => bgUploadInputRef.current?.click()}
                      disabled={bgUploadLoading}
                      className="w-full h-20 rounded-md border-2 border-dashed border-border hover:border-brand-500 hover:bg-brand-950/10 transition-colors flex flex-col items-center justify-center gap-1 text-text-muted hover:text-brand-300"
                    >
                      {bgUploadLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4 rotate-180" />
                          <span className="text-[10px]">Clique pra escolher</span>
                        </>
                      )}
                    </button>
                    {bgUploadError && (
                      <p className="text-[10px] text-destructive">{bgUploadError}</p>
                    )}
                    <p className="text-[9px] text-text-muted">
                      JPG, PNG ou WebP · máx 5MB · fica só no navegador (sandbox)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Edit painel — skeleton */}
            {singlePostSpec && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    Textos
                  </p>
                  {singlePostSpec.blocks.some(
                    (b) => b.type === "stack" || b.type === "card",
                  ) && (
                    <button
                      type="button"
                      onClick={handleDetachAllGroups}
                      title="Quebra todos os grupos pra mover cada item individualmente"
                      className="text-[9px] text-brand-400 hover:text-brand-300 px-1.5 py-0.5 rounded border border-brand-700 hover:border-brand-500"
                    >
                      ✂ Soltar tudo
                    </button>
                  )}
                </div>
                {(() => {
                  const items = collectEditableTexts(singlePostSpec.blocks)
                  let textIdx = 0
                  let pillIdx = 0
                  return items.map((entry) => {
                    let label: string
                    if (entry.kind === "text") {
                      textIdx++
                      label = `Texto ${textIdx}`
                    } else {
                      pillIdx++
                      label = `Pill ${pillIdx}`
                    }
                    const block = getBlockAtPath(singlePostSpec.blocks, entry.path)
                    const scale =
                      (block && (block.type === "text" || block.type === "pill")
                        ? block.font_size_scale
                        : undefined) ?? 1
                    const align =
                      block && block.type === "text" ? (block.text_align ?? "left") : null
                    const fontVal =
                      block && (block.type === "text" || block.type === "pill")
                        ? (block.font ?? "")
                        : null
                    const isInGroup = entry.path.includes(".")
                    const textColor =
                      block && block.type === "text" ? block.color : null
                    const pillFg =
                      block && block.type === "pill" ? block.fg : null
                    const pillBg =
                      block && block.type === "pill" ? block.bg : null
                    return (
                      <div
                        key={entry.path}
                        className="space-y-1.5 p-2 rounded-md border border-border-subtle bg-background-secondary/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-[10px] text-muted-foreground">
                            {label}
                            {isInGroup && (
                              <span className="text-text-muted ml-1">(em grupo)</span>
                            )}
                          </Label>
                          <div className="flex items-center gap-1">
                            {isInGroup && (
                              <button
                                type="button"
                                onClick={() => handleDetachBlock(entry.path)}
                                title="Soltar do grupo pra mover individualmente"
                                className="text-[9px] text-brand-400 hover:text-brand-300 px-1.5 py-0.5 rounded border border-brand-700 hover:border-brand-500"
                              >
                                ✂ Soltar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(entry.path)}
                              title="Excluir esse bloco"
                              className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded border border-red-900 hover:border-red-500"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                        <Textarea
                          value={entry.text}
                          onChange={(e) => handleSpecTextEdit(entry.path, e.target.value)}
                          rows={Math.min(4, Math.ceil(entry.text.length / 40) + 1)}
                          className="text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-text-muted w-10 shrink-0">
                            tamanho
                          </span>
                          <input
                            type="range"
                            min={0.5}
                            max={2}
                            step={0.05}
                            value={scale}
                            onChange={(e) =>
                              handleSpecBlockPatch(entry.path, {
                                font_size_scale: parseFloat(e.target.value),
                              })
                            }
                            className="flex-1 h-1 accent-brand-500"
                          />
                          <span className="text-[9px] text-text-muted w-8 text-right tabular-nums">
                            {scale.toFixed(2)}x
                          </span>
                          {scale !== 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSpecBlockPatch(entry.path, { font_size_scale: 1 })
                              }
                              className="text-[9px] text-brand-400 hover:text-brand-300"
                            >
                              reset
                            </button>
                          )}
                        </div>
                        {fontVal !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-text-muted w-10 shrink-0">
                              fonte
                            </span>
                            <select
                              value={fontVal}
                              onChange={(e) =>
                                handleSpecBlockPatch(entry.path, { font: e.target.value })
                              }
                              className="flex-1 h-7 rounded-md bg-background-secondary border border-border px-2 text-[11px] text-text-primary"
                              style={{ colorScheme: "dark" }}
                            >
                              {[
                                ["inter", "Inter"],
                                ["inter_bold", "Inter Bold"],
                                ["playfair", "Playfair"],
                                ["playfair_italic", "Playfair Italic"],
                                ["anton", "Anton"],
                                ["bebas", "Bebas Neue"],
                                ["montserrat", "Montserrat"],
                                ["archivo", "Archivo Black"],
                                ["grotesk", "Space Grotesk"],
                                ["allura", "Allura (script)"],
                              ].map(([val, lbl]) => (
                                <option key={val} value={val}>
                                  {lbl}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {align !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-text-muted w-10 shrink-0">
                              align
                            </span>
                            <div className="flex flex-1 gap-1">
                              {(["left", "center", "right"] as const).map((a) => (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() =>
                                    handleSpecBlockPatch(entry.path, { text_align: a })
                                  }
                                  className={`flex-1 h-6 text-[10px] rounded border ${
                                    align === a
                                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                                      : "border-border text-text-muted hover:text-text-primary"
                                  }`}
                                >
                                  {a}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {textColor !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-text-muted w-10 shrink-0">
                              cor
                            </span>
                            <input
                              type="color"
                              value={normalizeHex(textColor)}
                              onChange={(e) =>
                                handleSpecBlockPatch(entry.path, { color: e.target.value })
                              }
                              className="w-7 h-6 rounded border border-border bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={textColor}
                              onChange={(e) =>
                                handleSpecBlockPatch(entry.path, { color: e.target.value })
                              }
                              className="flex-1 h-6 text-[10px] font-mono px-1.5 rounded border border-border bg-background-secondary"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        )}
                        {pillFg !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-text-muted w-10 shrink-0">
                              texto
                            </span>
                            <input
                              type="color"
                              value={normalizeHex(pillFg)}
                              onChange={(e) =>
                                handleSpecBlockPatch(entry.path, { fg: e.target.value })
                              }
                              className="w-7 h-6 rounded border border-border bg-transparent cursor-pointer"
                            />
                            <span className="text-[9px] text-text-muted w-7 shrink-0 ml-1">
                              fundo
                            </span>
                            <input
                              type="color"
                              value={normalizeHex(pillBg ?? "#000000")}
                              onChange={(e) =>
                                handleSpecBlockPatch(entry.path, { bg: e.target.value })
                              }
                              className="w-7 h-6 rounded border border-border bg-transparent cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            )}

            {/* Edit painel — template */}
            {singlePostTemplateId && singlePostTemplateContent && (
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted bg-background-secondary/40 border border-border-subtle rounded px-2 py-1.5">
                  <span className="font-semibold">Modo template.</span> Edite só os
                  campos abaixo. Pra mover blocos / mudar fonte por bloco use o modo
                  livre (escolha "auto" ou um skeleton no modelo).
                </p>
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold pt-1">
                  Campos
                </p>
                {Object.entries(singlePostTemplateContent)
                  .filter(
                    ([k, v]) =>
                      typeof v === "string" &&
                      !k.endsWith("_url") &&
                      k !== "image_url" &&
                      !!v,
                  )
                  .map(([field, value]) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-mono capitalize">
                        {field.replace(/_/g, " ")}
                      </Label>
                      {(value as string).length > 60 ? (
                        <Textarea
                          value={value as string}
                          onChange={(e) =>
                            handleTemplateContentEdit(
                              field as keyof PostContent,
                              e.target.value,
                            )
                          }
                          rows={3}
                          className="text-xs"
                        />
                      ) : (
                        <Input
                          value={value as string}
                          onChange={(e) =>
                            handleTemplateContentEdit(
                              field as keyof PostContent,
                              e.target.value,
                            )
                          }
                          className="text-xs"
                        />
                      )}
                    </div>
                  ))}
                {Object.entries(singlePostTemplateContent)
                  .filter(([, v]) => Array.isArray(v))
                  .map(([field, value]) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-mono capitalize">
                        {field.replace(/_/g, " ")} (separado por |)
                      </Label>
                      <Input
                        value={(value as string[]).join(" | ")}
                        onChange={(e) =>
                          handleTemplateContentEdit(
                            field as keyof PostContent,
                            e.target.value
                              .split("|")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          )
                        }
                        className="text-xs"
                      />
                    </div>
                  ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom nav (mobile only, lg:hidden) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        aria-label="Navegação"
      >
        <div className="grid grid-cols-3 h-14 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobilePanel("form")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              mobilePanel === "form"
                ? "text-brand-400"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Configurar
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("preview")}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              mobilePanel === "preview"
                ? "text-brand-400"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Square className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("editor")}
            disabled={
              pageMode === "post-unico" && !singlePostSpec && !singlePostTemplateId
            }
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              mobilePanel === "editor"
                ? "text-brand-400"
                : "text-text-muted hover:text-text-primary"
            }`}
            title={
              pageMode === "carrossel"
                ? "Editor disponível só no modo Post Único"
                : ""
            }
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        </div>
      </nav>

      {editingIndex !== null && result && (
        <SlideEditorModal
          slide={result.slides[editingIndex]}
          totalSlides={result.slides.length}
          onSave={(updated) => {
            const newSlides = [...result.slides]
            newSlides[editingIndex] = {
              ...newSlides[editingIndex],
              ...updated,
              // preserva os metadados da imagem (prompt/query/ms/cost) que o
              // modal não carrega, aplicando só url/source/attribution/error.
              image: { ...newSlides[editingIndex].image, ...updated.image },
            }
            setResult({ ...result, slides: newSlides })
          }}
          onClose={() => setEditingIndex(null)}
        />
      )}

      {lightboxIndex !== null && result && (
        <CarouselLightbox
          slides={result.slides}
          startIndex={lightboxIndex}
          template={template}
          brandColors={colors}
          fontClass={fontEntry.className}
          editorialStyle={editorialStyle as EditorialStyle}
          handle={handle}
          lightBg={lightBg}
          darkBg={darkBg}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

function CardChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string; description: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left p-3 rounded-md border transition-colors ${
              opt.value === value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40"
            }`}
          >
            <p className="text-sm font-medium">{opt.label}</p>
            <p className="text-[10px] text-muted-foreground">
              {opt.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function MetricsBar({ metrics }: { metrics: ResultMetrics }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        {(metrics.total.ms / 1000).toFixed(1)}s total
      </span>
      <span className="flex items-center gap-1.5">
        <DollarSign className="w-3.5 h-3.5" />
        {metrics.total.costUsd.toFixed(4)}
      </span>
      <span>
        Claude: {(metrics.claude.ms / 1000).toFixed(1)}s,{" "}
        {metrics.claude.inputTokens}↓ {metrics.claude.outputTokens}↑
        {metrics.claude.cacheReadInputTokens > 0 &&
          ` (cache_hit: ${metrics.claude.cacheReadInputTokens})`}
        {metrics.claude.cacheCreationInputTokens > 0 &&
          ` (cache_write: ${metrics.claude.cacheCreationInputTokens})`}
      </span>
      <span>
        Imagens: {(metrics.images.parallelMs / 1000).toFixed(1)}s, $
        {metrics.images.totalCostUsd.toFixed(4)}
      </span>
    </div>
  )
}
