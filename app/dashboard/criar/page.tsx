"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Square,
  Smartphone,
  GalleryHorizontal,
  Heart,
  DollarSign,
  Flame,
  GraduationCap,
  Users,
  Wand2,
  Link2,
  Lightbulb,
  Pencil,
  Loader2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type StepId = 1 | 2 | 3

type Formato = {
  id: string
  label: string
  size: string
  pageMode: "carrossel" | "post-unico"
  format: "post" | "story"
  slides: number | null
  icon: typeof Sparkles
  gradient: string
}

const FORMATOS: Formato[] = [
  {
    id: "post-portrait",
    label: "Post Portrait",
    size: "1080 × 1350px",
    pageMode: "post-unico",
    format: "post",
    slides: 1,
    icon: Square,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "carrossel-portrait",
    label: "Carrossel Portrait",
    size: "1080 × 1350px",
    pageMode: "carrossel",
    format: "post",
    slides: 7,
    icon: GalleryHorizontal,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "stories-unico",
    label: "Stories Único",
    size: "1080 × 1920px",
    pageMode: "post-unico",
    format: "story",
    slides: 1,
    icon: Smartphone,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "stories-carrossel",
    label: "Stories Carrossel",
    size: "1080 × 1920px",
    pageMode: "carrossel",
    format: "story",
    slides: 5,
    icon: Smartphone,
    gradient: "from-emerald-500 to-teal-500",
  },
]

type Objetivo = "engajar" | "vender"
type Abordagem = "viral" | "educativo" | "comunidade"
type ComoCriar = "zero" | "link" | "inspiracoes"

export default function CriarWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<StepId>(1)
  const [formato, setFormato] = useState<Formato | null>(null)
  const [objetivo, setObjetivo] = useState<Objetivo>("engajar")
  const [abordagem, setAbordagem] = useState<Abordagem | null>(null)
  const [comoCriar, setComoCriar] = useState<ComoCriar>("zero")
  const [briefing, setBriefing] = useState("")
  const [promptRefinado, setPromptRefinado] = useState<string | null>(null)
  const [refinando, setRefinando] = useState(false)
  const [refineErr, setRefineErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Pré-preenche briefing se vier de Inspiração
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = sessionStorage.getItem("syncpost_pending_inspiracao")
      if (!raw) return
      sessionStorage.removeItem("syncpost_pending_inspiracao")
      const p = JSON.parse(raw)
      if (typeof p.briefing === "string") setBriefing(p.briefing)
      if (p.formato === "post") {
        setFormato(FORMATOS[0])
        setStep(2)
      }
      if (p.formato === "carrossel") {
        setFormato(FORMATOS[1])
        setStep(2)
      }
      if (p.formato === "stories") {
        setFormato(FORMATOS[2])
        setStep(2)
      }
    } catch {}
  }, [])

  function canAdvanceStep1() {
    return formato !== null
  }
  function canAdvanceStep2() {
    return abordagem !== null && comoCriar !== null
  }
  function canFinish() {
    return briefing.trim().length >= 10
  }

  async function refinarComIA() {
    if (briefing.trim().length < 10) {
      setRefineErr("Briefing precisa ter pelo menos 10 chars")
      return
    }
    setRefineErr(null)
    setRefinando(true)
    try {
      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing: briefing.trim(),
          formato: formato?.id ?? "post-portrait",
          objetivo,
          abordagem,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRefineErr(data.error ?? "erro ao refinar")
        return
      }
      setPromptRefinado(data.refined)
    } catch (err) {
      setRefineErr(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setRefinando(false)
    }
  }

  function handleGerar() {
    if (!formato || !canFinish()) return
    setSubmitting(true)
    const finalBriefing = (promptRefinado ?? briefing).trim()
    if (formato.pageMode === "post-unico") {
      // Post único / Stories único — vai pra /teste com payload
      try {
        sessionStorage.setItem(
          "syncpost_pending_post_unico",
          JSON.stringify({
            kind: "skeleton",
            brand: {
              id: "wizard-brand",
              name: "Marca Demo",
              brand_colors: ["#7C3AED", "#0A0A0F", "#FAF8F5"],
              instagram_handle: "marca",
            },
            briefing: finalBriefing,
            autoRun: true,
            ts: Date.now(),
          }),
        )
      } catch {}
      router.push(`/teste?format=${formato.format}`)
      return
    }
    // Carrossel
    try {
      sessionStorage.setItem(
        "syncpost_pending_generation",
        JSON.stringify({
          topic: finalBriefing,
          objective: objetivo === "vender" ? "sell" : "engage",
          template: "editorial",
          nSlides: formato.slides ?? 7,
          autoRun: true,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push("/teste")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                if (s < step) setStep(s as StepId)
              }}
              disabled={s >= step}
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${
                step === s
                  ? "text-purple-400"
                  : step > s
                    ? "text-text-secondary hover:text-text-primary cursor-pointer"
                    : "text-text-muted"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  step === s
                    ? "bg-purple-500 ring-4 ring-purple-500/30"
                    : step > s
                      ? "bg-emerald-500"
                      : "bg-text-muted"
                }`}
              />
              <span>
                {s === 1 ? "Formato" : s === 2 ? "Modo" : "Criar"}
              </span>
            </button>
            {i < 2 && <div className="w-8 sm:w-16 h-px bg-border-subtle" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Step1
          formato={formato}
          onSelect={setFormato}
          onNext={() => canAdvanceStep1() && setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          objetivo={objetivo}
          abordagem={abordagem}
          comoCriar={comoCriar}
          onObjetivo={setObjetivo}
          onAbordagem={setAbordagem}
          onComoCriar={setComoCriar}
          onBack={() => setStep(1)}
          onNext={() => canAdvanceStep2() && setStep(3)}
        />
      )}

      {step === 3 && formato && (
        <Step3
          formato={formato}
          objetivo={objetivo}
          comoCriar={comoCriar}
          briefing={briefing}
          setBriefing={setBriefing}
          promptRefinado={promptRefinado}
          setPromptRefinado={setPromptRefinado}
          onRefinar={refinarComIA}
          refinando={refinando}
          refineErr={refineErr}
          submitting={submitting}
          onBack={() => setStep(2)}
          onGerar={handleGerar}
          canFinish={canFinish()}
        />
      )}
    </div>
  )
}

function Step1({
  formato,
  onSelect,
  onNext,
}: {
  formato: Formato | null
  onSelect: (f: Formato) => void
  onNext: () => void
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Escolha o Formato
        </h1>
        <p className="text-sm text-text-secondary">
          Você está no modo IA. Escolha o formato pra começar.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {FORMATOS.map((f) => {
          const selected = formato?.id === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f)}
              className={`relative aspect-[4/5] rounded-2xl overflow-hidden text-white p-4 flex flex-col justify-between transition-all bg-gradient-to-br ${f.gradient} ${
                selected
                  ? "ring-4 ring-purple-400 scale-[1.02]"
                  : "ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.01]"
              }`}
            >
              {selected && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <f.icon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow" />
              </div>
              <div className="relative">
                <p className="text-sm sm:text-base font-bold drop-shadow leading-tight">
                  {f.label}
                </p>
                <p className="text-[10px] sm:text-xs opacity-90 mt-0.5">
                  {f.size}
                </p>
                {f.slides && f.slides > 1 && (
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {f.slides} slides
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!formato}
          className="min-w-[140px]"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}

function Step2({
  objetivo,
  abordagem,
  comoCriar,
  onObjetivo,
  onAbordagem,
  onComoCriar,
  onBack,
  onNext,
}: {
  objetivo: Objetivo
  abordagem: Abordagem | null
  comoCriar: ComoCriar
  onObjetivo: (v: Objetivo) => void
  onAbordagem: (v: Abordagem) => void
  onComoCriar: (v: ComoCriar) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Defina o Conteúdo
        </h1>
        <p className="text-sm text-text-secondary">
          Esse contexto será expandido em prompt visual pra gerar a arte com IA.
        </p>
      </div>

      {/* Objetivo */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          Qual o objetivo deste post?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "engajar" as const,
              label: "Engajar",
              desc: "Aumentar interação e comunidade",
              icon: Heart,
            },
            {
              id: "vender" as const,
              label: "Vender",
              desc: "Converter seguidores em clientes",
              icon: DollarSign,
            },
          ].map((o) => {
            const sel = objetivo === o.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onObjetivo(o.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  sel
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      sel ? "bg-purple-500/20" : "bg-background-tertiary"
                    }`}
                  >
                    <o.icon className={`w-4 h-4 ${sel ? "text-purple-300" : "text-text-secondary"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {o.label}
                    </p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {o.desc}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Abordagem */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
          Abordagem
        </p>
        <p className="text-[11px] text-text-muted mb-2">
          Define a estratégia do conteúdo (textos, layout, tom).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: "viral" as const, label: "Viral", icon: Flame, color: "text-orange-400" },
            { id: "educativo" as const, label: "Educativo", icon: GraduationCap, color: "text-blue-400" },
            { id: "comunidade" as const, label: "Comunidade", icon: Users, color: "text-emerald-400" },
          ].map((a) => {
            const sel = abordagem === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAbordagem(a.id)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                  sel
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                <a.icon className={`w-5 h-5 ${a.color}`} />
                <p className="text-xs font-medium text-text-primary">{a.label}</p>
              </button>
            )
          })}
          <div className="p-3 rounded-xl border-2 border-dashed border-border-subtle bg-background-tertiary/10 flex flex-col items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">
            <span className="text-text-muted">···</span>
            <p className="text-xs text-text-muted">Ver mais</p>
          </div>
        </div>
      </div>

      {/* Como criar */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          Como você quer criar?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "zero" as const,
              label: "Criar do Zero",
              desc: "Descreva sua ideia e a IA cria todo o conteúdo",
              icon: Wand2,
            },
            {
              id: "link" as const,
              label: "A partir de Link",
              desc: "Cole link e a IA extrai e adapta o conteúdo",
              icon: Link2,
            },
            {
              id: "inspiracoes" as const,
              label: "Inspirações",
              desc: "Escolha de uma biblioteca de ideias prontas",
              icon: Lightbulb,
            },
          ].map((c) => {
            const sel = comoCriar === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onComoCriar(c.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  sel
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                <c.icon
                  className={`w-5 h-5 mb-2 ${sel ? "text-purple-300" : "text-text-secondary"}`}
                />
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {c.label}
                </p>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {c.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!abordagem}>
          Continuar
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}

function Step3({
  formato,
  briefing,
  setBriefing,
  comoCriar,
  promptRefinado,
  setPromptRefinado,
  onRefinar,
  refinando,
  refineErr,
  submitting,
  onBack,
  onGerar,
  canFinish,
}: {
  formato: Formato
  objetivo: Objetivo
  comoCriar: ComoCriar
  briefing: string
  setBriefing: (v: string) => void
  promptRefinado: string | null
  setPromptRefinado: (v: string | null) => void
  onRefinar: () => void
  refinando: boolean
  refineErr: string | null
  submitting: boolean
  onBack: () => void
  onGerar: () => void
  canFinish: boolean
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Sua Ideia
        </h1>
        <p className="text-sm text-text-secondary">
          Vamos transformar sua ideia em conteúdo profissional.
        </p>
      </div>

      {/* Resumo das escolhas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        <Pill icon={formato.icon} label="FORMATO" value={formato.label} sub={formato.size} />
        <Pill icon={Wand2} label="MODO" value={comoCriar === "zero" ? "Criar do Zero" : comoCriar === "link" ? "A partir de Link" : "Inspirações"} sub="Criação livre" />
        <Pill icon={Sparkles} label="CRÉDITOS" value="10 cr" sub={formato.slides && formato.slides > 1 ? `${formato.slides} slides` : "1 slide"} />
      </div>

      {/* Briefing */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Ideia Original
          </p>
          {briefing.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBriefing("")
                setPromptRefinado(null)
              }}
              className="text-[10px] text-text-muted hover:text-text-primary"
            >
              Limpar
            </button>
          )}
        </div>
        <Textarea
          value={briefing}
          onChange={(e) => {
            setBriefing(e.target.value)
            if (promptRefinado) setPromptRefinado(null)
          }}
          placeholder="Ex: Como o distanciamento entre OpenAI e Microsoft afeta o setor de IA"
          rows={3}
          className="text-sm"
        />
        <p className="text-[10px] text-text-muted mt-1 text-right">
          {briefing.length} chars
        </p>
      </div>

      {/* Prompt refinado */}
      {promptRefinado && (
        <div className="mb-4 rounded-xl border border-purple-600/30 bg-purple-600/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Prompt expandido pela IA
            </p>
            <button
              type="button"
              onClick={onRefinar}
              disabled={refinando}
              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"
            >
              {refinando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Refinar de novo
            </button>
          </div>
          <Textarea
            value={promptRefinado}
            onChange={(e) => setPromptRefinado(e.target.value)}
            rows={8}
            className="text-xs font-mono leading-relaxed resize-y"
          />
          <p className="text-[9px] text-text-muted mt-1.5 flex items-center gap-1">
            <Pencil className="w-2.5 h-2.5" />
            Edite o prompt pra ajustar o tom, adicionar detalhes ou mudar o foco
          </p>
        </div>
      )}

      {refineErr && (
        <p className="text-xs text-destructive mb-3">{refineErr}</p>
      )}

      {!promptRefinado && briefing.trim().length >= 10 && (
        <button
          type="button"
          onClick={onRefinar}
          disabled={refinando}
          className="w-full mb-4 py-3 rounded-xl border-2 border-dashed border-purple-500/40 hover:border-purple-500/70 hover:bg-purple-500/5 text-purple-300 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {refinando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Refinando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Refinar com IA antes de gerar
            </>
          )}
        </button>
      )}

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
        <Button
          onClick={onGerar}
          disabled={!canFinish || submitting}
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 min-w-[160px]"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Gerar com IA · 10
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function Pill({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Sparkles
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-background-tertiary/30 p-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-background-tertiary border border-border-subtle flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-text-secondary" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
            {label}
          </p>
          <p className="text-xs font-semibold text-text-primary truncate">
            {value}
          </p>
          <p className="text-[10px] text-text-muted truncate">{sub}</p>
        </div>
      </div>
    </div>
  )
}
