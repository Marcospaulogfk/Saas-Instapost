import {
  House,
  Library,
  Store,
  Settings,
  Lightbulb,
  CalendarDays,
  LayoutTemplate,
  Instagram,
  Handshake,
  Coins,
  Gift,
} from "lucide-react"
import { AFILIADOS_HABILITADO, INDICACAO_HABILITADA } from "@/lib/features"
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
  { name: "Calendário", href: "/dashboard/calendario", icon: CalendarDays, badge: "IA" },
  { name: "Biblioteca", href: "/dashboard/projetos", icon: Library },
  { name: "Instagram", href: "/dashboard/instagram", icon: Instagram },
]

/** Configuração da conta — grupo "Outros", separado por rótulo na sidebar. */
export const OTHERS_NAV_ITEMS: NavItem[] = [
  { name: "Marcas", href: "/dashboard/marcas", icon: Store },
  // Saldo, extrato, preços e assinatura: a única fonte de verdade do usuário.
  { name: "Tokens", href: "/dashboard/tokens", icon: Coins },
  // Indique e ganhe: só com a flag (depende das migrations 0014/0020).
  ...(INDICACAO_HABILITADA
    ? [{ name: "Indicação", href: "/dashboard/indicacao", icon: Gift } satisfies NavItem]
    : []),
  // Afiliados (dinheiro): só aparece com a flag ligada (lib/features.ts).
  ...(AFILIADOS_HABILITADO
    ? [{ name: "Afiliados", href: "/dashboard/afiliados", icon: Handshake } satisfies NavItem]
    : []),
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]

/** Lista corrida (drawer mobile, que não agrupa). */
export const NAV_ITEMS: NavItem[] = [...MAIN_NAV_ITEMS, ...OTHERS_NAV_ITEMS]
