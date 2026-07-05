"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Plus } from "lucide-react"
import { NAV_ITEMS } from "./nav-items"
import { getBrandGradient } from "@/lib/brand-colors"
import { Logo } from "@/components/brand/logo"

interface MobileNavProps {
  activeBrandName: string | null
  activeBrandId: string | null
  activeBrandLogoUrl: string | null
}

/** Menu de navegação mobile (hamburger + drawer). Visível só abaixo de md. */
export function MobileNav({
  activeBrandName,
  activeBrandId,
  activeBrandLogoUrl,
}: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Fecha o drawer ao navegar.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Trava o scroll do body enquanto o drawer está aberto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
        style={{ color: "var(--text-primary)", background: "rgba(255,255,255,0.04)" }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col overflow-y-auto"
            style={{
              background: "#101016",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <Link href="/dashboard">
                <Logo size={28} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeBrandName && activeBrandId && (
              <div className="px-4 pb-2">
                <div
                  className="rounded-xl p-2.5 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  {activeBrandLogoUrl ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeBrandLogoUrl}
                        alt={activeBrandName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-lg ${getBrandGradient(activeBrandId)} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-sm font-bold text-white">
                        {activeBrandName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
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
                      {activeBrandName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 mt-2 mb-3">
              <Link
                href="/dashboard/criar"
                className="flex items-center justify-center gap-2 w-full h-10 rounded-lg text-sm font-semibold"
                style={{
                  background:
                    "linear-gradient(180deg, #8A33EC 0%, #7320E6 50%, #5F14D6 100%)",
                  color: "#ffffff",
                }}
              >
                <Plus className="w-4 h-4" />
                Criar conteúdo
              </Link>
            </div>

            <nav className="flex-1 px-3 pt-1 pb-6 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                    style={{
                      color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                      background: isActive ? "rgba(115, 32, 230,0.1)" : "transparent",
                    }}
                  >
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
          </div>
        </div>
      )}
    </div>
  )
}
