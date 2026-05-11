import { inter } from "../fonts"
import { Camera } from "lucide-react"

/** Conjunto de elementos UI estilo Instagram (botão capture + abas) usados em templates beauty 03 */
export function InstagramCaptureButton() {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: "min(13cqw, 60px)",
        height: "min(13cqw, 60px)",
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(8px)",
        border: "3px solid rgba(255,255,255,0.92)",
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: "min(10cqw, 44px)",
          height: "min(10cqw, 44px)",
          background: "#FFFFFF",
        }}
      />
    </div>
  )
}

interface TabsProps {
  active?: "post" | "story" | "live"
}

export function InstagramTabs({ active = "story" }: TabsProps) {
  const tabs = [
    { key: "post", label: "POST" },
    { key: "story", label: "STORY" },
    { key: "live", label: "LIVE" },
  ] as const

  return (
    <div className="flex items-center" style={{ gap: "min(7cqw, 32px)" }}>
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <span
            key={t.key}
            className={inter.className}
            style={{
              color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)",
              fontSize: "min(2.3cqw, 0.7rem)",
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.2em",
              borderBottom: isActive ? "1px solid #FFFFFF" : "none",
              paddingBottom: isActive ? "min(1.5cqw, 6px)" : 0,
            }}
          >
            {t.label}
          </span>
        )
      })}
    </div>
  )
}

export function CameraIconCorner({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <Camera
      style={{
        color,
        width: "min(4.5cqw, 22px)",
        height: "min(4.5cqw, 22px)",
      }}
    />
  )
}
