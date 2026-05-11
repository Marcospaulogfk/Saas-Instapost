import { HandlePill } from "../../shared/HandlePill"
import { playfair, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function ProfissionalRetratoCardCta({ brand, content, palette }: Props) {
  const photo = content.image_url
  const phone = content.contact_phone || brand.phone
  const website = content.contact_website || brand.website

  return (
    <div
      className="absolute inset-0 overflow-hidden flex"
      style={{ background: palette.surface }}
    >
      {/* Esquerda — texto */}
      <div
        className="relative flex flex-col"
        style={{
          width: "58%",
          padding: "7cqw 5cqw 5cqw 5cqw",
          minWidth: 0,
        }}
      >
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="light" size="sm" />

        <div
          className="flex-1 flex flex-col justify-center"
          style={{ paddingTop: "3cqw", minWidth: 0 }}
        >
          {content.title && (
            <h2
              className={playfair.className}
              style={{
                color: palette.dark,
                fontSize: "min(10cqw, 2.6rem)",
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                whiteSpace: "pre-line",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {content.title}
            </h2>
          )}

          {content.body && (
            <p
              className={inter.className}
              style={{
                color: palette.textSecondary,
                fontSize: "min(3.2cqw, 0.92rem)",
                fontWeight: 400,
                lineHeight: 1.5,
                marginTop: "3cqw",
                maxWidth: "100%",
              }}
            >
              {content.body}
            </p>
          )}

          {content.cta_text && (
            <div
              className={`${inter.className} inline-flex items-center self-start`}
              style={{
                marginTop: "4cqw",
                background: palette.dark,
                color: "#FFFFFF",
                borderRadius: 999,
                padding: "2.5cqw 5cqw",
                fontSize: "min(2.8cqw, 0.82rem)",
                fontWeight: 500,
                gap: "2cqw",
              }}
            >
              <span>{content.cta_text}</span>
              <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.3)" }} />
              <span>↓</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        {(phone || website) && (
          <div
            className={inter.className}
            style={{
              color: palette.dark,
              opacity: 0.55,
              fontSize: "min(2.2cqw, 0.65rem)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              lineHeight: 1.4,
            }}
          >
            {phone && <p>{phone}</p>}
            {website && <p>{website}</p>}
          </div>
        )}
      </div>

      {/* Direita — foto */}
      <div className="relative" style={{ width: "42%" }}>
        {photo ? (
          <img
            src={photo}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${palette.surface} 0%, #d4d4d4 100%)`,
              color: palette.textSecondary,
              fontSize: "0.75rem",
            }}
          >
            retrato corpo
          </div>
        )}
      </div>
    </div>
  )
}
