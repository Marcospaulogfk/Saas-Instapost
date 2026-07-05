"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Lightbulb,
  Flame,
  ArrowRight,
  Filter,
  Sparkles,
  CalendarDays,
  Store,
} from "lucide-react"
import {
  type InspiracaoCategoria,
  type Inspiracao,
} from "@/lib/inspiracoes"
import {
  getProximasDatas,
  categoriaColorClass,
  type DataComemorativa,
} from "@/lib/datas-comemorativas"

type InspiracaoView = Inspiracao & { personalizada?: boolean }

type ProximaData = DataComemorativa & { date: Date; daysAway: number }

const CATEGORIAS: Array<{ id: "todas" | InspiracaoCategoria; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "trends", label: "🔥 Trends" },
  { id: "engajamento", label: "Engajamento" },
  { id: "venda", label: "Venda" },
  { id: "autoridade", label: "Autoridade" },
  { id: "comunidade", label: "Comunidade" },
]

const FORMATOS: Array<{ id: "todos" | Inspiracao["formato"]; label: string }> = [
  { id: "todos", label: "Todos formatos" },
  { id: "post", label: "Post único" },
  { id: "carrossel", label: "Carrossel" },
  { id: "stories", label: "Stories" },
]

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

interface Props {
  inspiracoes: InspiracaoView[]
  brandName: string | null
  /** Bloco de contexto da marca ativa pra prefixar briefings gerados na hora (datas). */
  contextoMarca: string | null
}

export function InspiracoesClient({ inspiracoes, brandName, contextoMarca }: Props) {
  const router = useRouter()
  const [catFilter, setCatFilter] = useState<"todas" | InspiracaoCategoria>("todas")
  const [formatoFilter, setFormatoFilter] = useState<"todos" | Inspiracao["formato"]>(
    "todos",
  )
  // Computa no cliente (depende de "hoje") pra evitar mismatch de hidratação.
  const [proximasDatas, setProximasDatas] = useState<ProximaData[]>([])

  useEffect(() => {
    setProximasDatas(getProximasDatas(new Date(), 3))
  }, [])

  const filtered = useMemo(() => {
    return inspiracoes.filter((i) => {
      const catOk =
        catFilter === "todas" ||
        i.categoria === catFilter ||
        (catFilter === "trends" && i.trend)
      const fmtOk = formatoFilter === "todos" || i.formato === formatoFilter
      return catOk && fmtOk
    })
  }, [inspiracoes, catFilter, formatoFilter])

  function irPraCriacao(briefing: string, formato: Inspiracao["formato"]) {
    try {
      sessionStorage.setItem(
        "syncpost_pending_inspiracao",
        JSON.stringify({
          briefing,
          formato,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push("/dashboard/criar")
  }

  function usarSugestao(insp: InspiracaoView) {
    irPraCriacao(insp.briefing, insp.formato)
  }

  function usarData(d: ProximaData) {
    const quando =
      d.daysAway === 0
        ? "hoje"
        : d.daysAway === 1
          ? "amanhã"
          : `em ${d.daysAway} dias (${d.dia} de ${MESES[d.mes - 1]})`
    const briefingData = `Post aproveitando a data comemorativa "${d.nome}", que acontece ${quando}. Conecte a data ao universo da marca de um jeito específico — nada de "feliz dia de X" genérico: traga um ângulo que só essa marca poderia postar (oferta ligada à data, bastidor, opinião ou dica útil relacionada). Gancho forte mencionando a data, corpo conectando com o que a marca faz, e CTA claro no final.`
    const briefing = contextoMarca
      ? `${contextoMarca}\n\n${briefingData}`
      : briefingData
    irPraCriacao(briefing, "post")
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {brandName ? (
              <>
                Sugestões para{" "}
                <span className="text-brand-300">{brandName}</span>
              </>
            ) : (
              "Sugestões"
            )}
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          {brandName ? (
            <>
              Ideias de post selecionadas pro nicho e objetivo da{" "}
              <span className="text-brand-300 font-medium">{brandName}</span>. Clica
              numa pra gerar já com o contexto da sua marca.
            </>
          ) : (
            <>
              Não sabe o que postar? Ideias prontas com briefing já estruturado.
              Clica em qualquer uma pra gerar e ajustar no editor.
            </>
          )}
        </p>
      </div>

      {/* Sem marca: convite pra criar e destravar personalização */}
      {!brandName && (
        <div className="mb-6 rounded-xl border border-brand-600/30 bg-brand-600/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">
              Crie sua marca pra receber sugestões personalizadas
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Com uma marca ativa, as sugestões chegam adaptadas ao seu nicho,
              público e objetivo — e o briefing já sai pronto no seu contexto.
            </p>
          </div>
          <Link
            href="/dashboard/marcas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 text-[#0e0e0e] hover:bg-brand-500 transition-colors flex-shrink-0"
          >
            Criar marca
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Ganchos da semana — próximas datas comemorativas */}
      {proximasDatas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-text-primary">
              Ganchos da semana
            </h2>
            <span className="text-[11px] text-text-muted">
              datas próximas pra aproveitar
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {proximasDatas.map((d) => {
              const dayLabel =
                d.daysAway === 0
                  ? "hoje"
                  : d.daysAway === 1
                    ? "amanhã"
                    : `em ${d.daysAway} dias`
              return (
                <div
                  key={`${d.id}-${d.date.toISOString()}`}
                  className="rounded-xl bg-gradient-card border border-border-subtle p-4 flex items-center gap-3"
                >
                  <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-background-tertiary/60 border border-border-subtle flex-shrink-0">
                    <span className="text-[10px] uppercase text-text-muted leading-none">
                      {MESES_CURTOS[d.mes - 1]}
                    </span>
                    <span className="text-sm font-bold text-text-primary leading-none mt-0.5">
                      {d.dia}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">
                      {d.nome}
                    </p>
                    <p
                      className={`text-[10px] font-medium ${categoriaColorClass(d.categoria)}`}
                    >
                      {dayLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => usarData(d)}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-brand-600/15 border border-brand-600/30 text-brand-300 hover:bg-brand-600/25 transition-colors flex-shrink-0"
                  >
                    Criar post
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatFilter(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              catFilter === c.id
                ? "bg-brand-600 border-brand-600 text-[#0e0e0e]"
                : "border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium"
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="w-px bg-border-subtle mx-1" />
        {FORMATOS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFormatoFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              formatoFilter === f.id
                ? "bg-lime border-lime text-white"
                : "border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((insp) => (
          <button
            key={insp.id}
            type="button"
            onClick={() => usarSugestao(insp)}
            className="group text-left rounded-xl bg-gradient-card border border-border-subtle hover:border-brand-600/40 transition-all p-5 space-y-3 hover:scale-[1.01]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {insp.personalizada && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-600/10 border border-brand-600/30 text-brand-300">
                    <Sparkles className="w-3 h-3" />
                    sua marca
                  </span>
                )}
                {insp.trend && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300">
                    <Flame className="w-3 h-3" />
                    trends
                  </span>
                )}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-lime/10 border border-lime/30 text-lime">
                  +{insp.xp} XP
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary capitalize">
                  {insp.formato}
                </span>
              </div>
            </div>
            <h3 className="text-base font-semibold text-text-primary leading-tight">
              {insp.titulo}
            </h3>
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {insp.descricao}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <span className="text-[11px] text-text-muted capitalize">
                {insp.categoria}
              </span>
              <span className="text-[11px] text-brand-400 group-hover:text-brand-300 flex items-center gap-1 font-medium">
                Usar essa ideia
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border-subtle p-12 text-center">
          <Filter className="w-8 h-8 mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">
            Nenhuma sugestão com esses filtros. Tenta outra categoria.
          </p>
        </div>
      )}
    </div>
  )
}
