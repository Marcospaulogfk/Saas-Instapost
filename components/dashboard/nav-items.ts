import {
  House,
  Library,
  Store,
  Settings,
  Lightbulb,
  CalendarDays,
  CalendarPlus,
  LayoutTemplate,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: House },
  { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { name: "Sugestões", href: "/dashboard/inspiracoes", icon: Lightbulb },
  { name: "Planejar", href: "/dashboard/planejar", icon: CalendarPlus, badge: "IA" },
  { name: "Biblioteca", href: "/dashboard/projetos", icon: Library },
  { name: "Calendário", href: "/dashboard/calendario", icon: CalendarDays },
  { name: "Marcas", href: "/dashboard/marcas", icon: Store },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]
