"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { isBillingCycle, type BillingCycle as Cycle } from "@/lib/billing/plans"
import { PricingHeader } from "@/components/pricing/pricing-header"
import { BillingToggle } from "@/components/pricing/billing-toggle"
import { PricingCards } from "@/components/pricing/pricing-cards"
import { FeatureComparison } from "@/components/pricing/feature-comparison"
import { AddOns } from "@/components/pricing/add-ons"
import { PricingFAQ } from "@/components/pricing/pricing-faq"
import { FinalCTA } from "@/components/pricing/final-cta"
import { TrustFooter } from "@/components/pricing/trust-footer"
import { EnterpriseCard } from "@/components/pricing/enterprise-card"

/**
 * Ciclos e preços vêm de lib/billing/plans.ts (só mensal e anual; o anual
 * mexe no preço, não nos tokens). Esta página não guarda número nenhum.
 */
export type BillingCycle = Cycle

function PricingPageInner() {
  const params = useSearchParams()
  const cicloInicial = params.get("ciclo")
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    isBillingCycle(cicloInicial) ? cicloInicial : "monthly",
  )
  const cancelado = params.get("checkout") === "cancelado"

  useEffect(() => {
    const c = params.get("ciclo")
    if (isBillingCycle(c)) setBillingCycle(c)
  }, [params])

  return (
    <main className="min-h-screen bg-background">
      <PricingHeader />
      <BillingToggle selected={billingCycle} onSelect={setBillingCycle} />
      {cancelado && (
        <p className="mx-auto mb-6 max-w-xl rounded-lg border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          Checkout cancelado. Nada foi cobrado; escolha um plano quando quiser.
        </p>
      )}
      <PricingCards
        billingCycle={billingCycle}
        autoStartPlan={params.get("plano")}
      />

      <div className="max-w-3xl mx-auto px-4 pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Tokens são a moeda do Nexus Content: roteiro + legenda do carrossel
          = 8 tokens, capa = 20, imagem por slide = 2, post único = 29. Você
          decide em cada peça se quer imagem de IA. Editar o que foi gerado é
          sempre grátis. Os tokens por mês são os mesmos no plano mensal e no
          anual.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="text-green-500 mr-4">&#10003; Cancele quando quiser</span>
          <span className="text-green-500 mr-4">&#10003; Garantia de 7 dias</span>
          <span className="text-green-500">&#10003; Cobranca em BRL</span>
        </p>
      </div>

      <EnterpriseCard />
      <FeatureComparison />
      <AddOns />
      <PricingFAQ />
      <FinalCTA />
      <TrustFooter />
    </main>
  )
}

/** useSearchParams exige Suspense no build estático. */
export default function PricingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <PricingPageInner />
    </Suspense>
  )
}
