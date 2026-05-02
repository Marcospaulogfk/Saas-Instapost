"use client"

import { useRef, useState, MouseEvent } from "react"
import { motion } from "framer-motion"
import { Sparkles, Image as ImageIcon, Building2, Crown, ArrowUpRight } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface StatsGridProps {
  projectsCount: number
  brandsCount: number
  creditsUsedThisMonth: number
  subscriptionStatus: string
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Pro",
  past_due: "Atrasado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
}

// Sparkline determinístico — não muda entre SSR e client
function sparkData(seed: number, points = 12) {
  const arr = []
  for (let i = 0; i < points; i++) {
    const v = Math.sin(seed * 0.7 + i * 0.9) * 0.5 + 0.5
    arr.push({ v: Math.max(0.05, v + i * 0.04) })
  }
  return arr
}

export function StatsGrid({
  projectsCount,
  brandsCount,
  creditsUsedThisMonth,
  subscriptionStatus,
}: StatsGridProps) {
  const planLabel = PLAN_LABELS[subscriptionStatus] ?? subscriptionStatus

  const stats = [
    {
      label: "Carrosséis criados",
      value: projectsCount.toString(),
      delta: projectsCount > 0 ? "+12% vs mês anterior" : "Crie o primeiro",
      deltaUp: projectsCount > 0,
      icon: Sparkles,
      gradient: "from-purple-500/20 to-purple-600/5",
      iconBg: "bg-purple-500/15 border-purple-500/30",
      iconColor: "text-purple-300",
      sparkColor: "#A78BFA",
      sparkSeed: 7 + projectsCount,
    },
    {
      label: "Imagens este mês",
      value: creditsUsedThisMonth.toString(),
      delta: "Geradas pela IA",
      deltaUp: null,
      icon: ImageIcon,
      gradient: "from-fuchsia-500/20 to-fuchsia-600/5",
      iconBg: "bg-fuchsia-500/15 border-fuchsia-500/30",
      iconColor: "text-fuchsia-300",
      sparkColor: "#D946EF",
      sparkSeed: 13 + creditsUsedThisMonth,
    },
    {
      label: "Marcas ativas",
      value: brandsCount.toString(),
      delta: brandsCount === 0 ? "Cadastre uma" : brandsCount === 1 ? "marca" : "marcas",
      deltaUp: null,
      icon: Building2,
      gradient: "from-violet-500/20 to-violet-600/5",
      iconBg: "bg-violet-500/15 border-violet-500/30",
      iconColor: "text-violet-300",
      sparkColor: "#8B5CF6",
      sparkSeed: 23 + brandsCount,
    },
    {
      label: "Plano atual",
      value: planLabel,
      delta: subscriptionStatus === "trial" ? "Faça upgrade" : "ativo",
      deltaUp: subscriptionStatus !== "trial",
      icon: Crown,
      gradient: "from-pink-500/20 to-purple-700/5",
      iconBg: "bg-pink-500/15 border-pink-500/30",
      iconColor: "text-pink-300",
      sparkColor: "#EC4899",
      sparkSeed: 41,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  )
}

interface StatCardProps {
  stat: {
    label: string
    value: string
    delta: string
    deltaUp: boolean | null
    icon: typeof Sparkles
    gradient: string
    iconBg: string
    iconColor: string
    sparkColor: string
    sparkSeed: number
  }
  index: number
}

function StatCard({ stat, index }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 })

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    setTilt({
      x: (py - 0.5) * -8,
      y: (px - 0.5) * 8,
      gx: px * 100,
      gy: py * 100,
    })
  }
  function handleLeave() {
    setTilt({ x: 0, y: 0, gx: 50, gy: 50 })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
      }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} border border-border-subtle backdrop-blur-xl p-5 group hover:border-purple-600/50 hover:shadow-glow-sm`}
    >
      {/* Spotlight do mouse no card */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${tilt.gx}% ${tilt.gy}%, rgba(167,139,250,0.18), transparent 50%)`,
        }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${stat.iconBg}`}>
          <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <p className="relative text-xs text-text-secondary mb-1">{stat.label}</p>
      <p className="relative text-3xl font-display font-bold text-text-primary tabular-nums leading-none mb-2">
        {stat.value}
      </p>
      <p
        className={`relative text-xs ${
          stat.deltaUp === true ? "text-success" : "text-text-muted"
        }`}
      >
        {stat.delta}
      </p>

      <div className="absolute bottom-0 right-0 h-12 w-2/3 opacity-60 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData(stat.sparkSeed)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`sparkArea-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stat.sparkColor} stopOpacity={0.45} />
                <stop offset="100%" stopColor={stat.sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={stat.sparkColor}
              strokeWidth={1.5}
              fill={`url(#sparkArea-${index})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
