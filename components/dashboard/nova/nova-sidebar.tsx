"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronsUpDown, Check, Loader2, Pencil, Building2, Plus } from "lucide-react"
import { MAIN_NAV_ITEMS, OTHERS_NAV_ITEMS, type NavItem } from "../nav-items"
import { Logo } from "@/components/brand/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setActiveBrand } from "@/app/actions/brands"
import { getBrandGradient } from "@/lib/brand-colors"

interface BrandItem {
  id: string
  name: string
  logo_url?: string | null
}

interface NovaSidebarProps {
  activeBrand: BrandItem | null
  brands: BrandItem[]
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

/**
 * Sidebar-CARTÃO do desktop (layout do EverReply): flutua sobre o canvas com
 * gutter em volta, canto de 20px e glow roxo ancorado no topo. Só a nav rola —
 * marca e CTA ficam fixos, então o cartão nunca mostra scrollbar cheia.
 *
 * Conta e créditos NÃO vivem aqui: viraram o chip de uso e o pill de conta no
 * header (NovaTopBar). O upgrade fica no NovaUpgradeCard do dashboard.
 */
export function NovaSidebar({ activeBrand, brands }: NovaSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSwitching, startSwitching] = useTransition()
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  function handleSwitchBrand(brandId: string) {
    if (!brandId || brandId === activeBrand?.id) return
    setSwitchingId(brandId)
    startSwitching(async () => {
      const result = await setActiveBrand(brandId)
      if (result.ok) router.refresh()
      setSwitchingId(null)
    })
  }

  return (
    <aside className="nv-sidebar-card hidden md:flex w-[248px] shrink-0 flex-col overflow-hidden px-4 pb-4 pt-7">
      {/* Marca — logo + seletor de marca (fixos). A logo respira sozinha: o
          bloco seguinte só começa bem depois dela, senão vira um amontoado
          grudado no topo do cartão. */}
      <div className="shrink-0">
        <Link href="/dashboard" className="flex items-center px-1 pb-8">
          <Logo size={32} />
        </Link>

        {activeBrand ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Trocar marca"
                className="nv-card-hover w-full rounded-xl p-2.5 flex items-center gap-3 text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--nv-border)" }}
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
                      <Check className="w-3.5 h-3.5" style={{ color: "#8DB8F7" }} />
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
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--nv-border)", color: "var(--nv-text-secondary)" }}
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(42, 121, 234,0.15)", color: "#8DB8F7" }}
            >
              <Plus className="w-4 h-4" />
            </span>
            <p className="text-[13px] font-medium" style={{ color: "var(--nv-text)" }}>
              Criar primeira marca
            </p>
          </Link>
        )}
      </div>

      {/* CTA principal: saiu do header (que agora só tem uso/busca/sino/conta)
          e virou o primeiro item da coluna, padrão "New" de Linear/Notion. */}
      <Link
        href="/dashboard/criar"
        className="nv-btn-primary mt-4 flex h-10 shrink-0 items-center justify-center gap-1.5 text-[13px]"
      >
        <Plus className="w-4 h-4" />
        Criar conteúdo
      </Link>

      {/* Só a NAV rola — logo e rodapé ficam parados. */}
      <div className="min-h-0 flex-1 overflow-y-auto nova-scroll pt-6">
        <div className="nv-nav-group">Menu principal</div>
        <nav className="flex flex-col gap-0.5">
          {MAIN_NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="nv-nav-group pt-5">Outros</div>
        <nav className="flex flex-col gap-0.5">
          {OTHERS_NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

    </aside>
  )
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href
  return (
    <Link
      href={item.href}
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className="nv-nav-item flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium"
    >
      <item.icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.1 : 1.8} />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span
          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ background: "rgba(22,104,227,0.22)", color: "var(--nv-brand-soft)" }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}
