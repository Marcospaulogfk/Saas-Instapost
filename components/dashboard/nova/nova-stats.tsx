"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { FileText, Layers, Store, CalendarClock } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface NovaStatsProps {
  totalContent: number
  carouselCount: number
  brandsCount: number
  scheduledCount: number
  credits: number
  creditsTotal: number
  /** série de 7 pontos por card, derivada de dados reais, pra sparkline */
  spark: { total: number[]; carousel: number[]; brands: number[]; scheduled: number[] }
}

type Tone = "purple" | "blue" | "orange" | "green"

const COLOR: Record<Tone, string> = {
  purple: "#8b5cf6",
  blue: "#3b82f6",
  orange: "#f59e0b",
  green: "#22c55e",
}

export function NovaStats({
  totalContent,
  carouselCount,
  brandsCount,
  scheduledCount,
  credits,
  creditsTotal,
  spark,
}: NovaStatsProps) {
  const cards: {
    label: string
    value: number
    sub: string
    icon: LucideIcon
    tone: Tone
    tile: string
    data: number[]
  }[] = [
    {
      label: "Conteúdos criados",
      value: totalContent,
      sub: "no total",
      icon: FileText,
      tone: "purple",
      tile: "nv-tile-purple",
      data: spark.total,
    },
    {
      label: "Carrosséis",
      value: carouselCount,
      sub: "gerados pela IA",
      icon: Layers,
      tone: "blue",
      tile: "nv-tile-blue",
      data: spark.carousel,
    },
    {
      label: "Marcas ativas",
      value: brandsCount,
      sub: brandsCount === 1 ? "cadastrada" : "cadastradas",
      icon: Store,
      tone: "orange",
      tile: "nv-tile-orange",
      data: spark.brands,
    },
    {
      label: "Agendados",
      value: scheduledCount,
      sub: "próximos posts",
      icon: CalendarClock,
      tone: "green",
      tile: "nv-tile-green",
      data: spark.scheduled,
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3.5">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
      <CreditsGauge credits={credits} total={creditsTotal} />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  tile,
  data,
}: {
  label: string
  value: number
  sub: string
  icon: LucideIcon
  tone: Tone
  tile: string
  data: number[]
}) {
  const series = data.map((v, i) => ({ i, v }))
  const color = COLOR[tone]
  return (
    <div className="nv-card nv-card-hover nv-fade p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className={`nv-tile ${tile} w-9 h-9`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
        </span>
      </div>
      <p className="text-[11.5px] mb-1" style={{ color: "var(--nv-text-muted)" }}>
        {label}
      </p>
      <p className="text-[26px] font-bold leading-none tabular-nums tracking-tight" style={{ color: "var(--nv-text)" }}>
        {value.toLocaleString("pt-BR")}
      </p>
      <div className="flex items-end justify-between mt-2 gap-2">
        <span className="text-[10.5px]" style={{ color: "var(--nv-text-subtle)" }}>
          {sub}
        </span>
        <div className="w-16 h-7 -mb-0.5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.8}
                fill={`url(#spark-${tone})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function CreditsGauge({ credits, total }: { credits: number; total: number }) {
  const safeTotal = Math.max(total, 1)
  // Anel mostra o que RESTA (cheio = carteira cheia; esvazia conforme usa).
  const remainingPct = Math.max(0, Math.min(100, Math.round((credits / safeTotal) * 100)))
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = (remainingPct / 100) * circ

  return (
    <div className="nv-card nv-card-hover nv-fade p-4 col-span-2 xl:col-span-1 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11.5px] mb-1" style={{ color: "var(--nv-text-muted)" }}>
          Créditos restantes
        </p>
        <p className="text-[26px] font-bold leading-none tabular-nums tracking-tight" style={{ color: "var(--nv-text)" }}>
          {credits.toLocaleString("pt-BR")}
        </p>
        <p className="text-[10.5px] mt-2" style={{ color: "var(--nv-text-subtle)" }}>
          de {total.toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="relative w-[68px] h-[68px] shrink-0">
        <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="6" />
          <circle
            cx="34"
            cy="34"
            r={r}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums"
          style={{ color: "var(--nv-text)" }}
        >
          {remainingPct}%
        </span>
      </div>
    </div>
  )
}
