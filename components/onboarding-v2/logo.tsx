import { Logo } from "@/components/brand/logo"

/**
 * Logo do onboarding — delega pro componente de marca, então acompanha
 * automaticamente a troca do lockup provisório pelo oficial.
 * `size` controla a ALTURA em px.
 */
export function NexusLogo({ size = 30 }: { size?: number }) {
  return <Logo size={size} />
}
