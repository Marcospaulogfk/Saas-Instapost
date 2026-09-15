interface HandlePillProps {
  handle: string
  variant?: "dark" | "light"
  size?: "sm" | "md"
}

/**
 * Pill arredondado com @handle (só texto, sem avatar), igual aos carrosséis editoriais.
 * Usa cqw pra escalar com o container — nunca fica desproporcional.
 */
export function HandlePill({ handle, variant = "dark", size = "md" }: HandlePillProps) {
  const clean = handle.replace(/^@/, "")
  const display = `@${clean}`

  const isDark = variant === "dark"
  const bg = isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.92)"
  const text = isDark ? "#FFFFFF" : "#0A0A0F"

  // Sem avatar de iniciais (decisão do Marcos): padding simétrico, só o @.
  const SIZES = {
    sm: {
      padding: "1.2cqw 2cqw",
      fontSize: "min(2.4cqw, 0.72rem)",
    },
    md: {
      padding: "1.4cqw 2.4cqw",
      fontSize: "min(2.7cqw, 0.82rem)",
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
        borderRadius: 9999,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <span style={{ fontSize: s.fontSize, letterSpacing: "0.01em" }}>{display}</span>
    </span>
  )
}
