"use client"

import { motion, useReducedMotion } from "framer-motion"
import { CountUp } from "./count-up"

/*
 * A seção "a verdade que ninguém te conta" era três cards idênticos com um X
 * vermelho dentro de um quadradinho — o formato mais genérico que existe.
 * Aqui cada dor ganha um visual próprio que mostra o problema acontecendo:
 * horas queimando, alcance caindo e o feed repetindo o mesmo layout.
 *
 * Grid assimétrico de propósito (5 / 7 / 12): quebra a simetria que faz a
 * página parecer gerada.
 */

const VIEWPORT = { once: true, margin: "-80px" } as const

/* ── 01 · Semana no Canva ─────────────────────────────────────── */

const SEMANA = [
  { d: "seg", h: 0.9 },
  { d: "ter", h: 0.55 },
  { d: "qua", h: 1 },
  { d: "qui", h: 0.4 },
  { d: "sex", h: 0.75 },
  { d: "sáb", h: 0.2 },
  { d: "dom", h: 0.85 },
]

function VisualHoras({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="mt-6">
      <div className="flex items-end gap-2 h-24">
        {SEMANA.map((dia, i) => (
          <div key={dia.d} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full h-20 rounded-md bg-surface-2 relative overflow-hidden">
              <motion.div
                className="absolute inset-x-0 bottom-0 rounded-md bg-danger/25 border-t border-danger/50"
                initial={reduced ? false : { height: 0 }}
                whileInView={{ height: `${dia.h * 100}%` }}
                viewport={VIEWPORT}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: "easeOut" }}
              />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-subtle">
              {dia.d}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-baseline justify-between border-t border-hairline pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Só montando arte
        </span>
        <span className="font-mono text-xl tabular-nums text-danger">
          <CountUp to={4.7} decimals={1} suffix="h/semana" />
        </span>
      </div>
    </div>
  )
}

/* ── 02 · Alcance esfriando ───────────────────────────────────── */

/* Sobe enquanto tem post e despenca no silêncio — o desenho conta a história. */
const ALCANCE = [38, 52, 61, 74, 88, 96, 70, 54, 41, 33, 26, 21, 17, 14]
const CORTE = 6 /* índice em que a pessoa some do feed */

function VisualAlcance({ reduced }: { reduced: boolean | null }) {
  return (
    <div className="mt-6">
      <div className="relative flex items-end gap-[3px] h-32">
        {ALCANCE.map((v, i) => (
          <motion.div
            key={i}
            className={`flex-1 rounded-sm ${
              i < CORTE ? "bg-primary/70" : "bg-danger/30"
            }`}
            initial={reduced ? false : { height: 0 }}
            whileInView={{ height: `${v}%` }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: "easeOut" }}
          />
        ))}

        {/* marca onde a constância parou */}
        <motion.div
          className="absolute inset-y-0 border-l border-dashed border-danger/60"
          style={{ left: `${(CORTE / ALCANCE.length) * 100}%` }}
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <span className="absolute -top-1 left-2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.12em] text-danger">
            você parou de postar
          </span>
        </motion.div>
      </div>
      <div className="mt-5 flex items-baseline justify-between border-t border-hairline pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Alcance 30 dias depois
        </span>
        <span className="font-mono text-xl tabular-nums text-danger">
          <CountUp to={-82} suffix="%" />
        </span>
      </div>
    </div>
  )
}

/* ── 03 · Esteira de templates ────────────────────────────────── */

function VisualTemplates() {
  /* Doze quadros iguais rolando: a repetição É o argumento. */
  const quadros = Array.from({ length: 12 })

  return (
    <div className="lp-fade-x mt-6 overflow-hidden">
      <div className="lp-marquee gap-3">
        {[...quadros, ...quadros].map((_, i) => (
          <div
            key={i}
            className={`shrink-0 w-24 aspect-[4/5] rounded-lg border p-3 flex flex-col justify-end gap-1.5 ${
              i % 12 === 5
                ? "border-danger/40 bg-danger/[0.05]"
                : "border-hairline bg-surface-2"
            }`}
          >
            <div className="h-1.5 w-3/4 rounded-full bg-text-subtle/25" />
            <div className="h-1.5 w-1/2 rounded-full bg-text-subtle/15" />
            {i % 12 === 5 && (
              <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-danger">
                o seu
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Casca ────────────────────────────────────────────────────── */

function Cartao({
  n,
  titulo,
  texto,
  children,
  className = "",
  delay = 0,
  reduced,
}: {
  n: string
  titulo: string
  texto: string
  children: React.ReactNode
  className?: string
  delay?: number
  reduced: boolean | null
}) {
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] }}
      className={`lp-card group relative overflow-hidden rounded-2xl border border-hairline bg-surface p-7 ${className}`}
    >
      {/* halo quente que acende no hover — dor, não marca */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-danger/[0.07] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] tabular-nums text-danger">{n}</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>
        <h3 className="mt-4 text-lg font-semibold md:text-xl">{titulo}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{texto}</p>
        {children}
      </div>
    </motion.article>
  )
}

export function PainCards() {
  const reduced = useReducedMotion()

  return (
    <div className="grid gap-5 md:grid-cols-12">
      <Cartao
        n="01"
        titulo="O Canva come suas horas"
        texto="Cada carrossel vira uma hora fuçando template, fonte e alinhamento. Tempo que devia virar venda."
        className="md:col-span-5"
        reduced={reduced}
      >
        <VisualHoras reduced={reduced} />
      </Cartao>

      <Cartao
        n="02"
        titulo="Sem constância, o alcance morre"
        texto="O algoritmo premia quem aparece todo dia. Você some uma semana e o perfil esfria por um mês."
        className="md:col-span-7"
        delay={0.1}
        reduced={reduced}
      >
        <VisualAlcance reduced={reduced} />
      </Cartao>

      <Cartao
        n="03"
        titulo="Tudo com cara de template"
        texto="Os mesmos layouts prontos de todo mundo. Seu conteúdo se dilui no meio do feed e ninguém para pra ler."
        className="md:col-span-12"
        delay={0.2}
        reduced={reduced}
      >
        <VisualTemplates />
      </Cartao>
    </div>
  )
}
