"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Instagram } from "lucide-react"

export interface DistSlice {
  name: string
  value: number
  color: string
}

export function NovaDistribution({ slices }: { slices: DistSlice[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  const hasData = total > 0
  const chartData = hasData ? slices.filter((s) => s.value > 0) : [{ name: "Sem dados", value: 1, color: "#26263a" }]

  return (
    <div className="nv-card nv-fade p-5 flex flex-col">
      <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--nv-text)" }}>
        Distribuição de conteúdo
      </h2>

      <div className="flex items-center gap-5">
        <div className="relative w-[132px] h-[132px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                isAnimationActive={false}
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={hasData ? 3 : 0}
                stroke="none"
              >
                {chartData.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color: "var(--nv-text)" }}>
              {total}
            </span>
            <span className="text-[10px]" style={{ color: "var(--nv-text-subtle)" }}>
              total
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-2.5 min-w-0">
          {slices.map((s) => {
            const pct = hasData ? Math.round((s.value / total) * 100) : 0
            return (
              <li key={s.name} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="flex-1 truncate" style={{ color: "var(--nv-text-muted)" }}>
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--nv-text)" }}>
                  {pct}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Plataforma principal */}
      <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--nv-border)" }}>
        <p className="text-[11px] mb-2.5" style={{ color: "var(--nv-text-subtle)" }}>
          Plataforma principal
        </p>
        <div className="flex items-center gap-3">
          <span className="nv-tile nv-tile-pink w-9 h-9">
            <Instagram className="w-[18px] h-[18px]" />
          </span>
          <div className="flex-1">
            <p className="text-[13px] font-semibold" style={{ color: "var(--nv-text)" }}>
              Instagram
            </p>
            <p className="text-[11px]" style={{ color: "var(--nv-text-subtle)" }}>
              Feed + Carrossel + Stories
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
