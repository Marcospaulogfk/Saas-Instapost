import { StatsGrid } from "@/components/dashboard/stats-grid"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { BrandsSection } from "@/components/dashboard/brands-section"
import { PopularTemplates } from "@/components/dashboard/popular-templates"
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

  return (
    <div className="relative p-8 space-y-8 max-w-7xl">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

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

      <StatsGrid
        projectsCount={counts.projectsCount}
        brandsCount={counts.brandsCount}
        creditsUsedThisMonth={profile?.plan_credits_used_this_month ?? 0}
        subscriptionStatus={profile?.subscription_status ?? "trial"}
      />

      <QuickActionCard />

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
