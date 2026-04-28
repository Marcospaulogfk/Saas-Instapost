"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { OnboardingProgress } from "@/components/onboarding/progress"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { UrlInputStep } from "@/components/onboarding/url-input-step"
import { AnalysisStep } from "@/components/onboarding/analysis-step"
import { ReviewStep } from "@/components/onboarding/review-step"
import { SuccessStep } from "@/components/onboarding/success-step"

export type OnboardingStep = "welcome" | "url" | "analysis" | "review" | "success"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [inputMethod, setInputMethod] = useState<"url" | "manual" | null>(null)

  const getStepIndex = () => {
    const steps: OnboardingStep[] = ["welcome", "url", "analysis", "review", "success"]
    if (currentStep === "url") return 0
    if (currentStep === "analysis") return 1
    if (currentStep === "review") return 2
    if (currentStep === "success") return 3
    return 0
  }

  const handleSelectMethod = (method: "url" | "manual") => {
    setInputMethod(method)
    if (method === "url") {
      setCurrentStep("url")
    } else {
      setCurrentStep("review")
    }
  }

  const handleUrlSubmit = () => {
    setCurrentStep("analysis")
    // Simulate analysis
    setTimeout(() => {
      setCurrentStep("review")
    }, 4000)
  }

  const handleReviewSubmit = () => {
    setCurrentStep("success")
  }

  const handleBack = () => {
    if (currentStep === "url") setCurrentStep("welcome")
    if (currentStep === "review" && inputMethod === "url") setCurrentStep("url")
    if (currentStep === "review" && inputMethod === "manual") setCurrentStep("welcome")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Grid pattern background */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative w-full max-w-[720px]">
        {/* Progress bar */}
        {currentStep !== "welcome" && currentStep !== "success" && (
          <OnboardingProgress currentStep={getStepIndex()} />
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-2xl p-12"
          >
            {currentStep === "welcome" && (
              <WelcomeStep onSelectMethod={handleSelectMethod} />
            )}
            {currentStep === "url" && (
              <UrlInputStep onBack={handleBack} onSubmit={handleUrlSubmit} />
            )}
            {currentStep === "analysis" && <AnalysisStep />}
            {currentStep === "review" && (
              <ReviewStep onBack={handleBack} onSubmit={handleReviewSubmit} />
            )}
            {currentStep === "success" && <SuccessStep />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
