"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CarouselEditor } from "@/components/carousel/carousel-editor"
import { generateCarouselImages } from "@/lib/carousel/generate-images"
import { loadCarouselV2 } from "@/app/actions/carousel"
import type { PreviewSlide, EditorialStyle } from "@/components/carousel/slide-preview"
import type { ClaudeSlide } from "@/lib/generation/claude"

interface PendingGeneration {
  kind?: string
  projectTitle?: string
  slides?: ClaudeSlide[]
  caption?: string
  colors?: string[]
  brandName?: string
  /** Handle do Instagram da marca (vem do wizard). Ex: "culturizesebrasil". */
  handle?: string
}

function handleFromBrand(name?: string): string {
  if (!name) return "@brand"
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
  return slug ? `@${slug}` : "@brand"
}

/** Normaliza o handle vindo do cadastro da marca ("culturizesebrasil" → "@culturizesebrasil"). */
function normalizeHandle(raw?: string | null): string | null {
  const h = (raw ?? "").trim().replace(/^@+/, "")
  return h ? `@${h}` : null
}

export default function CarrosselEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const carouselId = searchParams.get("id")
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  )
  const [slides, setSlides] = useState<PreviewSlide[]>([])
  const [meta, setMeta] = useState<{
    title: string
    caption: string
    brandName: string
    colors: string[]
    handle: string
  } | null>(null)
  const [savedStyle, setSavedStyle] = useState<EditorialStyle>("auto")
  const [savedFormat, setSavedFormat] = useState<"feed" | "stories">("feed")
  const [savedId, setSavedId] = useState<string | undefined>(undefined)
  const [savedFont, setSavedFont] = useState<string | undefined>(undefined)
  const [savedTitleWeight, setSavedTitleWeight] = useState<number | undefined>(
    undefined,
  )
  const [savedTitleScale, setSavedTitleScale] = useState<number | undefined>(
    undefined,
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState("Gerando as imagens do carrossel…")
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (typeof window === "undefined") return

    // Reabrindo um carrossel salvo da biblioteca (?id=...).
    if (carouselId) {
      setProgress("Carregando carrossel salvo…")
      ;(async () => {
        const res = await loadCarouselV2(carouselId)
        if (!res.ok) {
          setStatus("error")
          setErrorMsg(res.error || "Não foi possível carregar o carrossel.")
          return
        }
        const d = res.data
        setSlides(Array.isArray(d.slides) ? d.slides : [])
        setMeta({
          title: d.title || "Carrossel",
          caption: d.caption || "",
          brandName: d.brandName || "Marca",
          colors:
            Array.isArray(d.colors) && d.colors.length
              ? d.colors
              : ["#7320E6", "#0A0A0F", "#FAF8F5"],
          handle: d.handle || handleFromBrand(d.brandName),
        })
        setSavedStyle(d.editorialStyle || "auto")
        setSavedFormat(d.format === "stories" ? "stories" : "feed")
        setSavedFont(d.font)
        setSavedTitleWeight(d.titleWeight)
        setSavedTitleScale(d.titleScale)
        setSavedId(carouselId)
        setStatus("ready")
      })()
      return
    }

    let raw: string | null = null
    try {
      raw = sessionStorage.getItem("syncpost_pending_generation")
    } catch {
      raw = null
    }

    // Sem geração nova pendente → tenta restaurar o rascunho salvo (reload/voltar).
    if (!raw) {
      try {
        const draftRaw = localStorage.getItem("syncpost_carousel_draft")
        if (draftRaw) {
          const draft = JSON.parse(draftRaw) as {
            slides?: PreviewSlide[]
            title?: string
            caption?: string
            brandName?: string
            colors?: string[]
            handle?: string
          }
          if (Array.isArray(draft.slides) && draft.slides.length) {
            setSlides(draft.slides)
            setMeta({
              title: draft.title || "Carrossel",
              caption: draft.caption || "",
              brandName: draft.brandName || "Marca",
              colors:
                Array.isArray(draft.colors) && draft.colors.length
                  ? draft.colors
                  : ["#7320E6", "#0A0A0F", "#FAF8F5"],
              handle: draft.handle || handleFromBrand(draft.brandName),
            })
            setStatus("ready")
            return
          }
        }
      } catch {
        // rascunho corrompido — cai pro empty
      }
      setStatus("empty")
      return
    }

    let payload: PendingGeneration
    try {
      payload = JSON.parse(raw) as PendingGeneration
      sessionStorage.removeItem("syncpost_pending_generation")
    } catch {
      setStatus("error")
      setErrorMsg("Dados do carrossel inválidos.")
      return
    }

    const claudeSlides = Array.isArray(payload.slides) ? payload.slides : []
    if (!claudeSlides.length) {
      setStatus("empty")
      return
    }

    setMeta({
      title: payload.projectTitle || "Carrossel",
      caption: payload.caption || "",
      brandName: payload.brandName || "Marca",
      colors:
        Array.isArray(payload.colors) && payload.colors.length
          ? payload.colors
          : ["#7320E6", "#0A0A0F", "#FAF8F5"],
      handle:
        normalizeHandle(payload.handle) ?? handleFromBrand(payload.brandName),
    })
    setProgress(`Gerando ${claudeSlides.length} imagens…`)

    ;(async () => {
      try {
        const result = await generateCarouselImages(claudeSlides)
        setSlides(result)
        setStatus("ready")
      } catch (err) {
        setStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "erro ao gerar imagens")
      }
    })()
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-text-secondary">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <p className="text-sm">{progress}</p>
      </div>
    )
  }

  if (status === "empty") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-text-secondary">
          Nenhum carrossel pra editar. Crie um novo pelo fluxo de criação.
        </p>
        <Button onClick={() => router.push("/dashboard/criar")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Ir pra criação
        </Button>
      </div>
    )
  }

  if (status === "error" || !meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-destructive">{errorMsg ?? "Erro ao montar o carrossel."}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/projetos")}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Ir pra biblioteca
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/criar")}>
            Criar novo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <CarouselEditor
      initialSlides={slides}
      initialTitle={meta.title}
      caption={meta.caption}
      brandName={meta.brandName}
      handle={meta.handle}
      colors={meta.colors}
      template="editorial"
      editorialStyle={savedStyle}
      initialFormat={savedFormat}
      initialCarouselId={savedId}
      initialFont={savedFont}
      initialTitleWeight={savedTitleWeight}
      initialTitleScale={savedTitleScale}
    />
  )
}
