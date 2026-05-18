"use client"

import { useRouter } from "next/navigation"
import {
  Fingerprint,
  BookOpen,
  Shield,
  Heart,
  Wand2,
  Smile,
  Compass,
  Check,
} from "lucide-react"
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

const ARCHETYPES: Array<{
  key: string
  label: string
  description: string
  Icon: typeof BookOpen
}> = [
  {
    key: "sage",
    label: "Sábio",
    description: "Compartilha conhecimento, fala com autoridade",
    Icon: BookOpen,
  },
  {
    key: "hero",
    label: "Herói",
    description: "Inspira ação e supera desafios",
    Icon: Shield,
  },
  {
    key: "caregiver",
    label: "Cuidador",
    description: "Protege, acolhe e ajuda",
    Icon: Heart,
  },
  {
    key: "magician",
    label: "Criador",
    description: "Transforma e revela o novo",
    Icon: Wand2,
  },
  {
    key: "everyman",
    label: "Próximo",
    description: "Amigo do dia a dia, fala de igual pra igual",
    Icon: Smile,
  },
  {
    key: "explorer",
    label: "Explorador",
    description: "Aventura, descoberta, liberdade",
    Icon: Compass,
  },
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

  const valid = hydrated && state.tones.length > 0 && state.archetype != null

  return (
    <>
      <OnboardingHeader stepIndex={4} />
      <OnboardingStepper current={4} />

      <main className="flex-1">
        <StepShell
          icon={Fingerprint}
          title="Como sua marca soa?"
          subtitle="Defina o tom de voz e o arquétipo da marca"
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

            {/* Arquétipo */}
            <section>
              <label className="onb-label">Arquétipo de marca</label>
              <p className="onb-helper" style={{ marginBottom: 12 }}>
                A personalidade que sua marca representa
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ARCHETYPES.map((arc) => {
                  const selected = state.archetype === arc.key
                  return (
                    <button
                      key={arc.key}
                      type="button"
                      onClick={() => update({ archetype: arc.key })}
                      aria-pressed={selected}
                      className="onb-card-selectable text-left"
                      data-selected={selected}
                    >
                      {selected && (
                        <div
                          className="absolute right-3 top-3 flex items-center justify-center rounded-full"
                          style={{
                            width: 20,
                            height: 20,
                            background: "var(--onb-primary)",
                          }}
                        >
                          <Check size={11} color="white" strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className="flex shrink-0 items-center justify-center rounded-lg"
                          style={{
                            width: 36,
                            height: 36,
                            background: "var(--onb-primary-dim)",
                            border: "0.5px solid var(--onb-primary-border)",
                          }}
                        >
                          <arc.Icon
                            size={18}
                            style={{ color: "var(--onb-primary-light)" }}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--onb-text-primary)",
                              marginBottom: 2,
                            }}
                          >
                            {arc.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--onb-text-secondary)",
                              lineHeight: 1.4,
                            }}
                          >
                            {arc.description}
                          </div>
                        </div>
                      </div>
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
