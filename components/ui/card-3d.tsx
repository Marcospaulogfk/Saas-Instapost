'use client'

import { useRef, MouseEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Card3DProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

export function Card3D({ children, className, intensity = 15 }: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    setRotation({
      x: ((y - centerY) / centerY) * -intensity,
      y: ((x - centerX) / centerX) * intensity,
    })
  }
  const handleMouseLeave = () => setRotation({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
