import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./onboarding.css"

export const metadata: Metadata = {
  title: "Configurar marca · SyncPost",
}

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="onb-root dark flex min-h-screen flex-col">{children}</div>
  )
}
