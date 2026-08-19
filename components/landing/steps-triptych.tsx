"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Check, Download, Link2, Sparkles } from "lucide-react"

/*
 * Tríptico dos três passos. Cada card tem um painel visual em cima (o passo
 * acontecendo) e a copy embaixo — em vez de três blocos de texto lado a lado.
 *
 * A entrada é "de dentro pra fora": o card do meio (o produto em si) chega
 * primeiro, os laterais entram depois com um leve deslocamento pro centro. O
 * painel é revelado por clip-path, como uma cortina subindo, e a copy sobe
 * logo atrás. Nada disso roda com prefers-reduced-motion.
 */

const EASE_PLACE = [0.16, 1, 0.3, 1] as const
const EASE_WIPE = [0.24, 0.86, 0.28, 1] as const
const VIEWPORT = { once: true, margin: "-90px" } as const

/* Ordem de entrada: 1 (centro) primeiro, depois 0 e 2. */
const ATRASO = [0.28, 0.06, 0.36]
/* Laterais entram deslizando na direção do centro. */
const DERIVA = [-14, 0, 14]

function cardVariants(i: number, reduced: boolean | null): Variants {
  if (reduced) return { off: {}, on: {} }
  return {
    off: { opacity: 0, y: 16, x: DERIVA[i], scale: 0.985 },
    on: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: { duration: 0.9, delay: ATRASO[i], ease: EASE_PLACE },
    },
  }
}

function painelVariants(i: number, reduced: boolean | null): Variants {
  if (reduced) return { off: {}, on: {} }
  return {
    off: { opacity: 0, clipPath: "inset(0 0 34% 0)" },
    on: {
      opacity: 1,
      clipPath: "inset(0 0 0% 0)",
      transition: { duration: 0.72, delay: ATRASO[i] + 0.2, ease: EASE_WIPE },
    },
  }
}

function copyVariants(i: number, reduced: boolean | null): Variants {
  if (reduced) return { off: {}, on: {} }
  return {
    off: { opacity: 0, y: 11 },
    on: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.62, delay: ATRASO[i] + 0.33, ease: EASE_PLACE },
    },
  }
}

/* ── Painel 01 · a marca sendo lida ───────────────────────────── */

function PainelMarca() {
  const tokens = [
    { l: "Paleta", v: null, cores: ["#1668E3", "#0B1B33", "#F3F0FB"] },
    { l: "Tom de voz", v: "direto, sem jargão" },
    { l: "Público", v: "mulheres 25–40" },
  ]

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5">
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2.5">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate font-mono text-[11px] text-text-secondary">
          suamarca.com.br
        </span>
        <span className="lp-caret ml-auto h-3 w-[2px] bg-primary" aria-hidden />
      </div>

      <div className="space-y-2">
        {tokens.map((t, i) => (
          <motion.div
            key={t.l}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.45, delay: 0.55 + i * 0.14 }}
            className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
              {t.l}
            </span>
            {t.cores ? (
              <span className="flex gap-1">
                {t.cores.map((c) => (
                  <span
                    key={c}
                    className="h-3.5 w-3.5 rounded-full border border-hairline"
                    style={{ background: c }}
                  />
                ))}
              </span>
            ) : (
              <span className="truncate text-[11px] text-text-secondary">{t.v}</span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
        <Check className="h-3 w-3" />
        Marca aprendida
      </div>
    </div>
  )
}

/* ── Painel 02 · o tema virando roteiro (âncora do produto) ───── */

function PainelTema() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-3.5 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15">
          <Sparkles className="h-3 w-3 text-primary" />
        </span>
        <span className="text-[12px] font-bold tracking-tight text-primary">
          Nexus Content
        </span>
      </div>

      <p className="text-[13px] font-medium leading-tight tracking-tight">
        Sobre o que é o carrossel de hoje?
      </p>

      <div className="rounded-lg border border-hairline-strong bg-surface/40 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-text-secondary">
          5 erros que fazem a cliente desistir da compra na hora de fechar
        </p>
      </div>

      <div className="relative">
        <motion.button
          type="button"
          tabIndex={-1}
          aria-hidden
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="lp-cta-glow inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[11px] font-medium text-white"
        >
          Gerar carrossel
          <Sparkles className="h-3 w-3" />
        </motion.button>

        {/* cursor chegando no botão */}
        <motion.span
          aria-hidden
          className="absolute left-[7.5rem] top-6 h-4 w-3"
          initial={{ opacity: 0, x: 26, y: 14 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.95, ease: EASE_PLACE }}
        >
          <svg viewBox="0 0 12 16" className="h-full w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            <path d="M0 0L11.3 7.4L6.8 8L4.6 12z" fill="#fff" stroke="#0b0b0b" strokeWidth="1.6" />
          </svg>
        </motion.span>
      </div>
    </div>
  )
}

/* ── Painel 03 · slides convergindo pro arquivo ───────────────── */

function PainelExport() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 p-5">
      {/* feixes convergindo — SVG anima melhor que canvas aqui e fica nítido
          em qualquer densidade de tela */}
      <svg viewBox="0 0 200 90" className="w-full" role="img" aria-label="Slides convergindo em um arquivo">
        <defs>
          <linearGradient id="feixe" x1="0" x2="1">
            <stop offset="0" stopColor="#1668E3" stopOpacity="0.08" />
            <stop offset="1" stopColor="#1668E3" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {[8, 26, 45, 64, 82].map((y, i) => (
          <motion.path
            key={y}
            d={`M0 ${y} C 76 ${y}, 148 45, 200 45`}
            fill="none"
            stroke="url(#feixe)"
            strokeWidth={i === 2 ? 2.4 : 1.4}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 1, delay: 0.5 + i * 0.09, ease: "easeOut" }}
          />
        ))}
        <motion.circle
          cx="196"
          cy="45"
          r="4"
          fill="#1668E3"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.35, delay: 1.35 }}
        />
      </svg>

      <div className="flex flex-wrap gap-1.5">
        {["8 slides", "Full HD 4:5", "PNG + ZIP"].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.35, delay: 1 + i * 0.1 }}
            className="rounded-full border border-hairline bg-surface px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-text-secondary"
          >
            {t}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

/* ── Tríptico ─────────────────────────────────────────────────── */

const PASSOS = [
  {
    n: "01",
    titulo: "Conte a sua marca",
    desc: "Cola o link do site ou responde 3 perguntas. A IA aprende tom, público e estilo — e nunca mais esquece.",
    Icone: Link2,
    Painel: PainelMarca,
  },
  {
    n: "02",
    titulo: "Digite o tema",
    desc: "Uma frase basta. A engine devolve o roteiro de 8 slides e as imagens no seu território visual.",
    Icone: Sparkles,
    Painel: PainelTema,
  },
  {
    n: "03",
    titulo: "Ajuste e exporte",
    desc: "Refine no editor e baixe em Full HD 4:5 — slide a slide ou o carrossel inteiro em ZIP.",
    Icone: Download,
    Painel: PainelExport,
  },
]

export function StepsTriptych() {
  const reduced = useReducedMotion()

  return (
    <div className="grid gap-5 md:grid-cols-3 md:gap-6">
      {PASSOS.map((p, i) => (
        <motion.article
          key={p.n}
          variants={cardVariants(i, reduced)}
          initial="off"
          whileInView="on"
          viewport={VIEWPORT}
          className={`lp-card relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_18px_40px_-24px_rgba(20,18,28,0.28)] ${
            i === 1 ? "md:-mt-3 md:mb-3" : ""
          }`}
        >
          {/* Painel */}
          <motion.div
            variants={painelVariants(i, reduced)}
            className="relative m-2.5 mb-0 h-56 overflow-hidden rounded-xl border border-hairline"
            style={{
              background:
                i === 1
                  ? "radial-gradient(circle at 74% 46%, rgba(22,104,227,0.16), transparent 52%), linear-gradient(180deg, var(--background-secondary), var(--background-quaternary))"
                  : "radial-gradient(circle at 50% 78%, rgba(22,104,227,0.10), transparent 50%), linear-gradient(180deg, var(--background-secondary), var(--background-tertiary))",
            }}
          >
            <p.Painel />
          </motion.div>

          {/* Copy */}
          <motion.div variants={copyVariants(i, reduced)} className="relative p-6 pt-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[11px] tabular-nums tracking-[0.18em] text-primary">
                {p.n}
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <h3 className="lp-display pr-12 text-xl leading-tight md:text-[1.4rem]">
              {p.titulo}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{p.desc}</p>

            <span className="absolute bottom-6 right-6 grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary">
              <p.Icone className="h-4 w-4" />
            </span>
          </motion.div>
        </motion.article>
      ))}
    </div>
  )
}
