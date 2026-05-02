import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopBar } from "@/components/dashboard/top-bar"
import { getProfile, listBrands } from "@/lib/data/queries"
import { getInitials } from "@/lib/brand-colors"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [{ user, profile }, brands] = await Promise.all([
    getProfile(),
    listBrands(),
  ])

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Usuario"
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null

  const activeBrand = brands[0]
    ? { id: brands[0].id, name: brands[0].name }
    : null

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-bg-fade opacity-20 pointer-events-none" />
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
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
