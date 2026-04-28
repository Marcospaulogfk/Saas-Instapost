"use client"

import { Sparkles, Image, Building2, Crown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    label: "Carrosseis criados",
    value: "23",
    trend: "+12% vs. mes anterior",
    trendUp: true,
    icon: Sparkles,
    iconColor: "text-primary",
  },
  {
    label: "Imagens geradas",
    value: "162",
    subtext: "este mes",
    icon: Image,
    iconColor: "text-muted-foreground",
  },
  {
    label: "Marcas ativas",
    value: "3",
    subtext: "de 5 disponiveis",
    icon: Building2,
    iconColor: "text-muted-foreground",
  },
  {
    label: "Plano atual",
    value: "Pro",
    subtext: "Renova em 12 dias",
    icon: Crown,
    iconColor: "text-primary",
  },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 tabular-nums">{stat.value}</p>
                {stat.trend && (
                  <p className={`text-sm mt-1 flex items-center gap-1 ${stat.trendUp ? "text-green-500" : "text-red-500"}`}>
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </p>
                )}
                {stat.subtext && (
                  <p className="text-sm text-muted-foreground mt-1">{stat.subtext}</p>
                )}
              </div>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
