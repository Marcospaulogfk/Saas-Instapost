import Image from "next/image"
import { cn } from "@/lib/utils"

// Proporção da arte horizontal oficial (aparada): 1181 x 263.
const LOGO_RATIO = 1181 / 263

interface LogoProps {
  /** Altura da logo em px (a largura segue a proporção real da arte). */
  size?: number
  /** false = mostra só o ícone (squircle), sem o wordmark. */
  showWordmark?: boolean
  /**
   * "light" = arte branca (para fundos escuros, padrão).
   * "dark"  = arte preta (para fundos claros).
   */
  variant?: "light" | "dark"
  className?: string
}

/**
 * Logo oficial Syncpost — usa a arte da identidade visual.
 * Com wordmark: arte horizontal (branca/preta conforme `variant`).
 * Sem wordmark: apenas o ícone squircle da marca.
 */
export function Logo({
  size = 32,
  showWordmark = true,
  variant = "light",
  className,
}: LogoProps) {
  if (!showWordmark) {
    return (
      <Image
        src="/syncpost-icon.png"
        alt="Syncpost"
        width={size}
        height={size}
        priority
        className={cn("rounded-[22%]", className)}
      />
    )
  }

  const height = size
  const width = Math.round(size * LOGO_RATIO)
  const src =
    variant === "dark"
      ? "/syncpost-horizontal-preta-trim.png"
      : "/syncpost-horizontal-branca-trim.png"

  return (
    <Image
      src={src}
      alt="Syncpost"
      width={width}
      height={height}
      priority
      className={className}
      style={{ width, height, objectFit: "contain" }}
    />
  )
}
