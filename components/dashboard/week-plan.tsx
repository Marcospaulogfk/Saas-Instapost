import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
import { statusColor, type ScheduledPost } from "@/lib/planejar"

/**
 * "Esta semana" — posts planejados dos próximos 7 dias da marca ativa.
 * Um card único; itens separados por RESPIRO (sem divisórias tipo caderno),
 * cada um com um bloco de data à esquerda.
 */
const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

export function WeekPlan({ posts }: { posts: ScheduledPost[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
          Esta semana
        </h2>
        <Link
          href="/dashboard/calendario"
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
        >
          Calendário
        </Link>
      </div>

      <div className="card-black p-2">
        {posts.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-brand-600/12 text-brand-300 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <p className="text-[12.5px] text-text-muted mb-3 leading-relaxed">
              Nada planejado pros
              <br />
              próximos 7 dias.
            </p>
            <Link
              href="/dashboard/calendario"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-300 hover:text-brand-200 transition-colors"
            >
              Planejar a semana
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {posts.slice(0, 6).map((p) => {
              const d = new Date(p.scheduled_date + "T00:00:00")
              return (
                <li key={p.id}>
                  <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.03]">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/[0.05] flex-shrink-0">
                      <span className="text-[8.5px] font-mono text-text-subtle leading-none">
                        {DIAS[d.getDay()]}
                      </span>
                      <span className="text-[15px] font-semibold text-text-primary leading-none mt-0.5 tabular-nums">
                        {String(d.getDate()).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-text-primary truncate leading-tight">
                        {p.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusColor(p.status)}`}
                        />
                        <span className="text-[10.5px] text-text-muted">
                          {p.scheduled_time
                            ? p.scheduled_time.slice(0, 5)
                            : "sem horário"}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
