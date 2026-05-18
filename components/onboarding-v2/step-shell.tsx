"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function StepShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mx-auto w-full max-w-[600px] px-8 py-12"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <div
          className="onb-icon-circle mb-5"
          style={{ width: 56, height: 56 }}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--onb-text-primary)",
            marginBottom: 6,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--onb-text-secondary)",
            maxWidth: 460,
          }}
        >
          {subtitle}
        </p>
      </div>

      {children}
    </motion.div>
  )
}
