"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, Plus, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function SuccessStep() {
  return (
    <div className="text-center py-8">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-8"
      >
        <Check className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      {/* Title */}
      <h2 className="text-4xl font-bold mb-2">Marca criada com sucesso!</h2>
      <p className="text-muted-foreground text-lg mb-12">
        Tudo pronto para gerar conteudo viral em segundos
      </p>

      {/* Brand summary card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-sm mx-auto rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-6 mb-12"
      >
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h3 className="text-xl font-bold mb-3">Culturize-se</h3>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Badge variant="secondary">Casual</Badge>
          <Badge variant="secondary">Inspirador</Badge>
          <Badge variant="secondary">Cinematografico</Badge>
        </div>

        <div className="flex justify-center gap-2">
          {["#F97316", "#DC2626", "#FBBF24", "#000000", "#FFFFFF"].map((color) => (
            <div
              key={color}
              className="w-6 h-6 rounded-full border border-border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </motion.div>

      {/* CTAs */}
      <div className="space-y-3 max-w-sm mx-auto">
        <Button asChild size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard">
            Ir para o painel
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full">
          <Link href="/dashboard/criar">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeiro carrossel
          </Link>
        </Button>
      </div>

      {/* Tip */}
      <div className="flex items-center justify-center gap-2 mt-12 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <span>Dica: Comece com um tema que voce domina para ver a IA brilhando</span>
      </div>
    </div>
  )
}
