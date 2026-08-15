import Image from "next/image"
import { cn } from "@/lib/utils"

// Proporções reais das artes aparadas (os PNGs originais vêm 2172x724 com quase
// tudo transparente em volta; foram recortados na caixa da arte antes de virar
// asset). Se reexportar do PSD, refazer o trim e conferir estes números.
const LOCKUP_RATIO = 1043 / 200
const CONTENT_RATIO = 977 / 200
const ICON_RATIO = 97 / 95

/** "nexus" = símbolo + NEXUS AI. "content" = símbolo + NEXUS AI / CONTENT. */
export type LogoVariant = "nexus" | "content"

interface LogoProps {
  /** Altura da logo em px (a largura segue a proporção real da arte). */
  size?: number
  /** false = mostra só o símbolo N, sem o wordmark. */
  showWordmark?: boolean
  /**
   * Qual lockup usar. O padrão é o da marca-mãe (site, dashboard, onboarding);
   * "content" carrega o nome do produto e fica reservado ao editor.
   */
  variant?: LogoVariant
  className?: string
}

/**
 * Logo oficial Nexus Content.
 *
 * As duas artes são feitas pra fundo escuro — que é onde o app inteiro vive. Se
 * um dia aparecer tela clara, é preciso exportar do LogoNexus.psd uma versão com
 * o wordmark escuro; não dá pra resolver com filtro CSS sem sujar o gradiente do
 * símbolo.
 */
export function Logo({
  size = 32,
  showWordmark = true,
  variant = "nexus",
  className,
}: LogoProps) {
  const isContent = variant === "content"
  const ratio = showWordmark ? (isContent ? CONTENT_RATIO : LOCKUP_RATIO) : ICON_RATIO
  const width = Math.round(size * ratio)

  const src = !showWordmark
    ? "/nexus-icon.png"
    : isContent
      ? "/nexus-content-horizontal.png"
      : "/nexus-horizontal.png"

  return (
    <Image
      src={src}
      alt={isContent && showWordmark ? "Nexus Content" : "Nexus"}
      width={width}
      height={size}
      priority
      className={cn(className)}
      style={{ width, height: size, objectFit: "contain" }}
    />
  )
}
