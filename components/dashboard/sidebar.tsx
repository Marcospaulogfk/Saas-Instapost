"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { signOut } from "@/app/actions/auth"
import { getBrandGradient } from "@/lib/brand-colors"

interface ActiveBrand {
  id: string
  name: string
}

interface DashboardSidebarProps {
  userName: string
  userEmail: string
  userInitials: string
  userAvatarUrl: string | null
  credits: number
  subscriptionStatus: string
  planCreditsMonthly: number
  creditsUsedThisMonth: number
  activeBrand: ActiveBrand | null
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Criar", href: "/dashboard/criar", icon: Sparkles, badge: "Novo" },
  { name: "Projetos", href: "/dashboard/projetos", icon: Folder },
  { name: "Marcas", href: "/dashboard/marcas", icon: Building2 },
  { name: "Templates", href: "/dashboard/templates", icon: Layers },
  { name: "Configuracoes", href: "/dashboard/configuracoes", icon: Settings },
]

export function DashboardSidebar({
  userName,
  userEmail,
  userInitials,
  userAvatarUrl,
  credits,
  subscriptionStatus,
  planCreditsMonthly,
  creditsUsedThisMonth,
  activeBrand,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  const isTrial = subscriptionStatus === "trial"
  const limit = isTrial ? Math.max(credits, 2) : planCreditsMonthly || 2
  const used = isTrial ? Math.max(0, limit - credits) : creditsUsedThisMonth
  const progress = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <aside className="hidden md:flex w-60 flex-col bg-background border-r border-border">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-xl font-bold text-foreground">InstaPost</span>
        </Link>
      </div>

      <div className="px-4 mb-4">
        {activeBrand ? (
          <Link
            href={`/dashboard/marcas/${activeBrand.id}`}
            className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div
              className={`w-9 h-9 rounded-lg ${getBrandGradient(activeBrand.id)} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-sm font-bold text-white">
                {activeBrand.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Marca atual</p>
              <p className="text-sm font-medium truncate">{activeBrand.name}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            href="/onboarding"
            className="rounded-lg border border-dashed border-border p-3 flex items-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Criar primeira marca</p>
          </Link>
        )}
      </div>

      <div className="px-4 mb-6">
        <Button
          asChild
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/dashboard/criar">
            <Plus className="w-4 h-4 mr-2" />
            Criar carrossel
          </Link>
        </Button>
      </div>

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
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground mb-2">
            {isTrial ? "Imagens gratis" : "Imagens este mes"}
          </p>
          <Progress value={progress} className="h-1.5 mb-2" />
          <p className="text-sm font-medium tabular-nums">
            {used} / {limit} imagens
          </p>
          {isTrial && (
            <p className="text-xs text-muted-foreground mt-1">
              Plano de avaliacao
            </p>
          )}
          <Link
            href="/pricing"
            className="text-xs text-primary hover:underline mt-2 inline-block"
          >
            {isTrial ? "Fazer upgrade" : "Gerenciar plano"} &rarr;
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                {userAvatarUrl && (
                  <AvatarImage src={userAvatarUrl} alt={userName} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">Minha conta</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">Configuracoes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing">Plano e cobranca</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void handleSignOut()
              }}
              className="text-destructive"
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
