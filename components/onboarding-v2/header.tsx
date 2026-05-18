"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { SyncPostLogo } from "./logo"
import { ExitDialog } from "./exit-dialog"
import { clearOnboardingStorage } from "@/lib/onboarding/store"

export function OnboardingHeader({
  stepIndex,
  showStep = true,
}: {
  stepIndex?: number
  showStep?: boolean
}) {
  const router = useRouter()
  const [exitOpen, setExitOpen] = useState(false)

  const handleExit = () => {
    clearOnboardingStorage()
    router.push("/dashboard")
  }

  return (
    <>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--onb-bg-surface)",
          borderBottom: "0.5px solid var(--onb-border-subtle)",
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-5">
          <div className="flex flex-col gap-0.5">
            <SyncPostLogo />
            <span
              style={{
                fontSize: 11,
                color: "var(--onb-text-tertiary)",
                marginLeft: 34,
              }}
            >
              {showStep
                ? "Configure sua conta em 5 passos simples"
                : "Configure sua conta rapidamente"}
            </span>
          </div>

          {showStep && (
            <div className="flex items-center gap-4">
              <span
                style={{
                  fontSize: 12,
                  color: "var(--onb-text-secondary)",
                  fontWeight: 500,
                }}
              >
                Passo {stepIndex} de 5
              </span>
              <button
                type="button"
                onClick={() => setExitOpen(true)}
                aria-label="Sair do onboarding"
                className="flex items-center justify-center rounded-md transition-colors"
                style={{
                  width: 28,
                  height: 28,
                  color: "var(--onb-text-secondary)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--onb-bg-card)"
                  e.currentTarget.style.color = "var(--onb-text-primary)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "var(--onb-text-secondary)"
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </header>
      <ExitDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        onConfirm={handleExit}
      />
    </>
  )
}
