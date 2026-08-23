"use client"

import type { MouseEvent } from "react"
import Link from "next/link"
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Os números aqui são DERIVADOS de lib/tokens.ts, não escolhidos:
 * `tokens` espelha PLAN_TOKENS e os "≈" saem de TOKEN_COST (roteiro 4 +
 * capa 25 + 2 por slide de miolo). Mudou a tabela de tokens? Refaz as contas
 * aqui — senão a landing promete o que o produto não entrega.
 *
 * Carrossel completo de 7 slides = 41 tokens · só a capa = 29 · sem imagem = 4.
 */
const PLANOS = [
  {
    name: "Grátis",
    price: 0,
    tag: "Pra decidir com a sua marca na tela",
    perDay: "Sem cartão",
    cta: "Começar por aqui",
    feats: [
      "45 tokens, uma vez",
      "≈ 1 carrossel completo com capa de IA",
      "1 marca configurada",
      "Com marca d'água",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: 47,
    tag: "Pra quem está começando",
    perDay: "~R$ 1,57/dia",
    cta: "Testar grátis primeiro",
    feats: [
      "300 tokens / mês",
      "≈ 7 carrosséis completos ou 75 roteiros",
      "1 marca configurada",
      "Capa em Nano Banana 2",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: 97,
    tag: "O favorito de quem posta todo dia",
    perDay: "~R$ 3,23/dia",
    cta: "Testar grátis primeiro",
    feats: [
      "1.000 tokens / mês",
      "≈ 24 carrosséis completos ou 250 roteiros",
      "5 marcas configuradas",
      "Capa em Nano Banana 2",
      "Sem marca d'água",
      "Export em lote",
    ],
    popular: true,
  },
  {
    name: "Studio",
    price: 247,
    tag: "Pra agências e operações",
    perDay: "~R$ 8,23/dia",
    cta: "Testar grátis primeiro",
    feats: [
      "3.000 tokens / mês",
      "≈ 73 carrosséis completos ou 750 roteiros",
      "Marcas ilimitadas",
      "API + white-label",
      "Até 3 usuários",
    ],
    popular: false,
  },
]

/** Card com foco de luz seguindo o cursor — reforça o card sem pintar de roxo. */
function Card({ plano, index }: { plano: (typeof PLANOS)[number]; index: number }) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${mx}px ${my}px, rgba(22,104,227,0.18), transparent 70%)`

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }

  return (
    <motion.div
      onMouseMove={onMove}
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay: index * 0.1 }}
      className={`group relative rounded-2xl border bg-surface p-7 transition-colors ${
        plano.popular
          ? "border-border-accent border-t-2 border-t-primary lp-cta-glow md:-mt-4 md:pb-10"
          : "border-hairline hover:border-hairline-strong"
      }`}
    >
      {/* O clip do spotlight fica isolado aqui — o card em si não pode ter
          overflow-hidden, senão a etiqueta "Mais escolhido" some. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlight }}
        />
      </div>

      {plano.popular && (
        <span className="absolute -top-3 left-7 z-10 rounded-md bg-primary text-white font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
          Mais escolhido
        </span>
      )}

      <div className="relative">
        <h3 className="text-lg font-semibold">{plano.name}</h3>
        <p className="text-sm text-text-secondary mt-1 mb-5">{plano.tag}</p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="lp-display text-4xl tabular-nums">R$ {plano.price}</span>
          {plano.price > 0 && (
            <span className="font-mono text-xs text-text-muted">/mês</span>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-6">
          {plano.perDay}
        </p>

        <Button
          asChild
          className={`w-full mb-6 rounded-full ${
            plano.popular
              ? "bg-primary text-white hover:bg-primary/90"
              : "border border-hairline-strong bg-transparent hover:border-primary hover:text-primary"
          }`}
        >
          <Link href="/cadastro">{plano.cta}</Link>
        </Button>

        <ul className="space-y-3">
          {plano.feats.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export function PricingCards() {
  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {PLANOS.map((p, i) => (
          <Card key={p.name} plano={p} index={i} />
        ))}
      </div>

      {/* "Token" não diz nada pra quem chega de fora — sem esta linha o card
          fica pior que o antigo "X imagens/mês". A tabela é a mesma de
          lib/tokens.ts e o ponto que ela precisa passar é o do meio: só a
          imagem de IA pesa, roteiro é praticamente de graça. */}
      <div className="mt-8 rounded-xl border border-hairline bg-surface/60 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mb-3">
          Como o token é gasto
        </p>
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <p>
            <span className="lp-display tabular-nums text-primary">4</span>
            <span className="text-text-secondary"> — roteiro + legenda</span>
          </p>
          <p>
            <span className="lp-display tabular-nums text-primary">25</span>
            <span className="text-text-secondary"> — imagem de capa</span>
          </p>
          <p>
            <span className="lp-display tabular-nums text-primary">2</span>
            <span className="text-text-secondary"> — imagem por slide</span>
          </p>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Você decide em cada carrossel se quer imagem de IA. Sem imagem, um
          carrossel custa 4 tokens — no Pro dá pra fazer 250 por mês.
        </p>
      </div>
    </>
  )
}
