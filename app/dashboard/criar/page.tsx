"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Sparkles,
  Square,
  Smartphone,
  GalleryHorizontal,
  Heart,
  DollarSign,
  Flame,
  GraduationCap,
  Newspaper,
  Tag,
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
import { POST_TEMPLATES, CATEGORY_LABELS } from "@/lib/single-posts/catalog"
import type { PostTemplateMeta } from "@/lib/single-posts/types"
import { getActiveBrandLite, type ActiveBrandLite } from "@/app/actions/brands"

type StepId = 1 | 2 | 3 | 4 | 5

// === Recomendação de templates por objetivo + abordagem ===
// Mapeia o que o usuário quer (objetivo/abordagem) pras categorias de template
// que combinam. v1 rule-based; depois dá pra cruzar com o nicho da marca.
const RECO_BY_ABORDAGEM: Record<Abordagem, string[]> = {
  viral: ["comercial", "fitness", "informativo"],
  educativo: ["profissional", "informativo", "empresa"],
  comunidade: ["informativo", "beauty", "profissional"],
  storytelling: ["profissional", "beauty", "empresa"],
  dados: ["informativo", "profissional", "empresa"],
  oferta: ["comercial", "fitness", "empresa"],
}
const RECO_BY_OBJETIVO: Record<Objetivo, string[]> = {
  vender: ["comercial", "fitness", "empresa"],
  engajar: ["informativo", "profissional", "beauty"],
  informar: ["informativo", "profissional", "empresa"],
  comunidade: ["beauty", "informativo", "fitness"],
}
function recommendedTemplates(
  objetivo: Objetivo,
  abordagem: Abordagem | null,
): PostTemplateMeta[] {
  const cats = new Set<string>([
    ...(abordagem ? RECO_BY_ABORDAGEM[abordagem] : []),
    ...RECO_BY_OBJETIVO[objetivo],
  ])
  return POST_TEMPLATES.filter((t) => cats.has(t.category)).slice(0, 6)
}

/** Marca demo usada pelo wizard ao empurrar pra /teste. */
const WIZARD_BRAND = {
  id: "wizard-brand",
  name: "Marca Demo",
  brand_colors: ["#7320E6", "#0A0A0F", "#FAF8F5"],
  instagram_handle: "marca",
}

type Formato = {
  id: string
  label: string
  size: string
  pageMode: "carrossel" | "post-unico"
  format: "post" | "story"
  slides: number
  icon: typeof Sparkles
}

type FormatKind = "post" | "story"

/**
 * Monta o objeto de formato a partir da escolha do usuário:
 * feed vs stories + quantidade de slides (1 a 20 — limite do Instagram).
 * 1 slide = post único, 2+ = carrossel. O restante do wizard consome esse
 * objeto genericamente.
 */
function buildFormato(format: FormatKind, slides: number): Formato {
  const n = Math.min(20, Math.max(1, slides))
  const isStory = format === "story"
  const pageMode = n <= 1 ? "post-unico" : "carrossel"
  const base = isStory ? "Stories" : "Feed"
  return {
    id: `${format}-${n}`,
    label: n <= 1 ? `${base} · 1 slide` : `${base} · ${n} slides`,
    size: isStory ? "1080 × 1920px" : "1080 × 1350px",
    pageMode,
    format,
    slides: n,
    icon: isStory ? Smartphone : n <= 1 ? Square : GalleryHorizontal,
  }
}

type Objetivo = "vender" | "engajar" | "informar" | "comunidade"
type Abordagem =
  | "viral"
  | "educativo"
  | "comunidade"
  | "storytelling"
  | "dados"
  | "oferta"
type ComoCriar = "zero" | "link" | "inspiracoes"

// === Objetivo: UI ↔ API (o backend usa sell/inform/engage/community) ===
const OBJETIVO_TO_API: Record<
  Objetivo,
  "sell" | "inform" | "engage" | "community"
> = {
  vender: "sell",
  informar: "inform",
  engajar: "engage",
  comunidade: "community",
}
const API_TO_OBJETIVO: Record<string, Objetivo> = {
  sell: "vender",
  inform: "informar",
  engage: "engajar",
  community: "comunidade",
}

/** main_objective da marca pode vir null ou com vírgulas ("sell,engage"). */
function objetivosFromBrand(
  mainObjective: string | null | undefined,
): Objetivo[] {
  if (!mainObjective) return []
  return mainObjective
    .split(",")
    .map((s) => API_TO_OBJETIVO[s.trim()])
    .filter((o): o is Objetivo => Boolean(o))
}

/** Heurística: abordagens recomendadas pra cada objetivo da marca. */
const RECO_ABORDAGEM_BY_OBJETIVO: Record<Objetivo, Abordagem[]> = {
  vender: ["oferta", "viral"],
  informar: ["educativo", "dados"],
  engajar: ["storytelling", "viral"],
  comunidade: ["comunidade", "storytelling"],
}

const OBJETIVO_OPTIONS: {
  id: Objetivo
  label: string
  desc: string
  icon: typeof Sparkles
}[] = [
  {
    id: "engajar",
    label: "Engajar",
    desc: "Aumentar interação e alcance",
    icon: Heart,
  },
  {
    id: "vender",
    label: "Vender",
    desc: "Converter seguidores em clientes",
    icon: DollarSign,
  },
  {
    id: "informar",
    label: "Informar",
    desc: "Educar e virar referência no tema",
    icon: Newspaper,
  },
  {
    id: "comunidade",
    label: "Comunidade",
    desc: "Criar conversa e pertencimento",
    icon: Users,
  },
]

const ABORDAGEM_OPTIONS: {
  id: Abordagem
  label: string
  icon: typeof Sparkles
  color: string
}[] = [
  { id: "viral", label: "Viral", icon: Flame, color: "text-orange-400" },
  { id: "educativo", label: "Educativo", icon: GraduationCap, color: "text-blue-400" },
  { id: "comunidade", label: "Comunidade", icon: Users, color: "text-emerald-400" },
  { id: "storytelling", label: "Storytelling", icon: BookOpen, color: "text-brand-400" },
  { id: "dados", label: "Dados & provas", icon: BarChart3, color: "text-sky-400" },
  { id: "oferta", label: "Oferta direta", icon: Tag, color: "text-pink-400" },
]

const BRIEFING_PLACEHOLDER_FALLBACK =
  "Ex: Como o distanciamento entre OpenAI e Microsoft afeta o setor de IA"

/**
 * Placeholder do briefing personalizado pela marca ativa — heurística local
 * (sem chamar IA). Usa nome + público + objetivo principal da marca.
 */
function buildBriefingPlaceholder(brand: ActiveBrandLite | null): string {
  const nome = brand?.name?.trim()
  if (!brand || !nome) return BRIEFING_PLACEHOLDER_FALLBACK
  const publico = brand.target_audience?.trim() || "seu público"
  // Sem objetivo definido mas com descrição → cai no tom "engajar" genérico.
  const primary =
    objetivosFromBrand(brand.main_objective)[0] ??
    (brand.description?.trim() ? "engajar" : null)
  const variante = nome.length % 2
  switch (primary) {
    case "vender":
      return variante === 0
        ? `Ex: 3 sinais de que ${publico} está pronto pra fechar com a ${nome}`
        : `Ex: o que ${publico} ganha ao escolher a ${nome} (e ninguém conta)`
    case "informar":
      return variante === 0
        ? `Ex: o erro mais comum que ${publico} comete — e como evitar`
        : `Ex: guia rápido: o que ${publico} precisa saber antes de decidir`
    case "comunidade":
      return variante === 0
        ? `Ex: pergunta pra ${publico}: qual o maior desafio de vocês hoje?`
        : `Ex: conta pra gente: o que faria ${publico} voltar sempre na ${nome}?`
    case "engajar":
      return variante === 0
        ? `Ex: os bastidores da ${nome} que ${publico} nunca viu`
        : `Ex: 5 curiosidades da ${nome} que ${publico} não imagina`
    default:
      return BRIEFING_PLACEHOLDER_FALLBACK
  }
}

export default function CriarWizardPage() {
  // useSearchParams (sync do step com a URL) exige Suspense boundary no App Router.
  return (
    <Suspense fallback={null}>
      <CriarWizard />
    </Suspense>
  )
}

function CriarWizard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<StepId>(1)
  const [formato, setFormato] = useState<Formato | null>(null)
  const [objetivo, setObjetivo] = useState<Objetivo>("engajar")
  const [abordagem, setAbordagem] = useState<Abordagem | null>(null)
  const [comoCriar, setComoCriar] = useState<ComoCriar>("zero")
  const [briefing, setBriefing] = useState("")
  // Template escolhido na etapa nova ("auto" = deixa a IA escolher).
  const [templateId, setTemplateId] = useState<string>("auto")
  const [promptRefinado, setPromptRefinado] = useState<string | null>(null)
  const [refinando, setRefinando] = useState(false)
  const [refineErr, setRefineErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // --- Modo "A partir de Link" ---
  const [linkUrl, setLinkUrl] = useState("")
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

  const isPostUnico = formato?.pageMode === "post-unico"
  // "Criar do Zero" pula a galeria de templates: vai direto pra Ideia e a
  // geração usa o modo free/skeleton (templateId fica "auto").
  const hasTemplateStep = isPostUnico && comoCriar !== "zero"

  // --- Sincronização do step com a URL (?step=N) ---
  // Avançar/voltar pelos botões faz push; back/forward do navegador é lido
  // pelo efeito abaixo — assim o botão voltar não sai do fluxo.
  function goToStep(s: StepId) {
    setStep(s)
    router.push(`${pathname}?step=${s}`, { scroll: false })
  }

  // Ref pro efeito ler o step atual sem entrar nas dependências (evita loop:
  // só damos push quando o step muda por clique, só setStep quando a URL muda).
  const stepRef = useRef<StepId>(step)
  stepRef.current = step

  useEffect(() => {
    const raw = Number(searchParams.get("step") ?? "1")
    const urlStep: StepId =
      raw === 2 || raw === 3 || raw === 4 || raw === 5 ? raw : 1
    if (urlStep === stepRef.current) return
    // Valida pré-requisitos: entrar direto em ?step=N sem os dados das etapas
    // anteriores cai no maior step válido (no pior caso, o 1).
    const allowed: StepId[] = [1]
    if (formato) allowed.push(2)
    if (formato && abordagem) {
      if (hasTemplateStep) allowed.push(3)
      allowed.push(4)
    }
    if (approvalDraft || carouselDraft || approvalLoading || carouselLoading) {
      allowed.push(5)
    }
    let target: StepId = 1
    for (const s of allowed) {
      if (s <= urlStep && s > target) target = s
    }
    setStep(target)
    if (target !== urlStep) {
      router.replace(`${pathname}?step=${target}`, { scroll: false })
    }
    // Só reage a mudança EXTERNA da URL (back/forward/entrada direta).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // --- Marca ativa: usada na geração em vez da Marca Demo hardcoded ---
  const [activeBrand, setActiveBrand] = useState<ActiveBrandLite | null>(null)
  // Marca se o usuário já escolheu objetivo manualmente (não sobrescrever).
  const objetivoTouched = useRef(false)
  useEffect(() => {
    getActiveBrandLite()
      .then((b) => {
        if (!b) return
        setActiveBrand(b)
        // Pré-seleciona o objetivo recomendado pela marca como default.
        const recos = objetivosFromBrand(b.main_objective)
        if (!objetivoTouched.current && recos[0]) setObjetivo(recos[0])
      })
      .catch(() => {})
  }, [])

  // Recomendações derivadas da marca ativa (badge "Recomendado" no Step 2).
  const recommendedObjetivos = objetivosFromBrand(activeBrand?.main_objective)
  const recommendedAbordagens = Array.from(
    new Set(
      recommendedObjetivos.flatMap((o) => RECO_ABORDAGEM_BY_OBJETIVO[o]),
    ),
  )
  // Marca efetiva pra geração: a ativa real, com fallback pros defaults demo
  // só quando ainda não carregou / o usuário não tem marca.
  const wizardBrand = activeBrand
    ? {
        id: activeBrand.id,
        name: activeBrand.name,
        brand_colors: activeBrand.brand_colors?.length
          ? activeBrand.brand_colors
          : WIZARD_BRAND.brand_colors,
        instagram_handle:
          activeBrand.instagram_handle || WIZARD_BRAND.instagram_handle,
      }
    : WIZARD_BRAND

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
        setFormato(buildFormato("post", 1))
        goToStep(2)
      }
      if (p.formato === "carrossel") {
        setFormato(buildFormato("post", 7))
        goToStep(2)
      }
      if (p.formato === "stories") {
        setFormato(buildFormato("story", 1))
        goToStep(2)
      }
    } catch {}
    // Roda só no mount (consome o pending da Inspiração).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // No modo link só precisamos de um link válido — o briefing vem da análise
  // da página na hora de gerar.
  function canGerar() {
    if (comoCriar === "link") return linkUrl.trim().length >= 8
    return canFinish()
  }

  /**
   * Refina o briefing com IA. Retorna o texto refinado (ou null se falhar) —
   * o retorno é usado pelo fluxo de geração automática, que não pode esperar
   * o setState de `promptRefinado` propagar.
   */
  async function refinarComIA(): Promise<string | null> {
    if (briefing.trim().length < 10) {
      setRefineErr("Briefing precisa ter pelo menos 10 chars")
      return null
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
        return null
      }
      const refined = typeof data.refined === "string" ? data.refined : null
      if (refined) setPromptRefinado(refined)
      return refined
    } catch (err) {
      setRefineErr(err instanceof Error ? err.message : "erro de rede")
      return null
    } finally {
      setRefinando(false)
    }
  }

  /**
   * Resolve o briefing final que alimenta a geração.
   * No modo "A partir de Link" a análise da página acontece AQUI, na hora de
   * gerar (sem etapa separada de "Analisar link") — a tela de carregamento de
   * "Revisando roteiro" cobre extração + geração num fluxo só.
   */
  async function resolveBriefing(refined?: string | null): Promise<string> {
    if (comoCriar === "link") {
      const url = linkUrl.trim()
      const res = await fetch("/api/extract-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          formato: formato?.id ?? "post",
          objetivo,
          abordagem,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "erro ao analisar o link")
      return (data.briefing ?? "").trim()
    }
    // `refined` cobre o refino automático da mesma submissão (o state
    // `promptRefinado` ainda não propagou nesse ponto).
    return (refined ?? promptRefinado ?? briefing).trim()
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
  async function gerarTextoParaAprovacao(refined?: string | null) {
    if (!formato) return
    setApprovalErr(null)
    setApprovalLoading(true)
    goToStep(5)
    try {
      const finalBriefing = await resolveBriefing(refined)
      const res = await fetch("/api/post-unico/free-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: wizardBrand,
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
          brand: wizardBrand,
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
  async function gerarRoteiroParaAprovacao(refined?: string | null) {
    if (!formato) return
    setCarouselErr(null)
    setCarouselLoading(true)
    goToStep(5)
    try {
      const finalBriefing = await resolveBriefing(refined)
      // Regeração ("gerar novo roteiro"): manda os títulos do roteiro atual
      // pra IA produzir uma versão realmente diferente (não variação cosmética).
      const avoidTitles = carouselDraft?.slides?.length
        ? carouselDraft.slides.map((s) => s.title).filter(Boolean)
        : undefined
      const res = await fetch("/api/editorial/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalBriefing,
          objective: OBJETIVO_TO_API[objetivo],
          abordagem: abordagem ?? undefined,
          template: "editorial",
          brandName: wizardBrand.name,
          handle: wizardBrand.instagram_handle,
          colors: wizardBrand.brand_colors,
          desiredSlides: formato.slides ?? 7,
          avoidTitles,
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
          objective: OBJETIVO_TO_API[objetivo],
          template: "editorial",
          nSlides: carouselDraft.slides.length || (formato.slides ?? 7),
          colors: wizardBrand.brand_colors,
          brandName: wizardBrand.name,
          handle: wizardBrand.instagram_handle,
          autoRun: true,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push("/dashboard/carrossel")
  }

  /** Template curado escolhido → vai direto pro /teste no modo template:
   *  o editor gera o conteúdo estruturado daquele template e monta o design. */
  function criarComTemplateEscolhido(refined?: string | null) {
    if (!formato) return
    setSubmitting(true)
    const finalBriefing = (refined ?? promptRefinado ?? briefing).trim()
    try {
      sessionStorage.setItem(
        "syncpost_pending_post_unico",
        JSON.stringify({
          kind: "template",
          brand: wizardBrand,
          templateId,
          rawContent: finalBriefing,
          briefing: finalBriefing,
          autoRun: true,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push(`/teste?format=${formato.format}`)
  }

  async function handleGerar() {
    if (!formato || !canGerar()) return
    setLinkErr(null)
    // Refino automático: acontece SEMPRE antes de gerar (exceto no modo link,
    // onde o briefing vem da análise da página). Se falhar, segue com o
    // briefing bruto — o refino nunca bloqueia a geração.
    let refined = promptRefinado
    if (comoCriar !== "link" && !refined) {
      refined = await refinarComIA()
    }
    if (formato.pageMode === "post-unico") {
      // Escolheu um template curado (e não é modo link) → gera direto nele,
      // sem a etapa de aprovação do caminho auto/skeleton.
      if (comoCriar !== "link" && templateId !== "auto") {
        criarComTemplateEscolhido(refined)
        return
      }
      // Auto (ou link): gera o TEXTO primeiro e abre a etapa de aprovação.
      void gerarTextoParaAprovacao(refined)
      return
    }
    // Carrossel: mesma etapa de aprovação — gera SÓ o roteiro (text-only),
    // o usuário revisa/edita e só então as imagens são geradas em /teste.
    void gerarRoteiroParaAprovacao(refined)
  }

  const steps: { id: StepId; label: string }[] = [
    { id: 1, label: "Formato" },
    { id: 2, label: "Modo" },
    // Template só pra post-único E fora do "Criar do Zero" (que vai direto
    // pra ideia e usa o modo free/skeleton). Carrossel também não tem catálogo.
    ...(hasTemplateStep ? [{ id: 3 as StepId, label: "Template" }] : []),
    { id: 4, label: "Ideia" },
    // Etapa de aprovação existe pros dois fluxos (post-único e carrossel).
    ...(formato ? [{ id: 5 as StepId, label: "Aprovar" }] : []),
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
            !(step === 5 && (approvalLoading || carouselLoading))
          return (
            <div key={s} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  if (clickable) goToStep(s)
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
          onNext={() => canAdvanceStep1() && goToStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          objetivo={objetivo}
          abordagem={abordagem}
          comoCriar={comoCriar}
          recommendedObjetivos={recommendedObjetivos}
          recommendedAbordagens={recommendedAbordagens}
          onObjetivo={(v) => {
            objetivoTouched.current = true
            setObjetivo(v)
          }}
          onAbordagem={setAbordagem}
          onComoCriar={(v) => {
            setComoCriar(v)
            // "Criar do Zero" pula a galeria → garante o modo free/skeleton.
            if (v === "zero") setTemplateId("auto")
          }}
          onBack={() => goToStep(1)}
          onNext={() => canAdvanceStep2() && goToStep(hasTemplateStep ? 3 : 4)}
        />
      )}

      {step === 3 && formato && hasTemplateStep && (
        <TemplateStep
          objetivo={objetivo}
          abordagem={abordagem}
          templateId={templateId}
          onSelect={setTemplateId}
          onBack={() => goToStep(2)}
          onNext={() => goToStep(4)}
        />
      )}

      {step === 4 && formato && (
        <Step3
          formato={formato}
          objetivo={objetivo}
          comoCriar={comoCriar}
          briefing={briefing}
          setBriefing={setBriefing}
          briefingPlaceholder={buildBriefingPlaceholder(activeBrand)}
          promptRefinado={promptRefinado}
          setPromptRefinado={setPromptRefinado}
          onRefinar={() => void refinarComIA()}
          refinando={refinando}
          refineErr={refineErr}
          submitting={submitting}
          linkUrl={linkUrl}
          setLinkUrl={setLinkUrl}
          linkErr={linkErr}
          onBack={() => goToStep(hasTemplateStep ? 3 : 2)}
          onGerar={() => void handleGerar()}
          canFinish={canGerar()}
        />
      )}

      {step === 5 && formato && isPostUnico && (
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
            goToStep(4)
          }}
          onApprove={aprovarECriar}
        />
      )}

      {step === 5 && formato && !isPostUnico && (
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
            goToStep(4)
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
  // Escolha atual derivada do formato já montado (ou defaults).
  const format: FormatKind = formato?.format ?? "post"
  const slides = formato?.slides ?? 1
  const chosen = formato !== null

  const FORMAT_OPTIONS: {
    id: FormatKind
    label: string
    size: string
    desc: string
    icon: typeof Square
  }[] = [
    {
      id: "post",
      label: "Feed",
      size: "1080 × 1350px",
      desc: "Post ou carrossel no feed",
      icon: Square,
    },
    {
      id: "story",
      label: "Stories",
      size: "1080 × 1920px",
      desc: "Tela cheia vertical",
      icon: Smartphone,
    },
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 tracking-tight">
          Qual formato você quer criar?
        </h1>
        <p className="text-sm text-text-secondary">
          Escolha onde vai publicar e quantos slides. O tema vem no próximo passo.
        </p>
      </div>

      {/* Formato: Feed x Stories */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-xl mx-auto">
        {FORMAT_OPTIONS.map((f) => {
          const selected = chosen && format === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(buildFormato(f.id, slides))}
              className={`relative rounded-2xl p-5 text-left transition-all border-2 ${
                selected
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
              }`}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${
                  selected ? "bg-brand-500/20" : "bg-background-tertiary"
                }`}
              >
                <f.icon
                  className={`w-5 h-5 ${selected ? "text-brand-300" : "text-text-secondary"}`}
                />
              </div>
              <p className="text-base font-semibold text-text-primary">
                {f.label}
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">{f.desc}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{f.size}</p>
            </button>
          )
        })}
      </div>

      {/* Quantidade de slides: 1 a 20 (limite do Instagram) */}
      <div className="max-w-xl mx-auto mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 text-center">
          Quantos slides?
        </p>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20].map((n) => {
            const selected = chosen && slides === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onSelect(buildFormato(format, n))}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  selected
                    ? "border-brand-500 bg-brand-500/10 text-brand-200"
                    : "border-border-subtle bg-background-tertiary/30 text-text-secondary hover:border-border-medium"
                }`}
              >
                <span className="text-lg font-semibold tabular-nums">{n}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-text-muted mt-2 text-center">
          {slides <= 1
            ? "1 slide = post único."
            : `${slides} slides = carrossel. O Instagram aceita até 20.`}
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!chosen} className="min-w-[140px]">
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
  recommendedObjetivos,
  recommendedAbordagens,
  onObjetivo,
  onAbordagem,
  onComoCriar,
  onBack,
  onNext,
}: {
  objetivo: Objetivo
  abordagem: Abordagem | null
  comoCriar: ComoCriar
  recommendedObjetivos: Objetivo[]
  recommendedAbordagens: Abordagem[]
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
          {OBJETIVO_OPTIONS.map((o) => {
            const sel = objetivo === o.id
            const reco = recommendedObjetivos.includes(o.id)
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onObjetivo(o.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  sel
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                {reco && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-600/90 text-white">
                    Recomendado
                  </span>
                )}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ABORDAGEM_OPTIONS.map((a) => {
            const sel = abordagem === a.id
            const reco = recommendedAbordagens.includes(a.id)
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAbordagem(a.id)}
                className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                  sel
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
                }`}
              >
                {reco && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-600/90 text-white">
                    Recomendado
                  </span>
                )}
                <a.icon className={`w-5 h-5 ${a.color}`} />
                <p className="text-xs font-medium text-text-primary">{a.label}</p>
              </button>
            )
          })}
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
  briefingPlaceholder,
  comoCriar,
  promptRefinado,
  setPromptRefinado,
  onRefinar,
  refinando,
  refineErr,
  submitting,
  linkUrl,
  setLinkUrl,
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
  briefingPlaceholder: string
  promptRefinado: string | null
  setPromptRefinado: (v: string | null) => void
  onRefinar: () => void
  refinando: boolean
  refineErr: string | null
  submitting: boolean
  linkUrl: string
  setLinkUrl: (v: string) => void
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <Pill
          icon={formato.icon}
          label="FORMATO"
          value={formato.label}
          sub={formato.size}
        />
        <Pill
          icon={Wand2}
          label="MODO"
          value={comoCriar === "zero" ? "Criar do Zero" : comoCriar === "link" ? "A partir de Link" : "Inspirações"}
          sub={formato.slides > 1 ? `${formato.slides} slides` : "1 slide"}
        />
      </div>

      {/* Modo Link: só o campo de URL. A IA analisa a página na hora de gerar. */}
      {isLinkMode && (
        <div className="rounded-2xl border border-border-subtle bg-background-tertiary/20 p-4 sm:p-5 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Link2 className="w-3 h-3" />
            Link de referência
          </p>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canFinish) {
                e.preventDefault()
                onGerar()
              }
            }}
            placeholder="https://exemplo.com/artigo"
            className="w-full h-10 px-3 rounded-xl bg-background-tertiary/40 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500/60"
          />
          {linkErr && (
            <p className="text-xs text-destructive mt-2">{linkErr}</p>
          )}
          <p className="text-[10px] text-text-muted mt-2">
            Cole o link e clique em gerar — a IA lê a página e cria o conteúdo direto.
          </p>
        </div>
      )}

      {/* Briefing + refino agrupados num card coeso (oculto no modo link) */}
      <div className={`rounded-2xl border border-border-subtle bg-background-tertiary/20 p-4 sm:p-5 mb-5${isLinkMode ? " hidden" : ""}`}>
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
          placeholder={briefingPlaceholder}
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

      {/* Refino agora é automático: acontece ao clicar em gerar. */}
      {!isLinkMode && !promptRefinado && (
        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          Ao gerar, a IA refina sua ideia automaticamente antes de criar o conteúdo.
        </p>
      )}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onBack} disabled={refinando}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
        <Button
          onClick={onGerar}
          disabled={!canFinish || submitting || refinando}
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 min-w-[160px]"
        >
          {refinando ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Refinando sua ideia...
            </>
          ) : submitting ? (
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
              Gerar com IA
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function TemplateCard({
  t,
  selected,
  recommended,
  onSelect,
}: {
  t: PostTemplateMeta
  selected: boolean
  recommended?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={t.use_when?.[0] ?? t.description}
      className={`group relative aspect-[4/5] rounded-xl overflow-hidden text-left transition-all ${
        selected
          ? "ring-2 ring-brand-400 scale-[1.02]"
          : "ring-1 ring-white/[0.06] hover:ring-brand-500/40"
      }`}
      style={{
        backgroundImage: `url(${t.reference_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0A0A0F",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,15,0.1) 0%, rgba(10,10,15,0.2) 45%, rgba(10,10,15,0.9) 100%)",
        }}
      />
      {recommended && !selected && (
        <span className="absolute top-2 left-2 z-10 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-600/90 text-white">
          Recomendado
        </span>
      )}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center z-10">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-2.5 z-10">
        <p className="text-[11px] font-bold text-white leading-tight">{t.label}</p>
        <p className="text-[9px] text-white/60">
          {CATEGORY_LABELS[t.category] ?? t.category}
        </p>
      </div>
    </button>
  )
}

function TemplateStep({
  objetivo,
  abordagem,
  templateId,
  onSelect,
  onBack,
  onNext,
}: {
  objetivo: Objetivo
  abordagem: Abordagem | null
  templateId: string
  onSelect: (id: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const recomendados = recommendedTemplates(objetivo, abordagem)
  const recoIds = new Set(recomendados.map((t) => t.id))
  const byCategory = POST_TEMPLATES.reduce<Record<string, PostTemplateMeta[]>>(
    (acc, t) => {
      ;(acc[t.category] ??= []).push(t)
      return acc
    },
    {},
  )

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1.5 tracking-tight">
          Escolha um template
        </h1>
        <p className="text-sm text-text-secondary">
          Recomendados pro seu objetivo — ou navegue a biblioteca completa.
        </p>
      </div>

      {/* Auto + Recomendados */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          Recomendados pra sua marca
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onSelect("auto")}
            className={`group aspect-[4/5] rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-center p-3 transition-all ${
              templateId === "auto"
                ? "border-brand-500 bg-brand-500/10"
                : "border-border-subtle bg-background-tertiary/30 hover:border-border-medium"
            }`}
          >
            <Sparkles
              className={`w-7 h-7 ${templateId === "auto" ? "text-brand-300" : "text-text-secondary"}`}
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">Auto</p>
              <p className="text-[10px] text-text-muted leading-tight">
                A IA escolhe o melhor layout
              </p>
            </div>
          </button>

          {recomendados.map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              selected={templateId === t.id}
              onSelect={() => onSelect(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Biblioteca completa */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          Biblioteca completa
        </p>
        <div className="space-y-5">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[11px] font-medium text-text-secondary mb-2">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((t) => (
                  <TemplateCard
                    key={t.id}
                    t={t}
                    selected={templateId === t.id}
                    recommended={recoIds.has(t.id)}
                    onSelect={() => onSelect(t.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
        <Button onClick={onNext}>
          Continuar
          <ArrowRight className="w-4 h-4 ml-1.5" />
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
