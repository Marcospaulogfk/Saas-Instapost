"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ChevronUp,
  ChevronsUpDown,
  Plus,
  Check,
  Loader2,
  Pencil,
  Building2,
} from "lucide-react"
import { NAV_ITEMS } from "./nav-items"
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
import { Logo } from "@/components/brand/logo"

interface BrandItem {
  id: string
  name: string
  logo_url?: string | null
}

/** Avatar da marca: usa a logo quando existe, senão a inicial sobre gradiente. */
function BrandAvatar({
  brand,
  size = 9,
}: {
  brand: BrandItem
  size?: 6 | 9
}) {
  const sizeClass = size === 9 ? "w-9 h-9 rounded-lg" : "w-6 h-6 rounded"
  const textClass = size === 9 ? "text-sm" : "text-[10px]"
  if (brand.logo_url) {
    return (
      <div
        className={`${sizeClass} overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/10`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo_url}
          alt={brand.name}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }
  return (
    <div
      className={`${sizeClass} ${getBrandGradient(brand.id)} flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${textClass} font-bold text-white`}>
        {brand.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
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

const navigation = NAV_ITEMS

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

  return (
    <aside className="dash-sidebar-float hidden md:flex w-64 flex-col">
      {/* Brand block — logo + seletor de marca em um cartão só */}
      <div className="px-4 pt-6 pb-2">
        <Link href="/dashboard" className="flex items-center mb-5 px-2">
          <Logo size={32} />
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
                  (e.currentTarget.style.background = "rgba(115, 32, 230,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                }
                aria-label="Trocar marca"
              >
                <BrandAvatar brand={activeBrand} size={9} />
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
                    <BrandAvatar brand={b} size={6} />
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
              e.currentTarget.style.background = "rgba(115, 32, 230,0.08)"
              e.currentTarget.style.color = "var(--text-primary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)"
              e.currentTarget.style.color = "var(--text-secondary)"
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(115, 32, 230,0.1)" }}
            >
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Criar primeira marca</p>
          </Link>
        )}
      </div>

      {/* CTA Criar conteúdo — flat, acento sólido (DESIGN.md §6: sem gradiente/glow) */}
      <div className="px-4 mt-3 mb-3">
        <Link
          href="/dashboard/criar"
          className="group flex items-center justify-center gap-2 w-full h-10 rounded-lg text-[13px] font-semibold text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] transition-colors"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Criar conteúdo
        </Link>
      </div>

      {/* Nav */}
      <div className="px-4 pt-2 pb-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-subtle">
          Menu
        </span>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
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
                  ? "rgba(115, 32, 230,0.1)"
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
                    background: "rgba(115, 32, 230,0.15)",
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
                    background: "rgba(115, 32, 230,0.18)",
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
