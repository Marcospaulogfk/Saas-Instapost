"use client"

import { motion } from "framer-motion"
import { Sparkles, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuickActionCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-purple-600/30 bg-gradient-to-br from-purple-600/20 via-purple-700/10 to-transparent p-8 shadow-glow"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-purple shadow-glow-lg flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-h2 font-display font-bold text-text-primary mb-1">
            Crie um post agora
          </h2>
          <p className="text-text-secondary max-w-md">
            Use IA pra transformar suas ideias em carrosséis profissionais em menos de 3 minutos.
          </p>
        </div>

        <Button asChild size="lg" className="group bg-gradient-purple hover:shadow-glow-lg text-white">
          <Link href="/dashboard/criar">
            <Sparkles className="w-4 h-4 mr-2" />
            Começar agora
            <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
