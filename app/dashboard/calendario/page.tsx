"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Trash2,
  Info,
  Filter,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DESTINOS,
  DESTINO_LABEL,
  STATUS_ESCOLHIVEIS,
  ehDestino,
  validarEdicaoPauta,
  type Destino,
} from "@/lib/pautas/editar"
import { getProximasDatas } from "@/lib/datas-comemorativas"
import {
  listActiveScheduledPosts,
  createScheduledPost,
  deleteScheduledPost,
  updateScheduledPost,
  buscarPecaDaPauta,
} from "@/app/actions/scheduled-posts"
import {
  statusColor,
  statusLabel,
  FORMATO_LABEL,
  toISODate,
  type PostStatus,
  type PostFormato,
} from "@/lib/planejar"
import type { PautaScheduledPost } from "@/lib/pautas/types"
import { CalendarioInteligenteCard } from "./calendario-inteligente"
import { PipelinePautas } from "./pipeline-pautas"

const MESES_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]
const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

const STATUS_FILTERS: Array<{ id: "todos" | PostStatus; label: string; color: string }> = [
  { id: "todos", label: "Todos", color: "bg-text-secondary" },
  { id: "ideia", label: "Ideias", color: "bg-brand-500" },
  { id: "em_criacao", label: "Em criação", color: "bg-blue-500" },
  { id: "pronto", label: "Prontos", color: "bg-emerald-500" },
  { id: "agendado", label: "Agendados", color: "bg-orange-500" },
  { id: "publicado", label: "Publicados", color: "bg-brand-600" },
]

/** Forma singular dos contadores ("1 pronto", e não "1 prontos"). */
const SINGULAR: Partial<Record<PostStatus, string>> = {
  ideia: "ideia",
  pronto: "pronto",
  agendado: "agendado",
  publicado: "publicado",
}

/** Mostra a hora HH:MM (ignora segundos) ou vazio. */
function fmtHora(t: string | null): string {
  if (!t) return ""
  return t.slice(0, 5)
}

/** Tela de celular (abaixo de 640px)? Muda o que o toque num dia faz. */
function useCelular(): boolean {
  const [celular, setCelular] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)")
    const on = () => setCelular(mql.matches)
    on()
    mql.addEventListener("change", on)
    return () => mql.removeEventListener("change", on)
  }, [])
  return celular
}

const DIAS_SEMANA_LONGO = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
]

export default function CalendarioPage() {
  const celular = useCelular()
  // Celular: tocar num dia que já tem pauta abre a lista do dia (as barrinhas da
  // grade são pequenas demais pro dedo).
  const [diaAberto, setDiaAberto] = useState<Date | null>(null)
  const [today] = useState(() => new Date())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [filterStatus, setFilterStatus] = useState<"todos" | PostStatus>("todos")
  const [novaModal, setNovaModal] = useState<{ data: string } | null>(null)
  // Pauta aberta pra edição (R4-17/R4-19): clicar nela no dia, na lista do
  // mês ou no Pipeline abre ESTA pauta, não uma nova.
  const [editando, setEditando] = useState<PautaScheduledPost | null>(null)

  // Fonte ÚNICA: scheduled_posts (banco). Cobre tanto ideias da IA
  // (source='ia') quanto pautas manuais (source='manual').
  const [scheduled, setScheduled] = useState<PautaScheduledPost[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refetch = useCallback(async () => {
    const res = await listActiveScheduledPosts().catch(() => null)
    if (res) {
      setBrandId(res.brandId)
      setScheduled(res.posts)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])
  const datasComemorativas = useMemo(() => {
    const startMonth = new Date(year, month, 1)
    return getProximasDatas(startMonth, 50).filter(
      (d) => d.date.getMonth() === month && d.date.getFullYear() === year,
    )
  }, [year, month])

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return scheduled
    return scheduled.filter((s) => s.status === filterStatus)
  }, [scheduled, filterStatus])

  const counts = useMemo(() => {
    const base: Record<PostStatus, number> = {
      ideia: 0,
      em_criacao: 0,
      pronto: 0,
      agendado: 0,
      publicado: 0,
      falhou: 0,
    }
    for (const s of scheduled) base[s.status]++
    return base
  }, [scheduled])

  function itensNoDia(date: Date | null): PautaScheduledPost[] {
    if (!date) return []
    const iso = toISODate(date)
    return filtered.filter((s) => s.scheduled_date === iso)
  }

  function dataComemorativaNoDia(date: Date | null) {
    if (!date) return null
    return datasComemorativas.find(
      (d) => d.date.toDateString() === date.toDateString(),
    )
  }

  function navMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  async function handleNovaPauta(
    titulo: string,
    data: string,
    hora: string,
    formato: PostFormato,
  ) {
    if (!brandId) {
      alert("Selecione ou crie uma marca antes de agendar.")
      return
    }
    setSaving(true)
    const res = await createScheduledPost({
      brandId,
      title: titulo,
      scheduledDate: data,
      scheduledTime: hora || null,
      format: formato,
      status: "agendado",
    })
    setSaving(false)
    if (!res.ok) {
      alert(res.error)
      return
    }
    // A pauta entra na tela NA HORA (R4-16): antes a tela esperava a
    // releitura e, no teste, só mostrava depois de recarregar a página, então
    // parecia que não tinha salvo e a pessoa criava de novo. A releitura
    // continua em segundo plano pra alinhar com o banco.
    const criadaId = res.data.id
    setScheduled((list) => [
      ...list,
      {
        id: criadaId,
        brand_id: brandId,
        title: titulo,
        description: null,
        format: formato,
        objective: "engage",
        scheduled_date: data,
        scheduled_time: hora || null,
        status: "agendado",
        source: "manual",
        project_id: null,
        created_at: new Date().toISOString(),
      },
    ])
    setNovaModal(null)
    void refetch()
  }

  /** Salva a edição de uma pauta existente (R4-17/R4-19). Mover = trocar a data. */
  async function handleEditarPauta(
    titulo: string,
    data: string,
    hora: string,
    formato: PostFormato,
    extras?: { status: PostStatus; network?: Destino },
  ) {
    if (!editando) return
    const id = editando.id
    setSaving(true)
    const res = await updateScheduledPost(id, {
      title: titulo,
      scheduledDate: data,
      scheduledTime: hora || null,
      format: formato,
      status: extras && extras.status !== editando.status ? extras.status : undefined,
      network:
        extras?.network && extras.network !== editando.network ? extras.network : undefined,
    })
    setSaving(false)
    if (!res.ok) {
      alert(res.error)
      return
    }
    setScheduled((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              title: titulo,
              scheduled_date: data,
              scheduled_time: hora || null,
              format: formato,
              ...(extras ? { status: extras.status } : {}),
              ...(extras?.network ? { network: extras.network } : {}),
            }
          : s,
      ),
    )
    setEditando(null)
    void refetch()
  }

  async function handleDelete(id: string) {
    setScheduled((list) => list.filter((s) => s.id !== id))
    await deleteScheduledPost(id)
  }

  const monthList = useMemo(
    () =>
      filtered
        .filter((s) => {
          const d = new Date(s.scheduled_date + "T00:00:00")
          return d.getMonth() === month && d.getFullYear() === year
        })
        .sort((a, b) => {
          const byDate = a.scheduled_date.localeCompare(b.scheduled_date)
          if (byDate !== 0) return byDate
          return (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "")
        }),
    [filtered, month, year],
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-brand-600/15 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Calendário Editorial</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Planeje, vincule e agende seus conteúdos.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navMonth(-1)}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-lg border border-border-subtle hover:border-hairline-strong flex items-center justify-center transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 h-11 sm:h-9 rounded-lg border border-border-subtle bg-background-tertiary/40 flex items-center text-sm font-semibold text-text-primary flex-1 sm:flex-none sm:min-w-[140px] justify-center">
            {MESES_LONG[month]} {year}
          </div>
          <button
            type="button"
            onClick={() => navMonth(1)}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-lg border border-border-subtle hover:border-hairline-strong flex items-center justify-center transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button onClick={() => setNovaModal({ data: toISODate(today) })} className="w-full sm:w-auto sm:ml-1 h-11 sm:h-9">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Pauta
          </Button>
        </div>
      </div>

      {/* Aviso honesto: agendar aqui é planejamento, não publica sozinho ainda. */}
      <div className="flex items-start gap-2 mb-4 rounded-lg border border-border-subtle bg-background-secondary/40 px-3 py-2">
        <Info className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-text-muted leading-relaxed">
          <span className="text-text-secondary font-medium">Agendado = planejado.</span>{" "}
          Por enquanto o calendário organiza o que publicar e quando — a publicação
          automática no Instagram ainda está em configuração.
        </p>
      </div>

      {/* Contadores à esquerda, filtro à direita — o desenho que o Marcos
          pediu de referência. Cada contador continua clicável: ele É o filtro,
          e o botão da direita só volta pra "todos". */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {STATUS_FILTERS.filter((f) => f.id !== "todos").map((f) => {
            const count = counts[f.id as PostStatus]
            const ativo = filterStatus === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(ativo ? "todos" : f.id)}
                /* py-2: altura clicável de pelo menos 32px (R4-22b). */
                className={`flex items-center gap-1.5 py-3 sm:py-2 text-[13px] transition-colors ${
                  ativo
                    ? "text-text-primary font-semibold"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
                {count}{" "}
                {count === 1 ? (SINGULAR[f.id as PostStatus] ?? f.label.toLowerCase()) : f.label.toLowerCase()}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setFilterStatus("todos")}
          className={`flex items-center gap-1.5 text-[13px] px-3 h-11 sm:h-9 rounded-lg border transition-colors ${
            filterStatus === "todos"
              ? "border-border-subtle text-text-secondary"
              : "border-brand-600 text-text-primary"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {filterStatus === "todos"
            ? "Todos"
            : STATUS_FILTERS.find((f) => f.id === filterStatus)?.label}
        </button>
      </div>

      {/* Calendário Inteligente — pauta grátis (0 tokens); o post é que cobra. */}
      <CalendarioInteligenteCard brandId={brandId} onSaved={refetch} />

      {/* Grid mensal */}
      <div className="rounded-xl border border-border-subtle overflow-hidden bg-background-secondary/30">
        <div className="grid grid-cols-7 border-b border-border-subtle bg-background-tertiary/40">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-bold text-text-muted text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            const isToday = cell && cell.toDateString() === today.toDateString()
            const dayItems = itensNoDia(cell)
            const dataCom = dataComemorativaNoDia(cell)
            const isOtherMonth = cell && cell.getMonth() !== month
            return (
              <div
                key={i}
                className={`min-h-[80px] sm:min-h-[110px] p-0 sm:p-2 border-b border-r border-border-subtle ${
                  cell ? "" : "bg-background-tertiary/10"
                } ${isOtherMonth ? "opacity-40" : ""}`}
              >
                {cell && (
                  <button
                    type="button"
                    aria-label={`Dia ${cell.getDate()}${dayItems.length ? `, ${dayItems.length} pauta(s)` : ""}`}
                    onClick={() =>
                      celular && dayItems.length > 0
                        ? setDiaAberto(cell)
                        : setNovaModal({ data: toISODate(cell) })
                    }
                    className="w-full h-full p-1 sm:p-0 flex flex-col gap-1 text-left hover:bg-background-tertiary/30 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold tabular-nums w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-brand-600 text-white"
                            : isOtherMonth
                              ? "text-text-muted"
                              : "text-text-primary"
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                      {dataCom && (
                        <span
                          className="text-xs font-bold text-orange-400 leading-none truncate max-w-[60%]"
                          title={dataCom.nome}
                        >
                          ✦ {dataCom.nome.slice(0, 14)}
                        </span>
                      )}
                    </div>
                    {/* Celular: só as bolinhas de status; o toque abre a lista do dia. */}
                    {dayItems.length > 0 && (
                      <div className="sm:hidden flex flex-wrap gap-1 pt-0.5">
                        {dayItems.slice(0, 4).map((s) => (
                          <span
                            key={s.id}
                            className={`w-2 h-2 rounded-full ${statusColor(s.status)}`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="hidden sm:block flex-1 space-y-1 overflow-hidden">
                      {dayItems.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          // Clicar na pauta abre ELA (R4-17), não uma nova: o
                          // stopPropagation impede o clique de chegar no botão do
                          // dia, que continua abrindo "Nova pauta" no espaço vazio.
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditando(s)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              e.stopPropagation()
                              setEditando(s)
                            }
                          }}
                          className="rounded px-1.5 py-0.5 text-xs truncate flex items-center gap-1 cursor-pointer hover:ring-1 hover:ring-brand-500/60"
                          style={{
                            background:
                              s.source === "ia"
                                ? "rgba(22,104,227,0.12)"
                                : "rgba(255,255,255,0.04)",
                          }}
                          title={`${fmtHora(s.scheduled_time)} ${s.title}`.trim()}
                        >
                          {s.source === "ia" ? (
                            <Sparkles className="w-2.5 h-2.5 text-brand-300 flex-shrink-0" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusColor(s.status)} flex-shrink-0`}
                            />
                          )}
                          {s.scheduled_time && (
                            <span className="text-text-muted tabular-nums flex-shrink-0">
                              {fmtHora(s.scheduled_time)}
                            </span>
                          )}
                          <span className="text-text-primary truncate">{s.title}</span>
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <p className="text-xs text-text-muted">+{dayItems.length - 3} mais</p>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista do mês (fonte única) */}
      {loading ? (
        <p className="mt-6 text-sm text-text-muted">Carregando…</p>
      ) : monthList.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            {filterStatus === "todos"
              ? "Conteúdos do mês"
              : statusLabel(filterStatus as PostStatus)}
          </h3>
          <div className="space-y-2">
            {monthList.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 sm:gap-3 pl-3 pr-1 sm:p-3 rounded-lg bg-background-tertiary/30 border border-border-subtle hover:border-hairline-strong transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusColor(s.status)} flex-shrink-0`}
                />
                <span className="text-xs tabular-nums text-text-muted w-14 sm:w-20 flex-shrink-0 leading-tight">
                  {s.scheduled_date.split("-").reverse().slice(0, 2).join("/")}
                  {s.scheduled_time ? ` ${fmtHora(s.scheduled_time)}` : ""}
                </span>
                {/* Título abre a pauta pra editar (R4-19). */}
                <button
                  type="button"
                  onClick={() => setEditando(s)}
                  title="Editar pauta"
                  className="text-left text-sm font-medium text-text-primary flex-1 min-w-0 min-h-14 sm:min-h-0 py-2 sm:py-0 hover:text-brand-300"
                >
                  <span className="block truncate">{s.title}</span>
                  <span className="sm:hidden block text-xs font-normal text-text-muted">
                    {statusLabel(s.status)} · {FORMATO_LABEL[s.format] ?? s.format}
                  </span>
                </button>
                {s.created_at && (
                  <span className="hidden sm:inline text-xs text-text-subtle flex-shrink-0">
                    criada em{" "}
                    {new Date(s.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                )}
                {s.source === "ia" && (
                  <Sparkles className="hidden sm:inline w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                )}
                <span className="hidden sm:inline text-xs text-text-muted">
                  {FORMATO_LABEL[s.format] ?? s.format}
                </span>
                <span className="hidden sm:inline text-xs text-text-muted">
                  {statusLabel(s.status)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="text-text-muted hover:text-red-400 w-11 h-11 sm:w-auto sm:h-auto sm:p-1 flex items-center justify-center flex-shrink-0"
                  title="Remover do calendário"
                  aria-label="Remover do calendário"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-text-muted">
          Nenhum conteúdo {filterStatus === "todos" ? "" : statusLabel(filterStatus as PostStatus).toLowerCase()}{" "}
          neste mês. Clique num dia ou em “Nova Pauta” pra começar.
        </p>
      )}

      {/* Pipeline: ideias da IA -> em criação -> prontos -> agendados.
          Fica abaixo do calendário porque é a visão de EXECUÇÃO (o que fazer
          agora), enquanto a grade acima é a visão de DISTRIBUIÇÃO (quando). */}
      {!loading && (
        <PipelinePautas posts={scheduled} onChanged={refetch} onEditar={setEditando} />
      )}

      {/* Modal: Nova Pauta */}
      {novaModal && (
        <Modal onClose={() => setNovaModal(null)} title="Nova Pauta">
          <NovaPautaForm
            initialData={novaModal.data}
            saving={saving}
            onSave={handleNovaPauta}
            onCancel={() => setNovaModal(null)}
          />
        </Modal>
      )}

      {/* Celular: lista do dia tocado. */}
      {diaAberto && (
        <Modal
          onClose={() => setDiaAberto(null)}
          title={`${DIAS_SEMANA_LONGO[diaAberto.getDay()]}, ${diaAberto.getDate()} de ${MESES_LONG[diaAberto.getMonth()].toLowerCase()}`}
        >
          <div className="space-y-2">
            {itensNoDia(diaAberto).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setDiaAberto(null)
                  setEditando(s)
                }}
                className="w-full flex items-center gap-3 min-h-14 rounded-lg border border-border-subtle bg-background-secondary/40 px-3 py-2 text-left"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor(s.status)}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">{s.title}</span>
                  <span className="block text-xs text-text-muted">
                    {s.scheduled_time ? `${fmtHora(s.scheduled_time)} · ` : ""}
                    {statusLabel(s.status)} · {FORMATO_LABEL[s.format] ?? s.format}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                const d = diaAberto
                setDiaAberto(null)
                setNovaModal({ data: toISODate(d) })
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova pauta neste dia
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal: Editar Pauta (R4-17/R4-19). Mover a pauta = trocar a data. */}
      {editando && (
        <Modal onClose={() => setEditando(null)} title="Editar pauta">
          <NovaPautaForm
            key={editando.id}
            pautaId={editando.id}
            initialData={editando.scheduled_date}
            edicao={{
              status: editando.status,
              network: ehDestino(editando.network) ? editando.network : null,
              temDestino: editando.network !== undefined,
              horaAntes: fmtHora(editando.scheduled_time),
            }}
            inicial={{
              titulo: editando.title,
              hora: fmtHora(editando.scheduled_time),
              formato: editando.format,
            }}
            saving={saving}
            onSave={handleEditarPauta}
            onCancel={() => setEditando(null)}
          />
        </Modal>
      )}

    </div>
  )
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startWeekday = first.getDay() // 0=dom
  const totalDays = last.getDate()

  const cells: (Date | null)[] = []
  // padding antes — preenche com dias do mês anterior pra continuidade visual
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i))
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(new Date(year, month, d))
  }
  // padding depois pra completar 6 linhas (42 cells)
  while (cells.length < 42) {
    const lastCell = cells[cells.length - 1] as Date
    const next = new Date(lastCell)
    next.setDate(next.getDate() + 1)
    cells.push(next)
  }
  return cells
}

function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode
  title: string
  onClose: () => void
}) {
  // Portal no <body> (rodada 6): o modal era `fixed` DENTRO da página, e um
  // ancestral com animação de entrada (transform) faz o `fixed` virar relativo
  // a ele. Resultado: nos dias das linhas de baixo o balão abria com o Salvar
  // fora da tela (y=928 numa tela de 900) e a página não rolava. No body ele
  // é relativo à janela de verdade, e o max-h com dvh garante que caiba.
  if (typeof document === "undefined") return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      {/* Celular: folha colada embaixo (o polegar alcança), com o título e o X
          sempre à vista; no computador, o balão centralizado de sempre. */}
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-background-tertiary border border-border-medium p-4 sm:p-5 pt-0 sm:pt-5 space-y-4 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 pt-4 sm:pt-0 pb-2 sm:pb-0 bg-background-tertiary flex items-center justify-between">
          <h3 className="text-base sm:text-sm font-semibold text-text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-11 h-11 sm:w-auto sm:h-auto -mr-2 sm:mr-0 flex items-center justify-center text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function NovaPautaForm({
  initialData,
  inicial,
  edicao,
  pautaId,
  saving,
  onSave,
  onCancel,
}: {
  initialData: string
  /** Preenchido na EDIÇÃO de uma pauta existente (R4-17/R4-19). */
  inicial?: { titulo: string; hora: string; formato: PostFormato }
  /** Só na edição: status e destino atuais (e se o banco tem a coluna de destino). */
  edicao?: {
    status: PostStatus
    network: Destino | null
    temDestino: boolean
    horaAntes: string
  }
  /** Só na edição: usado pra achar a arte e oferecer "Abrir post". */
  pautaId?: string
  saving: boolean
  onSave: (
    titulo: string,
    data: string,
    hora: string,
    formato: PostFormato,
    extras?: { status: PostStatus; network?: Destino },
  ) => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "")
  const [data, setData] = useState(initialData)
  const [hora, setHora] = useState(inicial?.hora ?? "")
  const [formato, setFormato] = useState<PostFormato>(inicial?.formato ?? "post")
  const [status, setStatus] = useState<PostStatus>(edicao?.status ?? "agendado")
  const [destino, setDestino] = useState<Destino>(edicao?.network ?? "instagram")
  const [aviso, setAviso] = useState<string | null>(null)
  const [peca, setPeca] = useState<{ tipo: "post" | "carrossel"; href: string } | null>(null)

  // Achar a arte desta pauta pra oferecer "Abrir post". Falha = só não mostra o botão.
  useEffect(() => {
    if (!pautaId) return
    let vivo = true
    buscarPecaDaPauta(pautaId)
      .then((p) => vivo && setPeca(p))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [pautaId])

  const publicada = edicao?.status === "publicado"
  // Status que a pessoa pode escolher; o atual entra mesmo que não seja
  // "escolhível" (ex.: publicado), só pra aparecer marcado.
  const statusOpcoes: PostStatus[] =
    edicao && !STATUS_ESCOLHIVEIS.includes(edicao.status)
      ? [edicao.status, ...STATUS_ESCOLHIVEIS]
      : STATUS_ESCOLHIVEIS

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!titulo.trim()) return
        if (edicao) {
          const recado = validarEdicaoPauta({
            statusAtual: edicao.status,
            status: status !== edicao.status ? status : undefined,
            data,
            hora: hora || null,
            dataAntes: initialData,
            horaAntes: edicao.horaAntes || null,
          })
          if (recado) {
            setAviso(recado)
            return
          }
          setAviso(null)
          onSave(titulo.trim(), data, hora, formato, {
            status,
            network: edicao.temDestino ? destino : undefined,
          })
          return
        }
        onSave(titulo.trim(), data, hora, formato)
      }}
      className="space-y-3"
    >
      {/* Abrir o post que nasceu desta pauta (editar texto e imagem). */}
      {peca && (
        <Button asChild type="button" variant="outline" className="w-full h-11">
          <Link href={peca.href}>
            <Pencil className="w-4 h-4 mr-1.5" />
            {peca.tipo === "carrossel" ? "Abrir o carrossel" : "Abrir o post"}
          </Link>
        </Button>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Título</Label>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Quebra mito do nicho"
          autoFocus={!edicao}
          className="h-11 sm:h-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Data</Label>
          <Input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={{ colorScheme: "dark" }}
            disabled={publicada}
            className="h-11 sm:h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hora (opcional)</Label>
          <Input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={{ colorScheme: "dark" }}
            disabled={publicada}
            className="h-11 sm:h-9"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Formato</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["post", "carrossel", "stories", "reels"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormato(f)}
              className={`text-xs h-11 sm:h-9 rounded border capitalize ${
                formato === f
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {edicao && (
        <div className="space-y-1">
          <Label className="text-xs">Situação</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {statusOpcoes.map((s) => (
              <button
                key={s}
                type="button"
                disabled={publicada}
                onClick={() => {
                  setStatus(s)
                  setAviso(null)
                }}
                className={`text-xs h-11 sm:h-9 rounded border flex items-center justify-center gap-1.5 ${
                  status === s
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-border-subtle text-text-secondary hover:text-text-primary"
                } disabled:opacity-60`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusColor(s)}`} />
                {statusLabel(s)}
              </button>
            ))}
          </div>
          {publicada && (
            <p className="text-xs text-text-muted">
              Esta peça já foi publicada: situação, data e hora não mudam mais.
            </p>
          )}
        </div>
      )}

      {edicao?.temDestino && (
        <div className="space-y-1">
          <Label className="text-xs">Destino</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {DESTINOS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDestino(d)}
                className={`text-xs h-11 sm:h-9 rounded border ${
                  destino === d
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                {DESTINO_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      )}

      {aviso && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {aviso}
        </p>
      )}

      {/* Salvar e Cancelar ficam colados no fim da folha: sempre à vista, sem rolar. */}
      <div className="flex gap-2 pt-2 sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 pb-1 bg-background-tertiary">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11 sm:h-9">
          Cancelar
        </Button>
        <Button type="submit" disabled={!titulo.trim() || saving} className="flex-1 h-11 sm:h-9">
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  )
}
