import { Sparkles, Image as ImageIcon, Building2, Crown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

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
      label: "Carrosséis",
      value: projectsCount.toString(),
      delta: projectsCount > 0 ? "criados até agora" : "crie o primeiro",
      icon: Sparkles,
    },
    {
      label: "Imagens / mês",
      value: creditsUsedThisMonth.toString(),
      delta: "geradas pela IA",
      icon: ImageIcon,
    },
    {
      label: "Marcas",
      value: brandsCount.toString(),
      delta: brandsCount === 1 ? "ativa" : "ativas",
      icon: Building2,
    },
    {
      label: "Plano",
      value: planLabel,
      delta: isActivePlan ? "assinatura ativa" : "faça upgrade",
      icon: Crown,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string
  value: string
  delta: string
  icon: LucideIcon
}) {
  return (
    <div className="group card-black card-black-hover p-5">
      <div className="flex items-start justify-between mb-6">
        <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-text-muted">
          {label}
        </span>
        <span className="w-8 h-8 rounded-lg bg-brand-600/10 text-brand-300 flex items-center justify-center transition-colors group-hover:bg-brand-600/18">
          <Icon className="w-4 h-4" strokeWidth={1.8} />
        </span>
      </div>
      <p className="text-[32px] font-semibold text-text-primary tabular-nums leading-none tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-[11.5px] text-text-muted">{delta}</p>
    </div>
  )
}
