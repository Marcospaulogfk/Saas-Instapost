"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

/*
 * Fundo da seção de planos: mural 3D de peças reais feitas na plataforma
 * subindo devagar atrás dos cards. Mesmo tratamento do hero — só entra no
 * cliente, no desktop, e fora de prefers-reduced-motion; em tudo que sobra a
 * seção fica com o fundo liso de sempre.
 *
 * Sem realce no hover: o mural não reage ao mouse (ver .drift-wall em
 * globals.css) e o clique atravessa direto pros cards.
 */

const DriftWall = dynamic(() => import("./drift-wall"), { ssr: false })

const PECAS = [
  "beauty/01",
  "comercial/02",
  "fitness/03",
  "Profissional/01",
  "informativo/02",
  "comercial/01",
  "beauty/03",
  "fitness/01",
  "empresa/03",
  "Profissional/03",
  "informativo/01",
  "comercial/03",
  "beauty/04",
  "fitness/04",
  "Profissional/02",
].map((p) => ({
  image: `/refs-posts-unicos/${p}/referencia.jpg`,
  title: "",
  /* o tipo do DriftWall infere `href` dos itens padrão — aqui nenhum tile é link */
  href: undefined,
}))

export function PlanosBackdrop() {
  const [liga, setLiga] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.innerWidth < 1024) return
    const t = setTimeout(() => setLiga(true), 300)
    return () => clearTimeout(t)
  }, [])

  if (!liga) return null

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <DriftWall
        items={PECAS}
        columns={5}
        tileWidth={200}
        tileHeight={132}
        gap={18}
        tilt={16}
        turn={-14}
        perspective={1200}
        depth={120}
        speed={42}
        direction="up"
        variance={0.45}
        /* parallax zerado: o mural não escuta o mouse (pointer-events: none) */
        parallax={0}
        lift={0}
        fade={0.6}
        dim={0.35}
        overlayColor="#05070D"
        radius={14}
        roll={0}
        pauseOnHover={false}
        grayscale={false}
      />
      {/* véu: os cards de plano precisam ganhar do mural */}
      <div className="absolute inset-0 bg-background/72" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}
