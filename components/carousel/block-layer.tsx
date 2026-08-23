// ============================================================================
// BlockLayer — renderiza os blocos livres (slide.blocks) por cima do layout.
//
// Montado dentro do root do SlidePreview, então vale em TODO lugar: filmstrip,
// canvas do editor, export PNG/ZIP e capa. Cada bloco carrega
// `data-edit="block"` + `data-edit-key={id}` pro overlay do editor fazer
// hit-test/seleção com chave estável (id, não índice).
//
// Sem blocos → retorna null (DOM idêntico ao slide gerado).
// Sem backdrop-filter (vira sombra borrada no html-to-image).
// ============================================================================

import { proxiedImageUrl } from "@/lib/proxy-image"
import { fontClassById } from "./carousel-fonts"
import { VerifiedBadge } from "./editorial-splits"
import type { SlideBlock } from "./slide-blocks"

const TEXT_SHADOW = "0 2px 12px rgba(0,0,0,0.55)"
const BOX_SHADOW = "0 10px 30px -8px rgba(0,0,0,0.6)"

export function BlockLayer({
  blocks,
  fontClass,
}: {
  blocks?: SlideBlock[]
  fontClass?: string
}) {
  if (!blocks || blocks.length === 0) return null
  const sorted = [...blocks].sort((a, b) => a.z - b.z)
  return (
    <div className="absolute inset-0 z-[15] pointer-events-none" data-block-layer>
      {sorted.map((b) => (
        <div
          key={b.id}
          data-edit="block"
          data-edit-key={b.id}
          data-block-type={b.type}
          className="absolute"
          style={{
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            opacity: b.opacity ?? 1,
            transform: b.rot ? `rotate(${b.rot}deg)` : undefined,
            transformOrigin: "center",
          }}
        >
          <BlockBody block={b} fontClass={b.font ? fontClassById(b.font) : fontClass} />
        </div>
      ))}
    </div>
  )
}

function BlockBody({ block, fontClass }: { block: SlideBlock; fontClass?: string }) {
  switch (block.type) {
    case "heading":
    case "text":
      return (
        <div
          className={`w-full h-full overflow-hidden ${fontClass ?? ""}`}
          style={{
            color: block.color,
            fontSize: block.size ?? (block.type === "heading" ? 30 : 14),
            fontWeight: block.weight ?? (block.type === "heading" ? 800 : 500),
            lineHeight: block.lineHeight ?? (block.type === "heading" ? 1.1 : 1.4),
            textAlign: block.align ?? "left",
            backgroundColor: block.fill,
            padding: block.padding ?? (block.fill ? 8 : 0),
            borderRadius: block.radius,
            letterSpacing: block.type === "heading" ? "-0.02em" : undefined,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            textShadow: block.shadow && !block.fill ? TEXT_SHADOW : undefined,
            boxShadow: block.shadow && block.fill ? BOX_SHADOW : undefined,
          }}
        >
          {block.text}
        </div>
      )
    case "image":
      return block.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proxiedImageUrl(block.url)}
          alt=""
          className="w-full h-full"
          style={{
            objectFit: block.fit ?? "cover",
            objectPosition: `${block.posX ?? 50}% ${block.posY ?? 50}%`,
            borderRadius: block.radius ?? 0,
            boxShadow: block.shadow ? BOX_SHADOW : undefined,
          }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-wider"
          style={{
            borderRadius: block.radius ?? 0,
            backgroundColor: "rgba(127,127,140,0.25)",
            color: "rgba(255,255,255,0.7)",
            border: "1px dashed rgba(255,255,255,0.4)",
          }}
        >
          Imagem
        </div>
      )
    case "pill": {
      const dark = block.variant === "dark"
      const accent = block.variant === "accent"
      return (
        <span
          className={`inline-flex w-full h-full items-center justify-center px-3 rounded-full text-[11px] font-semibold whitespace-nowrap overflow-hidden ${fontClass ?? ""}`}
          style={{
            backgroundColor: accent ? block.color ?? "#1668E3" : dark ? "#0A0A0F" : "#FFFFFF",
            color: dark || accent ? "#FFFFFF" : "#0A0A0F",
            border: dark
              ? "1px solid rgba(255,255,255,0.16)"
              : accent
                ? "none"
                : "1px solid rgba(0,0,0,0.12)",
            boxShadow: block.shadow ? BOX_SHADOW : undefined,
          }}
        >
          {block.text}
        </span>
      )
    }
    case "shape":
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: block.fill ?? "transparent",
            border: block.stroke ? `${block.strokeWidth ?? 2}px solid ${block.stroke}` : undefined,
            borderRadius: block.shape === "circle" ? "50%" : (block.radius ?? 0),
            boxShadow: block.shadow ? BOX_SHADOW : undefined,
          }}
        />
      )
    case "brand": {
      const ink = block.color ?? "#FFFFFF"
      const initials =
        block.initials?.trim() ||
        block.handle.replace(/^@/, "").slice(0, 2).toUpperCase() ||
        "MP"
      const size = Math.max(24, Math.min(block.h, 64))
      return (
        <div
          className={`w-full h-full flex items-center gap-2.5 overflow-hidden ${fontClass ?? ""}`}
          style={{ color: ink, textShadow: block.shadow ? TEXT_SHADOW : undefined }}
        >
          {block.showAvatar !== false && (
            <div
              className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
              style={{
                width: size,
                height: size,
                backgroundColor: "rgba(127,127,140,0.35)",
                fontSize: size * 0.36,
                boxShadow: block.shadow ? BOX_SHADOW : undefined,
              }}
            >
              {block.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proxiedImageUrl(block.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          )}
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold truncate" style={{ fontSize: Math.max(11, size * 0.34) }}>
                {block.name}
              </span>
              {block.verified !== false && <VerifiedBadge size={Math.max(12, size * 0.32)} />}
            </div>
            <div className="truncate" style={{ fontSize: Math.max(10, size * 0.28), opacity: 0.75 }}>
              {block.handle}
            </div>
          </div>
        </div>
      )
    }
    case "divider":
      return (
        <div className="w-full h-full flex items-center">
          <div
            className="w-full"
            style={{
              height: block.thickness ?? 3,
              backgroundColor: block.color ?? "#FFFFFF",
              borderRadius: 999,
            }}
          />
        </div>
      )
  }
}
