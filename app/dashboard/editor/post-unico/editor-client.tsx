"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Baseline,
  Check,
  Copy,
  Download,
  Loader2,
  MessageSquare,
  Move,
  Plus,
  RectangleVertical,
  RefreshCw,
  Image as ImageIcon,
  Save,
  Smartphone,
  Sparkles,
  Square,
  Type,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { EditorSection as Section } from "@/components/editor/editor-section"
import { PublishToInstagram } from "@/components/instagram/publish-to-instagram"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSpecEditor } from "@/lib/single-posts/use-spec-editor"
import { applyFontPreset, FONT_PRESETS } from "@/lib/single-posts/font-presets"
import {
  exportSpecToPng,
  isRealBrandId,
  renderSpecToPng,
  saveSinglePost,
} from "@/lib/single-posts/save"
import { uploadPngDataUrl } from "@/lib/instagram/render-upload"
import {
  addImageBlock,
  addShapeBlock,
  addTextBlock,
  TEXT_STYLES,
} from "@/lib/single-posts/add-block"
import { TOKEN_COST, tokenCostForSinglePost } from "@/lib/tokens"
import {
  adaptSpecFormat,
  measureSpecBlocks,
} from "@/lib/single-posts/adapt-format"
import {
  POST_FORMATS,
  POST_FORMAT_LIST,
  toPostFormat,
  type PostFormat,
} from "@/lib/single-posts/formats"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"
import type { PostBrand } from "@/lib/single-posts/types"

/**
 * Payload que os wizards gravam no sessionStorage antes de redirecionar.
 *
 * - `skeleton`: so o briefing — o editor gera texto e imagem.
 * - `approved`: o texto ja foi gerado e aprovado no passo 5 do /dashboard/criar.
 *   O editor NAO regenera a copy: manda o conteudo aprovado e so monta o design
 *   com a foto. O texto ja foi cobrado na etapa text_only, entao aqui so a
 *   imagem e debitada.
 */
interface PendingPayload {
  kind: "skeleton" | "approved" | "template"
  brand: PostBrand
  briefing?: string
  rawContent?: string
  autoRun?: boolean
  // --- modo approved ---
  skeletonId?: string
  approvedContent?: Record<string, unknown>
  caption?: string
  photoPrompt?: string | null
  photoEntity?: string | null
}

const STORAGE_KEY = "syncpost_pending_post_unico"

/** Post salvo carregado da biblioteca para reedicao (`?post=<id>`). */
export interface InitialPost {
  id: string
  brandId: string
  spec: FreePostSpec
  fontPreset: string
  caption: string
  briefing: string
  skeletonId: string | null
  format: PostFormat
  /** Textos pintados na arte (modo bitmap) — null em posts de camadas. */
  bitmapTexts?: Record<string, unknown> | null
}

interface Props {
  brands: PostBrand[]
  balance: number
  initialPost?: InitialPost | null
}

export function EditorClient({ brands, balance, initialPost }: Props) {
  const router = useRouter()
  const cost = tokenCostForSinglePost()

  const [brand, setBrand] = useState<PostBrand | null>(
    (initialPost && brands.find((b) => b.id === initialPost.brandId)) ??
      brands[0] ??
      null,
  )
  const [briefing, setBriefing] = useState(initialPost?.briefing ?? "")
  const [caption, setCaption] = useState(initialPost?.caption ?? "")
  const [copied, setCopied] = useState(false)
  const [spec, setSpec] = useState<FreePostSpec | null>(initialPost?.spec ?? null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [skeletonId, setSkeletonId] = useState<string | null>(
    initialPost?.skeletonId ?? null,
  )
  const [usedIds, setUsedIds] = useState<string[]>([])
  const [fontPreset, setFontPreset] = useState(initialPost?.fontPreset ?? "editorial")
  /**
   * Formato do canvas. Não é só um preview diferente: o spec guardado JÁ está
   * posicionado pra este formato (ver `handleFormat`), então ele viaja junto no
   * save e volta na reedição.
   */
  const [format, setFormat] = useState<PostFormat>(
    toPostFormat(initialPost?.format),
  )
  const [adapting, setAdapting] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(initialPost?.id ?? null)
  const [saveOk, setSaveOk] = useState(false)

  // ---- Edição cirúrgica (modo bitmap) ----
  // Os textos PINTADOS na arte, na forma dos slots da copy. O painel edita um
  // rascunho; "Aplicar" manda só as diferenças pro nano-banana /edit.
  const [bitmapTexts, setBitmapTexts] = useState<Record<string, unknown> | null>(
    initialPost?.bitmapTexts ?? null,
  )
  const [bitmapDraft, setBitmapDraft] = useState<Record<string, string>>({})
  const [bitmapApplying, setBitmapApplying] = useState(false)
  const [bitmapErr, setBitmapErr] = useState<string | null>(null)

  const previewRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bootstrapped = useRef(false)
  /**
   * Armado ao fim de uma geração NOVA; desarmado pelo efeito que salva.
   * Ref e não estado porque o efeito precisa ler o valor já atualizado no mesmo
   * ciclo em que o spec chega, sem provocar um render só pra isso.
   */
  const autoSaveRef = useRef(false)

  const finalSpec = spec ? applyFontPreset(spec, fontPreset) : null

  const { canvas, panel, containerRef, setSelectedPath } = useSpecEditor(
    finalSpec,
    (next) => setSpec(next),
    { format },
  )

  const generate = useCallback(
    async (b: PostBrand, brief: string, excludeIds: string[]) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/post-unico/free-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: b,
            briefing: brief.trim(),
            skeleton_id: null,
            exclude_skeleton_ids: excludeIds.slice(-3),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "erro desconhecido")
          return
        }
        setSpec(data.spec)
        setCaption(typeof data.caption === "string" ? data.caption : "")
        setPhotoUrl(data.photo_url ?? null)
        setSkeletonId(data.skeleton_id ?? null)
        if (data.content) {
          setBitmapTexts(data.content)
          setBitmapDraft({})
        }
        if (data.skeleton_id) setUsedIds((prev) => [...prev, data.skeleton_id])
        // Novo post gerado = novo registro na biblioteca no próximo save.
        setSavedId(null)
        autoSaveRef.current = true
      } catch (err) {
        setError(err instanceof Error ? err.message : "erro na geração")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  /**
   * Conteudo ja aprovado no wizard → nao regenera a copy, so monta o design e
   * a foto. Espelha o modo `approved_content` da rota.
   */
  const buildApproved = useCallback(
    async (p: PendingPayload) => {
      if (!p.brand || !p.skeletonId || !p.approvedContent) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/post-unico/free-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: p.brand,
            skeleton_id: p.skeletonId,
            approved_content: p.approvedContent,
            photo_prompt: p.photoPrompt ?? null,
            image_entity: p.photoEntity ?? null,
            // Contexto de assunto pro compositor de layout — o conteúdo
            // aprovado sozinho não diz do que o post trata.
            briefing: p.briefing ?? null,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "erro desconhecido")
          return
        }
        setSpec(data.spec)
        // A legenda aprovada no wizard vence a que volta da rota.
        setCaption(p.caption ?? (typeof data.caption === "string" ? data.caption : ""))
        setPhotoUrl(data.photo_url ?? null)
        if (data.content ?? p.approvedContent) {
          setBitmapTexts((data.content ?? p.approvedContent) as Record<string, unknown>)
          setBitmapDraft({})
        }
        setSkeletonId(data.skeleton_id ?? p.skeletonId)
        setSavedId(null)
        autoSaveRef.current = true
      } catch (err) {
        setError(err instanceof Error ? err.message : "erro na geração")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Recebe o payload do wizard e monta o post. Roda só na 1ª montagem.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    // Reedicao de post salvo: o estado ja veio do servidor, nada a fazer.
    if (initialPost) return
    let payload: PendingPayload | null = null
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) payload = JSON.parse(raw) as PendingPayload
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // sem payload — o usuário chegou direto no editor
    }
    if (!payload) return
    const brief = (payload.briefing ?? payload.rawContent ?? "").trim()
    const b = brands.find((x) => x.id === payload.brand?.id) ?? payload.brand ?? brands[0]
    if (b) setBrand(b)
    if (brief) setBriefing(brief)
    if (!payload.autoRun) return
    // Texto ja aprovado no wizard → so monta o design (nao recobra o texto).
    if (payload.kind === "approved" && payload.approvedContent) {
      void buildApproved(payload)
      return
    }
    if (b && brief) void generate(b, brief, [])
  }, [brands, generate, buildApproved, initialPost])

  /**
   * Auto-salva na biblioteca assim que um post NOVO termina de ser gerado.
   *
   * Antes o post só existia no banco depois do clique manual em "Salvar" — quem
   * gerava e fechava a aba perdia a peça, e a queixa que chegava era "o post que
   * eu gerei não foi pra Biblioteca". O carrossel já fazia isso desde sempre
   * (components/carousel/carousel-editor.tsx); o post único ficou de fora.
   *
   * Roda DEPOIS que o spec chega ao estado, não dentro da geração: o handleSave
   * lê `spec`/`caption`/`format` do closure do render, então salvar no meio da
   * geração persistiria o spec anterior (ou nenhum).
   *
   * Marca-demo do sandbox não salva (isRealBrandId) — é o mesmo guard do save
   * manual, e ali a mensagem de erro seria ruído numa geração que deu certo.
   */
  useEffect(() => {
    if (!autoSaveRef.current) return
    if (!spec || !brand || saving || savedId) return
    if (!isRealBrandId(brand.id)) {
      autoSaveRef.current = false
      return
    }
    autoSaveRef.current = false
    void handleSave()
    // handleSave é recriado a cada render; depender dele reentraria no efeito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, brand, saving, savedId])

  /**
   * Adapta a arte pro outro formato. CUSTO ZERO — nenhuma chamada de IA nem de
   * imagem: as camadas são reposicionadas em TypeScript
   * (lib/single-posts/adapt-format.ts). É o oposto do concorrente, que
   * regenera a peça do zero e devolve um design diferente do aprovado.
   *
   * A medição sai do DOM ANTES de trocar o formato: com a arte renderizada, a
   * altura de cada camada é o retângulo real, não uma estimativa — e é isso
   * que faz o texto cair no lugar certo em vez de "quase certo".
   */
  function handleFormat(next: PostFormat) {
    if (!spec || next === format || adapting) return
    setAdapting(true)
    setError(null)
    try {
      const measurements = measureSpecBlocks(previewRef.current)
      const { spec: adapted } = adaptSpecFormat(spec, format, next, measurements)
      setSpec(adapted)
      setFormat(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao adaptar o formato")
    } finally {
      setAdapting(false)
    }
  }

  async function handleExport() {
    if (!previewRef.current) return
    setExporting(true)
    setSelectedPath(null)
    await new Promise((r) => setTimeout(r, 60)) // deixa a UI de edição sumir
    try {
      await exportSpecToPng(previewRef.current, format)
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro no export")
    } finally {
      setExporting(false)
    }
  }

  /**
   * Campos editáveis da arte bitmap: os slots de texto que foram pintados na
   * imagem (as frases descritivas dos bullets ficam de fora — não entram na
   * arte por regra de prompt).
   */
  function bitmapFields(): Array<{ key: string; label: string; value: string }> {
    if (!bitmapTexts) return []
    const t = bitmapTexts as {
      kicker?: string
      title?: string
      subtitle?: string
      cta_text?: string
      stat_value?: string
      bullets?: Array<{ label?: string }>
    }
    const out: Array<{ key: string; label: string; value: string }> = []
    if (t.kicker) out.push({ key: "kicker", label: "Etiqueta", value: t.kicker })
    if (t.title) out.push({ key: "title", label: "Título", value: t.title })
    if (t.subtitle)
      out.push({ key: "subtitle", label: "Subtítulo", value: t.subtitle })
    if (t.stat_value)
      out.push({ key: "stat_value", label: "Número", value: t.stat_value })
    t.bullets?.forEach((b, i) => {
      if (b?.label)
        out.push({ key: `bullet_${i}`, label: `Item ${i + 1}`, value: b.label })
    })
    if (t.cta_text) out.push({ key: "cta_text", label: "Botão", value: t.cta_text })
    return out
  }

  /** true = post em modo bitmap (arte completa na imagem, sem camadas). */
  const isBitmap =
    !!spec && spec.blocks.length === 0 && spec.background.kind === "photo"

  /** URL pública da arte bitmap (null enquanto for data URL local). */
  const artUrl =
    spec?.background.kind === "photo" &&
    spec.background.photo_url &&
    /^https?:\/\//.test(spec.background.photo_url)
      ? spec.background.photo_url
      : null

  const bitmapChanges = bitmapFields()
    .map((f) => ({ key: f.key, from: f.value, to: (bitmapDraft[f.key] ?? f.value).trim() }))
    .filter((c) => c.to && c.to !== c.from)

  /** Aplica as trocas de texto na PRÓPRIA arte via nano-banana /edit. */
  async function handleBitmapApply() {
    if (!spec || spec.background.kind !== "photo" || !spec.background.photo_url) return
    if (!bitmapChanges.length) return
    setBitmapApplying(true)
    setBitmapErr(null)
    try {
      const res = await fetch("/api/post-unico/edit-bitmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: spec.background.photo_url,
          changes: bitmapChanges.map(({ from, to }) => ({ from, to })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBitmapErr(data.error ?? "erro na edição da arte")
        return
      }
      // Arte nova vira o fundo; os textos registrados acompanham a mudança.
      setSpec((cur) =>
        cur
          ? { ...cur, background: { ...cur.background, photo_url: data.url } }
          : cur,
      )
      setPhotoUrl(data.url)
      setBitmapTexts((cur) => {
        if (!cur) return cur
        const next = JSON.parse(JSON.stringify(cur)) as Record<string, unknown>
        for (const c of bitmapChanges) {
          const m = c.key.match(/^bullet_(\d+)$/)
          if (m) {
            const arr = next.bullets as Array<{ label?: string }> | undefined
            if (arr?.[Number(m[1])]) arr[Number(m[1])].label = c.to
          } else {
            next[c.key] = c.to
          }
        }
        return next
      })
      setBitmapDraft({})
      // Persiste a arte editada na biblioteca.
      autoSaveRef.current = false
      void handleSave()
    } catch (err) {
      setBitmapErr(err instanceof Error ? err.message : "erro de rede")
    } finally {
      setBitmapApplying(false)
    }
  }

  async function handleSave() {
    if (!spec || !brand) return
    setSaving(true)
    setError(null)
    // A miniatura sai do preview na tela — sem tirar a seleção, o outline de
    // edição do bloco selecionado entra no PNG que vai pra biblioteca.
    setSelectedPath(null)
    await new Promise((r) => setTimeout(r, 60))
    const res = await saveSinglePost({
      brandId: brand.id,
      spec,
      skeletonId,
      briefing,
      caption,
      fontPreset,
      format,
      photoUrl,
      bitmapTexts,
      previewNode: previewRef.current,
      savedId,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setSavedId(res.postId)
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2500)
    router.refresh()
  }

  /**
   * Imagem local vira camada. Fica como data URL enquanto edita; o save
   * re-hospeda no Storage antes de persistir (maybeUploadDataUrl).
   */
  function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // permite re-selecionar o mesmo arquivo
    if (!file || !spec) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande (max 5MB).")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null
      if (url) setSpec((cur) => (cur ? addImageBlock(cur, url) : cur))
    }
    reader.onerror = () => setError("Nao consegui ler a imagem.")
    reader.readAsDataURL(file)
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Não consegui copiar — selecione o texto e copie manualmente.")
    }
  }

  const canSave = !!spec && !!brand && isRealBrandId(brand.id) && !saving
  const insufficient = balance < cost

  return (
    // Mesmo shell do editor de carrossel: TELA CHEIA por cima do dashboard.
    // A sidebar do editor substitui a de navegação — sem ficar com duas.
    <div className="fixed inset-0 z-50 bg-background flex overflow-hidden">
      {/* Coluna direita (toolbar + canvas). A sidebar fica ANTES (order-1). */}
      <div className="order-2 flex-1 min-w-0 flex flex-col">
        {/* Toolbar de topo — ações sempre visíveis */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-2 flex-wrap">
          {/* Formato do canvas — mesmo lugar e mesmo controle do editor de
              carrossel. Aqui ele ADAPTA a arte (reposiciona as camadas em TS),
              não regenera nada: por isso não custa tokens. */}
          <Select
            value={format}
            onValueChange={(v) => handleFormat(v as PostFormat)}
            disabled={!spec || adapting}
          >
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POST_FORMAT_LIST.map((f) => {
                const Icone =
                  f.id === "story"
                    ? RectangleVertical
                    : f.id === "square"
                      ? Square
                      : Smartphone
                return (
                  <SelectItem key={f.id} value={f.id}>
                    <span className="flex items-center gap-2">
                      <Icone className="w-4 h-4" />
                      {f.label} {f.ratio}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-text-muted">
            {adapting
              ? "Adaptando as camadas…"
              : `${POST_FORMATS[format].width} × ${POST_FORMATS[format].height}px · adaptar não custa tokens`}
          </span>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {spec && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => brand && briefing && generate(brand, briefing, usedIds)}
                disabled={loading || insufficient || !brand || !briefing}
                title={`Gera outra versão por ${cost} tokens`}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Outra versão ({cost})
              </Button>
            )}
            {/* Publicar direto — mesmo botão do carrossel. A arte final é
                renderizada do preview e hospedada na hora de publicar, então
                funciona tanto pro bitmap quanto pro post de camadas (antes só
                o bitmap com URL pública mostrava o botão). */}
            {spec && (
              <PublishToInstagram
                kind="post"
                imageCount={1}
                caption={caption}
                getImageUrls={async () => {
                  // Bitmap já hospedado: manda a URL direto, sem re-render.
                  if (isBitmap && artUrl) return [artUrl]
                  if (!previewRef.current) throw new Error("preview indisponível")
                  const png = await renderSpecToPng(previewRef.current, format)
                  return [await uploadPngDataUrl(png, `post-unico-${format}.png`)]
                }}
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!spec || exporting}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Exportar PNG
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={!canSave}>
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : saveOk ? (
                <Check className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              {saveOk ? "Salvo" : savedId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Área do canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-3"
        >
          {error && (
            <div className="w-full max-w-[440px] rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Escrevendo a copy e gerando a arte…</p>
            </div>
          ) : finalSpec ? (
            <div
              ref={previewRef}
              /* Largura EXPLÍCITA é obrigatória: o renderizador usa
                 container-type:inline-size + aspect-ratio, então sem largura do
                 pai ele colapsa pra 0×0 — o post some e, pior, o auto-detach
                 mede zero e embaralha as posições de todos os blocos. */
              style={{ maxWidth: POST_FORMATS[format].previewMaxWidth }}
              className={`w-full ${
                exporting ? "[&_*]:!outline-none [&_*]:!cursor-default" : ""
              }`}
            >
              {canvas}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <Sparkles className="w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-secondary">Nada gerado ainda.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/criar">Criar um post</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar de edição — coluna cheia à ESQUERDA */}
      <aside className="order-1 w-[320px] flex-shrink-0 border-r border-white/10 bg-black p-4 space-y-3 h-full overflow-y-auto">
        <div className="px-1 pb-5">
          <Logo size={28} variant="content" />
        </div>
        <Link
          href="/dashboard/projetos"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary px-1 pb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Dashboard
        </Link>

        {insufficient && (
          <p className="text-[11px] text-danger px-1">
            Saldo insuficiente pra gerar de novo ({balance} de {cost}).{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              Fazer upgrade
            </Link>
          </p>
        )}

        {spec && (
          <>
            {isBitmap && bitmapFields().length > 0 && (
              <Section icon={Type} title="Textos da arte" defaultOpen>
                <p className="text-[10px] text-text-muted">
                  A arte é uma imagem única. Edite os textos e aplique — a IA
                  troca só o que mudou, mantendo todo o design.
                </p>
                {bitmapFields().map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wide text-text-muted">
                      {f.label}
                    </Label>
                    <Textarea
                      value={bitmapDraft[f.key] ?? f.value}
                      onChange={(e) =>
                        setBitmapDraft((d) => ({ ...d, [f.key]: e.target.value }))
                      }
                      rows={1}
                      className="min-h-8 text-xs"
                    />
                  </div>
                ))}
                {bitmapErr && <p className="text-xs text-red-400">{bitmapErr}</p>}
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={!bitmapChanges.length || bitmapApplying}
                  onClick={() => void handleBitmapApply()}
                >
                  {bitmapApplying ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                  )}
                  {bitmapApplying
                    ? "Editando a arte…"
                    : `Aplicar na arte (${TOKEN_COST.editBitmap} tokens)`}
                </Button>
              </Section>
            )}

            <Section icon={Plus} title="Adicionar ao canvas">
              <div className="grid grid-cols-2 gap-1.5">
                {TEXT_STYLES.map((st) => (
                  <Button
                    key={st.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px]"
                    onClick={() => setSpec(addTextBlock(spec, st.id))}
                  >
                    <Type className="w-3 h-3 mr-1" />
                    {st.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Imagem
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() => setSpec(addShapeBlock(spec, "rounded"))}
                >
                  <Square className="w-3 h-3 mr-1" />
                  Forma
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAddImage}
              />
            </Section>

            <Section icon={Baseline} title="Tipografia">
              <Select value={fontPreset} onValueChange={setFontPreset}>
                <SelectTrigger className="bg-background-secondary/60 border-border-subtle h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-tertiary border-border-medium">
                  {FONT_PRESETS.map((fp) => (
                    <SelectItem key={fp.id} value={fp.id}>
                      {fp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Section>

            <Section icon={Move} title="Elemento selecionado" defaultOpen>
              {panel}
            </Section>

            <Section icon={MessageSquare} title="Legenda">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={copyCaption}
                  disabled={!caption}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary disabled:opacity-40"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={8}
                placeholder="A legenda gerada aparece aqui."
                className="bg-background-secondary/60 border-border-subtle text-xs leading-relaxed"
              />
              <p className="text-[10px] text-text-muted">
                Vai junto com o post ao salvar. Editar não custa tokens.
              </p>
            </Section>
          </>
        )}
      </aside>
    </div>
  )
}
