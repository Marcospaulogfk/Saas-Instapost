"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Pencil,
  Plus,
  Save,
  X,
  Globe,
  Instagram,
  Loader2,
  Palette,
  Megaphone,
  Sparkles as SparklesIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getBrandGradient, getProjectGradient } from "@/lib/brand-colors"
import { formatRelativeDate } from "@/lib/format-date"
import { updateBrand } from "@/app/actions/brands"

interface Brand {
  id: string
  name: string
  description: string | null
  website_url: string | null
  instagram_handle: string | null
  target_audience: string | null
  tone_of_voice: string | null
  visual_style: string | null
  main_objective: string | null
  brand_colors: string[]
}

interface Project {
  id: string
  title: string
  created_at: string
}

interface BrandDetailProps {
  brand: Brand
  projects: Project[]
}

const OBJECTIVE_LABELS: Record<string, string> = {
  sell: "Vender",
  inform: "Informar",
  engage: "Engajar",
  community: "Comunidade",
}

export function BrandDetail({ brand, projects }: BrandDetailProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const [draft, setDraft] = useState({
    name: brand.name,
    description: brand.description ?? "",
    website_url: brand.website_url ?? "",
    instagram_handle: brand.instagram_handle ?? "",
    target_audience: brand.target_audience ?? "",
    tone_of_voice: brand.tone_of_voice ?? "",
    visual_style: brand.visual_style ?? "",
    main_objective: (brand.main_objective ?? "inform") as
      | "sell"
      | "inform"
      | "engage"
      | "community",
    brand_colors: brand.brand_colors.length > 0 ? brand.brand_colors : ["#7C3AED"],
  })

  function reset() {
    setDraft({
      name: brand.name,
      description: brand.description ?? "",
      website_url: brand.website_url ?? "",
      instagram_handle: brand.instagram_handle ?? "",
      target_audience: brand.target_audience ?? "",
      tone_of_voice: brand.tone_of_voice ?? "",
      visual_style: brand.visual_style ?? "",
      main_objective: (brand.main_objective ?? "inform") as
        | "sell"
        | "inform"
        | "engage"
        | "community",
      brand_colors: brand.brand_colors.length > 0 ? brand.brand_colors : ["#7C3AED"],
    })
    setError(null)
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateBrand(brand.id, {
        name: draft.name,
        description: draft.description,
        website_url: draft.website_url,
        instagram_handle: draft.instagram_handle,
        target_audience: draft.target_audience,
        tone_of_voice: draft.tone_of_voice,
        visual_style: draft.visual_style,
        main_objective: draft.main_objective,
        brand_colors: draft.brand_colors.filter(Boolean),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditing(false)
      setSavedAt(Date.now())
      router.refresh()
    })
  }

  function addColor() {
    setDraft((d) => ({ ...d, brand_colors: [...d.brand_colors, "#FFFFFF"] }))
  }

  function updateColor(index: number, value: string) {
    setDraft((d) => ({
      ...d,
      brand_colors: d.brand_colors.map((c, i) => (i === index ? value : c)),
    }))
  }

  function removeColor(index: number) {
    setDraft((d) => ({
      ...d,
      brand_colors: d.brand_colors.filter((_, i) => i !== index),
    }))
  }

  const hasIdentity =
    !!brand.tone_of_voice ||
    !!brand.target_audience ||
    !!brand.visual_style ||
    brand.brand_colors.length > 0 ||
    !!brand.website_url ||
    !!brand.instagram_handle

  return (
    <div className="relative p-6 md:p-8 space-y-6 max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="-ml-3 text-text-secondary hover:text-text-primary">
        <Link href="/dashboard/marcas">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para marcas
        </Link>
      </Button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border-subtle backdrop-blur-xl p-6">
        <div className="absolute -top-20 -right-12 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-4 flex-wrap">
          <div
            className={`w-20 h-20 rounded-xl ${getBrandGradient(brand.id)} flex items-center justify-center flex-shrink-0 shadow-glow-sm`}
          >
            <span className="text-4xl font-display font-bold text-white">
              {brand.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="text-2xl font-display font-bold h-12 bg-background-secondary/60 border-border-medium"
                placeholder="Nome da marca"
              />
            ) : (
              <h1 className="text-h1 font-display font-bold text-text-primary truncate">
                {brand.name}
              </h1>
            )}
            {editing ? (
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Descrição curta da marca"
                rows={2}
                className="mt-2 bg-background-secondary/60 border-border-subtle resize-none"
              />
            ) : brand.description ? (
              <p className="text-text-secondary mt-1">{brand.description}</p>
            ) : (
              <p className="text-text-muted mt-1 italic">Sem descrição</p>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  className="border-border-medium"
                  onClick={() => {
                    reset()
                    setEditing(false)
                  }}
                  disabled={isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={save} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="border-border-medium"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar marca
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="relative z-10 mt-4 rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
            {error}
          </div>
        )}
        {savedAt && !editing && (
          <div className="relative z-10 mt-4 rounded-lg bg-lime/10 border border-[rgba(209,254,23,0.3)] p-3 text-sm text-lime">
            Marca atualizada com sucesso.
          </div>
        )}
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList className="bg-background-secondary/60 border border-border-subtle">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="projetos">
            Projetos {projects.length > 0 && `(${projects.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="space-y-4 pt-6">
          {!hasIdentity && !editing && (
            <div className="rounded-xl border border-dashed border-border-medium bg-gradient-card backdrop-blur-xl p-8 text-center space-y-3">
              <p className="text-text-secondary">
                Esta marca ainda não tem identidade configurada.
              </p>
              <Button onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Configurar identidade
              </Button>
            </div>
          )}

          {/* Objetivo principal */}
          <FieldCard icon={Megaphone} title="Objetivo principal">
            {editing ? (
              <Select
                value={draft.main_objective}
                onValueChange={(v) =>
                  setDraft({ ...draft, main_objective: v as typeof draft.main_objective })
                }
              >
                <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-11 max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-tertiary border-border-medium">
                  <SelectItem value="sell">Vender</SelectItem>
                  <SelectItem value="inform">Informar</SelectItem>
                  <SelectItem value="engage">Engajar</SelectItem>
                  <SelectItem value="community">Comunidade</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-text-secondary">
                {OBJECTIVE_LABELS[brand.main_objective ?? ""] ?? "—"}
              </p>
            )}
          </FieldCard>

          {/* Tom de voz */}
          <FieldCard icon={SparklesIcon} title="Tom de voz">
            {editing ? (
              <Textarea
                value={draft.tone_of_voice}
                onChange={(e) => setDraft({ ...draft, tone_of_voice: e.target.value })}
                placeholder="Ex: direto, confiante, com toques de humor"
                rows={2}
                className="bg-background-secondary/60 border-border-subtle resize-none"
              />
            ) : (
              <p className="text-text-secondary">
                {brand.tone_of_voice || <span className="text-text-muted italic">Não definido</span>}
              </p>
            )}
          </FieldCard>

          {/* Público-alvo */}
          <FieldCard title="Público-alvo">
            {editing ? (
              <Textarea
                value={draft.target_audience}
                onChange={(e) => setDraft({ ...draft, target_audience: e.target.value })}
                placeholder="Quem você quer atingir?"
                rows={2}
                className="bg-background-secondary/60 border-border-subtle resize-none"
              />
            ) : (
              <p className="text-text-secondary">
                {brand.target_audience || <span className="text-text-muted italic">Não definido</span>}
              </p>
            )}
          </FieldCard>

          {/* Estilo visual */}
          <FieldCard title="Estilo visual">
            {editing ? (
              <Textarea
                value={draft.visual_style}
                onChange={(e) => setDraft({ ...draft, visual_style: e.target.value })}
                placeholder="Ex: minimalista, fotografia preto e branco, tipografia bold"
                rows={2}
                className="bg-background-secondary/60 border-border-subtle resize-none"
              />
            ) : (
              <p className="text-text-secondary">
                {brand.visual_style || <span className="text-text-muted italic">Não definido</span>}
              </p>
            )}
          </FieldCard>

          {/* Paleta de cores */}
          <FieldCard icon={Palette} title="Paleta de cores">
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {draft.brand_colors.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateColor(i, e.target.value)}
                          className="w-16 h-16 rounded-lg border border-border-medium cursor-pointer bg-transparent"
                          aria-label={`Cor ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeColor(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center hover:brightness-110"
                          aria-label="Remover cor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => updateColor(i, e.target.value)}
                        className="w-20 text-xs font-mono text-center text-text-secondary bg-background-secondary/60 border border-border-subtle rounded px-1 py-0.5 focus:border-purple-600/50 focus:outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addColor}
                    className="w-16 h-16 rounded-lg border border-dashed border-border-medium hover:border-purple-600/60 hover:text-purple-300 text-text-muted flex items-center justify-center transition-colors"
                    aria-label="Adicionar cor"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : brand.brand_colors.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {brand.brand_colors.map((color) => (
                  <div key={color} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 h-16 rounded-lg border border-border-medium"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-text-muted">{color}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted italic">Nenhuma cor definida</p>
            )}
          </FieldCard>

          {/* Links */}
          <FieldCard title="Links">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-text-secondary mb-1.5 block">Site</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <Input
                      value={draft.website_url}
                      onChange={(e) => setDraft({ ...draft, website_url: e.target.value })}
                      placeholder="https://..."
                      className="pl-10 bg-background-secondary/60 border-border-subtle"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-text-secondary mb-1.5 block">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <Input
                      value={draft.instagram_handle}
                      onChange={(e) => setDraft({ ...draft, instagram_handle: e.target.value })}
                      placeholder="@usuario"
                      className="pl-10 bg-background-secondary/60 border-border-subtle"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {brand.website_url && (
                  <p className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-text-muted" />
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {brand.website_url}
                    </a>
                  </p>
                )}
                {brand.instagram_handle && (
                  <p className="flex items-center gap-2 text-text-secondary">
                    <Instagram className="w-4 h-4 text-text-muted" />
                    <span className="font-medium text-text-primary">
                      @{brand.instagram_handle.replace(/^@/, "")}
                    </span>
                  </p>
                )}
                {!brand.website_url && !brand.instagram_handle && (
                  <p className="text-text-muted italic">Nenhum link cadastrado</p>
                )}
              </div>
            )}
          </FieldCard>
        </TabsContent>

        <TabsContent value="projetos" className="pt-6">
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-medium bg-gradient-card backdrop-blur-xl p-12 text-center space-y-3">
              <p className="text-text-secondary">
                Nenhum carrossel criado nesta marca ainda.
              </p>
              <Button asChild>
                <Link href="/dashboard/criar">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro carrossel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projetos/${project.id}`}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border-subtle hover:border-purple-600/50 hover:shadow-glow-sm transition-all"
                >
                  <div className={`absolute inset-0 ${getProjectGradient(project.id)}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
                    <h3 className="font-display font-semibold text-white truncate">
                      {project.title}
                    </h3>
                    <p className="text-sm text-white/60">
                      {formatRelativeDate(project.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FieldCardProps {
  icon?: typeof Globe
  title: string
  children: React.ReactNode
}

function FieldCard({ icon: Icon, title, children }: FieldCardProps) {
  return (
    <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-purple-400" />}
        <h3 className="font-display font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </section>
  )
}
