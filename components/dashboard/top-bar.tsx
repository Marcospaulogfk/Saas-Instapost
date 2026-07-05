"use client"

import Link from "next/link"
import { Search, Bell, HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardTopBarProps {
  /** Slot do menu mobile (hamburger) — renderizado antes da busca, só < md. */
  mobileNav?: React.ReactNode
}

export function DashboardTopBar({ mobileNav }: DashboardTopBarProps) {
  return (
    <header
      className="h-[60px] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-10"
      style={{
        background:
          "linear-gradient(180deg, var(--background) 0%, transparent 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {mobileNav}

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <Input
          placeholder="Buscar projetos, marcas..."
          className="pl-10 bg-white/[0.03] border-white/[0.04] focus:border-brand-600/50 focus:shadow-glow-sm"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded bg-white/[0.04] border border-white/[0.06] px-1.5 font-mono text-[10px] font-medium text-text-muted">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação nova
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/suporte">
            <HelpCircle className="w-5 h-5" />
            <span className="sr-only">Ajuda e suporte</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
