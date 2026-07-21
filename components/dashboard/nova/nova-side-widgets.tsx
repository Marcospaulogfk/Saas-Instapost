"use client"

import Link from "next/link"
import { PenLine, Layers, LayoutTemplate, CalendarPlus, ChevronRight, Crown, Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/* ---------------- Quick Actions ---------------- */

const ACTIONS: { label: string; sub: string; href: string; icon: LucideIcon; tile: string }[] = [
  { label: "Criar post único", sub: "Imagem + legenda com IA", href: "/dashboard/criar/post-unico", icon: PenLine, tile: "nv-tile-purple" },
  { label: "Criar carrossel", sub: "Editorial de vários slides", href: "/dashboard/criar/editorial", icon: Layers, tile: "nv-tile-blue" },
  { label: "Explorar templates", sub: "Modelos prontos pra editar", href: "/dashboard/templates", icon: LayoutTemplate, tile: "nv-tile-orange" },
  { label: "Planejar com IA", sub: "Calendário de conteúdo", href: "/dashboard/planejar", icon: CalendarPlus, tile: "nv-tile-green" },
]

export function NovaQuickActions() {
  return (
    <div className="nv-card nv-fade p-5 h-full flex flex-col">
      <h2 className="text-[15px] font-semibold mb-3.5" style={{ color: "var(--nv-text)" }}>
        Ações rápidas
      </h2>
      <div className="flex-1 flex flex-col justify-between gap-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="nv-card-hover flex items-center gap-3 p-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--nv-border)" }}
          >
            <span className={`nv-tile ${a.tile} w-9 h-9 shrink-0`}>
              <a.icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium" style={{ color: "var(--nv-text)" }}>
                {a.label}
              </p>
              <p className="text-[11px] truncate" style={{ color: "var(--nv-text-subtle)" }}>
                {a.sub}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--nv-text-subtle)" }} />
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Calendário ---------------- */

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function NovaCalendar({
  year,
  month,
  today,
  scheduledDays,
}: {
  year: number
  month: number // 0-11
  today: number | null // dia do mês se for o mês atual
  scheduledDays: number[]
}) {
  const first = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const scheduled = new Set(scheduledDays)

  const cells: (number | null)[] = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--nv-text)" }}>
          Calendário
        </h2>
        <span className="text-[12px]" style={{ color: "var(--nv-text-muted)" }}>
          {MONTHS[month]} {year}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[10px] font-medium" style={{ color: "var(--nv-text-subtle)" }}>
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />
          const isToday = d === today
          const isScheduled = scheduled.has(d)
          return (
            <div
              key={i}
              className="relative aspect-square flex items-center justify-center text-[12px] rounded-lg tabular-nums"
              style={{
                background: isToday ? "var(--nv-grad-primary)" : "transparent",
                color: isToday ? "#fff" : "var(--nv-text-muted)",
                fontWeight: isToday ? 700 : 400,
                boxShadow: isToday ? "0 4px 14px -4px rgba(124,58,237,0.6)" : "none",
              }}
            >
              {d}
              {isScheduled && !isToday && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "var(--nv-purple)" }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Atividade recente ---------------- */

export interface NovaActivityItem {
  id: string
  title: string
  kind: string
  when: string
}

export function NovaActivity({ items }: { items: NovaActivityItem[] }) {
  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--nv-text)" }}>
          Atividade recente
        </h2>
        <Link href="/dashboard/projetos" className="text-[12px] font-medium" style={{ color: "#b79dfb" }}>
          Ver tudo
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-[12.5px] py-3" style={{ color: "var(--nv-text-subtle)" }}>
          Sua atividade aparece aqui conforme você cria.
        </p>
      ) : (
        <div className="space-y-3.5">
          {items.map((it) => (
            <div key={it.id} className="flex items-start gap-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                style={{ background: "rgba(139,92,246,0.18)", color: "#b79dfb" }}
              >
                {it.title.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] truncate" style={{ color: "var(--nv-text)" }}>
                  <span className="font-medium">{it.kind}</span>{" "}
                  <span style={{ color: "var(--nv-text-muted)" }}>{it.title}</span>
                </p>
                <p className="text-[11px]" style={{ color: "var(--nv-text-subtle)" }}>
                  {it.when}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Upgrade card ---------------- */

const PERKS = ["Gerações ilimitadas", "Modelos de IA avançados", "Nano Banana Pro", "Suporte prioritário"]

export function NovaUpgradeCard({ isPro }: { isPro: boolean }) {
  if (isPro) return null
  return (
    <div className="nv-upgrade nv-fade p-5">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4" style={{ color: "#f6c35a" }} />
          <h2 className="text-[14px] font-bold" style={{ color: "var(--nv-text)" }}>
            Desbloqueie o SyncPost Pro
          </h2>
        </div>
        <ul className="space-y-1.5 mb-4">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--nv-text-muted)" }}>
              <Check className="w-3.5 h-3.5" style={{ color: "#62e29a" }} />
              {p}
            </li>
          ))}
        </ul>
        <Link
          href="/pricing"
          className="nv-btn-primary flex items-center justify-center gap-1.5 w-full h-10 text-[13px]"
        >
          <Crown className="w-4 h-4" />
          Fazer upgrade
        </Link>
      </div>
    </div>
  )
}
