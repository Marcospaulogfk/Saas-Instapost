"use client"

import { motion, useReducedMotion } from "framer-motion"
import { CountUp } from "./count-up"

const ITENS = [
  { item: "Canva Pro", nota: "design", preco: 49.9 },
  { item: "ChatGPT Plus", nota: "textos e ideias", preco: 109 },
  { item: "Gerador de imagem com IA", nota: "assinatura avulsa", preco: 79 },
  { item: "Designer freelancer", nota: "layouts", preco: 250 },
  { item: "Copywriter freelancer", nota: "roteiros", preco: 85 },
]

const TOTAL = ITENS.reduce((s, i) => s + i.preco, 0)
const MAIOR = Math.max(...ITENS.map((i) => i.preco))

/** Empilhamento de custos com barra proporcional — a soma conta na entrada. */
export function CostStack() {
  const reduced = useReducedMotion()

  return (
    <div className="rounded-2xl border border-hairline bg-surface overflow-hidden">
      <div className="divide-y divide-hairline">
        {ITENS.map((r, i) => (
          <motion.div
            key={r.item}
            initial={reduced ? false : { opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="relative px-6 py-4"
          >
            {/* barra proporcional ao preço, atrás do conteúdo */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-danger/[0.07]"
              initial={reduced ? false : { width: 0 }}
              whileInView={{ width: `${(r.preco / MAIOR) * 100}%` }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.08, ease: "easeOut" }}
            />
            <div className="relative flex items-center justify-between gap-4">
              <span className="text-[15px] text-text-secondary">
                {r.item}{" "}
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                  · {r.nota}
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums text-text-muted line-through decoration-danger/60 shrink-0">
                R$ {r.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between px-6 py-5 bg-surface-2 border-t border-hairline">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Soma de tudo (referência)
        </span>
        <span className="font-mono text-xl font-semibold tabular-nums text-danger">
          <CountUp to={TOTAL} decimals={0} prefix="~R$ " suffix="/mês" />
        </span>
      </div>

      <div className="flex items-center justify-between px-6 py-6 border-t-2 border-t-primary">
        <div>
          <div className="font-semibold text-foreground">Nexus Content Pro</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mt-0.5">
            tudo num lugar só
          </div>
        </div>
        <span className="lp-display text-3xl tabular-nums text-primary">
          <CountUp to={97} prefix="R$ " />
          <span className="font-mono text-xs text-text-muted font-normal ml-1">/mês</span>
        </span>
      </div>
    </div>
  )
}
