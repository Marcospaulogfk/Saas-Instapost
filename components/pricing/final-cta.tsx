"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-20 text-center"
    >
      <h2 className="text-4xl font-bold mb-4 text-balance">
        Pronto para criar carrosséis virais?
      </h2>
      <p className="text-xl text-muted-foreground mb-8">
        Comece grátis com 1 carrossel completo. Sem cartão de crédito.
      </p>
      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
        Começar agora
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.section>
  )
}
