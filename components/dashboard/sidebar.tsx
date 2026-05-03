"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Sparkles,
  Folder,
  Building2,
  Layers,
  Settings,
  ChevronUp,
  Plus,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  { name: "Editorial", href: "/dashboard/editorial", icon: FileText },
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
  const remaining = Math.max(0, limit - used)
  const progress = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <aside className="hidden md:flex w-60 flex-col bg-background-secondary/80 backdrop-blur-xl border-r border-border-subtle">
      {/* Logo */}
      <div className="p-6 border-b border-border-subtle">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-purple flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-text-primary">SyncPost</span>
        </Link>
      </div>

      {/* Active brand */}
      <div className="px-4 mt-4 mb-3">
        {activeBrand ? (
          <Link
            href={`/dashboard/marcas/${activeBrand.id}`}
            className="rounded-lg border border-border-subtle bg-background-tertiary/40 p-3 flex items-center gap-3 hover:border-purple-600/30 hover:bg-background-tertiary/70 transition-all"
          >
            <div
              className={`w-9 h-9 rounded-lg ${getBrandGradient(activeBrand.id)} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-sm font-bold text-white">
                {activeBrand.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-text-muted">Marca</p>
              <p className="text-sm font-medium text-text-primary truncate">{activeBrand.name}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-text-muted" />
          </Link>
        ) : (
          <Link
            href="/onboarding"
            className="rounded-lg border border-dashed border-border-medium p-3 flex items-center gap-3 text-text-secondary hover:text-purple-400 hover:border-purple-600/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-background-tertiary flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Criar primeira marca</p>
          </Link>
        )}
      </div>

      {/* CTA Criar */}
      <div className="px-4 mb-4">
        <Button asChild size="lg" className="w-full group">
          <Link href="/dashboard/criar">
            <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
            Criar carrossel
          </Link>
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
                isActive
                  ? "text-purple-400 bg-purple-600/10"
                  : "text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-purple rounded-r-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge
                  variant="secondary"
                  className="bg-lime text-zinc-950 border-0 text-[10px] tracking-wide font-semibold shadow-[0_0_10px_rgba(209,254,23,0.4)]"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Credits widget */}
      <div className="p-4">
        <div className="rounded-lg bg-gradient-card border border-border-subtle p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs text-text-secondary">
              {isTrial ? "Créditos grátis" : "Créditos"}
            </p>
            <p className="text-xs text-text-primary tabular-nums">
              <span className="text-lime font-semibold">{remaining}</span>
              <span className="text-text-muted">/{limit}</span>
            </p>
          </div>
          <div className="w-full h-1.5 bg-background-tertiary rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, 100 - progress)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-lime shadow-[0_0_8px_rgba(209,254,23,0.6)]"
            />
          </div>
          <Link
            href="/pricing"
            className="text-xs text-lime hover:brightness-110 transition-all"
          >
            {isTrial ? "Fazer upgrade →" : "Gerenciar plano →"}
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-t border-border-subtle">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-background-tertiary transition-colors">
              <Avatar className="h-8 w-8 border border-border-medium">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName} />}
                <AvatarFallback className="bg-purple-600/20 text-purple-300">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
                <p className="text-xs text-text-muted truncate">{userEmail}</p>
              </div>
              <ChevronUp className="w-4 h-4 text-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background-tertiary border-border-medium">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">Minha conta</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing">Plano e cobrança</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void handleSignOut()
              }}
              className="text-danger focus:text-danger"
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
