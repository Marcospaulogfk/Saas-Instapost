export function SyncPostLogo({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: size,
          height: size,
          background: "var(--onb-primary)",
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--onb-text-primary)",
          letterSpacing: "-0.015em",
        }}
      >
        SyncPost
      </span>
    </div>
  )
}
