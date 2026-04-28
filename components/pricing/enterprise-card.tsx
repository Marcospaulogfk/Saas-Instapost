"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function EnterpriseCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto px-4 py-16"
    >
      <div className="rounded-2xl p-8 md:p-12 bg-gradient-to-br from-surface to-surface/50 border border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Precisa de mais?
            </h3>
            <p className="text-muted-foreground max-w-lg">
              Para volumes acima de 10.000 imagens/mes ou necessidades especificas, fale com nosso time.
            </p>
          </div>
          <Button variant="outline" className="shrink-0 hover:border-primary hover:text-primary">
            Agendar conversa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
