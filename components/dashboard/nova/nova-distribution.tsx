"use client"

import Link from "next/link"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Instagram, Plus } from "lucide-react"
import { getBrandGradient } from "@/lib/brand-colors"

export interface DistSlice {
  name: string
  value: number
  color: string
}

export interface DistBrand {
  id: string
  name: string
  logoUrl: string | null
  /** Quantos conteúdos essa marca já tem. */
  count: number
}

export function NovaDistribution({
  slices,
  brands = [],
}: {
  slices: DistSlice[]
  brands?: DistBrand[]
}) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  const hasData = total > 0
  const chartData = hasData ? slices.filter((s) => s.value > 0) : [{ name: "Sem dados", value: 1, color: "#26263a" }]

  return (
    <div className="nv-card nv-fade p-5 flex flex-col h-full">
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

      {/* Marcas ativas — ocupa a altura que sobrava embaixo do gráfico */}
      <div className="mt-5 pt-4 flex-1 min-h-0 flex flex-col" style={{ borderTop: "1px solid var(--nv-border)" }}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-[11px]" style={{ color: "var(--nv-text-subtle)" }}>
            Marcas ativas
          </p>
          <Link
            href="/dashboard/marcas"
            className="text-[11.5px] font-medium"
            style={{ color: "var(--nv-brand-soft)" }}
          >
            Gerenciar
          </Link>
        </div>

        {brands.length === 0 ? (
          <Link
            href="/onboarding"
            className="nv-card-hover flex items-center gap-3 rounded-xl p-2.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--nv-border)" }}
          >
            <span
              className="grid w-8 h-8 shrink-0 place-items-center rounded-lg"
              style={{ background: "rgba(10,46,122,0.5)", color: "var(--nv-brand-soft)" }}
            >
              <Plus className="w-4 h-4" />
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: "var(--nv-text)" }}>
              Criar primeira marca
            </span>
          </Link>
        ) : (
          <ul className="space-y-1.5 overflow-y-auto nova-scroll">
            {brands.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/dashboard/marcas/${b.id}`}
                  className="nv-card-hover flex items-center gap-2.5 rounded-lg px-2 py-1.5"
                >
                  {b.logoUrl ? (
                    <span className="w-7 h-7 shrink-0 overflow-hidden rounded-md bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logoUrl} alt="" className="w-full h-full object-contain" />
                    </span>
                  ) : (
                    <span
                      className={`grid w-7 h-7 shrink-0 place-items-center rounded-md ${getBrandGradient(b.id)}`}
                    >
                      <span className="text-[11px] font-bold text-white">
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: "var(--nv-text)" }}>
                    {b.name}
                  </span>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ color: "var(--nv-text-subtle)" }}
                  >
                    {b.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Plataforma principal */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--nv-border)" }}>
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
