'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  className?: string
  showRadialGradient?: boolean
  children?: React.ReactNode
}

export function AuroraBackground({
  className,
  showRadialGradient = true,
  children,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col min-h-screen items-center justify-center bg-background text-text-primary overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            'absolute -inset-[10px] opacity-40 will-change-transform',
            'bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.35),transparent_60%),radial-gradient(ellipse_60%_40%_at_100%_80%,rgba(167,139,250,0.18),transparent),radial-gradient(ellipse_60%_40%_at_0%_50%,rgba(124,58,237,0.12),transparent)]',
            'blur-[6px]',
          )}
        />
        <div
          className={cn(
            'absolute inset-0',
            'bg-[linear-gradient(120deg,rgba(124,58,237,0.18)_0%,rgba(167,139,250,0.08)_25%,transparent_50%,rgba(124,58,237,0.12)_75%,rgba(109,40,217,0.18)_100%)]',
            'bg-[length:200%_200%] animate-aurora opacity-50',
            showRadialGradient &&
              '[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]',
          )}
        />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
