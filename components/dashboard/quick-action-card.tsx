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
      className="relative overflow-hidden rounded-2xl border border-purple-600/40 group"
    >
      {/* Imagem de fundo AI */}
      <img
        src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&q=85&auto=format&fit=crop"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover opacity-30 transition-opacity group-hover:opacity-40"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-purple-900/85 to-fuchsia-950/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.5),transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 -right-12 w-64 h-64 bg-fuchsia-500/30 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-24 -left-12 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs text-white/90 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-300 animate-pulse" />
            Powered by WebSync.ai
          </div>

          <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight mb-3">
            Crie um carrossel{" "}
            <span className="bg-gradient-to-r from-fuchsia-300 via-purple-200 to-purple-300 bg-clip-text text-transparent">
              em 3 minutos.
            </span>
          </h2>
          <p className="text-white/70 max-w-lg mb-6">
            Conte sua ideia. A IA escreve o roteiro, gera as imagens cinematográficas e monta tudo seguindo frameworks de marketing comprovados.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60 mb-6">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-fuchsia-300" /> Roteiro em 30s</span>
            <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-purple-300" /> Estratégia adaptada</span>
            <span className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-pink-300" /> Imagens IA</span>
          </div>

          <Button
            asChild
            size="lg"
            className="group/btn bg-white text-purple-900 hover:bg-white/90 shadow-glow-lg font-semibold"
          >
            <Link href="/dashboard/criar">
              Começar agora
              <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </Button>
        </div>

        {/* Visual gráfico — mockup de carrossel em mini, ao invés de ícone */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex relative items-center justify-center w-[220px] h-[220px]"
        >
          {/* Slide 3 (back) */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute w-[140px] h-[180px] rounded-2xl bg-gradient-to-br from-fuchsia-400/40 to-purple-700/60 border border-white/10 backdrop-blur-md rotate-[12deg] translate-x-7 translate-y-3 shadow-2xl"
          >
            <div className="p-4 space-y-1.5">
              <div className="h-1.5 w-3/4 bg-white/20 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/15 rounded-full" />
            </div>
          </motion.div>
          {/* Slide 2 (mid) */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute w-[140px] h-[180px] rounded-2xl bg-gradient-to-br from-purple-400/50 to-fuchsia-600/70 border border-white/15 backdrop-blur-md rotate-[6deg] translate-x-3 shadow-2xl"
          >
            <div className="p-4 space-y-1.5">
              <div className="h-1.5 w-2/3 bg-white/30 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/20 rounded-full" />
              <div className="h-1.5 w-3/4 bg-white/20 rounded-full" />
            </div>
          </motion.div>
          {/* Slide 1 (front) */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[140px] h-[180px] rounded-2xl bg-gradient-to-br from-purple-200/95 via-purple-300/95 to-fuchsia-300/95 border border-white/30 shadow-glow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_50%)]" />
            <div className="relative p-4 h-full flex flex-col justify-between text-purple-900">
              <div className="space-y-2">
                <div className="h-2 w-3/4 bg-purple-900/40 rounded-full" />
                <div className="h-2 w-1/2 bg-purple-900/30 rounded-full" />
                <div className="h-1.5 w-2/3 bg-purple-900/25 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-purple-900" : "bg-purple-900/30"}`}
                    />
                  ))}
                </div>
                <div className="text-[8px] font-semibold tracking-wider opacity-60">SYNCPOST</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
