"use client"

import { motion } from "framer-motion"
import type { BillingCycle } from "@/app/pricing/page"
import { Badge } from "@/components/ui/badge"
import { Flame } from "lucide-react"

interface BillingToggleProps {
  selected: BillingCycle
  onSelect: (cycle: BillingCycle) => void
}

const options: { value: BillingCycle; label: string; discount?: string; hot?: boolean }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral", discount: "-17%" },
  { value: "semiannual", label: "Semestral", discount: "-30%" },
  { value: "annual", label: "Anual", discount: "-40%", hot: true },
]

export function BillingToggle({ selected, onSelect }: BillingToggleProps) {
  return (
    <div className="flex justify-center mb-12 px-4">
      <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-surface/50 backdrop-blur-sm border border-border">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selected === option.value
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {selected === option.value && (
              <motion.div
                layoutId="billing-pill"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
            {option.discount && (
              <Badge 
                variant="secondary" 
                className={`relative z-10 text-xs ${
                  selected === option.value 
                    ? "bg-black/20 text-white" 
                    : "bg-primary/10 text-primary"
                }`}
              >
                {option.discount}
              </Badge>
            )}
            {option.hot && selected === option.value && (
              <span className="relative z-10 flex items-center gap-1 text-xs">
                <Flame className="w-3 h-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
