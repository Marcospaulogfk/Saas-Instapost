"use client"

import { useRouter } from "next/navigation"
import { Fingerprint } from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { OnboardingStepper } from "@/components/onboarding-v2/stepper"
import { OnboardingFooter } from "@/components/onboarding-v2/footer"
import { StepShell } from "@/components/onboarding-v2/step-shell"
import { useOnboardingState } from "@/lib/onboarding/store"

const TONES = [
  "Formal",
  "Descontraído",
  "Inspirador",
  "Técnico",
  "Divertido",
  "Autoral",
  "Acolhedor",
  "Direto",
  "Provocador",
  "Educacional",
]

export default function IdentidadePage() {
  const router = useRouter()
  const { state, hydrated, update } = useOnboardingState()

  const toggleTone = (tone: string) => {
    const next = state.tones.includes(tone)
      ? state.tones.filter((t) => t !== tone)
      : [...state.tones, tone]
    update({ tones: next })
  }

  const valid = hydrated && state.tones.length > 0

  return (
    <>
      <OnboardingHeader stepIndex={4} />
      <OnboardingStepper current={4} />

      <main className="flex-1">
        <StepShell
          icon={Fingerprint}
          title="Como sua marca soa?"
          subtitle="Defina o tom de voz da marca"
        >
          <div className="flex flex-col gap-8">
            {/* Tom de voz */}
            <section>
              <label className="onb-label">
                Tom de voz{" "}
                <span
                  style={{
                    color: "var(--onb-text-tertiary)",
                    fontWeight: 400,
                  }}
                >
                  (selecione 1 ou mais)
                </span>
              </label>
              <p className="onb-helper" style={{ marginBottom: 12 }}>
                Como a marca se expressa nos posts
              </p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => {
                  const selected = state.tones.includes(tone)
                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => toggleTone(tone)}
                      aria-pressed={selected}
                      className="rounded-full transition-all"
                      style={{
                        padding: "8px 14px",
                        fontSize: 12,
                        fontWeight: 500,
                        background: selected
                          ? "var(--onb-primary)"
                          : "var(--onb-bg-card)",
                        color: selected
                          ? "#ffffff"
                          : "var(--onb-text-secondary)",
                        border: `0.5px solid ${selected ? "var(--onb-primary)" : "var(--onb-border-default)"}`,
                        cursor: "pointer",
                      }}
                    >
                      {tone}
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        </StepShell>
      </main>

      <OnboardingFooter
        onBack={() => router.push("/onboarding/publico")}
        onContinue={() => router.push("/onboarding/estilo")}
        continueDisabled={!valid}
      />
    </>
  )
}
