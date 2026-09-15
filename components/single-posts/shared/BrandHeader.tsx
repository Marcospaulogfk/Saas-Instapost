import { inter } from "../fonts"
import type { PostBrand } from "@/lib/single-posts/types"

interface BrandHeaderProps {
  brand: PostBrand
  textColor?: string
  logoBg?: string
  logoFg?: string
}

/**
 * Header pequeno com o nome da marca.
 * Usado em templates fitness no canto superior esquerdo.
 * Sem círculo de iniciais (decisão do Marcos): logoBg/logoFg ficam no tipo
 * só pra não quebrar quem ainda passa, e são ignorados.
 */
export function BrandHeader({
  brand,
  textColor = "#1A1A1A",
}: BrandHeaderProps) {
  return (
    <div className="flex items-center">
      <span
        className={inter.className}
        style={{
          color: textColor,
          fontSize: "min(3.2cqw, 1rem)",
          fontWeight: 700,
          letterSpacing: "0.01em",
        }}
      >
        {brand.name}
      </span>
    </div>
  )
}
