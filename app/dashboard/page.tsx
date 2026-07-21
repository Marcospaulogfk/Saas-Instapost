import { NovaHero } from "@/components/dashboard/nova/nova-hero"
import { NovaStats } from "@/components/dashboard/nova/nova-stats"
import { NovaPerformance, type PerfPoint } from "@/components/dashboard/nova/nova-performance"
import { NovaDistribution, type DistSlice } from "@/components/dashboard/nova/nova-distribution"
import { NovaRecent, type NovaRecentItem } from "@/components/dashboard/nova/nova-recent"
import {
  NovaQuickActions,
  NovaUpgradeCard,
} from "@/components/dashboard/nova/nova-side-widgets"
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

/** Chave YYYY-MM-DD (local) de uma data. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Conta ocorrências por dia numa janela de N dias terminando hoje. */
function bucketByDay(dates: string[], days: number): number[] {
  const counts = new Map<string, number>()
  for (const iso of dates) {
    if (!iso) continue
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) continue
    const k = dayKey(d)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const out: number[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(counts.get(dayKey(d)) ?? 0)
  }
  return out
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

  const scheduledPosts = (sched.posts ?? []) as { scheduled_date: string }[]

  // Fontes com datas normalizadas
  const carouselDates = carousels.map((c) => c.updated_at)
  const postDates = singlePosts.map((p) => p.created_at)
  const projectDates = projects.map((p) => p.created_at)
  const brandDates = brands.map((b) => b.created_at)
  const allContentDates = [...carouselDates, ...postDates, ...projectDates]
  const scheduledDates = scheduledPosts.map((p) => `${p.scheduled_date}T12:00:00`)

  // Recentes (todas as fontes)
  const recentItems: NovaRecentItem[] = [
    ...carousels.map((c) => ({
      id: c.id,
      title: c.title,
      href: `/dashboard/carrossel?id=${c.id}`,
      image: c.cover_url ?? null,
      cover: c.cover,
      slides: c.slides,
      brand: c.brand_name ?? null,
      created_at: c.updated_at,
      kind: "Carrossel" as const,
    })),
    ...singlePosts.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/dashboard/posts-unicos/${p.id}`,
      image: p.rendered_image_url ?? null,
      brand: p.brand_name ?? null,
      created_at: p.created_at,
      kind: "Post" as const,
    })),
    ...projects.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/dashboard/projetos/${p.id}`,
      image: null,
      brand: p.brand.name ?? null,
      created_at: p.created_at,
      kind: "Projeto" as const,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)

  // Perfil / saudação
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name.split(/\s+/)[0]) ||
    (typeof meta.name === "string" && meta.name.split(/\s+/)[0]) ||
    user.email?.split("@")[0] ||
    "você"
  const isPro = profile?.subscription_status === "active"

  // Stats
  const totalContent = allContentDates.length
  const carouselCount = carousels.length
  const spark = {
    total: bucketByDay(allContentDates, 7),
    carousel: bucketByDay(carouselDates, 7),
    brands: bucketByDay(brandDates, 7),
    scheduled: bucketByDay(scheduledDates, 7),
  }

  // Performance (28 dias)
  const criadosSeries = bucketByDay(allContentDates, 28)
  const agendadosSeries = bucketByDay(scheduledDates, 28)
  const today0 = new Date()
  today0.setHours(0, 0, 0, 0)
  const perfData: PerfPoint[] = criadosSeries.map((criados, idx) => {
    const d = new Date(today0)
    d.setDate(today0.getDate() - (27 - idx))
    return {
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      criados,
      agendados: agendadosSeries[idx] ?? 0,
    }
  })

  // Distribuição por tipo
  const distSlices: DistSlice[] = [
    { name: "Carrosséis", value: carousels.length, color: "#8b5cf6" },
    { name: "Posts únicos", value: singlePosts.length, color: "#3b82f6" },
    { name: "Projetos", value: projects.length, color: "#f59e0b" },
    { name: "Agendados", value: scheduledPosts.length, color: "#22c55e" },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-5 md:px-8 py-6 md:py-8 space-y-5">
      {/* Linha 1: hero + ações rápidas com a MESMA altura (grid items-stretch) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-stretch">
        <NovaHero greeting={getGreeting()} name={displayName} />
        <NovaQuickActions />
      </div>

      {/* Métricas: 4 stat cards + Distribuição de conteúdo */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-stretch">
        <NovaStats
          totalContent={totalContent}
          carouselCount={carouselCount}
          brandsCount={counts.brandsCount}
          scheduledCount={scheduledPosts.length}
          spark={spark}
        />
        <NovaDistribution slices={distSlices} />
      </div>

      {/* Projetos recentes */}
      <NovaRecent items={recentItems} />

      {/* Performance + Upgrade */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <NovaPerformance data={perfData} />
        <NovaUpgradeCard isPro={isPro} />
      </div>
    </div>
  )
}
