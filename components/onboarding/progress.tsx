"use client"

import { Check } from "lucide-react"

interface OnboardingProgressProps {
  currentStep: number
}

const steps = ["Inicio", "Analise", "Confirmacao", "Pronto"]

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-2 ${
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>

            {/* Line */}
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-0.5 mx-2 mb-6 ${
                  index < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
