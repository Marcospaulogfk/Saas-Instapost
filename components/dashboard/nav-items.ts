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

/** Trabalho do dia a dia — grupo "Menu principal" da sidebar. */
export const MAIN_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: House },
  { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { name: "Sugestões", href: "/dashboard/inspiracoes", icon: Lightbulb },
  { name: "Planejar", href: "/dashboard/planejar", icon: CalendarPlus, badge: "IA" },
  { name: "Biblioteca", href: "/dashboard/projetos", icon: Library },
  { name: "Calendário", href: "/dashboard/calendario", icon: CalendarDays },
]

/** Configuração da conta — grupo "Outros", separado por rótulo na sidebar. */
export const OTHERS_NAV_ITEMS: NavItem[] = [
  { name: "Marcas", href: "/dashboard/marcas", icon: Store },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]

/** Lista corrida (drawer mobile, que não agrupa). */
export const NAV_ITEMS: NavItem[] = [...MAIN_NAV_ITEMS, ...OTHERS_NAV_ITEMS]
