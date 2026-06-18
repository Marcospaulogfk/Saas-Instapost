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
import { ApprovalStep, type ApprovalDraft } from "./ApprovalStep"
import {
  CarouselApprovalStep,
  type CarouselDraft,
} from "./CarouselApprovalStep"
import type { SkeletonContent } from "@/lib/single-posts/skeletons"
import type { ClaudeSlide } from "@/lib/generation/claude"

type StepId = 1 | 2 | 3 | 4

/** Marca demo usada pelo wizard ao empurrar pra /teste. */
const WIZARD_BRAND = {
  id: "wizard-brand",
  name: "Marca Demo",
  brand_colors: ["#7C3AED", "#0A0A0F", "#FAF8F5"],
  instagram_handle: "marca",
}

type Formato = {
  id: string
  label: string
  size: string
  pageMode: "carrossel" | "post-unico"
  format: "post" | "story"
  slides: number | null
  icon: typeof Sparkles
  image: string
}

const FORMATOS: Formato[] = [
  {
    id: "post-portrait",
    label: "Post Vertical",
    size: "1080 × 1350px",
    pageMode: "post-unico",
    format: "post",
    slides: 1,
    icon: Square,
    image: "/format-post-portrait.png",
  },
  {
    id: "carrossel-portrait",
    label: "Carrossel Vertical",
    size: "1080 × 1350px",
    pageMode: "carrossel",
    format: "post",
    slides: 7,
    icon: GalleryHorizontal,
    image: "/format-carrossel-portrait.png",
  },
  {
    id: "stories-unico",
    label: "Stories Único",
    size: "1080 × 1920px",
    pageMode: "post-unico",
    format: "story",
    slides: 1,
    icon: Smartphone,
    image: "/format-stories-unico.png",
  },
  {
    id: "stories-carrossel",
    label: "Stories Carrossel",
    size: "1080 × 1920px",
    pageMode: "carrossel",
    format: "story",
    slides: 5,
    icon: Smartphone,
    image: "/format-stories-carrossel.png",
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

  // --- Modo "A partir de Link" ---
  const [linkUrl, setLinkUrl] = useState("")
  const [analisandoLink, setAnalisandoLink] = useState(false)
  const [linkErr, setLinkErr] = useState<string | null>(null)

  // --- Etapa de aprovação (post-único) ---
  const [approvalDraft, setApprovalDraft] = useState<ApprovalDraft | null>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalErr, setApprovalErr] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  // --- Etapa de aprovação (carrossel) ---
  const [carouselDraft, setCarouselDraft] = useState<CarouselDraft | null>(null)
  const [carouselLoading, setCarouselLoading] = useState(false)
  const [carouselErr, setCarouselErr] = useState<string | null>(null)
  const [carouselApproving, setCarouselApproving] = useState(false)

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

  /** Extrai o conteúdo de um link e preenche o briefing com o resumo da IA. */
  async function analisarLink() {
    const url = linkUrl.trim()
    if (url.length < 4) {
      setLinkErr("Cole um link válido")
      return
    }
    setLinkErr(null)
    setAnalisandoLink(true)
    try {
      const res = await fetch("/api/extract-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          formato: formato?.id ?? "post-portrait",
          objetivo,
          abordagem,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLinkErr(data.error ?? "erro ao analisar o link")
        return
      }
      setBriefing(data.briefing ?? "")
      setPromptRefinado(null)
    } catch (err) {
      setLinkErr(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setAnalisandoLink(false)
    }
  }

  /** Mapeia os slots do skeleton pros 3 campos editáveis da aprovação. */
  function draftFromContent(
    skeletonId: string,
    content: SkeletonContent,
    caption: string,
    photoPrompt: string | null,
    photoEntity: string | null = null,
  ): ApprovalDraft {
    const title =
      content.title ??
      (content.title_lines ? content.title_lines.join(" ") : "") ??
      ""
    const body = content.body ?? content.subtitle ?? ""
    return {
      skeletonId,
      title,
      body,
      caption,
      rawContent: content,
      photoPrompt,
      photoEntity,
    }
  }

  /** Gera SÓ o texto (sem foto) e abre a tela de revisão/aprovação. */
  async function gerarTextoParaAprovacao() {
    if (!formato) return
    const finalBriefing = (promptRefinado ?? briefing).trim()
    setApprovalErr(null)
    setApprovalLoading(true)
    setStep(4)
    try {
      const res = await fetch("/api/post-unico/free-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: WIZARD_BRAND,
          briefing: finalBriefing,
          text_only: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApprovalErr(data.error ?? "erro ao gerar conteúdo")
        return
      }
      setApprovalDraft(
        draftFromContent(
          data.skeleton_id,
          data.content ?? {},
          data.caption ?? "",
          data.photo_prompt ?? null,
          data.image_entity ?? null,
        ),
      )
    } catch (err) {
      setApprovalErr(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setApprovalLoading(false)
    }
  }

  /** Empurra o conteúdo aprovado pra /teste montar o design (sem regerar texto). */
  function aprovarECriar() {
    if (!formato || !approvalDraft) return
    setApproving(true)
    // Reconstrói o content do skeleton com as edições do usuário aplicadas.
    const editedContent: SkeletonContent = { ...approvalDraft.rawContent }
    if (approvalDraft.rawContent.title_lines) {
      editedContent.title_lines = approvalDraft.title.split(/\s*\n\s*/)
      editedContent.title = approvalDraft.title
    } else {
      editedContent.title = approvalDraft.title
    }
    if (approvalDraft.rawContent.body !== undefined) {
      editedContent.body = approvalDraft.body
    } else if (approvalDraft.rawContent.subtitle !== undefined) {
      editedContent.subtitle = approvalDraft.body
    } else if (approvalDraft.body.trim()) {
      editedContent.body = approvalDraft.body
    }
    try {
      sessionStorage.setItem(
        "syncpost_pending_post_unico",
        JSON.stringify({
          kind: "approved",
          brand: WIZARD_BRAND,
          skeletonId: approvalDraft.skeletonId,
          approvedContent: editedContent,
          caption: approvalDraft.caption,
          photoPrompt: approvalDraft.photoPrompt,
          photoEntity: approvalDraft.photoEntity ?? null,
          briefing: (promptRefinado ?? briefing).trim(),
          autoRun: true,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push(`/teste?format=${formato.format}`)
  }

  /** Gera SÓ o roteiro do carrossel (texto + legenda) e abre a aprovação. */
  async function gerarRoteiroParaAprovacao() {
    if (!formato) return
    const finalBriefing = (promptRefinado ?? briefing).trim()
    setCarouselErr(null)
    setCarouselLoading(true)
    setStep(4)
    try {
      const res = await fetch("/api/editorial/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalBriefing,
          objective: objetivo === "vender" ? "sell" : "engage",
          template: "editorial",
          brandName: WIZARD_BRAND.name,
          handle: WIZARD_BRAND.instagram_handle,
          colors: WIZARD_BRAND.brand_colors,
          desiredSlides: formato.slides ?? 7,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCarouselErr(data.error ?? "erro ao gerar roteiro")
        return
      }
      setCarouselDraft({
        projectTitle: data.project_title ?? "",
        slides: Array.isArray(data.slides) ? data.slides : [],
        caption: data.caption ?? "",
      })
    } catch (err) {
      setCarouselErr(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setCarouselLoading(false)
    }
  }

  /** Empurra o roteiro aprovado pra /teste montar o design (só gera imagens). */
  function aprovarECriarCarrossel() {
    if (!formato || !carouselDraft) return
    setCarouselApproving(true)
    try {
      sessionStorage.setItem(
        "syncpost_pending_generation",
        JSON.stringify({
          kind: "approved",
          projectTitle: carouselDraft.projectTitle,
          slides: carouselDraft.slides,
          caption: carouselDraft.caption,
          objective: objetivo === "vender" ? "sell" : "engage",
          template: "editorial",
          nSlides: carouselDraft.slides.length || (formato.slides ?? 7),
          colors: WIZARD_BRAND.brand_colors,
          brandName: WIZARD_BRAND.name,
          autoRun: true,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push("/dashboard/carrossel")
  }

  function handleGerar() {
    if (!formato || !canFinish()) return
    if (formato.pageMode === "post-unico") {
      // Novo fluxo: gera o TEXTO primeiro e abre a etapa de aprovação.
      void gerarTextoParaAprovacao()
      return
    }
    // Carrossel: mesma etapa de aprovação — gera SÓ o roteiro (text-only),
    // o usuário revisa/edita e só então as imagens são geradas em /teste.
    void gerarRoteiroParaAprovacao()
  }

  const isPostUnico = formato?.pageMode === "post-unico"
  const steps: { id: StepId; label: string }[] = [
    { id: 1, label: "Formato" },
    { id: 2, label: "Modo" },
    { id: 3, label: "Ideia" },
    // Etapa de aprovação existe pros dois fluxos (post-único e carrossel).
    ...(formato ? [{ id: 4 as StepId, label: "Aprovar" }] : []),
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        {steps.map((stepDef, i) => {
          const s = stepDef.id
          // Não deixa clicar pra "voltar" no meio da aprovação assíncrona.
          const clickable =
            s < step &&
            !(step === 4 && (approvalLoading || carouselLoading))
          return (
            <div key={s} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  if (clickable) setStep(s)
                }}
                disabled={!clickable}
                className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  step === s
                    ? "text-brand-400"
                    : step > s
                      ? "text-text-secondary hover:text-text-primary cursor-pointer"
                      : "text-text-muted"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    step === s
                      ? "bg-brand-500 ring-4 ring-brand-500/30"
                      : step > s
                        ? "bg-emerald-500"
                        : "bg-text-muted"
                  }`}
                />
                <span>{stepDef.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className="w-6 sm:w-12 h-px bg-border-subtle" />
              )}
            </div>
          )
        })}
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
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          onAnalisarLink={analisarLink}
          analisandoLink={analisandoLink}
          linkErr={linkErr}
          onBack={() => setStep(2)}
          onGerar={handleGerar}
          canFinish={canFinish()}
        />
      )}

      {step === 4 && formato && isPostUnico && (
        <ApprovalStep
          draft={approvalDraft}
          loading={approvalLoading}
          error={approvalErr}
          approving={approving}
          onChange={(patch) =>
            setApprovalDraft((d) => (d ? { ...d, ...patch } : d))
          }
          onRegenerate={() => void gerarTextoParaAprovacao()}
          onBack={() => {
            setApprovalDraft(null)
            setApprovalErr(null)
            setStep(3)
          }}
          onApprove={aprovarECriar}
        />
      )}

      {step === 4 && formato && !isPostUnico && (
        <CarouselApprovalStep
          draft={carouselDraft}
          loading={carouselLoading}
          error={carouselErr}
          approving={carouselApproving}
          onSlideChange={(index, patch) =>
            setCarouselDraft((d) =>
              d
                ? {
                    ...d,
                    slides: d.slides.map((s, i) =>
                      i === index ? { ...s, ...patch } : s,
                    ),
                  }
                : d,
            )
          }
          onCaptionChange={(caption) =>
            setCarouselDraft((d) => (d ? { ...d, caption } : d))
          }
          onRegenerate={() => void gerarRoteiroParaAprovacao()}
          onBack={() => {
            setCarouselDraft(null)
            setCarouselErr(null)
            setStep(3)
          }}
          onApprove={aprovarECriarCarrossel}
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
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 tracking-tight">
          Qual formato você quer criar?
        </h1>
        <p className="text-sm text-text-secondary">
          Escolha o tipo de conteúdo. Você define o tema no próximo passo.
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
              className={`group relative aspect-[4/5] rounded-2xl overflow-hidden text-white p-4 flex flex-col justify-between transition-all ${
                selected
                  ? "ring-2 ring-brand-400 scale-[1.02] shadow-[0_8px_32px_rgba(115, 32, 230,0.35)]"
                  : "ring-1 ring-white/[0.06] hover:ring-brand-500/40 hover:scale-[1.01]"
              }`}
              style={{
                backgroundImage: `url(${f.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: "#0A0A0F",
              }}
            >
              {/* Overlay gradient pra contraste do texto */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(10,10,15,0.35) 0%, rgba(10,10,15,0.15) 40%, rgba(10,10,15,0.85) 100%)",
                }}
              />
              {selected && (
                <div
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10"
                  style={{
                    background:
                      "linear-gradient(180deg, #8A33EC 0%, #7320E6 60%, #5F14D6 100%)",
                    boxShadow: "0 4px 14px rgba(115, 32, 230,0.5)",
                  }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
              <div className="relative z-10">
                <div
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg backdrop-blur-md"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <f.icon className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-sm sm:text-base font-bold leading-tight">
                  {f.label}
                </p>
                <p className="text-[10px] sm:text-xs opacity-80 mt-0.5">
                  {f.size}
                </p>
                {f.slides && f.slides > 1 && (
                  <p className="text-[10px] opacity-70 mt-0.5">
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
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1.5 tracking-tight">
          Defina o conteúdo
        </h1>
        <p className="text-sm text-text-secondary">
          Objetivo, abordagem e ponto de partida — em um só lugar.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-background-tertiary/20 p-4 sm:p-5 mb-6 space-y-5">
      {/* Objetivo */}
      <div>
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
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      sel ? "bg-brand-500/20" : "bg-background-tertiary"
                    }`}
                  >
                    <o.icon className={`w-4 h-4 ${sel ? "text-brand-300" : "text-text-secondary"}`} />
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
      <div className="pt-1 border-t border-border-subtle/60">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1 mt-3">
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
                    ? "border-brand-500 bg-brand-500/10"
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
      <div className="pt-1 border-t border-border-subtle/60">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 mt-3">
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
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                <c.icon
                  className={`w-5 h-5 mb-2 ${sel ? "text-brand-300" : "text-text-secondary"}`}
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
  linkUrl,
  setLinkUrl,
  onAnalisarLink,
  analisandoLink,
  linkErr,
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
  linkUrl: string
  setLinkUrl: (v: string) => void
  onAnalisarLink: () => void
  analisandoLink: boolean
  linkErr: string | null
  onBack: () => void
  onGerar: () => void
  canFinish: boolean
}) {
  const isPostUnico = formato.pageMode === "post-unico"
  const isLinkMode = comoCriar === "link"
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1.5 tracking-tight">
          Sua ideia
        </h1>
        <p className="text-sm text-text-secondary">
          {isLinkMode
            ? "Cole um link. A IA lê a página e transforma o conteúdo na sua ideia."
            : isPostUnico
              ? "Escreva a ideia. A IA escreve o texto e você revisa antes da arte."
              : "Vamos transformar sua ideia em conteúdo profissional."}
        </p>
      </div>

      {/* Resumo das escolhas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <Pill icon={formato.icon} label="FORMATO" value={formato.label} sub={formato.size} />
        <Pill icon={Wand2} label="MODO" value={comoCriar === "zero" ? "Criar do Zero" : comoCriar === "link" ? "A partir de Link" : "Inspirações"} sub="Criação livre" />
        <Pill icon={Sparkles} label="CRÉDITOS" value="10 cr" sub={formato.slides && formato.slides > 1 ? `${formato.slides} slides` : "1 slide"} />
      </div>

      {/* Modo Link: campo de URL + análise */}
      {isLinkMode && (
        <div className="rounded-2xl border border-border-subtle bg-background-tertiary/20 p-4 sm:p-5 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Link2 className="w-3 h-3" />
            Link de referência
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !analisandoLink) {
                  e.preventDefault()
                  onAnalisarLink()
                }
              }}
              placeholder="https://exemplo.com/artigo"
              className="flex-1 h-10 px-3 rounded-xl bg-background-tertiary/40 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500/60"
            />
            <Button
              onClick={onAnalisarLink}
              disabled={analisandoLink || linkUrl.trim().length < 4}
              className="min-w-[130px]"
            >
              {analisandoLink ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Analisar link
                </>
              )}
            </Button>
          </div>
          {linkErr && (
            <p className="text-xs text-destructive mt-2">{linkErr}</p>
          )}
          <p className="text-[10px] text-text-muted mt-2">
            A IA lê o conteúdo da página e gera o briefing abaixo — você pode editar antes de gerar.
          </p>
        </div>
      )}

      {/* Briefing + refino agrupados num card coeso */}
      <div className="rounded-2xl border border-border-subtle bg-background-tertiary/20 p-4 sm:p-5 mb-5">
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
        <div className="mb-4 rounded-xl border border-brand-600/30 bg-brand-600/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Prompt expandido pela IA
            </p>
            <button
              type="button"
              onClick={onRefinar}
              disabled={refinando}
              className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 disabled:opacity-50"
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
          className="w-full py-3 rounded-xl border-2 border-dashed border-brand-500/40 hover:border-brand-500/70 hover:bg-brand-500/5 text-brand-300 text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
        <Button
          onClick={onGerar}
          disabled={!canFinish || submitting}
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 min-w-[160px]"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPostUnico ? (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Gerar conteúdo
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
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
