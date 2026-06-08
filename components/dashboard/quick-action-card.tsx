"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Zap, Wand2, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuickActionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-surface"
      style={{
        borderTop: "var(--rule-top)",
        boxShadow: "inset 0 0 0 1px var(--border-accent)",
      }}
    >
      <div className="relative z-10 p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-accent text-tiny font-mono uppercase tracking-[0.14em] text-text-muted mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-600)]" />
            Powered by WebSync.ai
          </div>

          <h2 className="text-3xl md:text-4xl font-display font-semibold text-text-primary leading-tight mb-3">
            Crie um carrossel{" "}
            <span className="text-[var(--brand-400)]">em 3 minutos.</span>
          </h2>
          <p className="text-text-secondary max-w-lg mb-6">
            Conte sua ideia. A IA escreve o roteiro, gera as imagens cinematográficas e monta tudo seguindo frameworks de marketing comprovados.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-tiny font-mono uppercase tracking-[0.1em] text-text-muted mb-6">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[var(--brand-400)]" /> Roteiro em 30s</span>
            <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-[var(--brand-400)]" /> Estratégia adaptada</span>
            <span className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-[var(--brand-400)]" /> Imagens IA</span>
          </div>

          <Button
            asChild
            size="lg"
            className="group/btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] font-semibold"
          >
            <Link href="/dashboard/criar">
              Começar agora
              <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </Button>
        </div>

        {/* Mockup empilhado de 3 slides — superfícies chapadas + hairline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex relative items-center justify-center w-[220px] h-[220px]"
        >
          <div className="absolute w-[140px] h-[180px] rounded-2xl bg-surface-2 border border-hairline rotate-[12deg] translate-x-7 translate-y-3">
            <div className="p-4 space-y-1.5">
              <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/[0.06] rounded-full" />
            </div>
          </div>
          <div className="absolute w-[140px] h-[180px] rounded-2xl bg-surface-2 border border-hairline-strong rotate-[6deg] translate-x-3">
            <div className="p-4 space-y-1.5">
              <div className="h-1.5 w-2/3 bg-white/15 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
              <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
            </div>
          </div>
          <div
            className="relative w-[140px] h-[180px] rounded-2xl bg-surface overflow-hidden"
            style={{ borderTop: "var(--rule-top)", boxShadow: "inset 0 0 0 1px var(--border-accent)" }}
          >
            <div className="relative p-4 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-white/80 rounded-full" />
                <div className="h-2 w-1/2 bg-white/60 rounded-full" />
                <div className="h-1.5 w-2/3 bg-white/40 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-[var(--brand-600)]" : "bg-white/25"}`}
                    />
                  ))}
                </div>
                <div className="text-[8px] font-mono font-semibold tracking-wider text-white/50">SYNCPOST</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
