"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BillingCycle } from "@/app/pricing/page"
import { cycles } from "@/app/pricing/page"
import {
  planTokensForCycle,
  TOKEN_COST,
  type BillingCycleId,
  type Plan,
} from "@/lib/tokens"

interface PricingCardsProps {
  billingCycle: BillingCycle
}

/**
 * Linha de tokens do card. Sai de PLAN_TOKENS_BY_CYCLE porque o grant ENCOLHE
 * nos ciclos com desconto — o token e quem trava o COGS, entao manter 1.000
 * no anual (-40%) entregaria o mesmo custo por 60% da receita. Nunca escrever
 * esse numero a mao aqui.
 *
 * O "≈" usa o carrossel completo de 7 slides (41 tokens: 4 roteiro + 25 capa
 * + 6x2 miolo) e o roteiro sozinho (4 tokens).
 */
function tokenFeature(
  id: Exclude<Plan, "trial">,
  cycle: BillingCycleId,
): string {
  const tk = planTokensForCycle(id, cycle)
  const completos = Math.floor(tk / 41)
  const roteiros = Math.floor(tk / TOKEN_COST.textOnly)
  return `${tk.toLocaleString("pt-BR")} tokens/mes (≈ ${completos} carrosseis completos ou ${roteiros} roteiros)`
}

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    tagline: "Para criadores comecando",
    basePrice: 47,
    popular: false,
    cta: "Comecar com Starter",
    ctaVariant: "outline" as const,
    features: [
      "1 marca configurada",
      "Templates basicos",
      "Capa em Nano Banana 2",
      "Marca d'agua no export",
      "Suporte por email",
    ],
    featurePrefix: "Inclui:",
  },
  {
    id: "pro" as const,
    name: "Pro",
    tagline: "Para criadores serios e agencias",
    basePrice: 97,
    popular: true,
    cta: "Escolher Pro",
    ctaVariant: "default" as const,
    features: [
      "5 marcas configuradas",
      "Sem marca d'agua",
      "Templates exclusivos",
      "Suporte prioritario (12h)",
      "Export em lote",
    ],
    featurePrefix: "Tudo do Starter, mais:",
  },
  {
    id: "studio" as const,
    name: "Studio",
    tagline: "Para agencias e empresas",
    basePrice: 247,
    popular: false,
    cta: "Falar com vendas",
    ctaVariant: "outline" as const,
    features: [
      "Marcas ilimitadas",
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
                {[tokenFeature(plan.id, billingCycle), ...plan.features].map(
                  (feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
