"use client"

import { useState } from "react"
import { PricingHeader } from "@/components/pricing/pricing-header"
import { BillingToggle } from "@/components/pricing/billing-toggle"
import { PricingCards } from "@/components/pricing/pricing-cards"
import { FeatureComparison } from "@/components/pricing/feature-comparison"
import { AddOns } from "@/components/pricing/add-ons"
import { PricingFAQ } from "@/components/pricing/pricing-faq"
import { FinalCTA } from "@/components/pricing/final-cta"
import { TrustFooter } from "@/components/pricing/trust-footer"
import { EnterpriseCard } from "@/components/pricing/enterprise-card"

export type BillingCycle = "monthly" | "quarterly" | "semiannual" | "annual"

export const cycles = {
  monthly: { discount: 0, period: 1, label: "/mês", suffix: "Cobrado mensalmente" },
  quarterly: { discount: 0.17, period: 3, label: "/mês", suffix: "Cobrado a cada 3 meses" },
  semiannual: { discount: 0.30, period: 6, label: "/mês", suffix: "Cobrado a cada 6 meses" },
  annual: { discount: 0.40, period: 12, label: "/mês", suffix: "Cobrado anualmente" }
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")

  return (
    <main className="min-h-screen bg-background">
      <PricingHeader />
      <BillingToggle selected={billingCycle} onSelect={setBillingCycle} />
      <PricingCards billingCycle={billingCycle} />
      
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
