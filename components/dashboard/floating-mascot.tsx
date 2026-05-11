"use client"

import { useState, useEffect } from "react"
import { Sparkles, X, MessageCircle, Lightbulb } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface Tip {
  text: string
  cta?: { label: string; href: string }
}

const TIPS_BY_PATH: Record<string, Tip[]> = {
  "/dashboard": [
    {
      text:
        "Comece a legenda com um gancho forte — uma pergunta provocativa funciona melhor que afirmações.",
    },
    {
      text:
        "Posts no horário 18h-21h costumam ter 2x mais alcance que durante o dia útil.",
    },
    {
      text: "Variar o tipo de post (carrossel, único, story) na semana ajuda no algoritmo.",
    },
  ],
  "/dashboard/criar": [
    {
      text: 'Quanto mais específico o briefing, melhor a copy. "Vender curso" é genérico — "Curso de Excel pra contadores" gera ouro.',
    },
    {
      text: "Não force IA a inventar números. Se você tem um caso real, escreve no briefing.",
    },
  ],
  "/dashboard/calendario": [
    {
      text: 'Use "Recomendações IA" pra preencher 1 mês inteiro de pautas em 30 segundos.',
    },
  ],
  "/dashboard/jornada": [
    {
      text: "Missões diárias renovam toda madrugada. 5 minutos por dia = +50 XP.",
    },
  ],
  "/dashboard/inspiracoes": [
    {
      text: "Cada inspiração já vem com briefing pré-pronto. Click nela e ajusta antes de gerar.",
    },
  ],
}

const DEFAULT_TIPS: Tip[] = [
  {
    text:
      "Dica: o editor do post único permite arrastar qualquer bloco, mudar fonte e cor.",
    cta: { label: "Abrir editor", href: "/teste" },
  },
  { text: "Você sabia? O carrossel exporta cada slide separado em PNG." },
]

export function FloatingMascot() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tipIdx, setTipIdx] = useState(0)
  const [hasNew, setHasNew] = useState(true)

  const tips = TIPS_BY_PATH[pathname] ?? DEFAULT_TIPS
  const currentTip = tips[tipIdx % tips.length]

  // Reset notification dot when user opens
  useEffect(() => {
    if (open) setHasNew(false)
  }, [open])

  // Reset tip + notification when path changes
  useEffect(() => {
    setTipIdx(0)
    setHasNew(true)
  }, [pathname])

  return (
    <>
      {/* Tooltip card */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm">
          <div className="rounded-xl bg-background-tertiary border border-border-medium shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-lime mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-primary leading-relaxed">
                {currentTip.text}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text-primary -mt-1 -mr-1 p-1"
                aria-label="Fechar dica"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {currentTip.cta && (
              <Link
                href={currentTip.cta.href}
                onClick={() => setOpen(false)}
                className="block text-[11px] text-purple-400 hover:text-purple-300 font-medium"
              >
                {currentTip.cta.label} →
              </Link>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setTipIdx((i) => (i + 1) % tips.length)}
                className="text-[10px] text-text-muted hover:text-text-primary flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Outra dica
              </button>
              <span className="text-[9px] text-text-muted">
                {((tipIdx % tips.length) + 1)}/{tips.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir dicas do assistente"
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-900/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        {hasNew && !open && (
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-lime border-2 border-background-secondary animate-pulse" />
        )}
      </button>
    </>
  )
}
