"use client"

import { motion } from "framer-motion"
import { Sparkles, ArrowUpRight, Zap, Wand2, Brain } from "lucide-react"
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
            <Sparkles className="w-3 h-3" />
            Powered by AI
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
              <Sparkles className="w-4 h-4 mr-2" />
              Começar agora
              <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </Button>
        </div>

        {/* Ilustração lateral */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="hidden md:flex relative"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-purple-600 shadow-glow-xl flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md flex items-center justify-center animate-float">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-2 -left-3 w-9 h-9 rounded-xl bg-white/15 border border-white/30 backdrop-blur-md flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
            <Brain className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
