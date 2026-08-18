"use client"

// =====================================================================
// Fontes próprias de inspiração — o usuário cadastra DE ONDE tirar ideia,
// e a IA gera pautas dali adaptadas à marca ativa.
//
// O custo aparece SEMPRE antes da ação (no botão de gerar), nunca depois.
// Sem emoji, por preferência do produto.
// =====================================================================

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Globe,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react"
import {
  adicionarFonte,
  descartarIdeia,
  marcarIdeiaUsada,
  removerFonte,
} from "@/app/actions/inspiracoes"
import {
  IDEIAS_GRATIS_POR_DIA,
  rotuloDeCusto,
  type CotaInspiracao,
} from "@/lib/inspiracoes/custo"
import {
  BADGE_LABEL,
  OBJETIVO_LABEL,
  type FonteInspiracao,
  type FonteKindImplementada,
  type IdeiaInspiracao,
} from "@/lib/inspiracoes/tipos"

function hostnameDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.slice(0, 40)
  }
}

interface Props {
  brandId: string | null
  brandName: string | null
  fontes: FonteInspiracao[]
  ideias: IdeiaInspiracao[]
  cota: CotaInspiracao
}

export function FontesClient({
  brandId,
  brandName,
  fontes,
  ideias: ideiasIniciais,
  cota: cotaInicial,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [kind, setKind] = useState<FonteKindImplementada>("url")
  const [valor, setValor] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [gerandoId, setGerandoId] = useState<string | null>(null)
  const [ideias, setIdeias] = useState<IdeiaInspiracao[]>(ideiasIniciais)
  const [cota, setCota] = useState<CotaInspiracao>(cotaInicial)

  // Após revalidatePath o servidor manda a lista nova — o estado local segue.
  useEffect(() => setIdeias(ideiasIniciais), [ideiasIniciais])
  useEffect(() => setCota(cotaInicial), [cotaInicial])

  function onAdicionar() {
    if (!brandId || !valor.trim()) return
    setErro(null)
    startTransition(async () => {
      const r = await adicionarFonte({ brandId, kind, value: valor })
      if (!r.ok) {
        setErro(r.error)
        return
      }
      setValor("")
      router.refresh()
    })
  }

  function onRemover(id: string) {
    startTransition(async () => {
      const r = await removerFonte(id)
      if (!r.ok) setErro(r.error)
      else router.refresh()
    })
  }

  async function onGerar(fonteId: string) {
    setErro(null)
    setGerandoId(fonteId)
    try {
      const res = await fetch("/api/inspiracoes/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: fonteId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? "Não consegui gerar as pautas agora.")
        return
      }
      const novas = (data.ideias ?? []) as IdeiaInspiracao[]
      setIdeias((atual) => [...novas, ...atual])
      if (data.cota) {
        setCota((c) => ({ ...c, ...data.cota }))
      }
      router.refresh()
    } catch {
      setErro("Falha de conexão ao gerar as pautas.")
    } finally {
      setGerandoId(null)
    }
  }

  function onDescartar(ideiaId: string) {
    setIdeias((atual) => atual.filter((i) => i.id !== ideiaId))
    startTransition(async () => {
      await descartarIdeia(ideiaId)
    })
  }

  /** Manda a pauta pro wizard pelo mesmo canal das sugestões curadas. */
  function onUsar(ideia: IdeiaInspiracao) {
    const formato =
      ideia.format === "reels" ? "post" : (ideia.format as string)
    try {
      sessionStorage.setItem(
        "syncpost_pending_inspiracao",
        JSON.stringify({
          briefing: ideia.briefing,
          formato,
          ts: Date.now(),
        }),
      )
    } catch {}
    void marcarIdeiaUsada(ideia.id)
    router.push("/dashboard/criar")
  }

  const semMarca = !brandId
  const custoLabel = rotuloDeCusto(cota)

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-text-primary">
          Suas fontes de inspiração
        </h2>
        <span className="text-[11px] text-text-muted">
          de onde a IA tira pauta pra {brandName ?? "sua marca"}
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-4 max-w-2xl leading-relaxed">
        Cadastre um site que você acompanha ou um assunto que quer monitorar. A
        IA lê a fonte e devolve pautas com o ângulo da sua marca — não o resumo
        genérico do link.
      </p>

      {/* Formulário */}
      <div className="rounded-xl bg-gradient-card border border-border-subtle p-4 mb-4">
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setKind("url")}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              kind === "url"
                ? "bg-brand-600 border-brand-600 text-[#0e0e0e]"
                : "border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Site ou artigo
          </button>
          <button
            type="button"
            onClick={() => setKind("keyword")}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              kind === "keyword"
                ? "bg-brand-600 border-brand-600 text-[#0e0e0e]"
                : "border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Palavra-chave
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAdicionar()
            }}
            disabled={semMarca || pending}
            placeholder={
              kind === "url"
                ? "https://blog.doseunicho.com.br/artigo"
                : "tendências de marketing jurídico"
            }
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-background-tertiary/60 border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-600/50 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onAdicionar}
            disabled={semMarca || pending || !valor.trim()}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 text-[#0e0e0e] hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Adicionar fonte
          </button>
        </div>

        <p className="text-[11px] text-text-muted mt-2">
          {kind === "url"
            ? "A gente lê a página na hora do cadastro pra confirmar que o link abre."
            : "A busca na web roda no momento de gerar as pautas, com o que houver de mais recente."}
        </p>
      </div>

      {erro && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {erro}
        </div>
      )}

      {/* Lista de fontes */}
      {fontes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border-subtle p-8 text-center mb-6">
          <Sparkles className="w-6 h-6 mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-secondary">
            Nenhuma fonte cadastrada ainda. Comece por um blog do seu nicho ou
            pelo assunto que seu público mais pesquisa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {fontes.map((f) => {
            const gerando = gerandoId === f.id
            return (
              <div
                key={f.id}
                className="rounded-xl bg-gradient-card border border-border-subtle p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-600/15 border border-brand-600/25 flex items-center justify-center flex-shrink-0">
                    {f.kind === "url" ? (
                      <Globe className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Search className="w-4 h-4 text-brand-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {f.label || f.value}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {f.kind === "url" ? f.value : "busca na web"}
                      {typeof f.ideias_count === "number" && f.ideias_count > 0
                        ? ` · ${f.ideias_count} pautas geradas`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemover(f.id)}
                    disabled={pending || gerando}
                    aria-label="Remover fonte"
                    className="text-text-muted hover:text-red-300 transition-colors flex-shrink-0 disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border-subtle">
                  {/* Custo SEMPRE visível antes da ação. */}
                  <span
                    className={`text-[11px] font-medium ${
                      cota.custoProxima === 0
                        ? "text-text-secondary"
                        : "text-brand-300"
                    }`}
                  >
                    {custoLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onGerar(f.id)}
                    disabled={gerando || gerandoId !== null || pending}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-brand-600/15 border border-brand-600/30 text-brand-300 hover:bg-brand-600/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {gerando ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Lendo a fonte
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Gerar pautas
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pautas geradas */}
      {ideias.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-text-primary">
              Pautas das suas fontes
            </h3>
            <span className="text-[11px] text-text-muted">
              {IDEIAS_GRATIS_POR_DIA} gerações grátis por dia
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideias.map((i) => (
              <div
                key={i.id}
                className="rounded-xl bg-gradient-card border border-border-subtle p-5 space-y-3 flex flex-col"
              >
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      i.badge === "trend"
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                        : "bg-brand-600/10 border-brand-600/30 text-brand-300"
                    }`}
                  >
                    {BADGE_LABEL[i.badge]}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary capitalize">
                    {i.format}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary">
                    {OBJETIVO_LABEL[i.objective]}
                  </span>
                  {i.used_at && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-muted">
                      já usada
                    </span>
                  )}
                </div>

                <h4 className="text-base font-semibold text-text-primary leading-tight">
                  {i.title}
                </h4>
                {i.angle && (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {i.angle}
                  </p>
                )}
                {i.execution_tip && (
                  <p className="text-[11px] text-text-muted leading-relaxed border-l-2 border-border-subtle pl-2">
                    Dica de execução: {i.execution_tip}
                  </p>
                )}
                {/* A origem aparece como TEXTO, não como link: a URL veio de
                    conteúdo de terceiro e não vale a pena virar clique. */}
                {i.source_ref && (
                  <p className="text-[10px] text-text-muted truncate">
                    origem: {hostnameDe(i.source_ref)}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => onDescartar(i.id)}
                    className="text-[11px] text-text-muted hover:text-red-300 transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={() => onUsar(i)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                  >
                    Criar esse post
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
