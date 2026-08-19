"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

/*
 * Fundo do hero. O LiquidEther é WebGL + three: carrega só no cliente, só
 * depois do primeiro paint e só se o aparelho topar — em prefers-reduced-motion
 * ou tela pequena o hero fica com o gradiente estático, que é o que importa
 * pra leitura da headline. Enquanto o bundle não chega, o mesmo gradiente
 * segura o lugar (nada de buraco preto no primeiro frame).
 */

const LiquidEther = dynamic(() => import("./liquid-ether"), { ssr: false })

/* Paleta da marca: azul principal, o violeta que a identidade herdou e o azul
   claro do gradiente de texto. Trocar aqui muda o hero inteiro. */
const CORES = ["#1668E3", "#7A5BFF", "#8DB8F7"]

function Estatico() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(22,104,227,0.30), transparent 70%), radial-gradient(ellipse 40% 40% at 72% 60%, rgba(122,91,255,0.20), transparent 70%)",
      }}
    />
  )
}

export function HeroBackdrop() {
  const [liga, setLiga] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.innerWidth < 768) return

    /* Espera o hero pintar antes de subir o simulador. */
    const t = setTimeout(() => setLiga(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="absolute inset-0">
      <Estatico />
      {liga && (
        <div className="absolute inset-0 opacity-90">
          <LiquidEther
            colors={CORES}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
      )}
    </div>
  )
}
