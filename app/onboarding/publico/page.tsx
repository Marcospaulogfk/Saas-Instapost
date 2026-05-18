"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Lightbulb, ChevronDown } from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { OnboardingStepper } from "@/components/onboarding-v2/stepper"
import { OnboardingFooter } from "@/components/onboarding-v2/footer"
import { StepShell } from "@/components/onboarding-v2/step-shell"
import { useOnboardingState } from "@/lib/onboarding/store"

export default function PublicoPage() {
  const router = useRouter()
  const { state, hydrated, update } = useOnboardingState()
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(state.pains || state.desires),
  )

  const valid = hydrated && state.idealCustomer.trim().length >= 10

  return (
    <>
      <OnboardingHeader stepIndex={3} />
      <OnboardingStepper current={3} />

      <main className="flex-1">
        <StepShell
          icon={Users}
          title="Quem é seu público-alvo?"
          subtitle="Descreva as pessoas que você quer alcançar"
        >
          <div className="flex flex-col gap-5">
            <div>
              <label className="onb-label">Quem é o cliente ideal?</label>
              <p className="onb-helper" style={{ marginBottom: 8 }}>
                Idade, gênero, localização, profissão, estilo de vida
              </p>
              <textarea
                className="onb-textarea"
                rows={4}
                placeholder="Famílias e indivíduos preocupados com a saúde..."
                value={state.idealCustomer}
                onChange={(e) => update({ idealCustomer: e.target.value })}
              />
            </div>

            {/* Collapsible avançado */}
            <div
              className="rounded-xl"
              style={{
                background: "var(--onb-bg-card)",
                border: "0.5px solid var(--onb-border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: 32,
                    height: 32,
                    background: "var(--onb-primary-dim)",
                    border: "0.5px solid var(--onb-primary-border)",
                  }}
                >
                  <Lightbulb
                    size={16}
                    style={{ color: "var(--onb-primary-light)" }}
                  />
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--onb-text-primary)",
                    }}
                  >
                    Configurações avançadas
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--onb-text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Esses detalhes ajudam a IA a criar conteúdo ainda melhor,
                    mas você pode preencher depois.
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    color: "var(--onb-text-tertiary)",
                    transform: advancedOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 200ms",
                  }}
                />
              </button>

              <AnimatePresence>
                {advancedOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex flex-col gap-5 p-4 pt-0"
                      style={{
                        borderTop: "0.5px solid var(--onb-border-subtle)",
                      }}
                    >
                      <div style={{ marginTop: 16 }}>
                        <label className="onb-label">
                          Quais são as dores e problemas desse público?{" "}
                          <span
                            style={{
                              color: "var(--onb-text-tertiary)",
                              fontWeight: 400,
                            }}
                          >
                            (opcional)
                          </span>
                        </label>
                        <p className="onb-helper" style={{ marginBottom: 8 }}>
                          O que incomoda? O que falta? Que problema precisam
                          resolver?
                        </p>
                        <textarea
                          className="onb-textarea"
                          rows={3}
                          value={state.pains}
                          onChange={(e) => update({ pains: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="onb-label">
                          Quais são os desejos e sonhos?{" "}
                          <span
                            style={{
                              color: "var(--onb-text-tertiary)",
                              fontWeight: 400,
                            }}
                          >
                            (opcional)
                          </span>
                        </label>
                        <p className="onb-helper" style={{ marginBottom: 8 }}>
                          O que querem alcançar? Como querem se sentir?
                        </p>
                        <textarea
                          className="onb-textarea"
                          rows={3}
                          value={state.desires}
                          onChange={(e) =>
                            update({ desires: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </StepShell>
      </main>

      <OnboardingFooter
        onBack={() => router.push("/onboarding/marca")}
        onContinue={() => router.push("/onboarding/identidade")}
        continueDisabled={!valid}
      />
    </>
  )
}
