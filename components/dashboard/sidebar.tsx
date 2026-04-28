"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Sparkles,
  Folder,
  Building2,
  Layers,
  Settings,
  ChevronUp,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Criar", href: "/dashboard/criar", icon: Sparkles, badge: "Novo" },
  { name: "Projetos", href: "/dashboard/projetos", icon: Folder },
  { name: "Marcas", href: "/dashboard/marcas", icon: Building2 },
  { name: "Templates", href: "/dashboard/templates", icon: Layers },
  { name: "Configuracoes", href: "/dashboard/configuracoes", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col bg-background border-r border-border">
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-xl font-bold text-foreground">InstaPost</span>
        </Link>
      </div>

      {/* Brand selector */}
      <div className="px-4 mb-4">
        <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Marca atual</p>
            <p className="text-sm font-medium truncate">Culturize-se</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="px-4 mb-6">
        <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/criar">
            <Plus className="w-4 h-4 mr-2" />
            Criar carrossel
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Credits Card */}
      <div className="p-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground mb-2">Imagens este mes</p>
          <Progress value={23.5} className="h-1.5 mb-2" />
          <p className="text-sm font-medium tabular-nums">47 / 200 imagens</p>
          <p className="text-xs text-muted-foreground mt-1">Renova em 12 dias</p>
          <Link 
            href="/pricing" 
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            Fazer upgrade &rarr;
          </Link>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.jpg" alt="Usuario" />
                <AvatarFallback className="bg-primary/10 text-primary">MP</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">Marcos Paulo</p>
                <p className="text-xs text-muted-foreground truncate">marcos@email.com</p>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>Minha conta</DropdownMenuItem>
            <DropdownMenuItem>Configuracoes</DropdownMenuItem>
            <DropdownMenuItem>Plano e cobranca</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
