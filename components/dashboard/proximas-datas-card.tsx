import Link from "next/link"
import { Calendar } from "lucide-react"
import { getProximasDatas, categoriaColorClass } from "@/lib/datas-comemorativas"

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

export function ProximasDatasCard() {
  const datas = getProximasDatas(new Date(), 5)

  return (
    <div className="rounded-xl bg-gradient-card border border-border-subtle p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-text-primary">Próximas Datas</h3>
      </div>
      <p className="text-[11px] text-text-muted mb-4">Não perca nenhuma</p>

      {datas.length === 0 ? (
        <p className="text-xs text-text-muted py-4 text-center">
          Nenhuma data próxima
        </p>
      ) : (
        <ul className="space-y-2.5">
          {datas.map((d) => {
            const dayLabel = d.daysAway === 0 ? "hoje" : d.daysAway === 1 ? "amanhã" : `em ${d.daysAway}d`
            return (
              <li key={`${d.id}-${d.date.toISOString()}`} className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-background-tertiary/60 border border-border-subtle flex-shrink-0">
                  <span className="text-[10px] uppercase text-text-muted leading-none">
                    {MESES[d.mes - 1]}
                  </span>
                  <span className="text-sm font-bold text-text-primary leading-none mt-0.5">
                    {d.dia}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {d.nome}
                  </p>
                  <p
                    className={`text-[10px] font-medium ${categoriaColorClass(d.categoria)}`}
                  >
                    {dayLabel}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Link
        href="/dashboard/calendario"
        className="block text-[11px] text-purple-400 hover:text-purple-300 font-medium mt-4 pt-3 border-t border-border-subtle"
      >
        Ver calendário completo →
      </Link>
    </div>
  )
}
