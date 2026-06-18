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
      className="dash-card relative overflow-hidden"
      style={{ borderTop: "var(--rule-top)" }}
    >
      {/* glow Rio difuso atrás do conteúdo pra dar profundidade ao hero */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--brand-600)]/20 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-[#e0556a]/10 blur-[100px]" />

      <div className="relative z-10 p-7 md:p-9 grid md:grid-cols-[1fr_auto] gap-7 items-center">
        <div>
          <h2 className="text-[28px] md:text-[38px] font-display font-semibold text-text-primary leading-[1.08] tracking-tight mb-3">
            Sua próxima ideia vira{" "}
            <span className="gradient-text">carrossel</span> em 3 minutos.
          </h2>
          <p className="text-text-secondary max-w-md mb-6 leading-relaxed">
            Conte o que você quer postar. A IA escreve o roteiro, gera as imagens e monta tudo seguindo frameworks que convertem.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mb-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2/60 px-2.5 py-1 text-tiny font-medium text-text-secondary">
              <Zap className="w-3.5 h-3.5 text-[var(--brand-400)]" /> Roteiro em 30s
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2/60 px-2.5 py-1 text-tiny font-medium text-text-secondary">
              <Brain className="w-3.5 h-3.5 text-[var(--brand-400)]" /> Estratégia adaptada
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2/60 px-2.5 py-1 text-tiny font-medium text-text-secondary">
              <Wand2 className="w-3.5 h-3.5 text-[var(--brand-400)]" /> Imagens IA
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="group/btn bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)] font-semibold shadow-[0_8px_24px_-8px_rgba(115,32,230,0.6)]"
            >
              <Link href="/dashboard/criar">
                Começar agora
                <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Link>
            </Button>
            <span className="text-tiny text-text-muted">Sem template em branco. Direto ao resultado.</span>
          </div>
        </div>

        {/* Mockup empilhado de 3 slides — superfícies chapadas + hairline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex relative items-center justify-center w-[210px] h-[210px]"
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
