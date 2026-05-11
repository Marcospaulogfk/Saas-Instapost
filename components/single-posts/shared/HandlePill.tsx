interface HandlePillProps {
  handle: string
  variant?: "dark" | "light"
  size?: "sm" | "md"
}

/**
 * Pill arredondado com @handle (avatar + texto), igual aos carrosséis editoriais.
 * Usa cqw pra escalar com o container — nunca fica desproporcional.
 */
export function HandlePill({ handle, variant = "dark", size = "md" }: HandlePillProps) {
  const clean = handle.replace(/^@/, "")
  const display = `@${clean}`
  const initials = clean.slice(0, 2).toUpperCase()

  const isDark = variant === "dark"
  const bg = isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.92)"
  const text = isDark ? "#FFFFFF" : "#0A0A0F"
  const avatarBg = isDark ? "rgba(255,255,255,0.18)" : "#0A0A0F"

  const SIZES = {
    sm: {
      padding: "0.7cqw 2cqw 0.7cqw 0.7cqw",
      avatar: "min(4.5cqw, 22px)",
      fontSize: "min(2.4cqw, 0.72rem)",
      gap: "1.2cqw",
    },
    md: {
      padding: "0.9cqw 2.4cqw 0.9cqw 0.9cqw",
      avatar: "min(5.5cqw, 26px)",
      fontSize: "min(2.7cqw, 0.82rem)",
      gap: "1.4cqw",
    },
  } as const

  const s = SIZES[size]

  return (
    <span
      className="inline-flex items-center font-medium leading-none"
      style={{
        background: bg,
        color: text,
        padding: s.padding,
        gap: s.gap,
        borderRadius: 9999,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <span
        className="rounded-full flex items-center justify-center font-bold leading-none"
        style={{
          width: s.avatar,
          height: s.avatar,
          background: avatarBg,
          color: "#FFFFFF",
          fontSize: `calc(${s.avatar} * 0.4)`,
        }}
      >
        {initials}
      </span>
      <span style={{ fontSize: s.fontSize, letterSpacing: "0.01em" }}>{display}</span>
    </span>
  )
}
