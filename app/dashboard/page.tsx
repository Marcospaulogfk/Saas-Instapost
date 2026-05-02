import { StatsGrid } from "@/components/dashboard/stats-grid"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { BrandsSection } from "@/components/dashboard/brands-section"
import { PopularTemplates } from "@/components/dashboard/popular-templates"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import {
  getProfile,
  listBrands,
  listRecentProjects,
  getDashboardCounts,
} from "@/lib/data/queries"

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

  return (
    <div className="relative p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Background ambient */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-fuchsia-600/8 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <header className="space-y-1">
        <h1 className="text-h1 font-display font-bold text-text-primary">
          Olá, <span className="gradient-text">{displayName}</span> 👋
        </h1>
        <p className="text-text-secondary">
          {credits > 0
            ? `Você tem ${credits} ${credits === 1 ? "imagem disponível" : "imagens disponíveis"}. Bora criar conteúdo viral?`
            : "Seus créditos acabaram. Faça upgrade pra continuar criando."}
        </p>
      </header>

      <QuickActionCard />

      <StatsGrid
        projectsCount={counts.projectsCount}
        brandsCount={counts.brandsCount}
        creditsUsedThisMonth={creditsUsed}
        subscriptionStatus={profile?.subscription_status ?? "trial"}
      />

      <ActivityChart projectsCount={counts.projectsCount} creditsUsedThisMonth={creditsUsed} />

      <RecentProjects projects={projects} />

      <BrandsSection
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          project_count: b.project_count,
        }))}
      />

      <PopularTemplates />
    </div>
  )
}
