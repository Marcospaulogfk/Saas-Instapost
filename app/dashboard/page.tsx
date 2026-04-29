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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ola, {displayName}</h1>
        <p className="text-muted-foreground mt-1">
          {credits > 0
            ? `Voce tem ${credits} ${credits === 1 ? "imagem disponivel" : "imagens disponiveis"}. Bora criar conteudo viral?`
            : "Seus creditos acabaram. Faca upgrade pra continuar criando."}
        </p>
      </div>

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
