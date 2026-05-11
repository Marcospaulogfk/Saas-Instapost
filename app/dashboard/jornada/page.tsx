"use client"

import { useEffect, useState } from "react"
import {
  Trophy,
  Zap,
  Calendar,
  CheckCircle2,
  Crown,
  Award,
  ArrowRight,
  Target,
  Flame,
} from "lucide-react"
import Link from "next/link"
import {
  loadJornada,
  saveJornada,
  progressoNivel,
  gerarRanking,
  MISSOES,
  type JornadaState,
} from "@/lib/jornada"

export default function JornadaPage() {
  const [state, setState] = useState<JornadaState | null>(null)
  const [tab, setTab] = useState<"missoes" | "conquistas">("missoes")

  useEffect(() => {
    setState(loadJornada())
  }, [])

  if (!state) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse h-32 bg-background-tertiary/40 rounded-xl" />
      </div>
    )
  }

  const { nivel, proxima, percentual, xpFaltando } = progressoNivel(state.xp)
  const ranking = gerarRanking(state.xp)
  const missoesDiarias = MISSOES.filter((m) => m.tipo === "diaria")
  const missoesSemanais = MISSOES.filter((m) => m.tipo === "semanal")
  const missoesMensais = MISSOES.filter((m) => m.tipo === "mensal")

  function progressoMissao(id: string, meta: number) {
    if (state!.missoesCompletas.includes(id)) {
      return { atual: meta, percentual: 100, completa: true }
    }
    // Mock determinístico: usa estado real se aplicável, senão zero
    let atual = 0
    if (id === "gere-1-post" && state!.postsCriados > 0) atual = 1
    if (id === "crie-5-posts") atual = Math.min(state!.postsCriados, meta)
    return {
      atual,
      percentual: Math.round((atual / meta) * 100),
      completa: atual >= meta,
    }
  }

  function completaMissao(id: string, xpReward: number) {
    if (state!.missoesCompletas.includes(id)) return
    const next: JornadaState = {
      ...state!,
      xp: state!.xp + xpReward,
      missoesCompletas: [...state!.missoesCompletas, id],
    }
    setState(next)
    saveJornada(next)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Minha Jornada</h1>
      </div>

      {/* Card de Nível */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 via-purple-600/5 to-transparent border border-purple-600/30 p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400/20" />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-text-muted font-bold mb-1">
          NÍVEL {nivel.id}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
          {nivel.nome}
        </h2>
        {proxima ? (
          <p className="text-sm text-text-secondary mb-4">
            Você está a <span className="font-bold text-purple-400">{xpFaltando} XP</span> de
            alcançar o próximo nível ({proxima.nome}).
          </p>
        ) : (
          <p className="text-sm text-text-secondary mb-4">
            Você atingiu o nível máximo. 🎉
          </p>
        )}
        <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5">
          <span>Progresso do Nível</span>
          <span className="font-medium text-text-primary">{percentual}%</span>
        </div>
        <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <p className="text-[10px] text-text-muted mt-1.5 text-right tabular-nums">
          {state.xp} / {nivel.max === Infinity ? "∞" : nivel.max} XP
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <StatCard icon={Flame} valor={state.diasOfensiva} label="Dias de Ofensiva" iconColor="text-orange-400" />
        <StatCard icon={Calendar} valor={state.postsCriados} label="Posts Criados" iconColor="text-blue-400" />
        <StatCard icon={CheckCircle2} valor={state.missoesCompletas.length} label="Missões Concluídas" iconColor="text-emerald-400" />
        <StatCard icon={Crown} valor={`#${ranking.global}`} label="Ranking Global" iconColor="text-purple-400" sublabel="Ver Top 100" />
        <StatCard icon={Award} valor={`#${ranking.mes}`} label="Ranking do Mês" iconColor="text-pink-400" sublabel="22 dias restantes" />
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-background-secondary/60 border border-border-subtle mb-6">
        <button
          type="button"
          onClick={() => setTab("missoes")}
          className={`flex items-center gap-2 px-4 h-9 rounded-md text-xs font-medium transition-colors ${
            tab === "missoes"
              ? "bg-purple-600 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Central de Missões
        </button>
        <button
          type="button"
          onClick={() => setTab("conquistas")}
          className={`flex items-center gap-2 px-4 h-9 rounded-md text-xs font-medium transition-colors ${
            tab === "conquistas"
              ? "bg-purple-600 text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Conquistas
        </button>
      </div>

      {tab === "missoes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MissoesGroup
            titulo="Missões Diárias"
            icon={<Zap className="w-4 h-4 text-orange-400" />}
            missoes={missoesDiarias}
            progress={progressoMissao}
            onComplete={completaMissao}
          />
          <MissoesGroup
            titulo="Missões Semanais"
            icon={<Calendar className="w-4 h-4 text-blue-400" />}
            missoes={missoesSemanais}
            progress={progressoMissao}
            onComplete={completaMissao}
          />
          <MissoesGroup
            titulo="Missões Mensais"
            icon={<Trophy className="w-4 h-4 text-purple-400" />}
            missoes={missoesMensais}
            progress={progressoMissao}
            onComplete={completaMissao}
          />
        </div>
      )}

      {tab === "conquistas" && (
        <div className="rounded-xl border-2 border-dashed border-border-subtle p-12 text-center">
          <Trophy className="w-10 h-10 mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">
            Sistema de conquistas em construção. Volta logo.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  valor,
  label,
  iconColor,
  sublabel,
}: {
  icon: typeof Trophy
  valor: number | string
  label: string
  iconColor: string
  sublabel?: string
}) {
  return (
    <div className="rounded-xl bg-gradient-card border border-border-subtle p-4">
      <div
        className={`w-9 h-9 rounded-lg bg-background-tertiary/60 flex items-center justify-center mb-2 ${iconColor}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
        {valor}
      </p>
      <p className="text-[11px] text-text-secondary leading-tight">{label}</p>
      {sublabel && (
        <p className="text-[10px] text-purple-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}

function MissoesGroup({
  titulo,
  icon,
  missoes,
  progress,
  onComplete,
}: {
  titulo: string
  icon: React.ReactNode
  missoes: typeof MISSOES
  progress: (id: string, meta: number) => { atual: number; percentual: number; completa: boolean }
  onComplete: (id: string, xp: number) => void
}) {
  return (
    <div className="rounded-xl bg-gradient-card border border-border-subtle p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-text-primary">{titulo}</h3>
      </div>
      <div className="space-y-3">
        {missoes.map((m) => {
          const p = progress(m.id, m.meta)
          return (
            <div
              key={m.id}
              className={`rounded-lg p-3 border ${
                p.completa
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-background-tertiary/40 border-border-subtle"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-start gap-2 min-w-0">
                  {p.completa && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs font-semibold text-text-primary leading-tight">
                    {m.titulo}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-lime flex-shrink-0">
                  +{m.xp} XP
                </span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                {m.descricao}
              </p>
              {!p.completa && (
                <>
                  <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                    <span className="tabular-nums">
                      {p.atual}/{m.meta}
                    </span>
                    <span className="tabular-nums">{p.percentual}%</span>
                  </div>
                  <div className="w-full h-1 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${p.percentual}%` }}
                    />
                  </div>
                  {p.percentual >= 100 ? (
                    <button
                      type="button"
                      onClick={() => onComplete(m.id, m.xp)}
                      className="w-full mt-2 text-[11px] font-medium bg-lime text-zinc-950 py-1.5 rounded hover:brightness-110 transition-all"
                    >
                      Resgatar +{m.xp} XP
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/criar"
                      className="block text-right text-[10px] text-purple-400 hover:text-purple-300 mt-1.5"
                    >
                      Ir <ArrowRight className="w-3 h-3 inline" />
                    </Link>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
