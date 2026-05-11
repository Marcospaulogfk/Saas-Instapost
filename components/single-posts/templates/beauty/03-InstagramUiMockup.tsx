import { HandlePill } from "../../shared/HandlePill"
import {
  InstagramCaptureButton,
  InstagramTabs,
  CameraIconCorner,
} from "../../shared/InstagramUI"
import { playfair, inter } from "../../fonts"
import type { PostBrand, PostContent, PostPalette } from "@/lib/single-posts/types"

interface Props {
  brand: PostBrand
  content: PostContent
  palette: PostPalette
}

export function BeautyInstagramUiMockup({ brand, content, palette }: Props) {
  const photo = content.image_url
  const kicker = content.kicker || content.title_emphasis || "Glúteo"
  const titleMain = content.title || "Sculpt"
  const tagline = content.subtitle || "mais\ncurvas"

  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-900">
      {photo ? (
        <img
          src={photo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(1.05) contrast(1.05)" }}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #4a3a30 0%, #2a1f18 100%)" }}
        />
      )}
      {/* Gradient ESQUERDA → meio pra legibilidade do título branco */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0) 60%)",
        }}
      />
      {/* Gradient sutil bottom pra UI */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Pill @handle top-left */}
      <div className="absolute" style={{ top: "5cqw", left: "5cqw", zIndex: 5 }}>
        <HandlePill handle={brand.instagram_handle ?? brand.name} variant="dark" size="sm" />
      </div>

      {/* Tagline opcional top-right (só se brand tiver) */}
      {brand.tagline && (
        <div
          className={`${inter.className} absolute uppercase`}
          style={{
            top: "5.5cqw",
            right: "5cqw",
            color: "rgba(255,255,255,0.7)",
            fontSize: "min(2cqw, 0.65rem)",
            fontWeight: 500,
            letterSpacing: "0.3em",
          }}
        >
          {brand.tagline}
        </div>
      )}

      {/* Título lateral esquerda */}
      <div
        className="absolute"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          left: "5cqw",
          width: "55%",
        }}
      >
        <p
          className={playfair.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(17cqw, 4.5rem)",
            fontStyle: "italic",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {kicker}
        </p>
        <p
          className={playfair.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(17cqw, 4.5rem)",
            fontWeight: 600,
            lineHeight: 1,
            marginTop: -2,
          }}
        >
          {titleMain}
        </p>
        <span
          style={{
            display: "inline-block",
            color: palette.accent,
            fontSize: "min(3cqw, 0.95rem)",
            margin: "min(3cqw, 14px) 0 min(2.5cqw, 12px)",
          }}
        >
          ✦
        </span>
        <p
          className={playfair.className}
          style={{
            color: "#FFFFFF",
            fontSize: "min(13cqw, 3.5rem)",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1,
            whiteSpace: "pre-line",
          }}
        >
          {tagline}
        </p>
      </div>

      {/* UI lateral direita: Aa + dots */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          right: "5cqw",
          top: "50%",
          transform: "translateY(-50%)",
          gap: "min(3.5cqw, 16px)",
          color: "#FFFFFF",
        }}
      >
        <span
          className={inter.className}
          style={{ fontSize: "min(5.5cqw, 1.5rem)", fontWeight: 600 }}
        >
          Aa
        </span>
        <div className="flex flex-col items-center" style={{ gap: 3 }}>
          {[...Array(3)].map((_, row) => (
            <div key={row} className="flex" style={{ gap: 3 }}>
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.7)",
                }}
              />
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.7)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botão captura central */}
      <div
        className="absolute"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "16cqw",
        }}
      >
        <InstagramCaptureButton />
      </div>

      {/* Abas POST/STORY/LIVE */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: 0,
          right: 0,
          bottom: "8cqw",
        }}
      >
        <InstagramTabs active="story" />
      </div>

      {/* Ícone câmera bottom-right */}
      <div className="absolute" style={{ bottom: "7cqw", right: "8cqw" }}>
        <CameraIconCorner />
      </div>
    </div>
  )
}
