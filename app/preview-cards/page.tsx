/** PREVIEW ISOLADO — só os cards da home, sem sidebar/topbar (pra screenshot). */
import "../dashboard/dashboard.css"
import { CreateLauncher } from "@/components/dashboard/create-launcher"
import { WeekPlan } from "@/components/dashboard/week-plan"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import type { ScheduledPost } from "@/lib/planejar"

const mk = (
  id: string,
  title: string,
  date: string,
  time: string | null,
  status: ScheduledPost["status"],
  format: ScheduledPost["format"] = "carrossel",
): ScheduledPost => ({
  id, brand_id: "b1", title, description: null, format, objective: "engage",
  scheduled_date: date, scheduled_time: time, status, source: "manual",
  project_id: null, created_at: "2026-07-14",
})

const MOCK_WEEK: ScheduledPost[] = [
  mk("1", "Quebra do mito: cultura é gasto", "2026-07-14", "09:00", "agendado"),
  mk("2", "Bastidores do projeto novo", "2026-07-15", "18:30", "pronto", "post"),
  mk("3", "Case: antes e depois", "2026-07-16", null, "em_criacao"),
  mk("4", "Checklist salvável", "2026-07-18", "12:00", "ideia"),
]

export default function PreviewCardsPage() {
  return (
    <div className="dashboard-root dark min-h-screen bg-background">
      <div className="max-w-[1180px] mx-auto px-10 py-12 space-y-8">
        <header className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            840 créditos <span className="text-text-subtle">·</span> plano Pro
          </div>
          <h1 className="text-[38px] font-display font-semibold leading-[1.05] tracking-tight text-text-primary">
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

        <StatsGrid projectsCount={24} brandsCount={3} creditsUsedThisMonth={160} subscriptionStatus="active" />
      </div>
    </div>
  )
}
