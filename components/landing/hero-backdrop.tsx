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

/* Placas que dividem memória com o sistema (integradas) e renderizadores por
   software. A simulação de fluidos roda Navier-Stokes a cada frame: nesses
   aparelhos ela estrangula o compositor e o Chrome derruba a aba, ainda mais
   quando a RAM da máquina já está apertada. */
const GPU_FRACA = /(SwiftShader|llvmpipe|Microsoft Basic|Mesa|Intel|UHD|HD Graphics)/i

/*
 * O gate. Errar pro lado conservador custa só um enfeite: o gradiente estático
 * continua entregando o hero. Errar pro outro lado custa a página inteira.
 */
function aguentaSimulacao(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
    if (window.innerWidth < 1024) return false

    const nucleos = navigator.hardwareConcurrency ?? 2
    if (nucleos < 8) return false

    /* deviceMemory só existe em navegador baseado em Chromium; onde não existe
       a gente não bloqueia por isso. */
    const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (typeof memoria === "number" && memoria < 8) return false

    const canvas = document.createElement("canvas")
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null
    if (!gl) return false

    const info = gl.getExtension("WEBGL_debug_renderer_info")
    const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ""

    /* Perde o contexto na hora: um canvas de teste não pode ficar segurando
       slot de WebGL, que é recurso contado pelo navegador. */
    gl.getExtension("WEBGL_lose_context")?.loseContext()

    if (gpu && GPU_FRACA.test(gpu)) return false
    return true
  } catch {
    return false
  }
}

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
    if (!aguentaSimulacao()) return

    /* Espera o hero pintar antes de subir o simulador. */
    const t = setTimeout(() => setLiga(true), 400)
    return () => clearTimeout(t)
  }, [])

  /* Se o driver derrubar o contexto WebGL mesmo assim, volta pro estático em
     vez de deixar um canvas morto por cima do hero. */
  useEffect(() => {
    if (!liga) return
    const onPerdeu = () => setLiga(false)
    window.addEventListener("webglcontextlost", onPerdeu, true)
    return () => window.removeEventListener("webglcontextlost", onPerdeu, true)
  }, [liga])

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
            iterationsViscous={16}
            iterationsPoisson={24}
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
