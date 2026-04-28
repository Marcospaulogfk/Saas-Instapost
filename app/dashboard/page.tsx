"use client"

import { StatsGrid } from "@/components/dashboard/stats-grid"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { BrandsSection } from "@/components/dashboard/brands-section"
import { PopularTemplates } from "@/components/dashboard/popular-templates"

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold">Ola, Marcos</h1>
        <p className="text-muted-foreground mt-1">
          Voce tem 47 imagens disponiveis este mes. Bora criar conteudo viral?
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Quick Action */}
      <QuickActionCard />

      {/* Recent Projects */}
      <RecentProjects />

      {/* Brands */}
      <BrandsSection />

      {/* Popular Templates */}
      <PopularTemplates />
    </div>
  )
}
