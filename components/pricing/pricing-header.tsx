"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export function PricingHeader() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-20 text-center"
    >
      <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/10">
        Precos simples e transparentes
      </Badge>
      <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4 text-balance">
        Escolha seu plano
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
        Comece gratis. Cancele quando quiser. Sem letras miudas.
      </p>
    </motion.header>
  )
}
