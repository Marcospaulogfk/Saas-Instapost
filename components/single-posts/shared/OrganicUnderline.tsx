interface OrganicUnderlineProps {
  width?: string | number
  height?: number
  color: string
  className?: string
  style?: React.CSSProperties
}

/** SVG curva orgânica (swoosh) usada como decorativo abaixo de palavras-chave */
export function OrganicUnderline({
  width = "100%",
  height = 18,
  color,
  className,
  style,
}: OrganicUnderlineProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 18"
      preserveAspectRatio="none"
      className={className}
      style={style}
      fill="none"
    >
      <path
        d="M 4 12 Q 50 2, 100 9 T 196 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  )
}
