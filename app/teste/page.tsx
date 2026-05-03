"use client"

import { useState } from "react"
import {
  Inter,
  Bebas_Neue,
  Playfair_Display,
  Montserrat,
  Anton,
  Archivo_Black,
  Space_Grotesk,
} from "next/font/google"
import { Loader2, Sparkles, Clock, DollarSign, Pencil } from "lucide-react"
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
  { value: "wesley", label: "Wesley", description: "Capas dramáticas + splits dark" },
  { value: "brandsdecoded", label: "Brandsdecoded", description: "Editorial premium" },
  { value: "bolo", label: "Bolo (lista)", description: "Lista de ideias numeradas" },
  { value: "mypostflow", label: "MyPostFlow", description: "Tech + CTA produto" },
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
  const [editorialStyle, setEditorialStyle] = useState<EditorialStyleKey>("wesley")
  const [handle, setHandle] = useState<string>("@brand")
  const [lightBg, setLightBg] = useState<string>("#FAF8F5")
  const [darkBg, setDarkBg] = useState<string>("#0A0A0A")
  const [font, setFont] = useState<FontKey>(DEFAULTS.font)
  const [nSlides, setNSlides] = useState<5 | 7 | 10>(DEFAULTS.nSlides)
  const [mode, setMode] = useState<typeof DEFAULTS.mode>(DEFAULTS.mode)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApiResult | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  async function onGenerate() {
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
        body: JSON.stringify({
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
        }),
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

  const fontEntry = FONTS[font]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Teste de Geração</h1>
          <p className="text-xs text-muted-foreground">
            Spike isolado — sem auth, sem banco, tudo em memória
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[calc(100vh-65px)]">
        <aside className="border-r border-border p-6 space-y-5 overflow-y-auto">
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
              {[5, 7, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNSlides(n as 5 | 7 | 10)}
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

        <main className="p-6 overflow-y-auto">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      </div>

      {editingIndex !== null && result && (
        <SlideEditorModal
          slide={result.slides[editingIndex]}
          totalSlides={result.slides.length}
          onSave={(updated) => {
            const newSlides = [...result.slides]
            newSlides[editingIndex] = { ...newSlides[editingIndex], ...updated }
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
