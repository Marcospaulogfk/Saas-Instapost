import { Sparkles } from "lucide-react"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { BrandsSection } from "@/components/dashboard/brands-section"
import { PopularTemplates } from "@/components/dashboard/popular-templates"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { ProximasDatasCard } from "@/components/dashboard/proximas-datas-card"
import {
  getProfile,
  listBrands,
  listRecentProjects,
  getDashboardCounts,
} from "@/lib/data/queries"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return "Boa noite"
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export default async function DashboardPage() {
  const [{ user, profile }, brands, projects, counts] = await Promise.all([
    getProfile(),
    listBrands(),
    listRecentProjects(6),
    getDashboardCounts(),
  ])

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name.split(/\s+/)[0]) ||
    (typeof meta.name === "string" && meta.name.split(/\s+/)[0]) ||
    user.email?.split("@")[0] ||
    "voce"
  const credits = profile?.credits ?? 0
  const creditsUsed = profile?.plan_credits_used_this_month ?? 0
  const greeting = getGreeting()

  return (
    <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 py-8 md:py-10 space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-[34px] md:text-[44px] font-display font-bold leading-[1.05] tracking-tight text-text-primary">
            {greeting},{" "}
            <span className="gradient-text">{displayName}</span>.
          </h1>
          <p className="text-text-secondary">
            {credits > 0
              ? "Tudo pronto pra criar o próximo carrossel."
              : "Seus créditos acabaram. Faça upgrade pra continuar criando."}
          </p>
        </div>
      </header>

      {/* Bloco principal: hero + atividade à esquerda, próximas datas no trilho */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          <QuickActionCard />
          <ActivityChart
            projectsCount={counts.projectsCount}
            creditsUsedThisMonth={creditsUsed}
          />
        </div>
        <ProximasDatasCard />
      </div>

      <StatsGrid
        projectsCount={counts.projectsCount}
        brandsCount={counts.brandsCount}
        creditsUsedThisMonth={creditsUsed}
        subscriptionStatus={profile?.subscription_status ?? "trial"}
      />

      <PopularTemplates />

      <RecentProjects projects={projects} />

      <BrandsSection
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          project_count: b.project_count,
        }))}
      />
    </div>
  )
}
