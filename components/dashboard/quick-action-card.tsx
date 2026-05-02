"use client"

import { useRef, useState, MouseEvent } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Zap, Wand2, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuickActionCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState({ x: 50, y: 50 })

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-purple-700/40 group"
      style={{
        background:
          "linear-gradient(135deg, #0A0A0F 0%, #1A0E2E 30%, #2E1065 60%, #0A0A0F 100%)",
      }}
    >
      {/* Mesh gradients sobrepostos */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(124,58,237,0.45), transparent 60%), radial-gradient(ellipse 50% 70% at 100% 0%, rgba(76,29,149,0.55), transparent 60%), radial-gradient(ellipse 40% 60% at 80% 100%, rgba(139,92,246,0.3), transparent 60%)",
        }}
      />

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Linha luminosa diagonal */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(167,139,250,0.4) 50%, transparent 70%)",
        }}
      />

      {/* Mouse spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(500px circle at ${spot.x}% ${spot.y}%, rgba(167,139,250,0.18), transparent 50%)`,
        }}
      />

      {/* Orbs animados */}
      <motion.div
        className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-purple-600/30 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-violet-700/30 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(209,254,23,0.12)] border border-[rgba(209,254,23,0.4)] backdrop-blur-md text-xs text-lime mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_10px_rgba(209,254,23,0.7)] animate-pulse" />
            Powered by WebSync.ai
          </div>

          <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight mb-3">
            Crie um carrossel{" "}
            <span className="bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
              em 3 minutos.
            </span>
          </h2>
          <p className="text-white/65 max-w-lg mb-6">
            Conte sua ideia. A IA escreve o roteiro, gera as imagens cinematográficas e monta tudo seguindo frameworks de marketing comprovados.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55 mb-6">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-purple-300" /> Roteiro em 30s</span>
            <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-purple-300" /> Estratégia adaptada</span>
            <span className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-purple-300" /> Imagens IA</span>
          </div>

          <Button
            asChild
            size="lg"
            className="group/btn bg-lime text-zinc-950 hover:bg-lime hover:brightness-110 glow-lime hover:shadow-[0_0_28px_rgba(209,254,23,0.5)] font-semibold"
          >
            <Link href="/dashboard/criar">
              Começar agora
              <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </Button>
        </div>

        {/* Mockup empilhado de 3 slides */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex relative items-center justify-center w-[220px] h-[220px]"
        >
          {/* Slide back */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute w-[140px] h-[180px] rounded-2xl bg-gradient-to-br from-purple-800/60 to-zinc-950/80 border border-white/10 backdrop-blur-md rotate-[12deg] translate-x-7 translate-y-3 shadow-2xl"
          >
            <div className="p-4 space-y-1.5">
              <div className="h-1.5 w-3/4 bg-white/15 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
            </div>
          </motion.div>
          {/* Slide mid */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute w-[140px] h-[180px] rounded-2xl bg-gradient-to-br from-purple-600/70 to-purple-900/90 border border-white/15 backdrop-blur-md rotate-[6deg] translate-x-3 shadow-2xl"
          >
            <div className="p-4 space-y-1.5">
              <div className="h-1.5 w-2/3 bg-white/25 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/15 rounded-full" />
              <div className="h-1.5 w-3/4 bg-white/15 rounded-full" />
            </div>
          </motion.div>
          {/* Slide front */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[140px] h-[180px] rounded-2xl bg-gradient-to-br from-zinc-900 via-purple-950 to-black border border-purple-500/40 shadow-glow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(167,139,250,0.35),transparent_50%)]" />
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
                      className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-lime shadow-[0_0_6px_rgba(209,254,23,0.7)]" : "bg-white/25"}`}
                    />
                  ))}
                </div>
                <div className="text-[8px] font-semibold tracking-wider text-white/50">SYNCPOST</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
