"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Trash2, ArrowRight, Wand2 } from "lucide-react"
import {
  deleteScheduledPost,
  updateScheduledPostStatus,
} from "@/app/actions/scheduled-posts"
import { FORMATO_LABEL, statusColor, type PostStatus } from "@/lib/planejar"
import { briefingDaPauta, type PautaScheduledPost } from "@/lib/pautas/types"
import { tokenCostForSinglePost } from "@/lib/tokens"
import { avisoDaGeracao, copiaDoDono, type AvisoDaGeracao } from "@/lib/websync/aviso-pauta"

// =====================================================================
// Pipeline do calendário: ideias da IA -> em criação -> prontos -> agendados.
//
// É a metade paga do funil. A pauta chegou de graça na primeira coluna; o
// botão "Gerar post" é o único ponto que cobra, e o preço vem de
// lib/tokens.ts (nunca escrito à mão aqui).
//
// O clique NÃO gera nada sozinho: ele leva pro wizard de criação, que já tem
// preview de custo, checagem de saldo e o débito. Duplicar a geração aqui
// significaria duplicar a cobrança — a pauta só entrega o briefing pronto.
// =====================================================================

const COLUNAS: Array<{ status: PostStatus; label: string; hint: string }> = [
  { status: "ideia", label: "Ideias da IA", hint: "Pautas geradas de graça" },
  { status: "em_criacao", label: "Em criação", hint: "Post sendo gerado" },
  { status: "pronto", label: "Prontos", hint: "Peça finalizada" },
  { status: "agendado", label: "Agendados", hint: "Com data marcada" },
]

/** Próximo passo manual de cada coluna (a última não avança). */
const PROXIMO: Partial<Record<PostStatus, { status: PostStatus; label: string }>> = {
  em_criacao: { status: "pronto", label: "Marcar pronto" },
  pronto: { status: "agendado", label: "Agendar" },
}

export function PipelinePautas({
  posts,
  onChanged,
  onEditar,
}: {
  posts: PautaScheduledPost[]
  onChanged: () => void
  /** Abre a pauta pra editar título, data, hora e formato (R4-19). */
  onEditar?: (p: PautaScheduledPost) => void
}) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState<string | null>(null)
  // O Nexus não monta toast; o aviso fica inline, no padrão das outras telas do calendário.
  const [aviso, setAviso] = useState<AvisoDaGeracao | null>(null)

  const porStatus = useMemo(() => {
    const mapa = new Map<PostStatus, PautaScheduledPost[]>()
    for (const c of COLUNAS) mapa.set(c.status, [])
    for (const p of posts) mapa.get(p.status)?.push(p)
    return mapa
  }, [posts])

  const custoPost = tokenCostForSinglePost()

  async function avancar(id: string, status: PostStatus) {
    setOcupado(id)
    await updateScheduledPostStatus(id, status)
    setOcupado(null)
    onChanged()
  }

  async function remover(id: string) {
    setOcupado(id)
    await deleteScheduledPost(id)
    setOcupado(null)
    onChanged()
  }

  async function gerarPost(p: PautaScheduledPost) {
    // REGRA DE OURO: o que o dono escreveu é respeitado ao pé da letra, e a IA
    // só gera o que está vazio. O critério é o CONTEÚDO (a pauta veio com o
    // texto pronto do CRM), não o formato: o wizard reescreveria o texto a
    // partir de um briefing.
    const copia = copiaDoDono(p.description)
    if (copia) {
      setAviso(null)
      setOcupado(p.id)
      try {
        if (copia === "imagem_unica") {
          // Post único: não há motor que diagrame sem IA de texto. Melhor
          // avisar do que reescrever o que o dono escreveu.
          setAviso(avisoDaGeracao(true, "formato_nao_suportado"))
          return
        }
        const res = await fetch("/api/calendario/pauta-pronta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: p.id }),
        })
        const corpo = (await res.json().catch(() => null)) as { arte?: string } | null
        setAviso(avisoDaGeracao(res.ok, corpo?.arte))
      } catch {
        setAviso(avisoDaGeracao(false, undefined))
      } finally {
        setOcupado(null)
        onChanged()
      }
      return
    }
    // Move pra "em criação" ANTES de navegar: o usuário sai da página e, se a
    // marcação ficasse pro retorno, a pauta continuaria parada em "ideia" e
    // ele geraria o mesmo post duas vezes — pagando duas vezes.
    setOcupado(p.id)
    await updateScheduledPostStatus(p.id, "em_criacao")
    const brief = encodeURIComponent(
      briefingDaPauta({
        title: p.title,
        description: p.description,
        rationale: p.rationale,
      }),
    )
    // `pauta=` carrega a ORIGEM até o save da arte (migration 0023): sem ela
    // a peça nasce órfã e o CRM nunca descobre que a pauta virou post.
    router.push(
      `/dashboard/criar?tipo=post-unico&step=2&brief=${brief}&pauta=${p.id}`,
    )
  }

  const vazio = posts.length === 0

  return (
    <div className="mt-8">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Pipeline</h3>
        <p className="text-xs text-text-muted">
          Da ideia ao agendamento. Gerar o post custa {custoPost} tokens; o
          resto é grátis.
        </p>
      </div>

      {aviso && (
        <p
          role="alert"
          className={`mb-3 text-xs ${aviso.tom === "ok" ? "text-emerald-400" : "text-red-400"}`}
        >
          {aviso.texto}
        </p>
      )}

      {vazio ? (
        <p className="text-sm text-text-muted">
          Nenhuma pauta ainda. Gere um calendário inteligente acima — não custa
          token.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {COLUNAS.map((col) => {
            const itens = porStatus.get(col.status) ?? []
            return (
              <div
                key={col.status}
                className="rounded-xl border border-border-subtle bg-background-secondary/30 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusColor(col.status)}`}
                  />
                  <p className="text-xs font-semibold text-text-primary">
                    {col.label}
                  </p>
                  <span className="text-xs text-text-muted tabular-nums ml-auto">
                    {itens.length}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-2">{col.hint}</p>

                <div className="space-y-2">
                  {itens.length === 0 && (
                    <p className="text-xs text-text-subtle">—</p>
                  )}
                  {itens.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-border-subtle bg-background-tertiary/40 p-2.5"
                    >
                      <div className="flex items-start gap-1.5 mb-1">
                        {p.source === "ia" && (
                          <Sparkles className="w-3 h-3 text-brand-400 flex-shrink-0 mt-0.5" />
                        )}
                        {/* Título abre a pauta pra editar (R4-19). */}
                        <button
                          type="button"
                          onClick={() => onEditar?.(p)}
                          disabled={!onEditar}
                          title="Editar pauta"
                          className="text-left text-[12px] font-medium text-text-primary leading-snug flex-1 min-h-11 sm:min-h-0 hover:text-brand-300 disabled:hover:text-text-primary"
                        >
                          {p.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => remover(p.id)}
                          disabled={ocupado === p.id}
                          /* Área de clique de 28x28 via pseudo-elemento absoluto
                             (não empurra o layout do cartão) + ml-1.5 pra dar
                             espaço visual em relação ao título. */
                          className="relative ml-1.5 text-text-muted hover:text-red-400 flex-shrink-0 flex items-center justify-center w-11 h-11 -mt-2 -mr-2 sm:w-auto sm:h-auto sm:m-0 sm:after:absolute sm:after:-inset-2 sm:after:content-['']"
                          aria-label="Remover pauta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs tabular-nums text-text-muted">
                          {p.scheduled_date
                            .split("-")
                            .reverse()
                            .slice(0, 2)
                            .join("/")}
                        </span>
                        <span className="text-xs text-text-muted">
                          {FORMATO_LABEL[p.format] ?? p.format}
                        </span>
                      </div>

                      {p.created_at && (
                        <p className="text-xs text-text-subtle mb-1.5">
                          criada em{" "}
                          {new Date(p.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </p>
                      )}

                      {/* O "por quê" é o que sustenta a decisão de gastar
                          token — some nas colunas seguintes, onde a escolha
                          já foi feita. */}
                      {col.status === "ideia" && p.rationale && (
                        <p className="text-xs text-text-muted leading-snug mb-2">
                          {p.rationale}
                        </p>
                      )}

                      {col.status === "ideia" ? (
                        <button
                          type="button"
                          onClick={() => gerarPost(p)}
                          disabled={ocupado === p.id}
                          className="w-full flex items-center justify-center gap-1.5 h-11 sm:h-8 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors disabled:opacity-60"
                        >
                          <Wand2 className="w-3 h-3" />
                          Gerar post
                          <span className="text-xs font-semibold opacity-80">
                            {custoPost} tokens
                          </span>
                        </button>
                      ) : PROXIMO[col.status] ? (
                        <button
                          type="button"
                          onClick={() =>
                            avancar(p.id, PROXIMO[col.status]!.status)
                          }
                          disabled={ocupado === p.id}
                          className="w-full flex items-center justify-center gap-1.5 h-11 sm:h-8 rounded-md border border-border-subtle hover:border-hairline-strong text-text-secondary text-xs transition-colors disabled:opacity-60"
                        >
                          {PROXIMO[col.status]!.label}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
