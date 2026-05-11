"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  loadPautas,
  savePautas,
  addPauta,
  deletePauta,
  gerarPautasIA,
  statusColor,
  statusLabel,
  type Pauta,
  type PautaStatus,
} from "@/lib/pautas"
import { getProximasDatas } from "@/lib/datas-comemorativas"

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

const STATUS_FILTERS: Array<{ id: "todos" | PautaStatus; label: string; color: string }> = [
  { id: "todos", label: "Todos", color: "bg-text-secondary" },
  { id: "ideia", label: "Ideias IA", color: "bg-purple-500" },
  { id: "em_criacao", label: "Em criação", color: "bg-blue-500" },
  { id: "pronto", label: "Prontos", color: "bg-emerald-500" },
  { id: "agendado", label: "Agendados", color: "bg-orange-500" },
]

export default function CalendarioPage() {
  const [today] = useState(() => new Date())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [filterStatus, setFilterStatus] = useState<"todos" | PautaStatus>("todos")
  const [novaModal, setNovaModal] = useState<{ data: string } | null>(null)
  const [iaModalOpen, setIaModalOpen] = useState(false)

  useEffect(() => {
    setPautas(loadPautas())
  }, [])

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])
  const datasComemorativas = useMemo(() => {
    const startMonth = new Date(year, month, 1)
    return getProximasDatas(startMonth, 50).filter(
      (d) => d.date.getMonth() === month && d.date.getFullYear() === year,
    )
  }, [year, month])

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return pautas
    return pautas.filter((p) => p.status === filterStatus)
  }, [pautas, filterStatus])

  const counts = useMemo(() => {
    return {
      ideia: pautas.filter((p) => p.status === "ideia").length,
      em_criacao: pautas.filter((p) => p.status === "em_criacao").length,
      pronto: pautas.filter((p) => p.status === "pronto").length,
      agendado: pautas.filter((p) => p.status === "agendado").length,
    }
  }, [pautas])

  function pautasNoDia(date: Date | null): Pauta[] {
    if (!date) return []
    const iso = formatDate(date)
    return filtered.filter((p) => p.data === iso)
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

  function handleNovaPauta(titulo: string, data: string, formato: Pauta["formato"]) {
    const novo = addPauta({ titulo, data, status: "ideia", formato, rede: "instagram" })
    setPautas((p) => [...p, novo])
    setNovaModal(null)
  }

  function handleDelete(id: string) {
    deletePauta(id)
    setPautas((list) => list.filter((p) => p.id !== id))
  }

  function handleRecomendarIA(qtd: number) {
    const novas = gerarPautasIA(year, month, qtd)
    const all = [...pautas, ...novas]
    savePautas(all)
    setPautas(all)
    setIaModalOpen(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Calendário Editorial</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Planeje, vincule e agende seus conteúdos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navMonth(-1)}
            className="w-9 h-9 rounded-lg border border-border-subtle hover:bg-background-tertiary flex items-center justify-center"
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
            className="w-9 h-9 rounded-lg border border-border-subtle hover:bg-background-tertiary flex items-center justify-center"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button onClick={() => setNovaModal({ data: formatDate(today) })} className="ml-1">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Pauta
          </Button>
        </div>
      </div>

      {/* Filtros + counts */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.id === "todos"
              ? pautas.length
              : counts[f.id as keyof typeof counts]
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                filterStatus === f.id
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
              {count} {f.label.toLowerCase()}
            </button>
          )
        })}
      </div>

      {/* Recomendações IA banner */}
      <button
        type="button"
        onClick={() => setIaModalOpen(true)}
        className="w-full mb-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white p-4 flex items-center gap-3 transition-all text-left shadow-lg shadow-purple-900/20"
      >
        <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Recomendações IA</p>
          <p className="text-[11px] opacity-90">
            Gere um calendário inteligente baseado nas suas inspirações
          </p>
        </div>
        <ChevronRight className="w-5 h-5" />
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
            const dayPautas = pautasNoDia(cell)
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
                    onClick={() => setNovaModal({ data: formatDate(cell) })}
                    className="w-full h-full flex flex-col gap-1 text-left hover:bg-background-tertiary/30 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold tabular-nums w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-purple-600 text-white"
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
                      {dayPautas.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="rounded px-1.5 py-0.5 text-[10px] truncate flex items-center gap-1"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          title={p.titulo}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusColor(p.status)} flex-shrink-0`}
                          />
                          <span className="text-text-primary truncate">{p.titulo}</span>
                        </div>
                      ))}
                      {dayPautas.length > 3 && (
                        <p className="text-[9px] text-text-muted">+{dayPautas.length - 3} mais</p>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de pautas filtradas */}
      {filtered.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Pautas {filterStatus === "todos" ? "do mês" : statusLabel(filterStatus as PautaStatus).toLowerCase()}
          </h3>
          <div className="space-y-2">
            {filtered
              .filter((p) => {
                const d = new Date(p.data)
                return d.getMonth() === month && d.getFullYear() === year
              })
              .sort((a, b) => a.data.localeCompare(b.data))
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary/30 border border-border-subtle"
                >
                  <span className={`w-2 h-2 rounded-full ${statusColor(p.status)} flex-shrink-0`} />
                  <span className="text-[11px] tabular-nums text-text-muted w-14 flex-shrink-0">
                    {p.data.split("-").reverse().slice(0, 2).join("/")}
                  </span>
                  <p className="text-sm font-medium text-text-primary flex-1 truncate">
                    {p.titulo}
                  </p>
                  <span className="hidden sm:inline text-[10px] text-text-muted capitalize">
                    {p.formato}
                  </span>
                  <span className="hidden sm:inline text-[10px] text-text-muted">
                    {statusLabel(p.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-text-muted hover:text-red-400 p-1"
                    title="Excluir pauta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal: Nova Pauta */}
      {novaModal && (
        <Modal onClose={() => setNovaModal(null)} title="Nova Pauta">
          <NovaPautaForm
            initialData={novaModal.data}
            onSave={handleNovaPauta}
            onCancel={() => setNovaModal(null)}
          />
        </Modal>
      )}

      {/* Modal: Gerar com IA */}
      {iaModalOpen && (
        <Modal onClose={() => setIaModalOpen(false)} title="Gerar Calendário com IA">
          <RecomendarIAForm
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
    const last = cells[cells.length - 1] as Date
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    cells.push(next)
  }
  return cells
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
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
  onSave,
  onCancel,
}: {
  initialData: string
  onSave: (titulo: string, data: string, formato: Pauta["formato"]) => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState("")
  const [data, setData] = useState(initialData)
  const [formato, setFormato] = useState<Pauta["formato"]>("post")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!titulo.trim()) return
        onSave(titulo.trim(), data, formato)
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
        <Label className="text-xs">Formato</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {(["post", "carrossel", "stories"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormato(f)}
              className={`text-xs h-9 rounded border capitalize ${
                formato === f
                  ? "bg-purple-600 border-purple-600 text-white"
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
        <Button type="submit" disabled={!titulo.trim()} className="flex-1">
          Salvar
        </Button>
      </div>
    </form>
  )
}

function RecomendarIAForm({
  onGerar,
  onCancel,
}: {
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
                  ? "bg-purple-600 border-purple-600 text-white"
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
        <Button type="button" onClick={() => onGerar(qtd)} className="flex-1">
          <Sparkles className="w-4 h-4 mr-1.5" />
          Gerar {qtd}
        </Button>
      </div>
    </div>
  )
}
