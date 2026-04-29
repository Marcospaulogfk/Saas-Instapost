import { Sparkles, Image as ImageIcon, Building2, Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

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

  const stats = [
    {
      label: "Carrosseis criados",
      value: projectsCount.toString(),
      subtext: projectsCount === 0 ? "Crie seu primeiro" : "no total",
      icon: Sparkles,
      iconColor: "text-primary",
    },
    {
      label: "Imagens geradas",
      value: creditsUsedThisMonth.toString(),
      subtext: "este mes",
      icon: ImageIcon,
      iconColor: "text-muted-foreground",
    },
    {
      label: "Marcas ativas",
      value: brandsCount.toString(),
      subtext:
        brandsCount === 0
          ? "Cadastre uma marca"
          : brandsCount === 1
            ? "marca"
            : "marcas",
      icon: Building2,
      iconColor: "text-muted-foreground",
    },
    {
      label: "Plano atual",
      value: planLabel,
      subtext: subscriptionStatus === "trial" ? "Faca upgrade" : "ativo",
      icon: Crown,
      iconColor: "text-primary",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="bg-card border-border hover:border-primary/30 transition-colors"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.subtext}
                </p>
              </div>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
