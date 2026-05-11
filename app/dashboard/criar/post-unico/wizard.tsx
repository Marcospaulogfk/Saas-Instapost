"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Wand2, Code2 } from "lucide-react"
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
import { TemplatePicker } from "@/components/single-posts/template-picker"
import { CATEGORY_LABELS } from "@/lib/single-posts/catalog"
import type { PostBrand, PostCategory } from "@/lib/single-posts/types"

interface WizardProps {
  brands: PostBrand[]
}

const CATEGORIES: Array<{ value: "all" | PostCategory; label: string }> = [
  { value: "all", label: "Todas as categorias" },
  ...(Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as PostCategory,
    label,
  }))),
]

type Mode = "template" | "free"

export function Wizard({ brands }: WizardProps) {
  const router = useRouter()
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "")
  const activeBrand = useMemo(
    () => brands.find((b) => b.id === brandId) ?? brands[0],
    [brands, brandId],
  )
  const [mode, setMode] = useState<Mode>("template")
  const [categoryFilter, setCategoryFilter] = useState<"all" | PostCategory>("all")
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [rawContent, setRawContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmitTemplate =
    mode === "template" &&
    !!activeBrand &&
    rawContent.trim().length >= 10 &&
    !submitting

  const canSubmitFree =
    mode === "free" &&
    !!activeBrand &&
    rawContent.trim().length >= 10 &&
    !submitting

  function handleGenerateTemplate() {
    if (!canSubmitTemplate || !activeBrand) return
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        kind: "template" as const,
        brand: activeBrand,
        templateId: templateId ?? "auto",
        rawContent: rawContent.trim(),
        categoryHint: categoryFilter === "all" ? null : categoryFilter,
        autoRun: true,
        ts: Date.now(),
      }
      sessionStorage.setItem("syncpost_pending_post_unico", JSON.stringify(payload))
      router.push("/teste")
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de redirect"
      setError(message)
      setSubmitting(false)
    }
  }

  function handleGenerateFree() {
    if (!canSubmitFree || !activeBrand) return
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        kind: "skeleton" as const,
        brand: activeBrand,
        briefing: rawContent.trim(),
        autoRun: true,
        ts: Date.now(),
      }
      sessionStorage.setItem("syncpost_pending_post_unico", JSON.stringify(payload))
      router.push("/teste")
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro de redirect"
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <aside className="space-y-5">
        {brands.length > 1 && (
          <div className="space-y-2">
            <Label className="text-sm text-text-secondary">Marca</Label>
            <Select value={brandId} onValueChange={setBrandId}>
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

        {/* Mode toggle */}
        <div className="space-y-2">
          <Label className="text-sm text-text-secondary">Modo</Label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-background-secondary/60 border border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setMode("template")
                setError(null)
              }}
              className={`flex items-center justify-center gap-2 h-9 rounded-md text-xs font-medium transition-colors ${
                mode === "template"
                  ? "bg-purple-600 text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Template
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("free")
                setError(null)
              }}
              className={`flex items-center justify-center gap-2 h-9 rounded-md text-xs font-medium transition-colors ${
                mode === "free"
                  ? "bg-lime text-zinc-950"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Modo dev
            </button>
          </div>
          <p className="text-[10px] text-text-muted">
            {mode === "template"
              ? "IA preenche um dos 20 templates curados."
              : "IA cria layout do zero baseado nos princípios visuais. Cada geração é única."}
          </p>
        </div>

        {mode === "template" && (
          <div className="space-y-2">
            <Label className="text-sm text-text-secondary">Filtrar por categoria</Label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
            >
              <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background-tertiary border-border-medium">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm text-text-secondary">
            {mode === "template" ? "Sobre o que é o post?" : "Briefing pra IA improvisar"}
          </Label>
          <Textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            rows={6}
            placeholder={
              mode === "template"
                ? "Ex: Vagas abertas pra instrutor de muay thai, com 3 anos de experiência..."
                : "Ex: queremos anunciar que abrimos uma nova unidade na Vila Madalena, com vibe sofisticada e foco em tratamentos premium..."
            }
            className="bg-background-secondary/60 border-border-subtle focus:border-purple-600/50 focus:shadow-glow-sm resize-none"
          />
          <p className="text-[11px] text-text-muted">
            {mode === "template"
              ? "Mín 10 caracteres. A IA estrutura nos campos do template escolhido."
              : "Mín 10 caracteres. A IA decide layout, tipografia, cores e composição livremente."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {mode === "template" ? (
          <Button
            type="button"
            onClick={handleGenerateTemplate}
            disabled={!canSubmitTemplate}
            className="w-full h-12"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Abrindo editor...
              </>
            ) : templateId ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar post
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Deixar IA escolher template
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleGenerateFree}
            disabled={!canSubmitFree}
            className="w-full h-12 bg-lime text-zinc-950 hover:bg-lime/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                IA improvisando...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Gerar layout livre
              </>
            )}
          </Button>
        )}

        <div className="rounded-lg border border-border-subtle bg-background-secondary/40 p-3 text-[11px] text-text-muted">
          <p className="font-medium text-text-secondary mb-1">
            {mode === "template" ? "Como funciona" : "Modo experimental"}
          </p>
          {mode === "template" ? (
            <>
              <p>1. Descreve o conteúdo aqui</p>
              <p>2. Escolhe um template (ou deixa a IA escolher)</p>
              <p>3. A IA preenche os campos no editor</p>
            </>
          ) : (
            <>
              <p>A IA recebe os 20 templates como referência visual + briefing</p>
              <p className="mt-1">
                e produz um layout único (cores, tipografia, composição) sem copiar
                template específico. Bom pra experimentar variações.
              </p>
            </>
          )}
        </div>
      </aside>

      <main>
        {mode === "template" ? (
          activeBrand ? (
            <TemplatePicker
              selectedId={templateId}
              onSelect={(id) => setTemplateId(id)}
              brand={activeBrand}
              filterCategory={categoryFilter === "all" ? null : categoryFilter}
            />
          ) : (
            <p className="text-sm text-text-muted">Cadastre uma marca antes.</p>
          )
        ) : (
          <div className="rounded-xl border-2 border-dashed border-lime/30 bg-lime/5 p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-lime/20 flex items-center justify-center">
              <Wand2 className="w-8 h-8 text-lime" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Modo Dev — IA improvisa
              </h3>
              <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                Sem template pré-definido. A IA usa os 20 templates como vocabulário
                visual e cria um layout único pra cada geração — composição,
                tipografia, hierarquia, decorações tudo decidido por ela.
              </p>
              <p className="text-[11px] text-text-muted mt-3">
                Cada geração custa ~$0.005 (Sonnet 4.6). Resultado pode variar
                bastante — é exploração.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
