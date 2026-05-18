"use client"

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"

export function OnboardingFooter({
  onBack,
  onContinue,
  backLabel = "Voltar",
  continueLabel = "Continuar",
  continueDisabled = false,
  isLoading = false,
  isFinal = false,
}: {
  onBack?: () => void
  onContinue?: () => void
  backLabel?: string
  continueLabel?: string
  continueDisabled?: boolean
  isLoading?: boolean
  isFinal?: boolean
}) {
  return (
    <footer
      className="sticky bottom-0 z-20"
      style={{
        background: "var(--onb-bg-surface)",
        borderTop: "0.5px solid var(--onb-border-subtle)",
      }}
    >
      <div className="mx-auto flex max-w-[800px] items-center justify-between px-8 py-5">
        {onBack ? (
          <button
            type="button"
            className="onb-btn-ghost"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft size={14} />
            {backLabel}
          </button>
        ) : (
          <span />
        )}

        {onContinue && (
          <button
            type="button"
            className="onb-btn-primary"
            onClick={onContinue}
            disabled={continueDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                {continueLabel}
                {isFinal ? <Check size={14} /> : <ArrowRight size={14} />}
              </>
            )}
          </button>
        )}
      </div>
    </footer>
  )
}
