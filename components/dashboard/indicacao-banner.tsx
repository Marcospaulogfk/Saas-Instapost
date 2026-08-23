"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Gift, X } from "lucide-react"
import { REFERRAL_TOKENS } from "@/lib/indicacao/config"
import { INDICACAO_HABILITADA } from "@/lib/features"

/**
 * Faixa de indicação no topo do dashboard.
 *
 * É a superfície mais visível do produto e por isso carrega a oferta que
 * precisa ser lida sem rolar: quem indica ganha e quem entra pelo link também.
 * Formato de anúncio (selo + promessa + CTA + fechar), no lugar onde o
 * concorrente põe o dele.
 *
 * Fecha por sessão de navegador, não pra sempre: a oferta não tem prazo, e um
 * dispensar definitivo esconderia o programa de quem só quis tirar a faixa da
 * frente naquele dia.
 */

const CHAVE_FECHADO = "nexus:indicacao:faixa-fechada"

export function IndicacaoBanner() {
  // Começa escondida e só aparece depois do mount: renderizar no servidor e
  // esconder na hidratação faria a faixa "piscar" em quem já fechou.
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!INDICACAO_HABILITADA) return
    try {
      if (sessionStorage.getItem(CHAVE_FECHADO) !== "1") setVisivel(true)
    } catch {
      setVisivel(true)
    }
  }, [])

  if (!visivel) return null

  function fechar() {
    setVisivel(false)
    try {
      sessionStorage.setItem(CHAVE_FECHADO, "1")
    } catch {
      // sem sessionStorage a faixa volta no próximo carregamento — tudo bem
    }
  }

  return (
    <div
      className="relative z-10 mx-2 mt-2 flex items-center gap-3 rounded-2xl px-4 py-2.5"
      style={{
        background: "linear-gradient(90deg, #0d2a63 0%, #1668E3 55%, #2A79EA 100%)",
      }}
    >
      <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:flex">
        <Gift className="h-4 w-4 text-white" />
      </span>
      <span className="hidden shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white sm:inline">
        Indique
      </span>
      <p className="min-w-0 flex-1 truncate text-[13px] text-white">
        <span className="font-bold">
          Ganhe {REFERRAL_TOKENS.indicador} créditos por indicação
        </span>
        <span className="text-white/80">
          {" "}
          — e quem entrar pelo seu link ganha {REFERRAL_TOKENS.indicado}.
        </span>
      </p>
      <Link
        href="/dashboard/indicacao"
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-bold text-[#0d2a63] transition-colors hover:bg-white/90"
      >
        Pegar meu link
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-md p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
