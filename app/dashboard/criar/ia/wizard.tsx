"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
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
  { value: "editorial", label: "Editorial", description: "Magazine, premium" },
  { value: "cinematic", label: "Cinematic", description: "Dramático, viral" },
  { value: "hybrid", label: "Hybrid", description: "News, esporte" },
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
  {
    value: "all_ai",
    label: "Tudo IA",
    description: "Flux Schnell em tudo",
  },
  {
    value: "smart_mix",
    label: "Misto Inteligente",
    description: "Claude decide por slide",
  },
  {
    value: "all_unsplash",
    label: "Tudo Unsplash",
    description: "Custo zero",
  },
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

  async function onGenerate() {
    setError(null)
    setLoading(true)
    setLoadingMessage("Escrevendo copy com Claude...")

    const interval = setInterval(() => {
      setLoadingMessage((prev) => {
        if (prev.includes("Claude")) return "Gerando imagens..."
        if (prev.includes("imagens")) return "Salvando no banco..."
        return "Quase la..."
      })
    }, 7000)

    try {
      const res = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          topic,
          objective,
          template,
          font_family: fontFamily,
          n_slides: nSlides,
          mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "erro desconhecido")
        return
      }
      router.push(`/dashboard/projetos/${data.project_id}`)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de rede"
      setError(message)
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const canSubmit =
    !!brandId && topic.trim().length >= 10 && !loading

  return (
    <div className="space-y-6">
      {brands.length > 1 && (
        <div className="space-y-2">
          <Label>Marca</Label>
          <Select value={brandId} onValueChange={handleBrandChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Marca: </span>
          <span className="font-medium">{activeBrand.name}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label>Tema do carrossel</Label>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="Sobre o que vai ser o carrossel? (min 10 chars)"
          className="bg-card"
        />
      </div>

      <CardChoiceGroup
        label="Objetivo"
        options={OBJECTIVES}
        value={objective}
        onChange={(v) => setObjective(v as Objective)}
      />

      <CardChoiceGroup
        label="Template visual"
        options={TEMPLATES}
        value={template}
        onChange={(v) => setTemplate(v as TemplateKey)}
      />

      <div className="space-y-2">
        <Label>Tipografia</Label>
        <Select
          value={fontFamily}
          onValueChange={(v) => setFontFamily(v as FontKey)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Numero de slides</Label>
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          {[5, 7, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNSlides(n as 5 | 7 | 10)}
              className={`h-10 rounded-md border text-sm font-medium ${
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
        label="Modo de geracao"
        options={MODES}
        value={mode}
        onChange={(v) => setMode(v as Mode)}
      />

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive whitespace-pre-wrap">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={onGenerate}
        disabled={!canSubmit}
        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
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
        <p className="text-xs text-muted-foreground text-center">
          ~10-30s no total. Imagens sao geradas em paralelo.
        </p>
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
            <p className="text-[11px] text-muted-foreground">
              {opt.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
