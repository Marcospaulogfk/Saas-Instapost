"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, X } from "lucide-react"

/*
 * CTA flutuante com o mascote. Substitui a barra fixa antiga: aquela ocupava a
 * largura toda e competia com o conteúdo — esta é uma pílula no canto, com o
 * mascote acenando e um balão que aparece sozinho na primeira vez.
 *
 * Some perto do CTA final (pra não duplicar a mesma oferta) e pode ser fechada;
 * a escolha vale pela sessão (sessionStorage), não pra sempre.
 */

const CHAVE = "nexus:cta-mascote-fechado"

export function MascoteCta() {
  const [visivel, setVisivel] = useState(false)
  const [fechado, setFechado] = useState(true)
  const [balao, setBalao] = useState(false)

  useEffect(() => {
    setFechado(sessionStorage.getItem(CHAVE) === "1")
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      /* Some antes do CTA final — a última tela já tem o botão grande. */
      const fim = document.documentElement.scrollHeight - window.innerHeight - 900
      setVisivel(y > window.innerHeight * 0.9 && y < fim)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* O balão entra um pouco depois da pílula e se recolhe sozinho. */
  useEffect(() => {
    if (!visivel || fechado) return
    const abre = setTimeout(() => setBalao(true), 900)
    const fecha = setTimeout(() => setBalao(false), 7000)
    return () => {
      clearTimeout(abre)
      clearTimeout(fecha)
    }
  }, [visivel, fechado])

  if (fechado) return null

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.94 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-40 flex items-end gap-2.5"
        >
          {/* Balão */}
          <AnimatePresence>
            {balao && (
              <motion.div
                initial={{ opacity: 0, x: 12, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12, scale: 0.95 }}
                transition={{ duration: 0.28 }}
                className="mb-2 hidden max-w-[15rem] rounded-2xl rounded-br-sm border border-hairline bg-surface px-4 py-3 shadow-[0_14px_40px_-16px_rgba(0,0,0,0.7)] sm:block"
              >
                <p className="text-[13px] leading-snug text-text-secondary">
                  Monta o primeiro carrossel comigo — leva 3 minutos e não pede cartão.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem(CHAVE, "1")
                setFechado(true)
              }}
              aria-label="Fechar convite"
              className="absolute -left-1 -top-1 z-10 grid h-6 w-6 place-items-center rounded-full border border-hairline bg-surface text-text-muted transition hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>

            <Link
              href="/onboarding"
              onMouseEnter={() => setBalao(true)}
              className="lp-cta-glow group flex items-center gap-3 rounded-full border border-white/10 bg-primary py-2 pl-2 pr-5 text-white transition-transform hover:-translate-y-0.5"
            >
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#040B1E] ring-1 ring-white/20">
                <Image
                  /* recorte de 160px feito a partir do PNG de 1080 da identidade —
                     o original tem 950KB e isso aqui é uma bolinha de 44px */
                  src="/mascote-nexus-avatar.png"
                  alt="Mascote do Nexus Content"
                  fill
                  sizes="44px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </span>

              <span className="text-left">
                <span className="block text-sm font-medium leading-tight">Testar grátis</span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-white/70">
                  1 carrossel · sem cartão
                </span>
              </span>

              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
