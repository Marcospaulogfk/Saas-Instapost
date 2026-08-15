"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"

type CountUpProps = {
  to: number
  /** Casas decimais — pra "4,9" e afins. */
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

/** Número que conta ao entrar na viewport. Formata em pt-BR. */
export function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced ? to : 0)

  useEffect(() => {
    if (!inView || reduced) return
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      // easeOutExpo — rápido no início, freia no final
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setValue(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, to, duration])

  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
