"use client"

import { useState, useTransition } from "react"
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
  ChevronsUpDown,
  Plus,
  FileText,
  Check,
  Loader2,
  Pencil,
  Lightbulb,
  Calendar,
  Users,
  Trophy,
  Zap,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/actions/auth"
import { setActiveBrand } from "@/app/actions/brands"
import { getBrandGradient } from "@/lib/brand-colors"

interface BrandItem {
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
  activeBrand: BrandItem | null
  brands: BrandItem[]
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Criar", href: "/dashboard/criar", icon: Sparkles, badge: "Novo" },
  { name: "Inspirações", href: "/dashboard/inspiracoes", icon: Lightbulb },
  { name: "Biblioteca", href: "/dashboard/projetos", icon: Folder },
  { name: "Calendário", href: "/dashboard/calendario", icon: Calendar },
  { name: "Comunidade", href: "/dashboard/comunidade", icon: Users },
  { name: "Jornada", href: "/dashboard/jornada", icon: Trophy },
  { name: "Marcas", href: "/dashboard/marcas", icon: Building2 },
  { name: "Templates", href: "/dashboard/templates", icon: Layers },
  { name: "Posts únicos", href: "/dashboard/posts-unicos", icon: FileText },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
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
  brands,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSwitching, startSwitching] = useTransition()
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  async function handleSignOut() {
    await signOut()
    router.push("/")
    router.refresh()
  }

  function handleSwitchBrand(brandId: string) {
    if (!brandId || brandId === activeBrand?.id) return
    setSwitchingId(brandId)
    startSwitching(async () => {
      const result = await setActiveBrand(brandId)
      if (result.ok) {
        router.refresh()
      }
      setSwitchingId(null)
    })
  }

  const isTrial = subscriptionStatus === "trial"
  const limit = isTrial ? Math.max(credits, 2) : planCreditsMonthly || 2
  const used = isTrial ? Math.max(0, limit - credits) : creditsUsedThisMonth
  const remaining = Math.max(0, limit - used)
  const progress = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <aside
      className="hidden md:flex w-64 flex-col"
      style={{
        background: "var(--sidebar)",
      }}
    >
      {/* Brand block — logo + seletor de marca em um cartão só */}
      <div className="px-4 pt-6 pb-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-5 px-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8a6cff 0%, #7C5CFF 50%, #5b3fe0 100%)",
              boxShadow:
                "0 4px 14px rgba(124,92,255,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-display font-bold text-base tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            SyncPost
          </span>
        </Link>

        {activeBrand ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full rounded-xl p-2.5 flex items-center gap-3 text-left transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(124,92,255,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                }
                aria-label="Trocar marca"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${getBrandGradient(activeBrand.id)} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-sm font-bold text-white">
                    {activeBrand.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-[0.12em] font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Marca ativa
                  </p>
                  <p
                    className="text-[13px] font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {activeBrand.name}
                  </p>
                </div>
                {isSwitching ? (
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: "var(--text-muted)" }}
                  />
                ) : (
                  <ChevronsUpDown
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 border-0">
              <div
                className="px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Trocar marca
              </div>
              {brands.map((b) => {
                const isActive = b.id === activeBrand.id
                const isLoading = switchingId === b.id
                return (
                  <DropdownMenuItem
                    key={b.id}
                    onSelect={(e) => {
                      e.preventDefault()
                      handleSwitchBrand(b.id)
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className={`w-6 h-6 rounded ${getBrandGradient(b.id)} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="flex-1 truncate text-[13px]">{b.name}</span>
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isActive ? (
                      <Check className="w-3.5 h-3.5 text-brand-400" />
                    ) : null}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/marcas/${activeBrand.id}`}
                  className="cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Editar marca atual
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/marcas" className="cursor-pointer">
                  <Building2 className="w-3.5 h-3.5 mr-2" />
                  Ver todas as marcas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/onboarding" className="cursor-pointer">
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  Adicionar nova marca
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/onboarding"
            className="rounded-xl p-3 flex items-center gap-3 transition-colors"
            style={{
              background: "rgba(255,255,255,0.02)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(124,92,255,0.08)"
              e.currentTarget.style.color = "var(--text-primary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)"
              e.currentTarget.style.color = "var(--text-secondary)"
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(124,92,255,0.1)" }}
            >
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Criar primeira marca</p>
          </Link>
        )}
      </div>

      {/* CTA Criar carrossel */}
      <div className="px-4 mt-3 mb-3">
        <Link
          href="/dashboard/criar"
          className="group flex items-center justify-center gap-2 w-full h-10 rounded-lg text-sm font-semibold transition-all"
          style={{
            background:
              "linear-gradient(180deg, #8a6cff 0%, #7C5CFF 50%, #6b4ce8 100%)",
            color: "#ffffff",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.2) inset, 0 4px 14px rgba(124,92,255,0.4)",
          }}
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Criar carrossel
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative group"
              style={{
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
                background: isActive
                  ? "rgba(124,92,255,0.1)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-primary)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-muted)"
                  e.currentTarget.style.background = "transparent"
                }
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: "var(--brand-600)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(124,92,255,0.15)",
                    color: "var(--brand-300)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Credits widget */}
      <div className="px-4 pt-4 pb-3">
        <div
          className="rounded-xl p-3.5"
          style={{
            background:
              "linear-gradient(180deg, rgba(72,52,144,0.18) 0%, rgba(28,20,60,0.25) 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Zap
                className="w-3 h-3"
                style={{ color: "var(--brand-300)" }}
              />
              <p
                className="text-[10px] uppercase tracking-[0.14em] font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {isTrial ? "Créditos grátis" : "Créditos"}
              </p>
            </div>
            <p
              className="text-[11px] tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {remaining}
              </span>
              <span style={{ color: "var(--text-muted)" }}>/{limit}</span>
            </p>
          </div>
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, 100 - progress)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-400), var(--brand-600))",
                boxShadow: "0 0 8px rgba(124,92,255,0.5)",
              }}
            />
          </div>
          <Link
            href="/pricing"
            className="block mt-2.5 text-[11px] font-medium transition-colors"
            style={{ color: "var(--brand-300)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--brand-200)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--brand-300)")
            }
          >
            {isTrial ? "Fazer upgrade →" : "Gerenciar plano →"}
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="px-3 pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Avatar className="h-8 w-8">
                {userAvatarUrl && (
                  <AvatarImage src={userAvatarUrl} alt={userName} />
                )}
                <AvatarFallback
                  style={{
                    background: "rgba(124,92,255,0.18)",
                    color: "var(--brand-300)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {userName}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {userEmail}
                </p>
              </div>
              <ChevronUp
                className="w-3.5 h-3.5"
                style={{ color: "var(--text-muted)" }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
