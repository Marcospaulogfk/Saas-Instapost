"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

/**
 * Showcase com efeito antigravity:
 * - 3 cards de carrossel flutuando em 3D
 * - Drift contínuo (loop infinito)
 * - Parallax sensível à posição do cursor
 * - Partículas subindo no fundo
 *
 * Posicionado absolute, atrás do conteúdo principal.
 */
export function AntigravityShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 60, damping: 20 })
  const smy = useSpring(my, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height
      mx.set(x)
      my.set(y)
    }
    window.addEventListener("mousemove", handle)
    return () => window.removeEventListener("mousemove", handle)
  }, [mx, my])

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ perspective: 1400 }}
    >
      {/* Cards posicionados no lado direito pra não competir com o texto (max-w-md à esquerda) */}
      <FloatingCard
        x={smx}
        y={smy}
        depth={1.2}
        baseStyle={{
          top: "8%",
          right: "18%",
          width: 200,
          height: 250,
          rotate: -10,
        }}
        driftDelay={0}
        accent="primary"
      />
      <FloatingCard
        x={smx}
        y={smy}
        depth={2.0}
        baseStyle={{
          top: "34%",
          right: "4%",
          width: 240,
          height: 300,
          rotate: 7,
        }}
        driftDelay={1.4}
        accent="light"
      />
      <FloatingCard
        x={smx}
        y={smy}
        depth={0.9}
        baseStyle={{
          bottom: "10%",
          right: "22%",
          width: 175,
          height: 220,
          rotate: 5,
        }}
        driftDelay={2.8}
        accent="primary"
      />

      <Particles />
    </div>
  )
}

function FloatingCard({
  x,
  y,
  depth,
  baseStyle,
  driftDelay,
  accent,
}: {
  x: ReturnType<typeof useMotionValue<number>>
  y: ReturnType<typeof useMotionValue<number>>
  depth: number
  baseStyle: {
    top?: string
    left?: string
    right?: string
    bottom?: string
    width: number
    height: number
    rotate: number
  }
  driftDelay: number
  accent: "primary" | "light"
}) {
  // Parallax: cards profundos movem menos, próximos movem mais
  const tx = useTransform(x, (v) => v * 28 * depth)
  const ty = useTransform(y, (v) => v * 28 * depth)
  const tilt = useTransform(x, (v) => v * 4)
  const tiltY = useTransform(y, (v) => v * -4)

  return (
    <motion.div
      className="absolute"
      style={{
        ...baseStyle,
        translateX: tx,
        translateY: ty,
        rotateX: tiltY,
        rotateY: tilt,
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        animate={{
          y: [0, -22, 0, 18, 0],
          rotate: [
            baseStyle.rotate,
            baseStyle.rotate + 1.5,
            baseStyle.rotate,
            baseStyle.rotate - 1.5,
            baseStyle.rotate,
          ],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: driftDelay,
        }}
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(40, 30, 88, 0.92) 0%, rgba(18, 14, 42, 0.95) 100%)",
          border: "0.5px solid rgba(255, 255, 255, 0.06)",
          boxShadow:
            accent === "primary"
              ? "0 24px 60px -12px rgba(124, 92, 255, 0.35), 0 0 0 1px rgba(124, 92, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 20px 50px -12px rgba(184, 164, 234, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Glow interno */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124, 92, 255, 0.25), transparent 60%)",
          }}
        />

        {/* Topo: profile + badge */}
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #B8A4EA, #7C5CFF)",
              }}
            />
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-[8px] font-semibold tracking-wider"
            style={{
              background: "rgba(124, 92, 255, 0.2)",
              color: "#D5C8F0",
              border: "0.5px solid rgba(124, 92, 255, 0.4)",
            }}
          >
            NEW
          </div>
        </div>

        {/* Centro: text bars */}
        <div className="relative px-4 mt-3 space-y-2">
          <div className="h-2.5 w-[88%] rounded bg-white/85" />
          <div className="h-2.5 w-[72%] rounded bg-white/85" />
          <div className="h-2.5 w-[60%] rounded bg-white/55" />
        </div>

        {/* Body bars menores */}
        <div className="relative px-4 mt-4 space-y-1">
          <div className="h-1 w-full rounded-full bg-white/15" />
          <div className="h-1 w-[90%] rounded-full bg-white/15" />
          <div className="h-1 w-[78%] rounded-full bg-white/12" />
          <div className="h-1 w-[65%] rounded-full bg-white/12" />
        </div>

        {/* Rodapé: CTA pill */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <div
            className="h-1 w-12 rounded-full"
            style={{ background: "linear-gradient(90deg, #B8A4EA, #7C5CFF)" }}
          />
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-0.5 h-0.5 rounded-full"
                style={{
                  background:
                    i === 0
                      ? "#7C5CFF"
                      : "rgba(255, 255, 255, 0.25)",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Partículas subindo (microbubbles) */
function Particles() {
  const [seeds, setSeeds] = useState<number[]>([])
  useEffect(() => {
    // Inicializa só no cliente pra evitar mismatch SSR
    setSeeds(Array.from({ length: 14 }, (_, i) => i))
  }, [])
  if (seeds.length === 0) return null
  return (
    <div className="absolute inset-0 pointer-events-none">
      {seeds.map((i) => {
        const left = (i * 7.3 + 13) % 100
        const size = 2 + ((i * 11) % 4)
        const duration = 12 + ((i * 3) % 8)
        const delay = (i * 0.7) % 8
        return (
          <motion.div
            key={i}
            className="absolute bottom-[-20px] rounded-full"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: "rgba(184, 164, 234, 0.5)",
              boxShadow: "0 0 8px rgba(124, 92, 255, 0.6)",
            }}
            animate={{
              y: [0, -800],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )
      })}
    </div>
  )
}
