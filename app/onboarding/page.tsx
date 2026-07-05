"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Globe, Pencil, ArrowRight, Loader2 } from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { useOnboardingState } from "@/lib/onboarding/store"

export default function OnboardingEntryPage() {
  const router = useRouter()
  const { state, update } = useOnboardingState()
  const [websiteOpen, setWebsiteOpen] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState(state.sourceUrl ?? "")
  const [submitting, setSubmitting] = useState(false)

  const handleWebsite = async () => {
    const url = websiteUrl.trim()
    if (!url) return
    setSubmitting(true)
    update({ entryMethod: "website", sourceUrl: url, instagramHandle: null })
    router.push("/onboarding/analyze")
  }

  const handleManual = () => {
    update({ entryMethod: "manual", sourceUrl: null, instagramHandle: null })
    router.push("/onboarding/objetivo")
  }

  return (
    <>
      <OnboardingHeader showStep={false} />

      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto w-full max-w-[560px] px-8 py-16"
        >
          <div className="mb-10 flex flex-col items-center text-center">
            <h1
              style={{
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "var(--onb-text-primary)",
                marginBottom: 10,
              }}
            >
              Vamos{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #9C5FF1 0%, #7320E6 60%, #5F14D6 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                agilizar
              </span>
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                color: "var(--onb-text-secondary)",
                maxWidth: 380,
              }}
            >
              Conecte sua marca e a IA preenche cores, tom de voz e identidade
              pra você. Em segundos.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Opção 1: Website */}
            <div className="onb-card-selectable" data-selected={websiteOpen}>
              <button
                type="button"
                onClick={() => setWebsiteOpen((v) => !v)}
                className="flex w-full items-center gap-4 text-left"
              >
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 44,
                    height: 44,
                    background: "var(--onb-bg-elevated)",
                    border: "0.5px solid var(--onb-border-default)",
                  }}
                >
                  <Globe size={20} style={{ color: "var(--onb-primary-light)" }} />
                </div>
                <div className="flex-1">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--onb-text-primary)",
                    }}
                  >
                    Tenho um Website
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--onb-text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    Cole a URL e a IA analisa cores, tom de voz e mais
                  </div>
                </div>
              </button>
              {websiteOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex flex-col gap-3 overflow-hidden"
                >
                  <input
                    type="url"
                    className="onb-input"
                    placeholder="https://suamarca.com.br"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="onb-btn-primary self-end"
                    disabled={!websiteUrl.trim() || submitting}
                    onClick={handleWebsite}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        Analisar
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Divisor */}
            <div className="my-4 flex items-center gap-3">
              <div
                className="h-px flex-1"
                style={{ background: "var(--onb-border-subtle)" }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--onb-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                ou
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "var(--onb-border-subtle)" }}
              />
            </div>

            {/* Opção 3: Manual */}
            <button
              type="button"
              onClick={handleManual}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-4 transition-colors"
              style={{
                background: "transparent",
                border: "1px dashed var(--onb-border-default)",
                color: "var(--onb-text-secondary)",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--onb-primary)"
                e.currentTarget.style.color = "var(--onb-text-primary)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--onb-border-default)"
                e.currentTarget.style.color = "var(--onb-text-secondary)"
              }}
            >
              <Pencil size={14} />
              Preencher manualmente
            </button>
          </div>
        </motion.div>
      </main>
    </>
  )
}
