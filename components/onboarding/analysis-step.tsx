"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Loader2, Circle } from "lucide-react"

const analysisSteps = [
  "Acessando o site...",
  "Extraindo conteudo...",
  "Identificando tom de voz...",
  "Definindo publico-alvo...",
  "Capturando estilo visual...",
]

export function AnalysisStep() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          setCompletedSteps((completed) => [...completed, prev])
          return prev + 1
        }
        return prev
      })
    }, 700)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center py-8">
      {/* Animated icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8"
      >
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </motion.div>

      {/* Title */}
      <h2 className="text-3xl font-bold mb-2">Estamos analisando sua marca...</h2>
      <p className="text-muted-foreground mb-12">Isso leva cerca de 30 segundos</p>

      {/* Progress checklist */}
      <div className="max-w-xs mx-auto space-y-4 text-left">
        {analysisSteps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            {completedSteps.includes(index) ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" />
              </motion.div>
            ) : currentStep === index ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/40" />
            )}
            <span
              className={
                completedSteps.includes(index)
                  ? "text-foreground"
                  : currentStep === index
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-12">
        Powered by Claude AI
      </p>
    </div>
  )
}
