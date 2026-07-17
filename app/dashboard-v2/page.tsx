// ============================================================================
// Dashboard V2 — server component. Busca os dados reais (mesmas queries do
// dashboard atual) e entrega pro client renderizar o layout novo.
// ============================================================================

import { listActiveScheduledPosts } from "@/app/actions/scheduled-posts"
import { listCarouselsV2 } from "@/app/actions/carousel"
import { listSinglePosts } from "@/lib/single-posts/queries"
import {
  getProfile,
  listBrands,
  listAllProjects,
  getDashboardCounts,
} from "@/lib/data/queries"
import { getActiveBrandIdFromCookie } from "@/lib/active-brand"
import { getInitials } from "@/lib/brand-colors"
import { DashboardV2Client, type PostItem } from "./dashboard-client"

const PLAN_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Pro",
  past_due: "Atrasado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
}

export default async function DashboardV2Page() {
  const [{ user, profile }, brands, projects, carousels, singlePosts, counts, sched, activeBrandIdCookie] =
    await Promise.all([
      getProfile(),
      listBrands(),
      listAllProjects(),
      listCarouselsV2().catch(() => []),
      listSinglePosts().catch(() => []),
      getDashboardCounts(),
      listActiveScheduledPosts().catch(() => ({ posts: [] as { scheduled_date: string }[] })),
      getActiveBrandIdFromCookie(),
    ])

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Usuário"
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null

  const matchedActive =
    (activeBrandIdCookie && brands.find((b) => b.id === activeBrandIdCookie)) ||
    brands[0] ||
    null

  // Posts recentes de todas as fontes (mesma composição do dashboard atual)
  const posts: PostItem[] = [
    ...carousels.map((c) => ({
      id: c.id,
      title: c.title,
      href: `/dashboard/carrossel?id=${c.id}`,
      image: c.cover_url,
      brand: c.brand_name,
      kind: "Carrossel" as const,
      detail: `${c.slide_count} slides`,
      created_at: c.updated_at,
      // Preview navegável (mesmo motor dos cards de template)
      preview:
        c.cover && c.slides.length > 0
          ? {
              slides: c.slides,
              template: c.cover.template,
              editorialStyle: c.cover.editorialStyle,
              colors: c.cover.colors,
              handle: c.cover.handle,
              brandName: c.cover.brandName,
              format: c.cover.format,
            }
          : null,
    })),
    ...singlePosts.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/dashboard/posts-unicos/${p.id}`,
      image: p.rendered_image_url,
      brand: p.brand_name,
      kind: "Post" as const,
      detail: "copy + arte",
      created_at: p.created_at,
    })),
    ...projects.map((p) => ({
      id: p.id,
      title: p.title,
      href: `/dashboard/projetos/${p.id}`,
      image: null,
      brand: p.brand.name,
      kind: "Projeto" as const,
      detail: "projeto",
      created_at: p.created_at,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6)

  const periodLabelRaw = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date())
  const periodLabel = periodLabelRaw.charAt(0).toUpperCase() + periodLabelRaw.slice(1)

  return (
    <DashboardV2Client
      userName={displayName}
      userEmail={user.email ?? ""}
      userInitials={getInitials(displayName)}
      userAvatarUrl={avatarUrl}
      credits={profile?.credits ?? 0}
      planLabel={PLAN_LABEL[profile?.subscription_status ?? "trial"] ?? "Trial"}
      planCreditsMonthly={profile?.plan_credits_monthly ?? 0}
      creditsUsed={profile?.plan_credits_used_this_month ?? 0}
      brands={brands.map((b) => ({ id: b.id, name: b.name, logo_url: b.logo_url ?? null }))}
      activeBrand={
        matchedActive
          ? { id: matchedActive.id, name: matchedActive.name, logo_url: matchedActive.logo_url ?? null }
          : null
      }
      posts={posts}
      singleDates={singlePosts.map((p) => p.created_at)}
      carouselDates={carousels.map((c) => c.updated_at)}
      projectDates={projects.map((p) => p.created_at)}
      scheduledDates={(sched.posts ?? []).map((p) => p.scheduled_date)}
      brandsCount={counts.brandsCount}
      projectsCount={counts.projectsCount}
      slidesTotal={carousels.reduce((acc, c) => acc + (c.slide_count ?? 0), 0)}
      periodLabel={periodLabel}
    />
  )
}
