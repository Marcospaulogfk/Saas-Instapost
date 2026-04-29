"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { OnboardingProgress } from "@/components/onboarding/progress"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { UrlInputStep } from "@/components/onboarding/url-input-step"
import { AnalysisStep } from "@/components/onboarding/analysis-step"
import {
  ReviewStep,
  type ReviewFormData,
} from "@/components/onboarding/review-step"
import { SuccessStep } from "@/components/onboarding/success-step"
import { createBrand } from "@/app/actions/brands"

export type OnboardingStep =
  | "welcome"
  | "url"
  | "analysis"
  | "review"
  | "success"

interface BrandAnalysis {
  name: string
  description: string
  target_audience: string
  tone_of_voice: string
  visual_style: string
  main_objective: "sell" | "inform" | "engage" | "community"
  brand_colors: string[]
  instagram_handle: string
}

interface AnalyzeApiResponse {
  website_url: string
  og_image: string | null
  analysis: BrandAnalysis
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>("welcome")
  const [inputMethod, setInputMethod] = useState<"url" | "manual" | null>(null)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedBrand, setSavedBrand] = useState<{
    id: string
    name: string
    colors: string[]
    tones: string
  } | null>(null)

  const getStepIndex = () => {
    if (step === "url") return 0
    if (step === "analysis") return 1
    if (step === "review") return 2
    if (step === "success") return 3
    return 0
  }

  const handleSelectMethod = (method: "url" | "manual") => {
    setError(null)
    setInputMethod(method)
    if (method === "url") {
      setStep("url")
    } else {
      setAnalysis(null)
      setStep("review")
    }
  }

  const handleUrlSubmit = async (url: string) => {
    setError(null)
    setStep("analysis")
    try {
      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "erro desconhecido")
        setStep("url")
        return
      }
      const payload = data as AnalyzeApiResponse
      setWebsiteUrl(payload.website_url)
      setAnalysis(payload.analysis)
      setStep("review")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro de rede"
      setError(msg)
      setStep("url")
    }
  }

  const handleReviewSubmit = async (form: ReviewFormData) => {
    setError(null)
    const result = await createBrand({
      name: form.name,
      description: form.description,
      website_url: websiteUrl || undefined,
      instagram_handle: form.instagram_handle || undefined,
      target_audience: form.target_audience,
      tone_of_voice: form.tone_of_voice,
      visual_style: form.visual_style,
      main_objective: form.main_objective,
      brand_colors: form.brand_colors,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSavedBrand({
      id: result.brandId,
      name: form.name,
      colors: form.brand_colors,
      tones: form.tone_of_voice,
    })
    setStep("success")
    router.refresh()
  }

  const handleBack = () => {
    setError(null)
    if (step === "url") setStep("welcome")
    else if (step === "review" && inputMethod === "url") setStep("url")
    else if (step === "review" && inputMethod === "manual") setStep("welcome")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative w-full max-w-[720px]">
        {step !== "welcome" && step !== "success" && (
          <OnboardingProgress currentStep={getStepIndex()} />
        )}

        {error && (step === "url" || step === "review") && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-2xl p-12"
          >
            {step === "welcome" && (
              <WelcomeStep onSelectMethod={handleSelectMethod} />
            )}
            {step === "url" && (
              <UrlInputStep onBack={handleBack} onSubmit={handleUrlSubmit} />
            )}
            {step === "analysis" && <AnalysisStep />}
            {step === "review" && (
              <ReviewStep
                initial={analysis}
                onBack={handleBack}
                onSubmit={handleReviewSubmit}
              />
            )}
            {step === "success" && savedBrand && (
              <SuccessStep
                brandName={savedBrand.name}
                brandColors={savedBrand.colors}
                tones={savedBrand.tones}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
