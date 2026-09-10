"use client"

import type { MouseEvent } from "react"
import Link from "next/link"
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PLAN_TOKENS, TOKEN_COST, tokenCostForCarousel } from "@/lib/tokens"

/**
 * Os números aqui são CALCULADOS de lib/tokens.ts, nunca escritos à mão: a
 * landing prometendo o que o produto não entrega foi bug real quando a tabela
 * de tokens mudou (v2 em 22/08/2026: roteiro 4 -> 8, capa 25 -> 20).
 */
const CARROSSEL_COMPLETO = tokenCostForCarousel(7, { cover: true, slides: true })
const CARROSSEL_SO_CAPA = tokenCostForCarousel(7, { cover: true, slides: false })

/** "≈ N carrosséis completos ou M roteiros" pro grant de um plano. */
function equivalencia(tokens: number): string {
  return `≈ ${Math.floor(tokens / CARROSSEL_COMPLETO)} carrosséis completos ou ${Math.floor(tokens / TOKEN_COST.textOnly)} roteiros`
}
const PLANOS = [
  {
    name: "Grátis",
    price: 0,
    tag: "Pra decidir com a sua marca na tela",
    perDay: "Sem cartão",
    cta: "Começar por aqui",
    feats: [
      `${PLAN_TOKENS.trial} tokens, uma vez`,
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
      `${PLAN_TOKENS.starter} tokens / mês`,
      equivalencia(PLAN_TOKENS.starter),
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
      `${PLAN_TOKENS.pro.toLocaleString("pt-BR")} tokens / mês`,
      equivalencia(PLAN_TOKENS.pro),
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
      `${PLAN_TOKENS.studio.toLocaleString("pt-BR")} tokens / mês`,
      equivalencia(PLAN_TOKENS.studio),
      "Marcas ilimitadas",
      "API + white-label",
      "Até 3 usuários",
    ],
    popular: false,
  },
]

/**
 * Caminho direto pra ASSINAR a partir da landing (revisão contra o EverReply,
 * que tem "Assinar" sólido mais "Teste grátis" fantasma em cada cartão pago).
 * Antes os três pagos diziam "Testar grátis primeiro" e não existia jeito de
 * assinar sem passar pelo teste.
 *
 * Vai pra /pricing com ?plano= e ?ciclo= porque é lá que o checkout já sabe
 * começar sozinho (components/pricing/pricing-cards.tsx). Quem não tem conta é
 * mandado pelo `iniciarCheckout` pro cadastro com o plano na URL e volta pro
 * checkout depois. Mensal porque é o preço que este cartão mostra.
 */
function linkAssinar(nome: string): string {
  const plano = nome.toLowerCase()
  return `/pricing?plano=${plano}&ciclo=monthly`
}

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
      /* h-full + flex: todos os cards têm a MESMA altura (o grid estica) e o
         destaque do "Mais escolhido" vem da borda e do glow, nunca de um card
         maior — cartão fora de esquadro é o que quebrava a régua da seção. */
      className={`group relative flex h-full flex-col rounded-2xl border bg-surface p-7 transition-colors ${
        plano.popular
          ? "border-border-accent border-t-2 border-t-primary lp-cta-glow"
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
        <span className="lp-sweep absolute -top-3 left-7 z-10 overflow-hidden rounded-md bg-primary text-white font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
          Mais escolhido
        </span>
      )}

      <div className="relative flex flex-1 flex-col">
        <h3 className="text-lg font-semibold">{plano.name}</h3>
        {/* min-h de 2 linhas: preço, CTA e lista nascem na mesma altura nos 4 cards. */}
        <p className="text-sm text-text-secondary mt-1 mb-5 min-h-[2.5rem]">{plano.tag}</p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="lp-display text-4xl tabular-nums">R$ {plano.price}</span>
          {plano.price > 0 && (
            <span className="font-mono text-xs text-text-muted">/mês</span>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-6">
          {plano.perDay}
        </p>

        {/* Nos pagos, "Assinar" é a ação principal e o teste grátis vira a
            saída de quem quer ver funcionando antes de pagar. No Grátis o único
            botão continua sendo o de começar, e um espaço do mesmo tamanho do
            link fantasma mantém as listas dos quatro cartões na mesma linha.
            `h-11`: o Button padrão tinha 36px, abaixo do alvo de toque. */}
        <div className="mb-6">
          <Button
            asChild
            className={`h-11 w-full rounded-full ${
              plano.popular
                ? "bg-primary text-white hover:bg-primary/90"
                : "border border-hairline-strong bg-transparent hover:border-primary hover:text-primary"
            }`}
          >
            <Link href={plano.price > 0 ? linkAssinar(plano.name) : "/cadastro"}>
              {plano.price > 0 ? `Assinar ${plano.name}` : plano.cta}
            </Link>
          </Button>
          {plano.price > 0 ? (
            <Link
              href="/cadastro"
              className="mt-1.5 flex min-h-11 w-full items-center justify-center rounded-full text-[13.5px] font-medium text-text-secondary transition-colors hover:text-foreground"
            >
              {plano.cta}
            </Link>
          ) : (
            <div aria-hidden className="mt-1.5 min-h-11" />
          )}
        </div>

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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANOS.map((p, i) => (
          <Card key={p.name} plano={p} index={i} />
        ))}
      </div>

      {/* "Token" não diz nada pra quem chega de fora: sem esta linha o card
          fica pior que o antigo "X imagens/mês". A tabela sai de lib/tokens.ts
          e o ponto que ela precisa passar é o do meio: só a imagem de IA pesa,
          o texto é barato. */}
      <div className="mt-8 rounded-xl border border-hairline bg-surface/60 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mb-3">
          Como o token é gasto
        </p>
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <p>
            <span className="lp-display tabular-nums text-primary">{TOKEN_COST.textOnly}</span>
            <span className="text-text-secondary"> roteiro + legenda</span>
          </p>
          <p>
            <span className="lp-display tabular-nums text-primary">{TOKEN_COST.imageCover}</span>
            <span className="text-text-secondary"> imagem de capa</span>
          </p>
          <p>
            <span className="lp-display tabular-nums text-primary">{TOKEN_COST.imageSlide}</span>
            <span className="text-text-secondary"> imagem por slide</span>
          </p>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Você decide em cada carrossel se quer imagem de IA. Só com a capa,
          um carrossel de 7 slides custa {CARROSSEL_SO_CAPA} tokens. Editar o
          que foi gerado é sempre grátis.
        </p>
      </div>
    </>
  )
}
