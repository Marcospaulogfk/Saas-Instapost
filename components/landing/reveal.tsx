"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

/*
 * Entradas por scroll em CSS puro.
 *
 * Antes isto era framer-motion. O problema: numa máquina com GPU fraca, a
 * thread principal engasga e as animações JS não rodam — como o estado inicial
 * é `opacity: 0`, a página aparecia em branco. Agora o JS só liga uma classe;
 * quem anima é o compositor, e se algo travar o conteúdo aparece mesmo assim.
 */

type RevealProps = {
  children: ReactNode
  /** Atraso em segundos — use pra escalonar itens de uma mesma linha. */
  delay?: number
  from?: "bottom" | "left" | "right" | "scale"
  className?: string
}

export function Reveal({ children, delay = 0, from = "bottom", className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    /* Avisa o CSS que o JS assumiu — desliga o failsafe de 2,5s (ver globals). */
    document.documentElement.classList.add("lp-js")

    /* Já está na tela no primeiro paint (hero): mostra sem esperar o observer. */
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setVisivel(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true)
          io.disconnect()
        }
      },
      { rootMargin: "-60px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`lp-reveal lp-reveal-${from} ${visivel ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}

/**
 * Headline revelada palavra a palavra — animação CSS com delay por índice.
 * `animation-fill-mode: both` garante o estado final mesmo se o frame atrasar.
 */
export function RevealWords({
  text,
  className = "",
  highlight = [],
}: {
  text: string
  className?: string
  /** Índices de palavra que recebem o gradiente de marca. */
  highlight?: number[]
}) {
  const words = text.split(" ")

  return (
    <span className={className}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className={`lp-word ${highlight.includes(i) ? "lp-text-gradient" : ""}`}
          style={{ animationDelay: `${0.05 * i}s` }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  )
}
