"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BillingCycle } from "@/app/pricing/page"
import { cycles } from "@/app/pricing/page"

interface PricingCardsProps {
  billingCycle: BillingCycle
}

const plans = [
  {
    name: "Starter",
    tagline: "Para criadores comecando",
    basePrice: 47,
    popular: false,
    cta: "Comecar com Starter",
    ctaVariant: "outline" as const,
    features: [
      "50 imagens por mes",
      "1 marca configurada",
      "Templates basicos",
      "Flux Schnell (qualidade boa)",
      "Marca d'agua no export",
      "Suporte por email",
    ],
    featurePrefix: "Inclui:",
  },
  {
    name: "Pro",
    tagline: "Para criadores serios e agencias",
    basePrice: 97,
    popular: true,
    cta: "Escolher Pro",
    ctaVariant: "default" as const,
    features: [
      "200 imagens por mes",
      "5 marcas configuradas",
      "Flux + Nano Banana 2 (premium)",
      "Sem marca d'agua",
      "Templates exclusivos",
      "Suporte prioritario (12h)",
      "Export em lote",
    ],
    featurePrefix: "Tudo do Starter, mais:",
  },
  {
    name: "Studio",
    tagline: "Para agencias e empresas",
    basePrice: 247,
    popular: false,
    cta: "Falar com vendas",
    ctaVariant: "outline" as const,
    features: [
      "800 imagens por mes",
      "Marcas ilimitadas",
      "Nano Banana Pro (qualidade maxima)",
      "API para automacao",
      "Equipe de ate 3 usuarios",
      "Gerente de conta dedicado",
      "White-label disponivel",
    ],
    featurePrefix: "Tudo do Pro, mais:",
  },
]

function calculatePrice(basePrice: number, cycle: BillingCycle) {
  const { discount, period } = cycles[cycle]
  const discountedPrice = basePrice * (1 - discount)
  const totalPrice = discountedPrice * period
  const savings = basePrice * period - totalPrice
  
  return {
    monthlyPrice: Math.round(discountedPrice),
    totalPrice: Math.round(totalPrice),
    savings: Math.round(savings),
    originalTotal: basePrice * period,
  }
}

export function PricingCards({ billingCycle }: PricingCardsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, index) => {
        const { monthlyPrice, totalPrice, savings, originalTotal } = calculatePrice(plan.basePrice, billingCycle)
        const cycle = cycles[billingCycle]
        const hasDiscount = cycle.discount > 0
        
        return (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-2xl p-8 border transition-all duration-300 ${
              plan.popular
                ? "border-primary/50 bg-card shadow-[0_0_60px_-15px_rgba(0,212,255,0.3)]"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-bold">
                MAIS POPULAR
              </Badge>
            )}
            
            <div className="mb-6">
              <h3 className={`text-xl font-semibold ${plan.popular ? "text-foreground" : "text-muted-foreground"}`}>
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={monthlyPrice}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-5xl font-bold tabular-nums"
                  >
                    R$ {monthlyPrice}
                  </motion.span>
                </AnimatePresence>
                <span className="text-lg text-muted-foreground">{cycle.label}</span>
              </div>
              
              {hasDiscount && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 space-y-1"
                >
                  <p className="text-sm text-muted-foreground line-through">
                    R$ {plan.basePrice} x {cycle.period}
                  </p>
                  <p className="text-sm text-green-500 font-medium">
                    Economize R$ {savings}
                  </p>
                </motion.div>
              )}
              
              <p className="text-xs text-muted-foreground mt-3">
                {hasDiscount ? `Cobrado R$ ${totalPrice} ${cycle.suffix.toLowerCase().replace('cobrado ', '')}` : cycle.suffix}
              </p>
            </div>

            <Button
              variant={plan.ctaVariant}
              className={`w-full mb-6 ${
                plan.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:border-primary hover:text-primary"
              }`}
            >
              {plan.cta}
            </Button>

            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                {plan.featurePrefix}
              </p>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
