"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Trash2,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { gerarPautasIA } from "@/lib/pautas"
import { getProximasDatas } from "@/lib/datas-comemorativas"
import {
  listActiveScheduledPosts,
  createScheduledPost,
  saveEditorialPlan,
  deleteScheduledPost,
} from "@/app/actions/scheduled-posts"
import {
  statusColor,
  statusLabel,
  FORMATO_LABEL,
  toISODate,
  type ScheduledPost,
  type PostStatus,
  type PostFormato,
  type PlanoIdeia,
} from "@/lib/planejar"
import Link from "next/link"

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

/** Mostra a hora HH:MM (ignora segundos) ou vazio. */
function fmtHora(t: string | null): string {
  if (!t) return ""
  return t.slice(0, 5)
}

export default function CalendarioPage() {
  const [today] = useState(() => new Date())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [filterStatus, setFilterStatus] = useState<"todos" | PostStatus>("todos")
  const [novaModal, setNovaModal] = useState<{ data: string } | null>(null)
  const [iaModalOpen, setIaModalOpen] = useState(false)

  // Fonte ÚNICA: scheduled_posts (banco). Cobre tanto ideias da IA
  // (source='ia') quanto pautas manuais (source='manual').
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([])
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

  function itensNoDia(date: Date | null): ScheduledPost[] {
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
    setNovaModal(null)
    await refetch()
  }

  async function handleDelete(id: string) {
    setScheduled((list) => list.filter((s) => s.id !== id))
    await deleteScheduledPost(id)
  }

  async function handleRecomendarIA(qtd: number) {
    if (!brandId) {
      alert("Selecione ou crie uma marca antes de gerar pautas.")
      return
    }
    setSaving(true)
    // Reusa o gerador de sementes e persiste no banco via saveEditorialPlan.
    const seeds = gerarPautasIA(year, month, qtd)
    const ideias: PlanoIdeia[] = seeds.map((p) => ({
      titulo: p.titulo,
      formato: p.formato as PostFormato,
      objetivo: "engage",
      data: p.data,
      descricao: "",
      motivo: "",
    }))
    const res = await saveEditorialPlan(brandId, ideias)
    setSaving(false)
    if (!res.ok) {
      alert(res.error)
      return
    }
    setIaModalOpen(false)
    await refetch()
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
            Planeje e organize seus conteúdos por dia e horário.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navMonth(-1)}
            className="w-9 h-9 rounded-lg border border-border-subtle hover:border-hairline-strong flex items-center justify-center transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 h-9 rounded-lg border border-border-subtle bg-background-tertiary/40 flex items-center text-sm font-semibold text-text-primary min-w-[140px] justify-center">
            {MESES_LONG[month]} {year}
          </div>
          <button
            type="button"
            onClick={() => navMonth(1)}
            className="w-9 h-9 rounded-lg border border-border-subtle hover:border-hairline-strong flex items-center justify-center transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button onClick={() => setNovaModal({ data: toISODate(today) })} className="ml-1">
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

      {/* Filtros + counts */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const count = f.id === "todos" ? scheduled.length : counts[f.id]
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                filterStatus === f.id
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
              {count} {f.label.toLowerCase()}
            </button>
          )
        })}
      </div>

      {/* Planejador IA banner — superfície chapada + hairline (sem gradiente/glow, DESIGN.md §6) */}
      <Link
        href="/dashboard/planejar"
        className="w-full mb-4 rounded-xl border border-border-subtle bg-background-secondary/50 hover:border-border-accent text-text-primary p-4 flex items-center gap-3 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-brand-600/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Planejar com IA</p>
          <p className="text-[11px] text-text-muted">
            Um papo rápido e a IA monta seu cronograma da semana, baseado na sua marca
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-text-muted" />
      </Link>

      {/* Recomendações IA local (sementes rápidas, sem chamar API) */}
      <button
        type="button"
        onClick={() => setIaModalOpen(true)}
        className="w-full mb-4 rounded-xl border border-border-subtle hover:border-hairline-strong text-text-secondary p-3 flex items-center gap-3 transition-colors text-left"
      >
        <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <span className="text-[13px] flex-1">Gerar pautas-semente rápidas (sem IA)</span>
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Grid mensal */}
      <div className="rounded-xl border border-border-subtle overflow-hidden bg-background-secondary/30">
        <div className="grid grid-cols-7 border-b border-border-subtle bg-background-tertiary/40">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-[10px] font-bold text-text-muted text-center">
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
                className={`min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-b border-r border-border-subtle ${
                  cell ? "" : "bg-background-tertiary/10"
                } ${isOtherMonth ? "opacity-40" : ""}`}
              >
                {cell && (
                  <button
                    type="button"
                    onClick={() => setNovaModal({ data: toISODate(cell) })}
                    className="w-full h-full flex flex-col gap-1 text-left hover:bg-background-tertiary/30 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold tabular-nums w-5 h-5 flex items-center justify-center rounded-full ${
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
                          className="text-[9px] font-bold text-orange-400 leading-none truncate max-w-[60%]"
                          title={dataCom.nome}
                        >
                          ✦ {dataCom.nome.slice(0, 14)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayItems.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="rounded px-1.5 py-0.5 text-[10px] truncate flex items-center gap-1"
                          style={{
                            background:
                              s.source === "ia"
                                ? "rgba(115,32,230,0.12)"
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
                        <p className="text-[9px] text-text-muted">+{dayItems.length - 3} mais</p>
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
                className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary/30 border border-border-subtle hover:border-hairline-strong transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusColor(s.status)} flex-shrink-0`}
                />
                <span className="text-[11px] tabular-nums text-text-muted w-20 flex-shrink-0">
                  {s.scheduled_date.split("-").reverse().slice(0, 2).join("/")}
                  {s.scheduled_time ? ` ${fmtHora(s.scheduled_time)}` : ""}
                </span>
                <p className="text-sm font-medium text-text-primary flex-1 truncate">
                  {s.title}
                </p>
                {s.source === "ia" && (
                  <Sparkles className="hidden sm:inline w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                )}
                <span className="hidden sm:inline text-[10px] text-text-muted">
                  {FORMATO_LABEL[s.format] ?? s.format}
                </span>
                <span className="hidden sm:inline text-[10px] text-text-muted">
                  {statusLabel(s.status)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="text-text-muted hover:text-red-400 p-1"
                  title="Remover do calendário"
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

      {/* Modal: Gerar com IA */}
      {iaModalOpen && (
        <Modal onClose={() => setIaModalOpen(false)} title="Gerar Calendário com IA">
          <RecomendarIAForm
            saving={saving}
            onGerar={handleRecomendarIA}
            onCancel={() => setIaModalOpen(false)}
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
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-background-tertiary border border-border-medium p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NovaPautaForm({
  initialData,
  saving,
  onSave,
  onCancel,
}: {
  initialData: string
  saving: boolean
  onSave: (titulo: string, data: string, hora: string, formato: PostFormato) => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState("")
  const [data, setData] = useState(initialData)
  const [hora, setHora] = useState("")
  const [formato, setFormato] = useState<PostFormato>("post")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!titulo.trim()) return
        onSave(titulo.trim(), data, hora, formato)
      }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <Label className="text-xs">Título</Label>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Quebra mito do nicho"
          autoFocus
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
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hora (opcional)</Label>
          <Input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={{ colorScheme: "dark" }}
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
              className={`text-xs h-9 rounded border capitalize ${
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
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={!titulo.trim() || saving} className="flex-1">
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

function RecomendarIAForm({
  saving,
  onGerar,
  onCancel,
}: {
  saving: boolean
  onGerar: (qtd: number) => void
  onCancel: () => void
}) {
  const [qtd, setQtd] = useState(8)
  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary">
        A IA vai gerar pautas espalhadas no mês baseadas em ideias prontas + datas
        comemorativas. Você pode editar/excluir cada uma depois.
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Quantas pautas gerar?</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {[4, 8, 12, 20].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQtd(q)}
              className={`text-xs h-9 rounded border ${
                qtd === q
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" onClick={() => onGerar(qtd)} disabled={saving} className="flex-1">
          <Sparkles className="w-4 h-4 mr-1.5" />
          {saving ? "Gerando…" : `Gerar ${qtd}`}
        </Button>
      </div>
    </div>
  )
}
