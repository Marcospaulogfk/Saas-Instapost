import { StatsGrid } from "@/components/dashboard/stats-grid"
import { CreateLauncher } from "@/components/dashboard/create-launcher"
import { WeekPlan } from "@/components/dashboard/week-plan"
import { RecentProjects, type RecentItem } from "@/components/dashboard/recent-projects"
import { BrandsSection } from "@/components/dashboard/brands-section"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { listActiveScheduledPosts } from "@/app/actions/scheduled-posts"
import { listCarouselsV2 } from "@/app/actions/carousel"
import { listSinglePosts } from "@/lib/single-posts/queries"
import {
  getProfile,
  listBrands,
  listAllProjects,
  getDashboardCounts,
} from "@/lib/data/queries"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return "Boa noite"
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

const PLAN_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Pro",
  past_due: "Atrasado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
}

export default async function DashboardPage() {
  const [{ user, profile }, brands, projects, carousels, singlePosts, counts, sched] =
    await Promise.all([
      getProfile(),
      listBrands(),
      listAllProjects(),
      listCarouselsV2().catch(() => []),
      listSinglePosts().catch(() => []),
      getDashboardCounts(),
      listActiveScheduledPosts().catch(() => ({ posts: [] as never[] })),
    ])

  // Recentes = TODAS as fontes (carrossel + post + projeto legado), ordenadas
  // por data. Antes o dashboard só lia `projects`, por isso ficava vazio.
  const recentItems: RecentItem[] = [
    ...carousels.map((c) => ({
      id: c.id,
      title: c.title,
      href: `/dashboard/carrossel?id=${c.id}`,
      image: c.cover_url,
      cover: c.cover,
      brand: c.brand_name,
      created_at: c.updated_at,
      kind: "Carrossel" as const,
      slideCount: c.slide_count,
    })),
    ...singlePosts.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/dashboard/posts-unicos/${p.id}`,
      image: p.rendered_image_url,
      brand: p.brand_name,
      created_at: p.created_at,
      kind: "Post" as const,
    })),
    ...projects.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/dashboard/projetos/${p.id}`,
      image: null,
      brand: p.brand.name,
      created_at: p.created_at,
      kind: "Projeto" as const,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8)

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name.split(/\s+/)[0]) ||
    (typeof meta.name === "string" && meta.name.split(/\s+/)[0]) ||
    user.email?.split("@")[0] ||
    "voce"
  const credits = profile?.credits ?? 0
  const creditsUsed = profile?.plan_credits_used_this_month ?? 0
  const greeting = getGreeting()
  const planLabel = PLAN_LABEL[profile?.subscription_status ?? "trial"] ?? "Trial"

  // Planejados dos próximos 7 dias (a partir de hoje).
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const weekPosts = (sched.posts ?? []).filter((p) => {
    const d = new Date(p.scheduled_date + "T00:00:00")
    return d >= start && d <= end
  })

  return (
    <div className="relative max-w-[1180px] mx-auto px-6 md:px-10 py-8 md:py-10 space-y-8">
      {/* Header — linha de sistema mono + saudação sóbria (Linear) */}
      <header className="space-y-2.5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          {credits} créditos
          <span className="text-text-subtle">·</span>
          plano {planLabel}
        </div>
        <h1 className="text-[30px] md:text-[38px] font-display font-semibold leading-[1.05] tracking-tight text-text-primary">
          {greeting}, {displayName}.
        </h1>
        <p className="text-[14px] text-text-secondary">
          {credits > 0
            ? "Escolha um formato e comece — a IA cuida do roteiro, das imagens e do design."
            : "Seus créditos acabaram. Faça upgrade pra continuar criando."}
        </p>
      </header>

      {/* Lançador de criação + planejados da semana */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        <CreateLauncher />
        <WeekPlan posts={weekPosts} />
      </div>

      <StatsGrid
        projectsCount={counts.projectsCount}
        brandsCount={counts.brandsCount}
        creditsUsedThisMonth={creditsUsed}
        subscriptionStatus={profile?.subscription_status ?? "trial"}
      />

      <ActivityChart
        projectsCount={counts.projectsCount}
        creditsUsedThisMonth={creditsUsed}
      />

      <RecentProjects items={recentItems} />

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
