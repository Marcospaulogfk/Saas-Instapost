"use client"

import { useState } from "react"
import { ChevronLeft, Sparkles, Plus, Target, DollarSign, BookOpen, Users, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface ReviewStepProps {
  onBack: () => void
  onSubmit: () => void
}

const toneOptions = [
  "Profissional",
  "Casual",
  "Divertido",
  "Educativo",
  "Inspirador",
  "Provocador",
  "Tecnico",
  "Acolhedor",
]

const styleOptions = [
  "Minimalista",
  "Vibrante",
  "Cinematografico",
  "Corporate",
  "Grunge",
  "Soft",
  "Brutalist",
  "Retro",
]

const goalOptions = [
  { id: "engage", icon: Target, label: "Engajar audiencia" },
  { id: "sales", icon: DollarSign, label: "Gerar vendas" },
  { id: "educate", icon: BookOpen, label: "Educar/Informar" },
  { id: "community", icon: Users, label: "Construir comunidade" },
]

const defaultColors = ["#F97316", "#DC2626", "#FBBF24", "#000000", "#FFFFFF"]

export function ReviewStep({ onBack, onSubmit }: ReviewStepProps) {
  const [brandName, setBrandName] = useState("Culturize-se")
  const [description, setDescription] = useState(
    "Plataforma de conteudo sobre churrasco, gastronomia e cultura brasileira. Compartilhamos dicas, receitas e historias que celebram a nossa culinaria."
  )
  const [audience, setAudience] = useState(
    "Entusiastas de churrasco e gastronomia, 25-45 anos, majoritariamente masculino, classe media-alta, interessados em lifestyle e cultura."
  )
  const [selectedTones, setSelectedTones] = useState(["Casual", "Inspirador"])
  const [selectedStyles, setSelectedStyles] = useState(["Cinematografico", "Vibrante"])
  const [selectedGoal, setSelectedGoal] = useState("engage")
  const [colors, setColors] = useState(defaultColors)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    )
  }

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    )
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Title */}
      <h2 className="text-3xl font-bold mb-2">Confira o que descobrimos</h2>
      <p className="text-muted-foreground mb-8">
        Edite o que precisar - voce sempre pode ajustar depois
      </p>

      <div className="space-y-8">
        {/* Identity section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Identidade
          </h3>

          <div className="space-y-2">
            <Label>Nome da marca</Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="bg-surface"
            />
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface min-h-[80px]"
            />
          </div>
        </section>

        {/* Logo upload section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Logo da marca <span className="text-xs normal-case font-normal">(opcional)</span>
          </h3>
          <div className="flex items-start gap-4">
            <div className="relative">
              {logoPreview ? (
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-xl border-2 border-border bg-surface bg-cover bg-center"
                    style={{ backgroundImage: `url(${logoPreview})` }}
                  />
                  <button
                    onClick={() => setLogoPreview(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Upload</span>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}
            </div>
            <div className="flex-1 pt-2">
              <p className="text-sm text-foreground mb-1">PNG, JPG ou SVG (até 2MB)</p>
              <p className="text-xs text-muted-foreground">
                A logo aparecerá automaticamente nos seus carrosséis. Você pode mudar a posição
                e tamanho no editor.
              </p>
            </div>
          </div>
        </section>

        {/* Audience section */}
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
            />
          </div>
        </section>

        {/* Tone of voice section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tom de voz
          </h3>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((tone) => (
              <Badge
                key={tone}
                variant={selectedTones.includes(tone) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedTones.includes(tone)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => toggleTone(tone)}
              >
                {tone}
              </Badge>
            ))}
          </div>
        </section>

        {/* Visual style section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Estilo visual
          </h3>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((style) => (
              <Badge
                key={style}
                variant={selectedStyles.includes(style) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedStyles.includes(style)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => toggleStyle(style)}
              >
                {style}
              </Badge>
            ))}
          </div>
        </section>

        {/* Goal section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Objetivo principal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {goalOptions.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedGoal === goal.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <goal.icon
                  className={`w-5 h-5 mb-2 ${
                    selectedGoal === goal.id ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm font-medium">{goal.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Colors section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cores da marca (auto-extraidas)
          </h3>
          <div className="flex gap-3 items-center">
            {colors.map((color, index) => (
              <button
                key={index}
                className="w-10 h-10 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                style={{ backgroundColor: color }}
              />
            ))}
            <button className="w-10 h-10 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </section>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onSubmit}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Salvar marca
        </Button>
      </div>
    </div>
  )
}
