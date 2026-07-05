"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const addOns = [
  {
    name: "Boost",
    tokens: 300,
    price: 34,
    equivalencia: "≈ 60 imagens normais",
    popular: false,
  },
  {
    name: "Pro Pack",
    tokens: 800,
    price: 79,
    equivalencia: "≈ 160 imagens normais",
    popular: true,
  },
  {
    name: "Power Pack",
    tokens: 2000,
    price: 179,
    equivalencia: "≈ 400 imagens normais",
    popular: false,
  },
]

export function AddOns() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto px-4 py-16"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Precisa de mais tokens?</h2>
        <p className="text-muted-foreground">
          Comprou o plano e o saldo acabou? Pegue um pacote avulso, sem compromisso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {addOns.map((addon, index) => (
          <motion.div
            key={addon.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-xl p-6 border bg-card transition-all hover:border-primary/30 ${
              addon.popular ? "border-primary/50" : "border-border"
            }`}
          >
            {addon.popular && (
              <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs">
                Melhor valor
              </Badge>
            )}

            <h3 className="text-lg font-semibold mb-1">{addon.name}</h3>
            <p className="text-2xl font-bold mb-1">
              {addon.tokens.toLocaleString('pt-BR')} tokens
            </p>
            <p className="text-3xl font-bold text-primary mb-2">
              R$ {addon.price}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {addon.equivalencia}
            </p>
            <Button variant="outline" className="w-full hover:border-primary hover:text-primary">
              Comprar
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
