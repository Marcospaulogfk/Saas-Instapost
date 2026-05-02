'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SparkleProps {
  className?: string
  size?: number
  delay?: number
  style?: React.CSSProperties
}

export function Sparkle({ className, size = 24, delay = 0, style }: SparkleProps) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none', className)}
      style={style}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 0L13.5 9L22 12L13.5 15L12 24L10.5 15L2 12L10.5 9L12 0Z"
          fill="url(#sparkle-gradient)"
        />
        <defs>
          <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

interface SparklesFieldProps {
  count?: number
  className?: string
}

interface SparkleSpec {
  key: number
  size: number
  delay: number
  top: string
  left: string
}

export function SparklesField({ count = 5, className }: SparklesFieldProps) {
  // Gera posições só no client após mount pra evitar hydration mismatch.
  const [sparkles, setSparkles] = useState<SparkleSpec[]>([])

  useEffect(() => {
    setSparkles(
      Array.from({ length: count }).map((_, i) => ({
        key: i,
        size: Math.random() * 16 + 8,
        delay: Math.random() * 3,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
      })),
    )
  }, [count])

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {sparkles.map((s) => (
        <Sparkle key={s.key} size={s.size} delay={s.delay} style={{ top: s.top, left: s.left }} />
      ))}
    </div>
  )
}
