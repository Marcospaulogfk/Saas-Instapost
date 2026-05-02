"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

/**
 * Background ambiental único pro dashboard:
 * - 4 mesh blobs roxos animados em loop infinito (movimento orgânico).
 * - Spotlight que segue o cursor pela viewport inteira.
 * - Grid sutil que apaga nas bordas.
 *
 * Tudo é absolute/fixed, atrás do conteúdo (-z-10), pointer-events-none.
 */
export function DashboardAmbient() {
  const ref = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: -500, y: -500, active: false })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true })
    }
    const handleLeave = () => setMouse((m) => ({ ...m, active: false }))

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseleave", handleLeave)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Mesh blobs animados — só roxo/violet/preto */}
      <motion.div
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-purple-700/30 blur-[120px]"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, 60, -50, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-violet-800/25 blur-[120px]"
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 80, -30, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-900/30 blur-[120px]"
        animate={{
          x: [0, 60, -80, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.08, 0.92, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] rounded-full bg-violet-700/22 blur-[120px]"
        animate={{
          x: [0, -50, 70, 0],
          y: [0, 50, -60, 0],
          scale: [1, 0.92, 1.12, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Grid sutil com fade radial */}
      <div className="absolute inset-0 grid-bg-fade opacity-20" />

      {/* Mouse spotlight */}
      <div
        className="absolute pointer-events-none transition-opacity duration-500"
        style={{
          left: mouse.x,
          top: mouse.y,
          width: 700,
          height: 700,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.18) 0%, rgba(124,58,237,0.10) 25%, transparent 60%)",
          opacity: mouse.active ? 1 : 0,
          willChange: "left, top",
        }}
      />
    </div>
  )
}
