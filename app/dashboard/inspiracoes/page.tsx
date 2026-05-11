"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Lightbulb, Flame, ArrowRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  INSPIRACOES,
  type InspiracaoCategoria,
  type Inspiracao,
} from "@/lib/inspiracoes"

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

export default function InspiracoesPage() {
  const router = useRouter()
  const [catFilter, setCatFilter] = useState<"todas" | InspiracaoCategoria>("todas")
  const [formatoFilter, setFormatoFilter] = useState<"todos" | Inspiracao["formato"]>(
    "todos",
  )

  const filtered = useMemo(() => {
    return INSPIRACOES.filter((i) => {
      const catOk = catFilter === "todas" || i.categoria === catFilter || (catFilter === "trends" && i.trend)
      const fmtOk = formatoFilter === "todos" || i.formato === formatoFilter
      return catOk && fmtOk
    })
  }, [catFilter, formatoFilter])

  function useInspiracao(insp: Inspiracao) {
    // Salva no sessionStorage e leva pro wizard
    try {
      sessionStorage.setItem(
        "syncpost_pending_inspiracao",
        JSON.stringify({
          briefing: insp.briefing,
          formato: insp.formato,
          ts: Date.now(),
        }),
      )
    } catch {}
    router.push("/dashboard/criar")
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Inspirações</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Ideias prontas com briefing já estruturado. Clica em qualquer uma pra
          gerar e ajustar no editor.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatFilter(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              catFilter === c.id
                ? "bg-purple-600 border-purple-600 text-white"
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
                ? "bg-lime border-lime text-zinc-950"
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
            onClick={() => useInspiracao(insp)}
            className="group text-left rounded-xl bg-gradient-card border border-border-subtle hover:border-purple-600/40 transition-all p-5 space-y-3 hover:scale-[1.01]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
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
              <span className="text-[11px] text-purple-400 group-hover:text-purple-300 flex items-center gap-1 font-medium">
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
            Nenhuma inspiração com esses filtros. Tenta outra categoria.
          </p>
        </div>
      )}
    </div>
  )
}
