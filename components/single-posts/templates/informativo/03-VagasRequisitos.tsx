import { BrandHeader } from "../../shared/BrandHeader"
import { HandlePill } from "../../shared/HandlePill"
import { anton, inter } from "../../fonts"
import { User, Check, Mail } from "lucide-react"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function InformativoVagasRequisitos({ brand, content, palette }: Props) {
  const photo = content.image_url
  const titleLines = content.title_lines || (
    content.title ? content.title.split("\n") : ["VAGAS", "ABERTAS"]
  )
  const cargo = content.kicker || "Profissional"
  const checklist = content.checklist || content.pill_lines || [
    "Experiência comprovada",
    "Boa comunicação",
    "Disponibilidade horária",
  ]
  const email = content.contact_email
  const accent = palette.accent

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.dark }}>
      {/* Header marca */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <BrandHeader brand={brand} textColor="#FFFFFF" logoBg={accent} logoFg={palette.dark} />
      </div>

      {/* @handle pill top-right */}
      <div className="absolute" style={{ top: "5cqw", right: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Foto direita (PNG cutout idealmente) */}
      {photo ? (
        <div
          className="absolute"
          style={{
            top: "12%",
            right: 0,
            width: "44%",
            height: "78%",
            zIndex: 2,
          }}
        >
          <img
            src={photo}
            alt={cargo}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center" }}
            crossOrigin="anonymous"
          />
        </div>
      ) : null}

      {/* Lado esquerdo: chamada + cargo + checklist */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "5cqw",
          width: "55%",
          top: "16cqw",
          gap: 14,
          zIndex: 4,
        }}
      >
        <h2
          className={anton.className}
          style={{
            color: accent,
            fontSize: "min(15cqw, 4rem)",
            fontWeight: 800,
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>

        {/* Pill cargo */}
        <span
          className={`${inter.className} inline-flex items-center self-start`}
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 999,
            padding: "min(2cqw, 10px) min(4cqw, 18px)",
            fontSize: "min(2.6cqw, 0.85rem)",
            fontWeight: 500,
            gap: 8,
          }}
        >
          <User
            style={{
              width: "min(3.5cqw, 16px)",
              height: "min(3.5cqw, 16px)",
              color: accent,
            }}
          />
          {cargo}
        </span>

        {/* Lista requisitos */}
        <div className="flex flex-col" style={{ gap: "min(2cqw, 10px)", marginTop: 4 }}>
          <p
            className={`${inter.className} uppercase`}
            style={{
              color: accent,
              fontSize: "min(2.4cqw, 0.78rem)",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            REQUISITOS:
          </p>
          {checklist.slice(0, 5).map((item, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{ gap: "min(2cqw, 10px)" }}
            >
              <Check
                style={{
                  width: "min(3.2cqw, 14px)",
                  height: "min(3.2cqw, 14px)",
                  color: accent,
                  flexShrink: 0,
                }}
              />
              <span
                className={inter.className}
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "min(2.6cqw, 0.85rem)",
                  fontWeight: 400,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA email — só se brand.email ou content.contact_email */}
      {email && (
        <div
          className="absolute"
          style={{
            left: "5cqw",
            bottom: "12cqw",
            zIndex: 5,
          }}
        >
          <p
            className={inter.className}
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "min(2.4cqw, 0.78rem)",
              fontWeight: 500,
            }}
          >
            Envie seu currículo:
          </p>
          <span
            className={`${inter.className} inline-flex items-center`}
            style={{
              color: accent,
              fontSize: "min(3cqw, 0.95rem)",
              fontWeight: 600,
              gap: 6,
              marginTop: 2,
            }}
          >
            <Mail style={{ width: "min(3.2cqw, 14px)", height: "min(3.2cqw, 14px)" }} />
            {email}
          </span>
        </div>
      )}

      {/* Footer info contato */}
      {(brand.phone || brand.website || brand.tagline) && (
        <div
          className={`${inter.className} absolute flex justify-between items-end`}
          style={{
            left: "5cqw",
            right: "5cqw",
            bottom: "4cqw",
            color: "rgba(255,255,255,0.6)",
            fontSize: "min(1.9cqw, 0.6rem)",
            lineHeight: 1.4,
            zIndex: 5,
          }}
        >
          <span>{brand.phone}</span>
          <span>{brand.website}</span>
          {brand.tagline ? (
            <span style={{ textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {brand.tagline}
            </span>
          ) : <span />}
        </div>
      )}
    </div>
  )
}
