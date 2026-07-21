"use client"

import Link from "next/link"
import { Search, Bell, Plus, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NovaTopBarProps {
  mobileNav?: React.ReactNode
  userName: string
  userInitials: string
  userAvatarUrl: string | null
}

export function NovaTopBar({ mobileNav, userName, userInitials, userAvatarUrl }: NovaTopBarProps) {
  return (
    <header
      className="h-[68px] px-4 sm:px-7 flex items-center gap-3 shrink-0 sticky top-0 z-20"
      style={{
        background: "rgba(8,8,14,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--nv-border)",
      }}
    >
      {mobileNav}

      {/* Busca */}
      <div className="relative w-full max-w-lg hidden sm:block">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--nv-text-subtle)" }}
        />
        <input
          placeholder="Buscar templates, projetos, marcas..."
          className="nv-search w-full h-11 pl-11 pr-16 text-[13.5px]"
        />
        <kbd
          className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center gap-0.5 rounded px-1.5 font-mono text-[10px]"
          style={{ background: "rgba(255,255,255,0.05)", color: "var(--nv-text-subtle)" }}
        >
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        {/* Criar novo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="nv-btn-primary hidden sm:flex items-center gap-1.5 h-10 px-4 text-[13px]">
              <Plus className="w-4 h-4" />
              Criar novo
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/criar/post-unico">Post único</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/criar/editorial">Carrossel</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/planejar">Planejar com IA</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Assistant */}
        <Link
          href="/dashboard/planejar"
          className="nv-btn-ghost hidden md:flex items-center gap-1.5 h-10 px-4 text-[13px]"
        >
          Assistente IA
        </Link>

        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative w-10 h-10 rounded-xl flex items-center justify-center nv-card-hover"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--nv-border)" }}
            >
              <Bell className="w-[18px] h-[18px]" style={{ color: "var(--nv-text-muted)" }} />
              <span
                className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--nv-pink)" }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação nova
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar (mobile) */}
        <div className="md:hidden w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.2)" }}>
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[12px] font-semibold" style={{ color: "#b79dfb" }}>
              {userInitials}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
