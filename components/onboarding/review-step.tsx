"use client"

import { useState } from "react"
import {
  ChevronLeft,
  Sparkles,
  Plus,
  Target,
  DollarSign,
  BookOpen,
  Users,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface InitialAnalysis {
  name: string
  description: string
  target_audience: string
  tone_of_voice: string
  visual_style: string
  main_objective: "sell" | "inform" | "engage" | "community"
  brand_colors: string[]
  instagram_handle: string
}

export interface ReviewFormData {
  name: string
  description: string
  instagram_handle: string
  target_audience: string
  tone_of_voice: string
  visual_style: string
  main_objective: "sell" | "inform" | "engage" | "community"
  brand_colors: string[]
}

interface ReviewStepProps {
  initial: InitialAnalysis | null
  onBack: () => void
  onSubmit: (data: ReviewFormData) => Promise<void>
}

const goalOptions: Array<{
  id: ReviewFormData["main_objective"]
  icon: typeof Target
  label: string
}> = [
  { id: "engage", icon: Target, label: "Engajar audiencia" },
  { id: "sell", icon: DollarSign, label: "Gerar vendas" },
  { id: "inform", icon: BookOpen, label: "Educar/Informar" },
  { id: "community", icon: Users, label: "Construir comunidade" },
]

const DEFAULT_COLORS = ["#E84D1E", "#1A1A1A", "#FAF8F5"]

export function ReviewStep({ initial, onBack, onSubmit }: ReviewStepProps) {
  const seed = initial ?? {
    name: "",
    description: "",
    target_audience: "",
    tone_of_voice: "",
    visual_style: "",
    main_objective: "engage" as const,
    brand_colors: DEFAULT_COLORS,
    instagram_handle: "",
  }

  const [name, setName] = useState(seed.name)
  const [description, setDescription] = useState(seed.description)
  const [instagramHandle, setInstagramHandle] = useState(seed.instagram_handle)
  const [audience, setAudience] = useState(seed.target_audience)
  const [tone, setTone] = useState(seed.tone_of_voice)
  const [visualStyle, setVisualStyle] = useState(seed.visual_style)
  const [goal, setGoal] = useState<ReviewFormData["main_objective"]>(
    seed.main_objective,
  )
  const [colors, setColors] = useState<string[]>(
    seed.brand_colors.length > 0 ? seed.brand_colors : DEFAULT_COLORS,
  )
  const [submitting, setSubmitting] = useState(false)

  const updateColor = (index: number, value: string) => {
    setColors((prev) => prev.map((c, i) => (i === index ? value : c)))
  }
  const addColor = () => {
    if (colors.length < 6) setColors([...colors, "#888888"])
  }
  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    audience.trim().length > 0 &&
    tone.trim().length > 0 &&
    colors.length >= 1

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      instagram_handle: instagramHandle.trim().replace(/^@/, ""),
      target_audience: audience.trim(),
      tone_of_voice: tone.trim(),
      visual_style: visualStyle.trim(),
      main_objective: goal,
      brand_colors: colors,
    })
    setSubmitting(false)
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>

      <h2 className="text-3xl font-bold mb-2">
        {initial ? "Confira o que descobrimos" : "Cadastre sua marca"}
      </h2>
      <p className="text-muted-foreground mb-8">
        {initial
          ? "Edite o que precisar — voce sempre pode ajustar depois."
          : "Preencha os campos abaixo. Voce pode editar tudo depois."}
      </p>

      <div className="space-y-8">
        {/* Identidade */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Identidade
          </h3>

          <div className="space-y-2">
            <Label>Nome da marca</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface"
              placeholder="Ex: Culturize-se"
            />
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface min-h-[80px]"
              placeholder="O que sua marca faz, em 2-3 frases"
            />
          </div>

          <div className="space-y-2">
            <Label>Instagram (opcional)</Label>
            <Input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="bg-surface"
              placeholder="@seuhandle"
            />
          </div>
        </section>

        {/* Audiencia */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Audiencia
          </h3>
          <div className="space-y-2">
            <Label>Publico-alvo</Label>
            <Textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="bg-surface min-h-[60px]"
              placeholder="Perfil do publico-alvo"
            />
          </div>
        </section>

        {/* Tom de voz */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tom de voz
          </h3>
          <Textarea
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="bg-surface min-h-[60px]"
            placeholder="Ex: casual, autoral, com toque de humor seco"
          />
          <p className="text-xs text-muted-foreground">
            Adjetivos separados por virgula — vai guiar a copy gerada.
          </p>
        </section>

        {/* Estilo visual */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Estilo visual
          </h3>
          <Textarea
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            className="bg-surface min-h-[60px]"
            placeholder="Ex: minimalista, alto contraste, editorial"
          />
        </section>

        {/* Objetivo */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Objetivo principal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {goalOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGoal(opt.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  goal === opt.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <opt.icon
                  className={`w-5 h-5 mb-2 ${
                    goal === opt.id ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Cores */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cores da marca {initial ? "(auto-extraidas)" : ""}
          </h3>
          <div className="flex gap-3 items-center flex-wrap">
            {colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1 group">
                <div className="relative">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer bg-transparent"
                  />
                  {colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center opacity-0 group-hover:flex hover:opacity-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {c.toUpperCase()}
                </span>
              </div>
            ))}
            {colors.length < 6 && (
              <button
                type="button"
                onClick={addColor}
                className="w-12 h-12 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center self-start"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="flex gap-4 mt-8 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Voltar
        </Button>
        <Button
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Salvar marca
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
