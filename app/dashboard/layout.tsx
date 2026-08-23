import { redirect } from "next/navigation"
import { NovaSidebar } from "@/components/dashboard/nova/nova-sidebar"
import { NovaTopBar } from "@/components/dashboard/nova/nova-topbar"
import { AssistenteBolha } from "@/components/dashboard/assistente-bolha"
import { IndicacaoBanner } from "@/components/dashboard/indicacao-banner"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { getProfile, listBrands } from "@/lib/data/queries"
import { getInitials } from "@/lib/brand-colors"
import { getActiveBrandIdFromCookie } from "@/lib/active-brand"
import "./dashboard.css"
import "./nova.css"

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
    // Layout-CARTÃO (padrão EverReply): o canvas tem gutter (p-2) e a sidebar
    // flutua como painel arredondado, em vez de colar na borda com border-right.
    // `isolate`: o root vira contexto de empilhamento próprio, então o fundo em
    // z-0 e o conteúdo em z-10 se resolvem AQUI dentro e nada do resto da
    // página pode se meter no meio.
    <div className="dashboard-root nova-root dark relative isolate flex h-screen gap-2 overflow-hidden p-2">
      <NovaSidebar activeBrand={activeBrand} brands={sidebarBrands} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Faixa de indicação — primeira coisa da coluna, acima do header. */}
        <IndicacaoBanner />
        <NovaTopBar
          userName={displayName}
          userEmail={user.email ?? ""}
          userInitials={getInitials(displayName)}
          userAvatarUrl={avatarUrl}
          credits={profile?.credits ?? 0}
          planCreditsMonthly={profile?.plan_credits_monthly ?? 0}
          creditsUsedThisMonth={profile?.plan_credits_used_this_month ?? 0}
          topupCredits={profile?.topup_credits ?? 0}
          referralCredits={profile?.referral_credits ?? 0}
          subscriptionStatus={profile?.subscription_status ?? "trial"}
          planId={profile?.plan_id ?? null}
          mobileNav={
            <MobileNav
              activeBrandName={activeBrand?.name ?? null}
              activeBrandId={activeBrand?.id ?? null}
              activeBrandLogoUrl={activeBrand?.logo_url ?? null}
            />
          }
        />
        <main className="nova-scroll flex-1 overflow-y-auto">{children}</main>
      </div>
      {/* Assistente em todas as telas do dashboard — o contexto de marca vem
          do servidor a cada request, entao a bolha nao precisa de props. */}
      <AssistenteBolha marcaAtiva={activeBrand?.name ?? null} />
    </div>
  )
}
