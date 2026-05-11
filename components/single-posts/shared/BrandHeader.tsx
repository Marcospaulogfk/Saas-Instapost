import { inter } from "../fonts"
import type { PostBrand } from "@/lib/single-posts/types"

interface BrandHeaderProps {
  brand: PostBrand
  textColor?: string
  logoBg?: string
  logoFg?: string
}

/**
 * Header pequeno com mini logo (monograma) + nome da marca em uppercase.
 * Usado em templates fitness no canto superior esquerdo.
 */
export function BrandHeader({
  brand,
  textColor = "#1A1A1A",
  logoBg = "#FFFFFF",
  logoFg = "#1A1A1A",
}: BrandHeaderProps) {
  return (
    <div className="flex items-center" style={{ gap: "min(2cqw, 10px)" }}>
      <span
        className="rounded-full flex items-center justify-center font-bold leading-none"
        style={{
          width: "min(6cqw, 28px)",
          height: "min(6cqw, 28px)",
          background: logoBg,
          color: logoFg,
          fontSize: "min(2.6cqw, 0.78rem)",
        }}
      >
        {brand.monogram}
      </span>
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
