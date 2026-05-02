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

// Sparkline determinístico — sem mismatch SSR/client
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
  const isActivePlan = subscriptionStatus === "active"

  const stats = [
    {
      label: "Carrosséis criados",
      value: projectsCount.toString(),
      delta: projectsCount > 0 ? "+12% vs mês anterior" : "Crie o primeiro",
      deltaUp: projectsCount > 0,
      icon: Sparkles,
      sparkColor: "#A78BFA",
      sparkSeed: 7 + projectsCount,
      accent: "purple" as const,
    },
    {
      label: "Imagens este mês",
      value: creditsUsedThisMonth.toString(),
      delta: "Geradas pela IA",
      deltaUp: null,
      icon: ImageIcon,
      sparkColor: "#8B5CF6",
      sparkSeed: 13 + creditsUsedThisMonth,
      accent: "purple" as const,
    },
    {
      label: "Marcas ativas",
      value: brandsCount.toString(),
      delta: brandsCount === 0 ? "Cadastre uma" : brandsCount === 1 ? "marca" : "marcas",
      deltaUp: null,
      icon: Building2,
      sparkColor: "#A78BFA",
      sparkSeed: 23 + brandsCount,
      accent: "purple" as const,
    },
    {
      label: "Plano atual",
      value: planLabel,
      delta: isActivePlan ? "Ativo" : "Faça upgrade",
      deltaUp: isActivePlan,
      icon: Crown,
      sparkColor: isActivePlan ? "#D1FE17" : "#A78BFA",
      sparkSeed: 41,
      accent: (isActivePlan ? "lime" : "purple") as "lime" | "purple",
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
    sparkColor: string
    sparkSeed: number
    accent: "purple" | "lime"
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

  const isLime = stat.accent === "lime"
  const iconBg = isLime
    ? "bg-[rgba(209,254,23,0.12)] border-[rgba(209,254,23,0.4)]"
    : "bg-purple-500/10 border-purple-500/30"
  const iconColor = isLime ? "text-lime" : "text-purple-300"
  const hoverBorder = isLime ? "hover:border-[rgba(209,254,23,0.4)]" : "hover:border-purple-600/50"
  const hoverShadow = isLime ? "hover:glow-lime" : "hover:shadow-glow-sm"
  const spotlightColor = isLime ? "rgba(209,254,23,0.18)" : "rgba(167,139,250,0.18)"

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
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-background-secondary/90 to-background-tertiary/40 border border-border-subtle backdrop-blur-xl p-5 group ${hoverBorder} ${hoverShadow}`}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${tilt.gx}% ${tilt.gy}%, ${spotlightColor}, transparent 50%)`,
        }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${iconBg}`}>
          <stat.icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <p className="relative text-xs text-text-secondary mb-1">{stat.label}</p>
      <p className="relative text-3xl font-display font-bold text-text-primary tabular-nums leading-none mb-2">
        {stat.value}
      </p>
      <p
        className={`relative text-xs ${
          stat.deltaUp === true
            ? isLime
              ? "text-lime"
              : "text-success"
            : "text-text-muted"
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
