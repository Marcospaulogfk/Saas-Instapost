import { inter } from "../fonts"
import type { PostBrand } from "@/lib/single-posts/types"

interface InlineFooterProps {
  brand: PostBrand
  variant?: "dark" | "light"
  showLogoMonogram?: boolean
  align?: "center" | "left"
  tagline?: string | null
}

/**
 * Footer horizontal usado em vários templates beauty.
 * Layout: [monogram?] tagline_uppercase
 * NÃO inclui @handle pill (cada template decide onde posiciona pra evitar duplicar).
 */
export function InlineFooter({
  brand,
  variant = "dark",
  showLogoMonogram = false,
  align = "center",
  tagline,
}: InlineFooterProps) {
  const text =
    variant === "dark" ? "rgba(255,255,255,0.85)" : "rgba(15,15,15,0.75)"
  const justifyClass = align === "left" ? "justify-start" : "justify-center"

  // Iniciais da marca não aparecem mais (decisão do Marcos): showLogoMonogram
  // é ignorado. Sem tagline, não renderiza nada.
  void showLogoMonogram
  if (!tagline) return null

  return (
    <div className={`flex items-center ${justifyClass}`}>
      {tagline && (
        <span
          className={inter.className}
          style={{
            color: text,
            fontSize: "min(2cqw, 0.65rem)",
            fontWeight: 500,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          {tagline}
        </span>
      )}
    </div>
  )
}
