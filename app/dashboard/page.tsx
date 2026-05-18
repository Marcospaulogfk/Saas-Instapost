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
    <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 py-8 md:py-12 space-y-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">
            <span className="inline-block w-6 h-px bg-brand-600" />
            Dashboard
          </div>
          <h1 className="text-[40px] md:text-[52px] font-display font-bold leading-[1.05] tracking-tight text-text-primary">
            {greeting},{" "}
            <span className="gradient-text">{displayName}</span>.
          </h1>
          <p className="text-text-secondary max-w-xl">
            {credits > 0
              ? "Tudo pronto pra criar o próximo carrossel."
              : "Seus créditos acabaram. Faça upgrade pra continuar criando."}
          </p>
        </div>

        {credits > 0 && (
          <div className="inline-flex items-center gap-2.5 rounded-full border border-border-medium bg-background-secondary/60 backdrop-blur-md px-4 py-2.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span className="text-sm text-text-primary tabular-nums font-semibold">
              {credits}
            </span>
            <span className="text-xs text-text-muted">
              {credits === 1 ? "imagem disponível" : "imagens disponíveis"}
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          <QuickActionCard />
          <PopularTemplates />
        </div>
        <ProximasDatasCard />
      </div>

      <ActivityChart
        projectsCount={counts.projectsCount}
        creditsUsedThisMonth={creditsUsed}
      />

      <StatsGrid
        projectsCount={counts.projectsCount}
        brandsCount={counts.brandsCount}
        creditsUsedThisMonth={creditsUsed}
        subscriptionStatus={profile?.subscription_status ?? "trial"}
      />

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
