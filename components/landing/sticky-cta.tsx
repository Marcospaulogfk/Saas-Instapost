"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

/**
 * Barra fixa de conversão: aparece depois que o usuário passa do hero e some
 * quando chega no CTA final (pra não competir com ele).
 */
export function StickyCta() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const fim = document.documentElement.scrollHeight - window.innerHeight - 900
      setVisivel(y > window.innerHeight * 0.9 && y < fim)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 inset-x-0 z-40 border-t border-hairline bg-background/90 backdrop-blur-xl px-4 py-3"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Primeiro carrossel em 3 minutos
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                1 carrossel grátis · sem cartão
              </p>
            </div>
            <Link
              href="/onboarding"
              className="lp-cta-glow shrink-0 inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Começar grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
