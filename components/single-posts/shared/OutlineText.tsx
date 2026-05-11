interface OutlineTextProps {
  children: React.ReactNode
  strokeColor: string
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

/** Texto vazado: fill transparent + stroke colorido. Usado em "RESULTADOS", "PRÊMIOS!" etc */
export function OutlineText({
  children,
  strokeColor,
  strokeWidth = 1.5,
  className,
  style,
}: OutlineTextProps) {
  return (
    <span
      className={className}
      style={{
        color: "transparent",
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        textShadow: "none",
        ...style,
      }}
    >
      {children}
    </span>
  )
}
