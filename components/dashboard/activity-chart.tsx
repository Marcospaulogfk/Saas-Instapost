"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp, Activity } from "lucide-react"

interface ActivityChartProps {
  /** Total de projetos criados (usado pra escalar o mock) */
  projectsCount: number
  /** Créditos usados este mês (usado pra escalar o mock) */
  creditsUsedThisMonth: number
}

// Dados mockados — proporcionais ao uso real, mostram tendência das últimas 4 semanas
function buildSeries(projectsCount: number, creditsUsed: number) {
  const days = 28
  const now = new Date()
  const series: { date: string; label: string; posts: number; imagens: number }[] = []

  // Distribui valores com leve crescimento e ruído determinístico (sem Math.random no SSR)
  const seed = projectsCount * 7 + creditsUsed * 3 + 13
  const pseudo = (i: number) => {
    const x = Math.sin(seed + i * 1.7) * 10000
    return Math.abs(x - Math.floor(x))
  }

  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - (days - 1 - i))
    const trend = (i / days) * 0.6 + 0.4 // crescimento sutil
    const postsBase = Math.max(0, Math.round((projectsCount / 12) * trend + pseudo(i) * 2))
    const imagensBase = Math.max(0, Math.round((creditsUsed / 8) * trend + pseudo(i + 100) * 3))
    series.push({
      date: d.toISOString(),
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      posts: postsBase,
      imagens: imagensBase,
    })
  }
  return series
}

export function ActivityChart({ projectsCount, creditsUsedThisMonth }: ActivityChartProps) {
  const data = useMemo(
    () => buildSeries(projectsCount, creditsUsedThisMonth),
    [projectsCount, creditsUsedThisMonth],
  )

  const totalPosts = data.reduce((acc, d) => acc + d.posts, 0)
  const totalImagens = data.reduce((acc, d) => acc + d.imagens, 0)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-card border border-border-subtle backdrop-blur-xl"
    >
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 pb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-h3 font-display font-semibold text-text-primary">
              Sua atividade
            </h2>
          </div>
          <p className="text-sm text-text-secondary">Últimos 28 dias</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="flex items-center gap-1.5 justify-end text-xs text-text-muted mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Posts
            </div>
            <div className="text-xl font-bold text-text-primary tabular-nums">{totalPosts}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 justify-end text-xs text-text-muted mb-1">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
              Imagens
            </div>
            <div className="text-xl font-bold text-text-primary tabular-nums">{totalImagens}</div>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            +24%
          </div>
        </div>
      </div>

      <div className="relative z-10 h-56 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 8, left: 8 }}>
            <defs>
              <linearGradient id="postsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="imagensArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D946EF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#D946EF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="#52525B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: "rgba(124,58,237,0.3)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(28,28,38,0.95)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 8,
                fontSize: 12,
                color: "#FFFFFF",
                backdropFilter: "blur(12px)",
              }}
              labelStyle={{ color: "#A1A1AA", fontSize: 11, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="#7C3AED"
              strokeWidth={2}
              fill="url(#postsArea)"
              name="Posts"
            />
            <Area
              type="monotone"
              dataKey="imagens"
              stroke="#D946EF"
              strokeWidth={2}
              fill="url(#imagensArea)"
              name="Imagens"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  )
}
