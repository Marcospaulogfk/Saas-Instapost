"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Globe,
  Target,
  Users,
  Network,
  MessageCircle,
  Check,
  Pencil,
  ChevronDown,
  X,
  Loader2,
  Info,
} from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { useOnboardingState } from "@/lib/onboarding/store"

interface AnalysisPayload {
  website_url: string
  og_image: string | null
  analysis: {
    name: string
    description: string
    target_audience: string
    tone_of_voice: string
    visual_style: string
    main_objective: "sell" | "inform" | "engage" | "community"
    brand_colors: string[]
    instagram_handle: string
  }
  logo?: {
    found: boolean
    url: string | null
    description: string | null
  }
  colors?: {
    primary: string
    secondary: string
    accent: string
  } | null
}

const OBJECTIVE_MAP: Record<
  string,
  "sell" | "authority" | "engagement" | "leads"
> = {
  sell: "sell",
  inform: "authority",
  engage: "engagement",
  community: "leads",
}

type ItemKey = "basic" | "audience" | "visual" | "voice"

export default function OnboardingAnalyzePage() {
  const router = useRouter()
  const { state, hydrated, update } = useOnboardingState()
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [openItem, setOpenItem] = useState<ItemKey | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    if (startedRef.current) return
    startedRef.current = true

    if (!state.entryMethod || state.entryMethod === "manual") {
      router.replace("/onboarding")
      return
    }

    const url =
      state.entryMethod === "website"
        ? state.sourceUrl
        : state.instagramHandle
          ? `https://instagram.com/${state.instagramHandle}`
          : null

    if (!url) {
      router.replace("/onboarding")
      return
    }

    void runAnalysis(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  async function runAnalysis(url: string) {
    setStatus("loading")
    setErrorMsg(null)
    try {
      const res = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? "Não conseguimos analisar a marca.")
        setStatus("error")
        return
      }
      const payload = data as AnalysisPayload
      const a = payload.analysis
      const logoUrl = payload.logo?.url ?? payload.og_image
      const multimodalColors = payload.colors
      const colorsArr = multimodalColors
        ? [
            multimodalColors.primary,
            multimodalColors.secondary,
            multimodalColors.accent,
          ]
        : (a.brand_colors ?? [])

      update({
        sourceUrl: payload.website_url,
        detectedLogoUrl: logoUrl,
        extractedColors: colorsArr,
        brandName: a.name ?? "",
        description: a.description ?? "",
        idealCustomer: a.target_audience ?? "",
        tones: a.tone_of_voice
          ? a.tone_of_voice.split(/,\s*/).filter(Boolean)
          : [],
        visualStyle: a.visual_style ?? "",
        objective: OBJECTIVE_MAP[a.main_objective] ?? null,
        objectives: OBJECTIVE_MAP[a.main_objective]
          ? [OBJECTIVE_MAP[a.main_objective]!]
          : [],
        primaryColor: colorsArr[0] ?? "#7320E6",
        secondaryColor: colorsArr[1] ?? "#5B8FF9",
        accentColor: colorsArr[2] ?? "#E2D5FF",
        instagramHandle: a.instagram_handle || state.instagramHandle,
      })
      setStatus("ready")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 6000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de rede"
      setErrorMsg(msg)
      setStatus("error")
    }
  }

  const hasLogo = !!state.detectedLogoUrl
  const hasColors = state.extractedColors.length > 0

  return (
    <>
      <OnboardingHeader showStep={false} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto flex w-full max-w-[420px] flex-col items-center px-8 py-24 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="onb-icon-circle mb-6"
                style={{ width: 64, height: 64 }}
              >
                <Sparkles size={28} strokeWidth={2} />
              </motion.div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--onb-text-primary)",
                  marginBottom: 8,
                }}
              >
                Analisando sua marca...
              </h1>
              <p style={{ fontSize: 13, color: "var(--onb-text-secondary)" }}>
                Extraindo logo, cores, tom de voz e dados do público. Pode
                levar uns segundos.
              </p>
              <Loader2
                size={20}
                className="mt-6 animate-spin"
                color="var(--onb-primary)"
              />
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex w-full max-w-[460px] flex-col items-center px-8 py-24 text-center"
            >
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--onb-text-primary)",
                  marginBottom: 8,
                }}
              >
                Não consegui analisar
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--onb-text-secondary)",
                  marginBottom: 24,
                }}
              >
                {errorMsg ?? "Tenta de novo ou siga preenchendo manualmente."}
              </p>
              <div className="flex gap-3">
                <button
                  className="onb-btn-outline"
                  onClick={() => router.push("/onboarding")}
                >
                  Voltar
                </button>
                <button
                  className="onb-btn-primary"
                  onClick={() => router.push("/onboarding/objetivo")}
                >
                  Preencher manualmente
                </button>
              </div>
            </motion.div>
          )}

          {status === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto w-full max-w-[640px] px-8 py-12"
            >
              {/* Toast */}
              <AnimatePresence>
                {showToast && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="fixed right-6 top-24 z-50 flex max-w-[320px] items-start gap-3 rounded-xl p-4 shadow-xl"
                    style={{
                      background: "var(--onb-bg-card)",
                      border: "0.5px solid var(--onb-border-default)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 28,
                        height: 28,
                        background: "var(--onb-success-dim)",
                        border: "0.5px solid var(--onb-success-border)",
                      }}
                    >
                      <Check size={14} color="var(--onb-success)" />
                    </div>
                    <div className="flex-1">
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--onb-text-primary)",
                        }}
                      >
                        Análise concluída!
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--onb-text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        Confira os dados e ajuste o que precisar.
                      </div>
                    </div>
                    <button
                      onClick={() => setShowToast(false)}
                      style={{
                        color: "var(--onb-text-tertiary)",
                        background: "transparent",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-8 flex flex-col items-center text-center">
                <div
                  className="onb-icon-circle mb-5"
                  style={{
                    width: 56,
                    height: 56,
                    background: "var(--onb-success-dim)",
                    borderColor: "var(--onb-success-border)",
                    color: "var(--onb-success)",
                  }}
                >
                  <Sparkles size={24} strokeWidth={2} />
                </div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    color: "var(--onb-text-primary)",
                    marginBottom: 6,
                  }}
                >
                  Analisamos sua marca!
                </h1>
                <p
                  style={{ fontSize: 14, color: "var(--onb-text-secondary)" }}
                >
                  {hasLogo || hasColors
                    ? "Encontramos sua logo e extraímos as cores automaticamente"
                    : "Extraímos os dados principais — confira abaixo"}
                </p>
              </div>

              {state.sourceUrl && (
                <div className="mb-6 flex justify-center">
                  <span className="onb-pill">
                    <span style={{ color: "var(--onb-text-tertiary)" }}>
                      Fonte:
                    </span>
                    <Globe
                      size={12}
                      style={{ color: "var(--onb-primary-light)" }}
                    />
                    <a
                      href={state.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "var(--onb-primary-light)",
                        textDecoration: "none",
                      }}
                    >
                      {state.sourceUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </span>
                </div>
              )}

              {/* Card logo detectada — só se realmente captou */}
              {hasLogo || hasColors ? (
                <div
                  className="mb-6 flex items-center gap-4 rounded-xl p-4"
                  style={{
                    background: "var(--onb-success-dim)",
                    border: "0.5px solid var(--onb-success-border)",
                  }}
                >
                  <div
                    className="flex items-center justify-center overflow-hidden rounded-lg"
                    style={{
                      width: 60,
                      height: 60,
                      background: "var(--onb-bg-elevated)",
                      border: "0.5px solid var(--onb-border-subtle)",
                    }}
                  >
                    {hasLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={state.detectedLogoUrl!}
                        alt="Logo detectada"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Sparkles
                        size={20}
                        style={{ color: "var(--onb-primary-light)" }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--onb-success)",
                        marginBottom: 2,
                      }}
                    >
                      <Check
                        size={14}
                        style={{
                          display: "inline",
                          marginRight: 4,
                          verticalAlign: "middle",
                        }}
                      />
                      {hasLogo ? "Logo detectada!" : "Cores extraídas"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--onb-text-secondary)",
                      }}
                    >
                      {hasColors
                        ? "As cores da marca foram extraídas automaticamente."
                        : "Você poderá enviar a logo no passo 5."}
                    </div>
                  </div>
                  {hasColors && (
                    <div className="flex gap-1.5">
                      {state.extractedColors.slice(0, 3).map((c, i) => (
                        <div
                          key={i}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: c,
                            border: "0.5px solid var(--onb-border-default)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="mb-6 flex items-start gap-3 rounded-xl p-4"
                  style={{
                    background: "var(--onb-bg-card)",
                    border: "0.5px solid var(--onb-border-subtle)",
                  }}
                >
                  <Info
                    size={16}
                    style={{
                      color: "var(--onb-text-secondary)",
                      marginTop: 2,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--onb-text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      Logo e cores não encontradas
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--onb-text-secondary)",
                      }}
                    >
                      Você pode enviar a logo e ajustar as cores no Passo 5.
                    </div>
                  </div>
                </div>
              )}

              {/* 4 cards expansíveis */}
              <div className="mb-8 flex flex-col gap-2">
                <ExpandableItem
                  itemKey="basic"
                  open={openItem === "basic"}
                  onToggle={(k) => setOpenItem(openItem === k ? null : k)}
                  Icon={Target}
                  label="Dados Básicos"
                  isEmpty={!state.brandName && !state.description}
                >
                  <Field label="Nome da Marca">
                    <input
                      className="onb-input"
                      value={state.brandName}
                      placeholder="Nome da marca"
                      onChange={(e) => update({ brandName: e.target.value })}
                    />
                  </Field>
                  <Field label="Descrição">
                    <textarea
                      className="onb-textarea"
                      rows={3}
                      value={state.description}
                      placeholder="O que a marca faz"
                      onChange={(e) =>
                        update({ description: e.target.value })
                      }
                    />
                  </Field>
                </ExpandableItem>

                <ExpandableItem
                  itemKey="audience"
                  open={openItem === "audience"}
                  onToggle={(k) => setOpenItem(openItem === k ? null : k)}
                  Icon={Users}
                  label="Público-alvo"
                  isEmpty={!state.idealCustomer}
                >
                  <Field label="Cliente ideal">
                    <textarea
                      className="onb-textarea"
                      rows={3}
                      value={state.idealCustomer}
                      placeholder="Quem é o cliente ideal"
                      onChange={(e) =>
                        update({ idealCustomer: e.target.value })
                      }
                    />
                  </Field>
                </ExpandableItem>

                <ExpandableItem
                  itemKey="visual"
                  open={openItem === "visual"}
                  onToggle={(k) => setOpenItem(openItem === k ? null : k)}
                  Icon={Network}
                  label="Estilo Visual"
                  isEmpty={!state.visualStyle && !hasColors}
                >
                  <Field label="Estilo visual extraído">
                    <input
                      className="onb-input"
                      value={state.visualStyle}
                      placeholder="Adjetivos do estilo (ex: minimalista, alto contraste)"
                      onChange={(e) =>
                        update({ visualStyle: e.target.value })
                      }
                    />
                  </Field>
                  {hasColors && (
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--onb-text-tertiary)",
                        }}
                      >
                        Cores extraídas
                      </span>
                      <div className="mt-2 flex gap-2">
                        {state.extractedColors.map((c, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: c,
                                border: "0.5px solid var(--onb-border-default)",
                              }}
                            />
                            <code
                              style={{
                                fontSize: 10,
                                color: "var(--onb-text-tertiary)",
                              }}
                            >
                              {c}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ExpandableItem>

                <ExpandableItem
                  itemKey="voice"
                  open={openItem === "voice"}
                  onToggle={(k) => setOpenItem(openItem === k ? null : k)}
                  Icon={MessageCircle}
                  label="Tom de Voz"
                  isEmpty={state.tones.length === 0}
                >
                  <Field label="Tons detectados">
                    {state.tones.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {state.tones.map((t, i) => (
                          <span
                            key={`${t}-${i}`}
                            className="onb-pill"
                            style={{
                              background: "var(--onb-primary-dim)",
                              borderColor: "var(--onb-primary-border)",
                              color: "var(--onb-primary-light)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="onb-helper"
                        style={{ color: "var(--onb-text-tertiary)" }}
                      >
                        Nenhum tom captado. Você define no Passo 4.
                      </p>
                    )}
                  </Field>
                </ExpandableItem>
              </div>

              {/* CTAs */}
              <div className="flex flex-col items-center gap-3">
                <button
                  className="onb-btn-primary w-full justify-center"
                  style={{ padding: "12px 18px" }}
                  onClick={() => router.push("/onboarding/objetivo")}
                >
                  <Check size={16} />
                  Tudo certo! Continuar
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/objetivo")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--onb-primary-light)",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Pencil size={12} />
                  Quero ajustar manualmente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  )
}

function ExpandableItem({
  itemKey,
  open,
  onToggle,
  Icon,
  label,
  isEmpty,
  children,
}: {
  itemKey: ItemKey
  open: boolean
  onToggle: (k: ItemKey) => void
  Icon: typeof Target
  label: string
  isEmpty: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--onb-bg-card)",
        border: "0.5px solid var(--onb-border-subtle)",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(itemKey)}
        className="flex w-full items-center gap-3 px-4 py-3"
        aria-expanded={open}
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
          <Icon size={14} style={{ color: "var(--onb-primary-light)" }} />
        </div>
        <div
          className="flex-1 text-left"
          style={{
            fontSize: 13,
            color: "var(--onb-text-primary)",
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        {isEmpty ? (
          <span
            style={{
              fontSize: 11,
              color: "var(--onb-text-tertiary)",
            }}
          >
            vazio
          </span>
        ) : (
          <Check size={14} color="var(--onb-success)" />
        )}
        <ChevronDown
          size={14}
          style={{
            color: "var(--onb-text-tertiary)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 200ms",
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-col gap-4 px-4 pb-4 pt-1"
              style={{ borderTop: "0.5px solid var(--onb-border-subtle)" }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--onb-text-tertiary)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}
