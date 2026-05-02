"use client"

import { Search, Bell, HelpCircle, Sun, Moon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DashboardTopBar() {
  return (
    <header className="h-[60px] border-b border-border-subtle bg-background-secondary/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <Input
          placeholder="Buscar projetos, marcas..."
          className="pl-10 bg-background-secondary/60 border-border-subtle focus:border-purple-600/50 focus:shadow-glow-sm"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border-medium bg-background-tertiary px-1.5 font-mono text-[10px] font-medium text-text-muted">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-2 ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full shadow-glow-sm" />
              <span className="sr-only">Notificacoes</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificacao nova
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon">
          <HelpCircle className="w-5 h-5" />
          <span className="sr-only">Ajuda</span>
        </Button>

        <Button variant="ghost" size="icon">
          <Moon className="w-5 h-5" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </div>
    </header>
  )
}
