import { HandlePill } from "../../shared/HandlePill"
import { InlineFooter } from "../../shared/InlineFooter"
import { OrganicUnderline } from "../../shared/OrganicUnderline"
import { playfair, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function BeautyProdutoComElemento({ brand, content, palette }: Props) {
  const photo = content.image_url
  const productPng = (content as { product_image_url?: string }).product_image_url
  const introA = content.intro || "Um hábito simples,"
  const introB = content.intro_2 || "um resultado incrível."
  const keyword = content.title || "Colágeno"

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.surface }}>
      {photo ? (
        <img
          src={photo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(1.04) saturate(0.95)" }}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #f5ede3 0%, #d4b899 100%)" }}
        />
      )}

      {/* Pill @handle top-left */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Tagline top-right (2 linhas) */}
      <div
        className={`${inter.className} absolute text-right`}
        style={{
          top: "5cqw",
          right: "5cqw",
          color: "rgba(255,255,255,0.95)",
          fontSize: "min(2.6cqw, 0.82rem)",
          lineHeight: 1.35,
        }}
      >
        <p style={{ fontStyle: "italic", fontWeight: 400 }}>{introA}</p>
        <p style={{ fontWeight: 600 }}>{introB}</p>
      </div>

      {/* Palavra-chave gigante centro-superior */}
      <div
        className="absolute"
        style={{
          top: "20%",
          left: "5cqw",
          right: "5cqw",
          textAlign: "center",
          zIndex: 4,
        }}
      >
        <span
          className={playfair.className}
          style={{
            display: "inline-block",
            color: "#FFFFFF",
            fontSize: "min(22cqw, 5.8rem)",
            fontStyle: "italic",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 20px rgba(0,0,0,0.25)",
            position: "relative",
          }}
        >
          {keyword}
          <OrganicUnderline
            width="100%"
            height={20}
            color={palette.accent}
            style={{ position: "absolute", left: 0, bottom: -10 }}
          />
        </span>
      </div>

      {/* Elemento produto PNG inclinado (placeholder se sem imagem) */}
      {productPng ? (
        <img
          src={productPng}
          alt="produto"
          className="absolute"
          style={{
            top: "16%",
            right: "8%",
            width: "26%",
            transform: "rotate(-5deg)",
            filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.3))",
            zIndex: 5,
          }}
          crossOrigin="anonymous"
        />
      ) : null}

      {/* Footer central */}
      <div className="absolute" style={{ bottom: "5cqw", left: "5cqw", right: "5cqw" }}>
        <InlineFooter
          brand={brand}
          variant="dark"
          align="center"
          showLogoMonogram
          tagline={brand.tagline}
        />
      </div>
    </div>
  )
}
