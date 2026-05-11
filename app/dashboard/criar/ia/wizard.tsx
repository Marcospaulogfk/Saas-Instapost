"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BrandSummary {
  id: string
  name: string
  default_template: string | null
  default_font: string | null
  brand_colors: string[]
  tone_of_voice: string | null
  target_audience: string | null
  visual_style: string | null
  main_objective: string | null
}

interface WizardProps {
  brands: BrandSummary[]
}

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
  {
    value: "editorial",
    label: "Editorial",
    description: "Magazine, tipografia premium",
    tag: "Premium",
  },
  {
    value: "cinematic",
    label: "Cinematic",
    description: "Foto + overlay dramático",
    tag: "Viral",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Mix tipografia e imagem",
    tag: "Versátil",
  },
] as const

const FONTS = [
  { value: "inter_black", label: "Inter Black" },
  { value: "bebas_neue", label: "Bebas Neue" },
  { value: "playfair", label: "Playfair Display" },
  { value: "montserrat_black", label: "Montserrat Black" },
  { value: "anton", label: "Anton" },
  { value: "archivo_black", label: "Archivo Black" },
  { value: "space_grotesk", label: "Space Grotesk" },
] as const

const MODES = [
  { value: "all_ai", label: "Tudo IA", description: "Flux Schnell em tudo" },
  { value: "smart_mix", label: "Misto Inteligente", description: "Claude decide por slide" },
  { value: "all_unsplash", label: "Tudo Unsplash", description: "Custo zero" },
] as const

type Objective = (typeof OBJECTIVES)[number]["value"]
type TemplateKey = (typeof TEMPLATES)[number]["value"]
type FontKey = (typeof FONTS)[number]["value"]
type Mode = (typeof MODES)[number]["value"]

function mapBrandFont(dbFont: string | null | undefined): FontKey {
  const m: Record<string, FontKey> = {
    inter: "inter_black",
    inter_black: "inter_black",
    bebas: "bebas_neue",
    bebas_neue: "bebas_neue",
    playfair: "playfair",
    montserrat: "montserrat_black",
    montserrat_black: "montserrat_black",
    anton: "anton",
    archivo_black: "archivo_black",
    space_grotesk: "space_grotesk",
  }
  if (dbFont && dbFont in m) return m[dbFont]!
  return "inter_black"
}

function mapBrandTemplate(t: string | null | undefined): TemplateKey {
  if (t === "editorial" || t === "cinematic" || t === "hybrid") return t
  return "cinematic"
}

export function Wizard({ brands }: WizardProps) {
  const router = useRouter()
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "")
  const activeBrand = brands.find((b) => b.id === brandId) ?? brands[0]

  const [topic, setTopic] = useState("")
  const [objective, setObjective] = useState<Objective>("inform")
  const [template, setTemplate] = useState<TemplateKey>(
    mapBrandTemplate(activeBrand?.default_template),
  )
  const [fontFamily, setFontFamily] = useState<FontKey>(
    mapBrandFont(activeBrand?.default_font),
  )
  const [nSlides, setNSlides] = useState<5 | 7 | 10>(7)
  const [mode, setMode] = useState<Mode>("all_ai")

  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleBrandChange(newId: string) {
    setBrandId(newId)
    const b = brands.find((x) => x.id === newId)
    if (b) {
      setTemplate(mapBrandTemplate(b.default_template))
      setFontFamily(mapBrandFont(b.default_font))
    }
  }

  function onGenerate() {
    if (!activeBrand) {
      setError("Selecione uma marca antes de gerar.")
      return
    }
    setError(null)
    setLoading(true)
    setLoadingMessage("Preparando editor...")

    const fallbackColors = ["#7C3AED", "#1A1A1A", "#FAF8F5"]
    const colors =
      activeBrand.brand_colors && activeBrand.brand_colors.length > 0
        ? activeBrand.brand_colors.slice(0, 3)
        : fallbackColors

    const payload = {
      brandId: activeBrand.id,
      brandName: activeBrand.name,
      topic,
      objective,
      tone: activeBrand.tone_of_voice ?? "",
      audience: activeBrand.target_audience ?? "",
      visualStyle: activeBrand.visual_style ?? "",
      colors,
      template,
      font: fontFamily,
      nSlides,
      mode,
      autoRun: true,
      ts: Date.now(),
    }

    try {
      sessionStorage.setItem("syncpost_pending_generation", JSON.stringify(payload))
    } catch {
      setError("Não consegui salvar o estado pra abrir o editor. Tente novamente.")
      setLoading(false)
      return
    }

    router.push("/teste")
  }

  const canSubmit = !!brandId && topic.trim().length >= 10 && !loading

  return (
    <div className="space-y-8">
      {brands.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm text-text-secondary">Marca</Label>
          <Select value={brandId} onValueChange={handleBrandChange}>
            <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background-tertiary border-border-medium">
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {brands.length === 1 && activeBrand && (
        <div className="rounded-lg border border-border-subtle bg-gradient-card backdrop-blur-xl px-4 py-3 text-sm">
          <span className="text-text-muted">Marca: </span>
          <span className="font-medium text-text-primary">{activeBrand.name}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm text-text-secondary">Tema do carrossel</Label>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="Sobre o que vai ser o carrossel? (mín 10 caracteres)"
          className="bg-background-secondary/60 border-border-subtle focus:border-purple-600/50 focus:shadow-glow-sm resize-none"
        />
      </div>

      <CardChoiceGroup
        label="Objetivo"
        options={OBJECTIVES}
        value={objective}
        onChange={(v) => setObjective(v as Objective)}
      />

      {/* Galeria de templates com preview visual */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label className="text-sm text-text-secondary">Template visual</Label>
          <span className="text-xs text-text-muted">
            Selecionado: <span className="text-purple-300 font-medium">{TEMPLATES.find((t) => t.value === template)?.label}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.value}
              template={tpl}
              selected={tpl.value === template}
              onSelect={() => setTemplate(tpl.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-text-secondary">Tipografia</Label>
        <Select
          value={fontFamily}
          onValueChange={(v) => setFontFamily(v as FontKey)}
        >
          <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background-tertiary border-border-medium">
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-text-secondary">Número de slides</Label>
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          {[5, 7, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNSlides(n as 5 | 7 | 10)}
              className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                n === nSlides
                  ? "border-purple-600 bg-purple-600/10 text-purple-300 shadow-glow-sm"
                  : "border-border-subtle bg-background-secondary/40 text-text-secondary hover:border-purple-600/40 hover:text-text-primary"
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
        onChange={(v) => setMode(v as Mode)}
      />

      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger whitespace-pre-wrap">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={onGenerate}
        disabled={!canSubmit}
        className="w-full h-12"
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

      {loading && (
        <p className="text-xs text-text-muted text-center">
          ~10-30s no total. Imagens são geradas em paralelo.
        </p>
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: (typeof TEMPLATES)[number]
  selected: boolean
  onSelect: () => void
}

function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative text-left rounded-xl border overflow-hidden transition-all ${
        selected
          ? "border-purple-600 shadow-glow ring-2 ring-purple-600/30"
          : "border-border-subtle hover:border-purple-600/40 hover:shadow-glow-sm"
      }`}
    >
      {/* Preview area */}
      <div className="relative aspect-[4/5] overflow-hidden bg-background-secondary">
        {template.value === "editorial" && <EditorialPreview />}
        {template.value === "cinematic" && <CinematicPreview />}
        {template.value === "hybrid" && <HybridPreview />}

        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-lime flex items-center justify-center shadow-[0_0_12px_rgba(209,254,23,0.6)]">
            <Check className="w-3.5 h-3.5 text-zinc-950" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-background-secondary/80 backdrop-blur-xl border-t border-border-subtle">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-display font-semibold text-text-primary">
            {template.label}
          </p>
          <span className="text-[10px] uppercase tracking-wider text-purple-300 bg-purple-600/15 border border-purple-600/30 rounded px-1.5 py-0.5">
            {template.tag}
          </span>
        </div>
        <p className="text-xs text-text-muted">{template.description}</p>
      </div>
    </button>
  )
}

/** Preview do template Editorial — magazine, tipografia em destaque, layout limpo */
function EditorialPreview() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-purple-950/60 to-black p-4 flex flex-col justify-between">
      <div>
        <div className="text-[7px] tracking-[0.2em] text-purple-300 uppercase mb-2 font-mono">
          ISSUE #07 — DESIGN
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-white/85 rounded-sm" />
          <div className="h-2.5 w-4/5 bg-white/85 rounded-sm" />
          <div className="h-2.5 w-2/3 bg-white/55 rounded-sm" />
        </div>
        <div className="mt-3 space-y-0.5">
          <div className="h-1 w-full bg-white/30 rounded-full" />
          <div className="h-1 w-5/6 bg-white/30 rounded-full" />
          <div className="h-1 w-4/6 bg-white/25 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-1 w-8 bg-purple-400 rounded-full" />
        <div className="text-[7px] tracking-wider text-white/40">01/07</div>
      </div>
    </div>
  )
}

/** Preview do template Cinematic — foto fullbleed + overlay dramático */
function CinematicPreview() {
  return (
    <div className="absolute inset-0">
      {/* "Foto" simulada com gradient + textura */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-violet-900 to-zinc-950" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.5), transparent 50%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.4), transparent 60%)",
        }}
      />
      {/* Overlay dramático bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />
      {/* Texto cinematic */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="h-3 w-4/5 bg-white rounded-sm mb-1" />
        <div className="h-3 w-2/3 bg-white rounded-sm mb-2" />
        <div className="h-1 w-1/2 bg-purple-300 rounded-full" />
      </div>
      {/* Indicador top */}
      <div className="absolute top-3 left-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_6px_rgba(209,254,23,0.7)]" />
        <span className="text-[7px] uppercase tracking-wider text-white/80 font-mono">LIVE</span>
      </div>
    </div>
  )
}

/** Preview do template Hybrid — split com texto + bloco visual */
function HybridPreview() {
  return (
    <div className="absolute inset-0 bg-zinc-950 grid grid-rows-[1fr_1.2fr]">
      {/* Top: bloco visual */}
      <div className="relative bg-gradient-to-br from-purple-600 to-purple-900 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18), transparent 40%)",
          }}
        />
        <div className="absolute top-2 left-2 text-[7px] tracking-[0.2em] text-white/80 uppercase font-mono">
          NEWS
        </div>
        <div className="absolute bottom-2 right-2 text-2xl font-bold text-white leading-none">
          47
        </div>
        <div className="absolute bottom-2 right-2 -translate-y-6 text-[7px] uppercase tracking-wider text-white/60">
          MIN
        </div>
      </div>
      {/* Bottom: texto */}
      <div className="p-3 flex flex-col justify-between bg-black">
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-white rounded-sm" />
          <div className="h-2.5 w-4/5 bg-white rounded-sm" />
          <div className="h-1.5 w-3/5 bg-white/60 rounded-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-purple-400" />
          <div className="text-[7px] tracking-wider text-white/40">SYNCPOST · ESPORTE</div>
        </div>
      </div>
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
      <Label className="text-sm text-text-secondary">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              opt.value === value
                ? "border-purple-600 bg-purple-600/10 shadow-glow-sm"
                : "border-border-subtle bg-background-secondary/40 hover:border-purple-600/40"
            }`}
          >
            <p className={`text-sm font-medium ${opt.value === value ? "text-purple-200" : "text-text-primary"}`}>
              {opt.label}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
