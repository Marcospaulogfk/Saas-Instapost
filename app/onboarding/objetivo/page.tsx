"use client"

import { useRouter } from "next/navigation"
import {
  Target,
  TrendingUp,
  Sparkles,
  Heart,
  UserPlus,
  Check,
} from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { OnboardingStepper } from "@/components/onboarding-v2/stepper"
import { OnboardingFooter } from "@/components/onboarding-v2/footer"
import { StepShell } from "@/components/onboarding-v2/step-shell"
import { useOnboardingState } from "@/lib/onboarding/store"
import type { Objective } from "@/lib/onboarding/types"

const OPTIONS: Array<{
  key: Objective
  label: string
  description: string
  Icon: typeof TrendingUp
  bg: string
  fg: string
}> = [
  {
    key: "sell",
    label: "Vender mais produtos/serviços",
    description: "Aumentar vendas e conversões",
    Icon: TrendingUp,
    bg: "rgba(74, 222, 128, 0.12)",
    fg: "#4ade80",
  },
  {
    key: "authority",
    label: "Construir autoridade",
    description: "Se tornar referência no seu nicho",
    Icon: Sparkles,
    bg: "rgba(236, 72, 153, 0.12)",
    fg: "#ec4899",
  },
  {
    key: "engagement",
    label: "Aumentar engajamento",
    description: "Criar comunidade ativa",
    Icon: Heart,
    bg: "rgba(239, 68, 68, 0.12)",
    fg: "#ef4444",
  },
  {
    key: "leads",
    label: "Gerar leads qualificados",
    description: "Captar potenciais clientes",
    Icon: UserPlus,
    bg: "var(--onb-primary-dim)",
    fg: "var(--onb-primary)",
  },
]

export default function ObjetivoPage() {
  const router = useRouter()
  const { state, hydrated, update } = useOnboardingState()

  const back = () => {
    if (state.entryMethod === "manual" || !state.entryMethod) {
      router.push("/onboarding")
    } else {
      router.push("/onboarding/analyze")
    }
  }

  const next = () => router.push("/onboarding/marca")

  const toggleObjective = (key: Objective) => {
    const nextObjectives = state.objectives.includes(key)
      ? state.objectives.filter((o) => o !== key)
      : [...state.objectives, key]
    // `objective` (legado) acompanha o primeiro selecionado — é ele que vira
    // o objetivo principal no banco.
    update({ objectives: nextObjectives, objective: nextObjectives[0] ?? null })
  }

  const backLabel =
    state.entryMethod === "manual" || !state.entryMethod
      ? "Voltar"
      : "Voltar à Revisão"

  return (
    <>
      <OnboardingHeader stepIndex={1} />
      <OnboardingStepper current={1} />

      <main className="flex-1">
        <StepShell
          icon={Target}
          title="Quais são seus objetivos?"
          subtitle="Selecione um ou mais — o primeiro será o principal"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPTIONS.map((opt) => {
              const selected = state.objectives.includes(opt.key)
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => toggleObjective(opt.key)}
                  className="onb-card-selectable text-left"
                  data-selected={selected}
                  aria-pressed={selected}
                  style={{ padding: 20 }}
                >
                  {selected && (
                    <div
                      className="absolute right-3 top-3 flex items-center justify-center rounded-full"
                      style={{
                        width: 22,
                        height: 22,
                        background: "var(--onb-primary)",
                      }}
                    >
                      <Check size={12} color="white" strokeWidth={3} />
                    </div>
                  )}
                  <div
                    className="mb-4 flex items-center justify-center rounded-xl"
                    style={{
                      width: 44,
                      height: 44,
                      background: opt.bg,
                    }}
                  >
                    <opt.Icon size={22} color={opt.fg} strokeWidth={2} />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--onb-text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--onb-text-secondary)",
                    }}
                  >
                    {opt.description}
                  </div>
                </button>
              )
            })}
          </div>
        </StepShell>
      </main>

      <OnboardingFooter
        onBack={back}
        backLabel={backLabel}
        onContinue={next}
        continueDisabled={!hydrated || state.objectives.length === 0}
      />
    </>
  )
}
