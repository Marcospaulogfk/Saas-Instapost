"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface PerfPoint {
  label: string
  criados: number
  agendados: number
}

export function NovaPerformance({ data }: { data: PerfPoint[] }) {
  const totalCriados = data.reduce((a, d) => a + d.criados, 0)
  const totalAgendados = data.reduce((a, d) => a + d.agendados, 0)

  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--nv-text)" }}>
            Performance de conteúdo
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <Legend color="#8b5cf6" label="Criados" value={totalCriados} />
            <Legend color="#3b82f6" label="Agendados" value={totalAgendados} />
          </div>
        </div>
        <span
          className="text-[12px] px-3 h-8 inline-flex items-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--nv-border)", color: "var(--nv-text-muted)" }}
        >
          Últimos 28 dias
        </span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="perfCriados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="perfAgendados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#6b7180"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(data.length / 6))}
            />
            <YAxis stroke="#6b7180" fontSize={11} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(18,18,29,0.96)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 10,
                fontSize: 12,
                color: "#fff",
              }}
              labelStyle={{ color: "#9ba1b2", fontSize: 11, marginBottom: 4 }}
            />
            <Area isAnimationActive={false} type="monotone" dataKey="criados" name="Criados" stroke="#8b5cf6" strokeWidth={2.2} fill="url(#perfCriados)" />
            <Area isAnimationActive={false} type="monotone" dataKey="agendados" name="Agendados" stroke="#3b82f6" strokeWidth={2.2} fill="url(#perfAgendados)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[12px]" style={{ color: "var(--nv-text-muted)" }}>
        {label}
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--nv-text)" }}>
        {value}
      </span>
    </div>
  )
}
