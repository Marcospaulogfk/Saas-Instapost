import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  /** Tamanho do squircle em px (o wordmark escala junto). */
  size?: number
  /** Mostra o wordmark "SyncPost" ao lado do squircle. */
  showWordmark?: boolean
  className?: string
}

/**
 * Logo oficial SyncPost: squircle (ícone) + wordmark.
 * O squircle é o asset fixo de marca (gradiente magenta→índigo).
 * O wordmark é texto Geist na grafia oficial "SyncPost" — a arte
 * horizontal renderiza "Syncpost", grafia que será corrigida depois.
 */
export function Logo({ size = 36, showWordmark = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/syncpost-icon.png"
        alt="SyncPost"
        width={size}
        height={size}
        priority
        className="rounded-[22%]"
      />
      {showWordmark && (
        <span
          className="font-display font-semibold tracking-tight text-foreground"
          style={{ fontSize: size * 0.55 }}
        >
          SyncPost
        </span>
      )}
    </span>
  )
}
