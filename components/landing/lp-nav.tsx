"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useSpring } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"

const LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
]

/**
 * Nav da landing: condensa ao rolar, mostra a barra de progresso da leitura
 * e abre menu em tela cheia no mobile.
 */
export function LpNav() {
  const [rolou, setRolou] = useState(false)
  const [aberto, setAberto] = useState(false)
  const { scrollYProgress } = useScroll()
  const progresso = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Trava o corpo enquanto o menu mobile está aberto. */
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [aberto])

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          rolou
            ? "backdrop-blur-xl bg-background/85 border-b border-hairline"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto flex items-center justify-between px-6 transition-all duration-300 ${
            rolou ? "py-3" : "py-5"
          }`}
        >
          <Link href="/" className="flex items-center shrink-0">
            <Logo size={22} />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="relative py-1 transition-colors hover:text-foreground after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="lp-cta-glow bg-primary text-white hover:bg-primary/90 rounded-full px-5"
            >
              <Link href="/onboarding">Começar grátis</Link>
            </Button>
            <button
              onClick={() => setAberto(true)}
              className="md:hidden p-2 -mr-2 text-text-secondary"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progresso de leitura */}
        <motion.div
          className="h-px bg-primary origin-left"
          style={{ scaleX: progresso, opacity: rolou ? 1 : 0 }}
        />
      </nav>

      {/* Menu mobile */}
      {aberto && (
        <div className="fixed inset-0 z-[60] bg-background md:hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-hairline">
            <Logo size={22} />
            <button onClick={() => setAberto(false)} className="p-2 -mr-2" aria-label="Fechar menu">
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          <div className="px-6 py-8 flex flex-col gap-6">
            {LINKS.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  href={l.href}
                  onClick={() => setAberto(false)}
                  className="lp-display text-2xl text-foreground"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Button asChild size="lg" className="bg-primary text-white rounded-full h-12">
                <Link href="/onboarding" onClick={() => setAberto(false)}>
                  Começar grátis
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 border-hairline-strong">
                <Link href="/login" onClick={() => setAberto(false)}>
                  Entrar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
