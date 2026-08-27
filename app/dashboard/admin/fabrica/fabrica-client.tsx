"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Eye,
  Hammer,
  Loader2,
  RefreshCcw,
  ThumbsDown,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

// =====================================================================
// Cliente do painel da fábrica: kanban da esteira + comparador de revisão
// (original vs spec renderizado AQUI, no navegador — o próprio painel é o
// renderizador do julgamento) + a esteira de produção dos usuários.
// =====================================================================

export interface GenRow {
  id: string
  brand_id: string | null
  brand_name?: string | null
  briefing: string | null
  niche: string | null
  skeleton_id: string | null
  fal_art_url: string
  art_url: string | null
  clean_url: string | null
  image_cost_usd: number
  pipeline_status: string
  conversion: {
    spec?: FreePostSpec
    clean_attempts?: number
    clean_approved?: boolean
    clean_restos?: string[]
    judge_log?: string[]
    error?: string
    anchors?: unknown[]
  } | null
  promoted_post_id: string | null
  single_post_id: string | null
  created_at: string
}

export interface PostRow {
  id: string
  title: string
  brand_id: string | null
  brand_name?: string | null
  rendered_image_url: string | null
  created_at: string
}

export interface CarouselRow {
  id: string
  topic: string
  brand_name: string | null
  cover: string | null
  created_at: string
}

const ESTAGIOS: { id: string; label: string; match: (s: string) => boolean }[] = [
  { id: "capturada", label: "Capturadas", match: (s) => s === "capturada" },
  {
    id: "convertendo",
    label: "Em conversão",
    match: (s) => s === "limpando" || s === "extraida" || s === "composta",
  },
  { id: "aguardando_revisao", label: "Pra revisar", match: (s) => s === "aguardando_revisao" },
  { id: "aprovada", label: "Aprovadas", match: (s) => s === "aprovada" },
  { id: "promovida", label: "Na biblioteca", match: (s) => s === "promovida" },
  { id: "reprovada", label: "Reprovadas", match: (s) => s === "reprovada" },
]

function fmtQuando(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

export function FabricaClient({
  gens,
  posts,
  carrosseis,
}: {
  gens: GenRow[]
  posts: PostRow[]
  carrosseis: CarouselRow[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"fabrica" | "producao">("fabrica")
  const [busy, setBusy] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [revisao, setRevisao] = useState<GenRow | null>(null)
  const renderRef = useRef<HTMLDivElement | null>(null)

  const stats = useMemo(() => {
    const semana = gens.filter(
      (g) => Date.now() - new Date(g.created_at).getTime() < 7 * 864e5,
    )
    const custo = semana.reduce((s, g) => s + Number(g.image_cost_usd || 0), 0)
    const porStatus = new Map<string, number>()
    for (const g of gens) {
      for (const e of ESTAGIOS) {
        if (e.match(g.pipeline_status)) {
          porStatus.set(e.id, (porStatus.get(e.id) ?? 0) + 1)
        }
      }
    }
    return { semana: semana.length, custo, porStatus }
  }, [gens])

  async function op(action: string, genId: string, extra?: Record<string, unknown>) {
    setBusy(genId)
    setErro(null)
    try {
      const res = await fetch("/api/admin/fabrica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, genId, ...extra }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setErro(data.error ?? `falha em ${action}`)
        return null
      }
      router.refresh()
      return data
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro de rede")
      return null
    } finally {
      setBusy(null)
    }
  }

  /** Promover: captura o render aprovado como PNG (vira a thumb do template). */
  async function promover(gen: GenRow) {
    let thumbDataUrl: string | undefined
    const node = renderRef.current?.querySelector<HTMLElement>("[data-post-canvas]")
    if (node) {
      try {
        const { toPng } = await import("html-to-image")
        thumbDataUrl = await toPng(node, {
          cacheBust: true,
          includeQueryParams: true,
          canvasWidth: 540,
          canvasHeight: 675,
          pixelRatio: 1,
        })
      } catch {
        // sem thumb o template salva do mesmo jeito
      }
    }
    const r = await op("promover", gen.id, { thumbDataUrl })
    if (r?.ok) setRevisao(null)
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(
          [
            ["fabrica", "Fábrica"],
            ["producao", "Produção dos usuários"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={
              tab === id
                ? { background: "var(--nv-accent, #7c5cff)", color: "#fff", borderColor: "transparent" }
                : { color: "var(--nv-text-muted)", borderColor: "var(--nv-border, #333)" }
            }
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-xs" style={{ color: "var(--nv-text-muted)" }}>
          <span>
            <strong style={{ color: "var(--nv-text)" }}>{stats.semana}</strong> gerações / 7d
          </span>
          <span>
            COGS imagem 7d:{" "}
            <strong style={{ color: "var(--nv-text)" }}>US$ {stats.custo.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {erro && (
        <p className="text-sm rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400">
          {erro}
        </p>
      )}

      {tab === "fabrica" ? (
        gens.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-10 text-center text-sm"
            style={{ borderColor: "var(--nv-border, #333)", color: "var(--nv-text-muted)" }}
          >
            Nenhuma geração capturada ainda. A partir de agora, todo post único
            (bitmap) gerado no produto aparece aqui como matéria-prima.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3 items-start">
            {ESTAGIOS.map((e) => {
              const itens = gens.filter((g) => e.match(g.pipeline_status))
              return (
                <div
                  key={e.id}
                  className="rounded-xl border p-3 space-y-2"
                  style={{ borderColor: "var(--nv-border, #333)", background: "var(--nv-surface, rgba(255,255,255,0.02))" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--nv-text-muted)" }}>
                    {e.label} <span className="opacity-60">({itens.length})</span>
                  </p>
                  {itens.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-lg border overflow-hidden"
                      style={{ borderColor: "var(--nv-border, #333)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.art_url ?? g.fal_art_url}
                        alt=""
                        className="w-full aspect-[4/5] object-cover"
                        loading="lazy"
                      />
                      <div className="p-2 space-y-1.5">
                        <p className="text-[11px] leading-tight truncate" style={{ color: "var(--nv-text)" }}>
                          {g.niche ?? "sem nicho"} · {g.brand_name ?? "—"}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--nv-text-muted)" }}>
                          {fmtQuando(g.created_at)} · US$ {Number(g.image_cost_usd).toFixed(2)}
                          {!g.art_url && " · re-host pendente"}
                          {g.conversion?.error && " · erro na última conversão"}
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(g.pipeline_status === "capturada") && (
                            <Button
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={busy === g.id}
                              onClick={() => op("converter", g.id)}
                            >
                              {busy === g.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Hammer className="w-3 h-3 mr-1" />
                              )}
                              Converter
                            </Button>
                          )}
                          {!g.art_url && g.pipeline_status === "capturada" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px]"
                              disabled={busy === g.id}
                              onClick={() => op("rehost", g.id)}
                            >
                              <RefreshCcw className="w-3 h-3 mr-1" />
                              Re-host
                            </Button>
                          )}
                          {(g.pipeline_status === "aguardando_revisao" ||
                            g.pipeline_status === "aprovada") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => setRevisao(g)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Revisar
                            </Button>
                          )}
                          {g.pipeline_status === "promovida" && g.promoted_post_id && (
                            <a
                              className="text-[11px] underline"
                              style={{ color: "var(--nv-text-muted)" }}
                              href={`/dashboard/editor/post-unico?post=${g.promoted_post_id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              abrir template
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {itens.length === 0 && (
                    <p className="text-[11px] py-4 text-center" style={{ color: "var(--nv-text-muted)" }}>
                      vazio
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <Secao titulo={`Posts únicos gerados (capturas da fábrica) — ${gens.length}`}>
            {gens.map((g) => (
              <CardMini
                key={g.id}
                img={g.art_url ?? g.fal_art_url}
                titulo={g.briefing?.slice(0, 60) ?? "sem briefing"}
                sub={`${g.niche ?? "sem nicho"} · ${g.brand_name ?? "—"} · ${fmtQuando(g.created_at)}`}
              />
            ))}
          </Secao>
          <Secao titulo={`Posts salvos na biblioteca — ${posts.length}`}>
            {posts.map((p) => (
              <CardMini
                key={p.id}
                img={p.rendered_image_url}
                titulo={p.title}
                sub={`${p.brand_name ?? "—"} · ${fmtQuando(p.created_at)}`}
                href={`/dashboard/editor/post-unico?post=${p.id}`}
              />
            ))}
          </Secao>
          <Secao titulo={`Carrosséis — ${carrosseis.length}`}>
            {carrosseis.map((c) => (
              <CardMini
                key={c.id}
                img={c.cover}
                titulo={c.topic}
                sub={`${c.brand_name ?? "—"} · ${fmtQuando(c.created_at)}`}
                href={`/dashboard/carrossel?id=${c.id}`}
              />
            ))}
          </Secao>
        </div>
      )}

      {/* Comparador de revisão */}
      {revisao && revisao.conversion?.spec && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setRevisao(null)}
        >
          <div
            className="rounded-2xl border p-5 max-w-[1100px] w-full space-y-4"
            style={{ background: "var(--nv-bg, #101014)", borderColor: "var(--nv-border, #333)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold" style={{ color: "var(--nv-text)" }}>
                  Revisão — {revisao.niche ?? "sem nicho"}
                </p>
                <p className="text-xs" style={{ color: "var(--nv-text-muted)" }}>
                  clean plate: {revisao.conversion.clean_attempts ?? "?"} tentativa(s)
                  {revisao.conversion.clean_approved === false && " (JUIZ REPROVOU — confira o fundo)"}
                  {" · "}
                  {(revisao.conversion.anchors?.length ?? 0)} âncora(s)
                </p>
              </div>
              <button type="button" onClick={() => setRevisao(null)} style={{ color: "var(--nv-text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <figure>
                <figcaption className="text-xs mb-1" style={{ color: "var(--nv-text-muted)" }}>
                  Original (nano-banana)
                </figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={revisao.art_url ?? revisao.fal_art_url}
                  alt="original"
                  className="w-full rounded-lg"
                />
              </figure>
              <figure>
                <figcaption className="text-xs mb-1" style={{ color: "var(--nv-text-muted)" }}>
                  Convertido (editável) — o render abaixo é o produto real
                </figcaption>
                <div ref={renderRef} className="rounded-lg overflow-hidden">
                  <FreePostRenderer spec={revisao.conversion.spec} format="post" />
                </div>
              </figure>
            </div>
            {(revisao.conversion.judge_log?.length ?? 0) > 0 && (
              <pre
                className="text-[11px] rounded-lg border p-2 whitespace-pre-wrap"
                style={{ borderColor: "var(--nv-border, #333)", color: "var(--nv-text-muted)" }}
              >
                {revisao.conversion.judge_log?.join("\n")}
              </pre>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                disabled={busy === revisao.id}
                onClick={async () => {
                  const motivo = window.prompt("Motivo da reprovação (vai pro log do dataset):") ?? ""
                  const r = await op("reprovar", revisao.id, { motivo })
                  if (r?.ok) setRevisao(null)
                }}
              >
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Reprovar
              </Button>
              {revisao.pipeline_status === "aguardando_revisao" && (
                <Button
                  variant="outline"
                  disabled={busy === revisao.id}
                  onClick={async () => {
                    const r = await op("aprovar", revisao.id)
                    if (r?.ok) setRevisao(null)
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Aprovar (sem promover)
                </Button>
              )}
              <Button disabled={busy === revisao.id} onClick={() => promover(revisao)}>
                {busy === revisao.id ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-1.5" />
                )}
                Promover pra biblioteca
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--nv-text)" }}>
        {titulo}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {children}
      </div>
    </div>
  )
}

function CardMini({
  img,
  titulo,
  sub,
  href,
}: {
  img: string | null
  titulo: string
  sub: string
  href?: string
}) {
  const inner = (
    <div
      className="rounded-lg border overflow-hidden hover:opacity-90 transition-opacity"
      style={{ borderColor: "var(--nv-border, #333)" }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="w-full aspect-[4/5] object-cover" loading="lazy" />
      ) : (
        <div
          className="w-full aspect-[4/5] flex items-center justify-center text-[10px]"
          style={{ color: "var(--nv-text-muted)", background: "var(--nv-surface, rgba(255,255,255,0.03))" }}
        >
          sem thumb
        </div>
      )}
      <div className="p-2">
        <p className="text-[11px] leading-tight truncate" style={{ color: "var(--nv-text)" }}>
          {titulo}
        </p>
        <p className="text-[10px] truncate" style={{ color: "var(--nv-text-muted)" }}>
          {sub}
        </p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  )
}
