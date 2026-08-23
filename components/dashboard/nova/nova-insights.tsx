"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Coins,
  Lightbulb,
  Sparkles,
  Store,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

/**
 * Insights — cartão da coluna direita do dashboard.
 *
 * Não é um mural de dicas genéricas: os primeiros itens são lidos do estado
 * REAL da conta (nada agendado, marca sem conteúdo, data comemorativa
 * chegando, saldo baixo) e só depois entram as dicas de ofício. Insight que
 * não olha pros seus dados é frase de biscoito da sorte.
 *
 * COR: só o azul da marca. A versão anterior pintava o cartão com uma cor por
 * categoria (âmbar pra saldo, violeta pra marca…) e o dashboard virava um
 * semáforo — o que muda entre um insight e outro é o ícone, não a paleta.
 *
 * Roda sozinho porque o cartão é pequeno e tem mais de um recado; para no
 * hover e no foco, e respeita prefers-reduced-motion.
 */

export interface NovaInsight {
  id: string
  /** Rótulo curto acima do texto: "Agenda", "Saldo", "Oportunidade"… */
  kicker: string
  texto: string
  /** Ação opcional — quando existe, o insight vira acionável. */
  href?: string
  cta?: string
}

const INTERVALO_MS = 7000

/** Azul da marca (--nv-brand). Em rgb pra compor os gradientes inline. */
const AZUL = "22, 104, 227"

/** Só o ícone muda por categoria — a cor é sempre a mesma. */
const ICONES: Record<string, LucideIcon> = {
  agenda: CalendarClock,
  saldo: Coins,
  marca: Store,
  ritmo: TrendingUp,
  oportunidade: Sparkles,
  dica: Lightbulb,
}

export function NovaInsights({ items }: { items: NovaInsight[] }) {
  const [i, setI] = useState(0)
  const [pausado, setPausado] = useState(false)
  const timerRef = useRef<number | null>(null)

  const total = items.length

  useEffect(() => {
    if (total <= 1 || pausado) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    timerRef.current = window.setTimeout(
      () => setI((v) => (v + 1) % total),
      INTERVALO_MS,
    )
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [i, pausado, total])

  if (total === 0) return null

  const atual = items[Math.min(i, total - 1)]
  const Icone = ICONES[atual.kicker.toLowerCase()] ?? Lightbulb
  const ir = (n: number) => setI((n + total) % total)

  return (
    <div
      /* shrink-0 + min-h: o cartão nunca encolhe abaixo do próprio conteúdo
         (era o que cortava o botão) e não sanfona a cada troca de insight. */
      className={`nv-card nv-fade relative min-h-[208px] shrink-0 overflow-hidden p-5 ${pausado ? "nv-insight-paused" : ""}`}
      style={{ borderColor: `rgba(${AZUL}, 0.28)` }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      {/* Duas camadas de luz cruzando o cartão em tempos diferentes. */}
      <div
        aria-hidden
        className="nv-insight-bg"
        style={{
          background: `radial-gradient(42% 46% at 22% 24%, rgba(${AZUL}, 0.55), rgba(${AZUL}, 0) 70%)`,
        }}
      />
      <div
        aria-hidden
        className="nv-insight-bg-2"
        style={{
          background: `radial-gradient(38% 42% at 80% 74%, rgba(56, 189, 248, 0.34), rgba(56, 189, 248, 0) 72%)`,
        }}
      />
      <div
        aria-hidden
        className="nv-insight-edge"
        style={{
          background: `linear-gradient(90deg, rgba(${AZUL}, 0) 0%, rgba(${AZUL}, 0.85) 45%, rgba(${AZUL}, 0) 100%)`,
        }}
      />

      <div className="nv-insight-front flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{
                background: `rgba(${AZUL}, 0.16)`,
                border: `1px solid rgba(${AZUL}, 0.34)`,
                color: "#8DB8F7",
              }}
            >
              <Icone className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h2
                className="text-[15px] font-semibold leading-none"
                style={{ color: "var(--nv-text)" }}
              >
                Insights
              </h2>
              <p
                className="mt-1 text-[11px] leading-none"
                style={{ color: "var(--nv-text-subtle)" }}
              >
                {i + 1} de {total}
              </p>
            </div>
          </div>
          {total > 1 && (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => ir(i - 1)}
                aria-label="Insight anterior"
                className="nv-insight-ctrl grid h-7 w-7 place-items-center rounded-lg border border-transparent transition-colors hover:border-white/10 hover:bg-white/[0.07]"
                style={{ color: "var(--nv-text-muted)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => ir(i + 1)}
                aria-label="Próximo insight"
                className="nv-insight-ctrl grid h-7 w-7 place-items-center rounded-lg border border-transparent transition-colors hover:border-white/10 hover:bg-white/[0.07]"
                style={{ color: "var(--nv-text-muted)" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* key: remonta a cada troca pra animação de entrada rodar de novo.
            aria-live: quem usa leitor de tela ouve a troca do carrossel. */}
        <div key={atual.id} className="nv-insight-in flex-1" aria-live="polite">
          <span
            className="inline-flex items-center rounded-md px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.14em]"
            style={{ background: `rgba(${AZUL}, 0.16)`, color: "#8DB8F7" }}
          >
            {atual.kicker}
          </span>
          <p
            className="mt-2.5 text-[13.5px] leading-[1.55]"
            style={{ color: "var(--nv-text)" }}
          >
            {atual.texto}
          </p>
          {atual.href && (
            <Link
              href={atual.href}
              className="nv-insight-ctrl mt-3.5 inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-black"
              style={{
                background: "rgba(0,0,0,0.72)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              {atual.cta ?? "Ver"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {total > 1 && (
          <div className="mt-5 flex items-center gap-2">
            {/* Trilho do tempo: a barra preenche até o próximo insight. */}
            <div
              className="h-[3px] flex-1 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                key={atual.id}
                className="nv-insight-progress h-full rounded-full"
                style={{
                  background: `rgb(${AZUL})`,
                  animationDuration: `${INTERVALO_MS}ms`,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {items.map((it, idx) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => ir(idx)}
                  aria-label={`Insight ${idx + 1} de ${total}`}
                  aria-current={idx === i}
                  className="nv-insight-ctrl h-1.5 w-1.5 rounded-full transition-all"
                  style={{
                    background:
                      idx === i ? `rgb(${AZUL})` : "rgba(255,255,255,0.22)",
                    transform: idx === i ? "scale(1.35)" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
