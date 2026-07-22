"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  Crown,
  Check,
  Loader2,
  Pencil,
  Building2,
  Plus,
} from "lucide-react"
import { NAV_ITEMS } from "../nav-items"
import { Logo } from "@/components/brand/logo"
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
  logo_url?: string | null
}

interface NovaSidebarProps {
  userName: string
  userEmail: string
  userInitials: string
  userAvatarUrl: string | null
  credits: number
  planCreditsMonthly: number
  creditsUsedThisMonth: number
  subscriptionStatus: string
  activeBrand: BrandItem | null
  brands: BrandItem[]
}

const PLAN_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Pro",
  past_due: "Atrasado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
}

/** Avatar da marca: logo quando existe, senão a inicial sobre gradiente. */
function BrandAvatar({ brand, size = 9 }: { brand: BrandItem; size?: 6 | 9 }) {
  const sizeClass = size === 9 ? "w-9 h-9 rounded-lg" : "w-6 h-6 rounded"
  const textClass = size === 9 ? "text-sm" : "text-[10px]"
  if (brand.logo_url) {
    return (
      <div
        className={`${sizeClass} overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/10`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
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

export function NovaSidebar({
  userName,
  userEmail,
  userInitials,
  userAvatarUrl,
  credits,
  planCreditsMonthly,
  creditsUsedThisMonth,
  subscriptionStatus,
  activeBrand,
  brands,
}: NovaSidebarProps) {
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
      if (result.ok) router.refresh()
      setSwitchingId(null)
    })
  }

  const monthly = planCreditsMonthly > 0 ? planCreditsMonthly : credits + creditsUsedThisMonth
  const total = monthly > 0 ? monthly : Math.max(credits, 1)
  // Barra e % mostram o que RESTA (esvazia conforme você usa), não o usado.
  const remainingPct = Math.max(0, Math.min(100, Math.round((credits / Math.max(total, 1)) * 100)))
  const planLabel = PLAN_LABEL[subscriptionStatus] ?? subscriptionStatus

  return (
    <aside
      className="hidden md:flex w-64 flex-col shrink-0 h-full"
      style={{ background: "var(--nv-sidebar)", borderRight: "1px solid var(--nv-border)" }}
    >
      {/* Marca — logo + seletor de marca */}
      <div className="px-4 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center mb-4 px-1">
          <Logo size={26} />
        </Link>

        {activeBrand ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Trocar marca"
                className="nv-card-hover w-full rounded-xl p-2.5 flex items-center gap-3 text-left"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--nv-border)" }}
              >
                <BrandAvatar brand={activeBrand} size={9} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-[0.12em] font-medium"
                    style={{ color: "var(--nv-text-subtle)" }}
                  >
                    Marca ativa
                  </p>
                  <p className="text-[13px] font-medium truncate" style={{ color: "var(--nv-text)" }}>
                    {activeBrand.name}
                  </p>
                </div>
                {isSwitching ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--nv-text-muted)" }} />
                ) : (
                  <ChevronsUpDown className="w-3.5 h-3.5" style={{ color: "var(--nv-text-muted)" }} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <div
                className="px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] font-medium"
                style={{ color: "var(--nv-text-muted)" }}
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
                      <Check className="w-3.5 h-3.5" style={{ color: "#b79dfb" }} />
                    ) : null}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/marcas/${activeBrand.id}`} className="cursor-pointer">
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
            className="nv-card-hover rounded-xl p-3 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--nv-border)", color: "var(--nv-text-secondary)" }}
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)", color: "#b79dfb" }}
            >
              <Plus className="w-4 h-4" />
            </span>
            <p className="text-[13px] font-medium" style={{ color: "var(--nv-text)" }}>
              Criar primeira marca
            </p>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto nova-scroll">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              data-active={isActive}
              className="nv-nav-item flex items-center gap-3 px-3 py-2.5 text-[13.5px] font-medium relative"
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                  style={{ background: "var(--nv-purple)" }}
                />
              )}
              <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.1 : 1.8} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(139,92,246,0.2)", color: "#b79dfb" }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Créditos + upgrade */}
      <div className="px-4 pb-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--nv-card)", border: "1px solid var(--nv-border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold" style={{ color: "var(--nv-text)" }}>
              Créditos de IA
            </span>
            <span className="text-[11px] font-medium tabular-nums" style={{ color: "var(--nv-text-muted)" }}>
              {remainingPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-[22px] font-bold tabular-nums" style={{ color: "var(--nv-text)" }}>
              {credits.toLocaleString("pt-BR")}
            </span>
            <span className="text-[12px]" style={{ color: "var(--nv-text-subtle)" }}>
              de {total.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="nv-progress-track h-1.5 mb-1.5">
            <div className="nv-progress-fill" style={{ width: `${remainingPct}%` }} />
          </div>
          <p className="text-[10.5px] mb-3" style={{ color: "var(--nv-text-subtle)" }}>
            créditos restantes este mês
          </p>
          <Link
            href="/pricing"
            className="nv-btn-primary flex items-center justify-center gap-1.5 w-full h-9 text-[12.5px]"
          >
            <Crown className="w-3.5 h-3.5" />
            Fazer upgrade
          </Link>
        </div>
      </div>

      {/* Usuário */}
      <div className="px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="nv-card-hover flex items-center gap-3 w-full p-2 rounded-xl">
              <Avatar className="h-8 w-8">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName} />}
                <AvatarFallback
                  style={{ background: "rgba(139,92,246,0.2)", color: "#b79dfb", fontSize: 11, fontWeight: 600 }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--nv-text)" }}>
                  {userName}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--nv-text-subtle)" }}>
                  {planLabel}
                </p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5" style={{ color: "var(--nv-text-subtle)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-[11px]" style={{ color: "var(--nv-text-muted)" }}>
              {userEmail}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes">Minha conta</Link>
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
