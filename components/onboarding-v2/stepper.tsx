"use client"

import { Target, Building2, Users, Fingerprint, Palette, Check } from "lucide-react"
import { STEPS } from "@/lib/onboarding/types"

const ICONS = {
  1: Target,
  2: Building2,
  3: Users,
  4: Fingerprint,
  5: Palette,
} as const

export function OnboardingStepper({ current }: { current: number }) {
  const progress = (current / 5) * 100

  return (
    <nav
      aria-label="Progresso do cadastro"
      className="mx-auto w-full max-w-[800px] px-8 pt-8"
    >
      <div
        className="relative h-[2px] w-full overflow-hidden rounded-full"
        style={{ background: "var(--onb-border-subtle)" }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, var(--onb-primary-light), var(--onb-primary), #8A33EC)",
            boxShadow: "0 0 12px rgba(115, 32, 230, 0.5)",
          }}
        />
      </div>

      <ol className="mt-3 grid grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const Icon = ICONS[step.index as keyof typeof ICONS]
          const isActive = step.index === current
          const isCompleted = step.index < current
          const aria = isActive ? "step" : undefined

          let bg = "var(--onb-bg-card)"
          let border = "var(--onb-border-default)"
          let iconColor = "var(--onb-text-tertiary)"
          let glow = "none"

          if (isActive) {
            bg =
              "linear-gradient(180deg, #9A52EF 0%, var(--onb-primary) 60%, #5F14D6 100%)"
            border = "var(--onb-primary)"
            iconColor = "#ffffff"
            glow =
              "0 0 0 4px var(--onb-primary-glow), 0 4px 16px rgba(115, 32, 230, 0.45)"
          } else if (isCompleted) {
            bg = "var(--onb-primary-dim)"
            border = "var(--onb-primary-border)"
            iconColor = "var(--onb-primary-light)"
          }

          return (
            <li
              key={step.route}
              aria-current={aria}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 36,
                  height: 36,
                  background: bg,
                  border: `0.5px solid ${border}`,
                  boxShadow: glow,
                }}
              >
                {isCompleted ? (
                  <Check size={16} color={iconColor} strokeWidth={2.5} />
                ) : (
                  <Icon size={16} color={iconColor} strokeWidth={2} />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: isActive
                    ? "var(--onb-text-primary)"
                    : "var(--onb-text-tertiary)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
