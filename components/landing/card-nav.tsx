"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Logo } from "@/components/brand/logo"

/*
 * Card Nav — barra flutuante que abre em cards (reactbits.dev/components/card-nav).
 * Reimplementado com framer-motion em vez de GSAP (já era dependência do projeto)
 * e com os tokens do tema escuro no lugar das cores claras do original.
 */

export type CardNavLink = { label: string; href: string }

export type CardNavItem = {
  label: string
  /** Fundo do card — use os tons de superfície/marca, não cor crua. */
  bgColor: string
  textColor: string
  links: CardNavLink[]
}

type CardNavProps = {
  items: CardNavItem[]
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

const BARRA = 60

export function CardNav({
  items,
  ctaLabel = "Começar grátis",
  ctaHref = "/onboarding",
  className = "",
}: CardNavProps) {
  const [aberto, setAberto] = useState(false)
  const reduced = useReducedMotion()
  const navRef = useRef<HTMLDivElement>(null)

  /* Fecha no Escape e ao clicar fora — o menu cobre conteúdo quando aberto. */
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false)
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [aberto])

  const cards = items.slice(0, 3)

  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 top-4 md:top-7 z-50 w-[92%] max-w-[860px] ${className}`}
    >
      <motion.nav
        ref={navRef}
        animate={{ height: aberto ? "auto" : BARRA }}
        initial={false}
        transition={
          reduced ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
        }
        className="relative block overflow-hidden rounded-2xl border border-hairline-strong bg-surface/85 backdrop-blur-xl shadow-card will-change-[height]"
      >
        {/* Barra */}
        <div
          className="relative flex items-center justify-between gap-3 pl-4 pr-2"
          style={{ height: BARRA }}
        >
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            className="group order-2 md:order-none flex h-full cursor-pointer flex-col items-center justify-center gap-[6px] px-1"
          >
            <span
              className={`h-[2px] w-[26px] bg-text-secondary transition-transform duration-300 group-hover:bg-foreground ${
                aberto ? "translate-y-[4px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[2px] w-[26px] bg-text-secondary transition-transform duration-300 group-hover:bg-foreground ${
                aberto ? "-translate-y-[4px] -rotate-45" : ""
              }`}
            />
          </button>

          <Link
            href="/"
            className="order-1 md:order-none flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
            aria-label="Início"
          >
            <Logo size={22} />
          </Link>

          <Link
            href={ctaHref}
            className="order-3 md:order-none hidden md:inline-flex h-[44px] items-center rounded-xl bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            {ctaLabel}
          </Link>
        </div>

        {/* Cards */}
        <AnimatePresence initial={false}>
          {aberto && (
            <motion.div
              key="cards"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-stretch gap-2 p-2 pt-0 md:flex-row md:items-stretch md:gap-3"
            >
              {cards.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={reduced ? false : { y: 46, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduced ? undefined : { y: 30, opacity: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: reduced ? 0 : 0.06 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative flex min-h-[92px] flex-1 select-none flex-col gap-2 rounded-xl px-4 py-3 md:min-h-[168px]"
                  style={{ backgroundColor: item.bgColor, color: item.textColor }}
                >
                  <div className="lp-display text-[19px] tracking-[-0.02em] md:text-[22px]">
                    {item.label}
                  </div>
                  <div className="mt-auto flex flex-col gap-[3px]">
                    {item.links.map((l) => (
                      <Link
                        key={l.href + l.label}
                        href={l.href}
                        onClick={() => setAberto(false)}
                        className="inline-flex items-center gap-1.5 text-[15px] opacity-85 transition-opacity hover:opacity-100"
                      >
                        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* CTA aparece dentro do menu no mobile, onde a barra não o mostra */}
              <Link
                href={ctaHref}
                onClick={() => setAberto(false)}
                className="md:hidden inline-flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-medium text-white"
              >
                {ctaLabel}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  )
}
