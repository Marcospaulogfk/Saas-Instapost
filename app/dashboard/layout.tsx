import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopBar } from "@/components/dashboard/top-bar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { DashboardAmbient } from "@/components/dashboard/dashboard-ambient"
import { getProfile, listBrands } from "@/lib/data/queries"
import { getInitials } from "@/lib/brand-colors"
import { getActiveBrandIdFromCookie } from "@/lib/active-brand"
import "./dashboard.css"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [{ user, profile }, brands, activeBrandIdCookie] = await Promise.all([
    getProfile(),
    listBrands(),
    getActiveBrandIdFromCookie(),
  ])

  // Primeiro acesso (sem marca cadastrada) cai obrigatoriamente no onboarding.
  if (brands.length === 0) redirect("/onboarding")

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Usuario"
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null

  const matchedActive =
    (activeBrandIdCookie && brands.find((b) => b.id === activeBrandIdCookie)) ||
    brands[0] ||
    null

  const activeBrand = matchedActive
    ? {
        id: matchedActive.id,
        name: matchedActive.name,
        logo_url: matchedActive.logo_url ?? null,
      }
    : null

  const sidebarBrands = brands.map((b) => ({
    id: b.id,
    name: b.name,
    logo_url: b.logo_url ?? null,
  }))

  return (
    <div className="dashboard-root dark flex h-screen bg-background relative overflow-hidden">
      <DashboardAmbient />
      <DashboardSidebar
        userName={displayName}
        userEmail={user.email ?? ""}
        userInitials={getInitials(displayName)}
        userAvatarUrl={avatarUrl}
        credits={profile?.credits ?? 0}
        subscriptionStatus={profile?.subscription_status ?? "trial"}
        planCreditsMonthly={profile?.plan_credits_monthly ?? 0}
        creditsUsedThisMonth={profile?.plan_credits_used_this_month ?? 0}
        activeBrand={activeBrand}
        brands={sidebarBrands}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopBar
          mobileNav={
            <MobileNav
              activeBrandName={activeBrand?.name ?? null}
              activeBrandId={activeBrand?.id ?? null}
              activeBrandLogoUrl={activeBrand?.logo_url ?? null}
            />
          }
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
