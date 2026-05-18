"use client"

import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { OnboardingStepper } from "@/components/onboarding-v2/stepper"
import { OnboardingFooter } from "@/components/onboarding-v2/footer"
import { StepShell } from "@/components/onboarding-v2/step-shell"
import { CountrySelect } from "@/components/onboarding-v2/country-select"
import { useOnboardingState } from "@/lib/onboarding/store"

export default function MarcaPage() {
  const router = useRouter()
  const { state, hydrated, update } = useOnboardingState()

  const nameValid = state.brandName.trim().length >= 2
  const descValid = state.description.trim().length >= 20
  const valid = hydrated && nameValid && descValid

  return (
    <>
      <OnboardingHeader stepIndex={2} />
      <OnboardingStepper current={2} />

      <main className="flex-1">
        <StepShell
          icon={Building2}
          title="Conte sobre sua marca"
          subtitle="Informações básicas para personalizarmos seu conteúdo"
        >
          <div className="flex flex-col gap-5">
            <div>
              <label className="onb-label">Nome da Marca</label>
              <input
                type="text"
                className="onb-input"
                placeholder="Ex: Amo Vacinas"
                value={state.brandName}
                onChange={(e) => update({ brandName: e.target.value })}
              />
            </div>

            <div>
              <label className="onb-label">Onde esta marca atua?</label>
              <p className="onb-helper" style={{ marginBottom: 8 }}>
                Usamos para mostrar as datas comemorativas certas do seu país
              </p>
              <CountrySelect
                code={state.country}
                name={state.countryName}
                onChange={(code, name) =>
                  update({ country: code, countryName: name })
                }
              />
            </div>

            <div>
              <label className="onb-label">O que a marca faz?</label>
              <p className="onb-helper" style={{ marginBottom: 8 }}>
                Descreva em poucas frases o negócio, produto ou serviço
              </p>
              <textarea
                className="onb-textarea"
                rows={4}
                placeholder="Descreva em poucas frases o negócio, produto ou serviço"
                value={state.description}
                onChange={(e) => update({ description: e.target.value })}
              />
              {state.description.length > 0 && !descValid && (
                <p
                  className="onb-helper"
                  style={{ color: "var(--onb-error)" }}
                >
                  Mínimo 20 caracteres ({state.description.trim().length}/20)
                </p>
              )}
            </div>
          </div>
        </StepShell>
      </main>

      <OnboardingFooter
        onBack={() => router.push("/onboarding/objetivo")}
        onContinue={() => router.push("/onboarding/publico")}
        continueDisabled={!valid}
      />
    </>
  )
}
