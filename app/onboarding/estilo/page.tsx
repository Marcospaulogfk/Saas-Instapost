"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Palette,
  ImageIcon,
  Upload,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { OnboardingHeader } from "@/components/onboarding-v2/header"
import { OnboardingStepper } from "@/components/onboarding-v2/stepper"
import { OnboardingFooter } from "@/components/onboarding-v2/footer"
import { StepShell } from "@/components/onboarding-v2/step-shell"
import { Switch } from "@/components/ui/switch"
import { useOnboardingState, clearOnboardingStorage } from "@/lib/onboarding/store"
import { createBrand } from "@/app/actions/brands"

const MAX_LOGO_BYTES = 5 * 1024 * 1024 // 5MB

const OBJECTIVE_DB_MAP: Record<
  string,
  "sell" | "inform" | "engage" | "community"
> = {
  sell: "sell",
  authority: "inform",
  engagement: "engage",
  leads: "community",
}

export default function EstiloPage() {
  const router = useRouter()
  const { state, hydrated, update } = useOnboardingState()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFile = (file: File | null) => {
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) {
      alert("Arquivo maior que 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update({
        logoUrl: typeof reader.result === "string" ? reader.result : null,
        logoFileName: file.name,
      })
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    // Limpa tanto o upload manual quanto a logo extraída do site, pra "remover"
    // de fato (senão a extraída reaparecia como fallback).
    update({ logoUrl: null, logoFileName: null, detectedLogoUrl: null })
    if (fileRef.current) fileRef.current.value = ""
  }

  // Logo a exibir: upload manual tem prioridade; senão a extraída do site.
  const logoPreview = state.logoUrl ?? state.detectedLogoUrl ?? null

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const finalize = async () => {
    // Proteção contra duplo clique: se já está enviando, ignora.
    if (!hydrated || submitting) return
    setSubmitError(null)

    const name = state.brandName.trim()
    if (!name) {
      setSubmitError(
        "O nome da marca é obrigatório. Volte à etapa Marca e preencha.",
      )
      return
    }

    // Multi-select: o primeiro objetivo é o principal; os demais vão
    // concatenados por vírgula (a coluna main_objective é text).
    const selectedObjectives =
      state.objectives.length > 0
        ? state.objectives
        : state.objective
          ? [state.objective]
          : []
    const objectivesDb = Array.from(
      new Set(
        selectedObjectives
          .map((o) => OBJECTIVE_DB_MAP[o])
          .filter(
            (v): v is "sell" | "inform" | "engage" | "community" => v != null,
          ),
      ),
    )
    if (objectivesDb.length === 0) {
      setSubmitError("Selecione pelo menos um objetivo na etapa Objetivo.")
      return
    }

    setSubmitting(true)
    try {
      const result = await createBrand({
        name,
        description: state.description.trim(),
        website_url: state.sourceUrl || null,
        instagram_handle: state.instagramHandle || null,
        target_audience: state.idealCustomer.trim() || "",
        tone_of_voice: state.tones.join(", "),
        visual_style: "",
        main_objective: objectivesDb.join(","),
        brand_colors: [state.primaryColor, state.secondaryColor, state.accentColor],
        logo_url: state.logoUrl ?? state.detectedLogoUrl ?? null,
      })

      if (!result.ok) {
        setSubmitting(false)
        setSubmitError(result.error)
        return
      }

      clearOnboardingStorage()
      // Navegação completa em vez de router.push + router.refresh: o refresh
      // logo após o push cancelava a navegação pendente do client router — a
      // marca era criada, mas o usuário ficava preso nessa tela sem feedback
      // (e clicava de novo, duplicando a marca). window.location garante que
      // o dashboard carrega do zero. `submitting` fica true até a página
      // trocar, mantendo o botão desabilitado.
      window.location.assign(`/dashboard?brandCreated=${result.brandId}`)
    } catch (err) {
      // Server action pode lançar (rede, payload da logo acima do limite,
      // etc.) — sem esse catch a falha era 100% silenciosa.
      setSubmitting(false)
      setSubmitError(
        err instanceof Error && err.message
          ? `Não foi possível salvar a marca: ${err.message}`
          : "Não foi possível salvar a marca. Verifique sua conexão e tente novamente.",
      )
    }
  }

  return (
    <>
      <OnboardingHeader stepIndex={5} />
      <OnboardingStepper current={5} />

      <main className="flex-1">
        <StepShell
          icon={Palette}
          title="Estilo visual da marca"
          subtitle="Defina a identidade visual para suas criações"
        >
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ImageIcon
                  size={14}
                  style={{ color: "var(--onb-text-secondary)" }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--onb-text-primary)",
                  }}
                >
                  Logo da marca
                </span>
                <span className="onb-label-tag">opcional</span>
              </div>

              {logoPreview ? (
                <div
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{
                    background: "var(--onb-bg-card)",
                    border: "0.5px solid var(--onb-border-default)",
                  }}
                >
                  <div className="relative">
                    <div
                      className="flex items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        width: 80,
                        height: 80,
                        background: "var(--onb-bg-elevated)",
                        border: "0.5px solid var(--onb-border-subtle)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview}
                        alt="Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <div
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        right: -4,
                        top: -4,
                        width: 22,
                        height: 22,
                        background: "var(--onb-success)",
                        border: "2px solid var(--onb-bg-card)",
                      }}
                    >
                      <Check size={12} color="white" strokeWidth={3} />
                    </div>
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
                      {state.logoUrl
                        ? "Logo enviada com sucesso"
                        : "Logo encontrada no seu site"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--onb-text-secondary)",
                      }}
                    >
                      {state.logoUrl
                        ? (state.logoFileName ?? "logo")
                        : "Use o botão Trocar pra subir outra"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center justify-center rounded-md px-3"
                    style={{
                      height: 28,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--onb-text-primary)",
                      background: "var(--onb-bg-elevated)",
                      border: "0.5px solid var(--onb-border-default)",
                    }}
                  >
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    aria-label="Remover logo"
                    className="flex items-center justify-center rounded-md"
                    style={{
                      width: 28,
                      height: 28,
                      color: "var(--onb-text-tertiary)",
                      background: "transparent",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-6 py-10 transition-colors"
                  style={{
                    border: `1px dashed ${dragOver ? "var(--onb-primary)" : "var(--onb-border-default)"}`,
                    background: dragOver
                      ? "rgba(115, 32, 230, 0.04)"
                      : "transparent",
                  }}
                >
                  <Upload
                    size={22}
                    style={{ color: "var(--onb-text-secondary)" }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--onb-text-primary)",
                    }}
                  >
                    Clique ou arraste sua logo aqui
                  </div>
                  <div
                    style={{ fontSize: 11, color: "var(--onb-text-tertiary)" }}
                  >
                    PNG, JPG ou SVG até 5MB
                  </div>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </section>

            {/* Cores */}
            <section
              className="rounded-xl p-5"
              style={{
                background: "var(--onb-bg-card)",
                border: "0.5px solid var(--onb-border-subtle)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette
                    size={14}
                    style={{ color: "var(--onb-primary-light)" }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--onb-text-primary)",
                    }}
                  >
                    Cores da marca
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--onb-text-secondary)",
                    }}
                  >
                    Personalizar
                  </span>
                  <Switch
                    checked={state.customColors}
                    onCheckedChange={(v) => update({ customColors: v })}
                  />
                </div>
              </div>

              <ColorRow
                label="Primária"
                value={state.primaryColor}
                editable={state.customColors}
                onChange={(v) => update({ primaryColor: v })}
              />
              <ColorRow
                label="Secundária"
                value={state.secondaryColor}
                editable={state.customColors}
                onChange={(v) => update({ secondaryColor: v })}
              />
              <ColorRow
                label="Destaque"
                value={state.accentColor}
                editable={state.customColors}
                onChange={(v) => update({ accentColor: v })}
              />
            </section>

            {submitError && (
              <div
                className="rounded-lg px-4 py-3"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "0.5px solid rgba(239, 68, 68, 0.3)",
                  color: "var(--onb-error)",
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}
          </div>
        </StepShell>
      </main>

      <OnboardingFooter
        onBack={() => router.push("/onboarding/identidade")}
        onContinue={finalize}
        continueLabel="Finalizar"
        continueDisabled={!hydrated}
        isLoading={submitting}
        isFinal
      />
    </>
  )
}

function ColorRow({
  label,
  value,
  editable,
  onChange,
}: {
  label: string
  value: string
  editable: boolean
  onChange: (v: string) => void
}) {
  return (
    <div
      className="flex items-center gap-3 py-2"
      style={{ borderTop: "0.5px solid var(--onb-border-subtle)" }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: value,
          border: "0.5px solid var(--onb-border-default)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: "var(--onb-text-primary)",
          minWidth: 96,
        }}
      >
        {label}
      </span>
      {editable ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: 32,
              height: 24,
              padding: 0,
              border: "0.5px solid var(--onb-border-default)",
              borderRadius: 4,
              background: "transparent",
              cursor: "pointer",
            }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="onb-input"
            style={{ flex: 1, fontFamily: "monospace", padding: "6px 10px" }}
          />
        </div>
      ) : (
        <span
          style={{
            fontSize: 12,
            color: "var(--onb-text-tertiary)",
            fontFamily: "monospace",
            marginLeft: "auto",
          }}
        >
          {value}
        </span>
      )}
    </div>
  )
}
