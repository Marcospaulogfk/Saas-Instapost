/**
 * PREVIEW SEM LOGIN — harness visual do dashboard pra iterar design.
 * Renderiza o shell real (sidebar + topbar) + a home redesenhada com dados MOCK.
 * NÃO é rota de produto; serve só pra visualizar/ajustar o design system.
 */
import "../dashboard/dashboard.css"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopBar } from "@/components/dashboard/top-bar"
import { CreateLauncher } from "@/components/dashboard/create-launcher"
import { WeekPlan } from "@/components/dashboard/week-plan"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import type { ScheduledPost } from "@/lib/planejar"

const MOCK_BRANDS = [
  { id: "b1", name: "Culturize-se", logo_url: null },
  { id: "b2", name: "Studio Fit", logo_url: null },
  { id: "b3", name: "Prime Invest", logo_url: null },
]

const mk = (
  id: string,
  title: string,
  date: string,
  time: string | null,
  status: ScheduledPost["status"],
  format: ScheduledPost["format"] = "carrossel",
): ScheduledPost => ({
  id,
  brand_id: "b1",
  title,
  description: null,
  format,
  objective: "engage",
  scheduled_date: date,
  scheduled_time: time,
  status,
  source: "manual",
  project_id: null,
  created_at: "2026-07-14",
})

const MOCK_WEEK: ScheduledPost[] = [
  mk("1", "Quebra do mito: cultura é gasto", "2026-07-14", "09:00", "agendado"),
  mk("2", "Bastidores do projeto novo", "2026-07-15", "18:30", "pronto", "post"),
  mk("3", "Case: antes e depois", "2026-07-16", null, "em_criacao"),
  mk("4", "Checklist salvável", "2026-07-18", "12:00", "ideia", "carrossel"),
]

export default function PreviewDashboardPage() {
  return (
    <div className="dashboard-root dark flex h-screen bg-background relative overflow-hidden">
      <DashboardSidebar
        userName="Marcos Paulo"
        userEmail="marcos@websync.com.br"
        userInitials="MP"
        userAvatarUrl={null}
        credits={840}
        subscriptionStatus="active"
        planCreditsMonthly={1000}
        creditsUsedThisMonth={160}
        activeBrand={MOCK_BRANDS[0]}
        brands={MOCK_BRANDS}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="relative max-w-[1180px] mx-auto px-6 md:px-10 py-8 md:py-10 space-y-8">
            <header className="space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                840 créditos
                <span className="text-text-subtle">·</span>
                plano Pro
              </div>
              <h1 className="text-[30px] md:text-[38px] font-display font-semibold leading-[1.05] tracking-tight text-text-primary">
                Bom dia, Marcos.
              </h1>
              <p className="text-[14px] text-text-secondary">
                Escolha um formato e comece — a IA cuida do roteiro, das imagens e do design.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
              <CreateLauncher />
              <WeekPlan posts={MOCK_WEEK} />
            </div>

            <StatsGrid
              projectsCount={24}
              brandsCount={3}
              creditsUsedThisMonth={160}
              subscriptionStatus="active"
            />
          </div>
        </main>
      </div>
    </div>
  )
}
