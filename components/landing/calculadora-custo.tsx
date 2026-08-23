"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { PLAN_TOKENS, TOKEN_COST, tokenCostForCarousel, tokenCostForSinglePost } from "@/lib/tokens"
import { PLAN_PRICE_MONTHLY } from "@/lib/billing/plans"

/*
 * "Faça as contas" virou calculadora: o visitante monta o próprio volume e vê
 * três linhas de custo pro MESMO resultado — agência, freelas + IAs avulsas, e
 * o plano do Nexus que dá conta desse volume.
 *
 * Os números do Nexus são CALCULADOS de lib/tokens.ts e lib/billing/plans.ts,
 * nunca escritos à mão: quando a tabela de tokens mudou (v2, 22/08/2026) as
 * cópias soltas na landing viraram promessa falsa.
 */

const TOKENS_CARROSSEL_COM_IMAGEM = tokenCostForCarousel(7, { cover: true, slides: true })
const TOKENS_CARROSSEL_SEM_IMAGEM = TOKEN_COST.textOnly
const TOKENS_POST_UNICO = tokenCostForSinglePost()

const PLANOS = [
  { nome: "Starter", preco: PLAN_PRICE_MONTHLY.starter, tokens: PLAN_TOKENS.starter },
  { nome: "Pro", preco: PLAN_PRICE_MONTHLY.pro, tokens: PLAN_TOKENS.pro },
  { nome: "Studio", preco: PLAN_PRICE_MONTHLY.studio, tokens: PLAN_TOKENS.studio },
]

/* Referências de mercado — assinaturas cheias em BRL, arredondadas. */
const STACK_IAS = [
  { nome: "ChatGPT Plus", preco: 109 },
  { nome: "Canva Pro", preco: 49.9 },
  { nome: "Gerador de imagem", preco: 79 },
]
const CUSTO_STACK = STACK_IAS.reduce((s, i) => s + i.preco, 0)

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

type Quem = "voce" | "freela" | "agencia"

export function CalculadoraCusto() {
  const reduced = useReducedMotion()

  const [carrosseis, setCarrosseis] = useState(12)
  const [posts, setPosts] = useState(8)
  const [comImagem, setComImagem] = useState(true)
  const [multiMarca, setMultiMarca] = useState(false)
  const [quem, setQuem] = useState<Quem>("voce")

  const conta = useMemo(() => {
    const pecas = carrosseis + posts
    const tokens =
      carrosseis * (comImagem ? TOKENS_CARROSSEL_COM_IMAGEM : TOKENS_CARROSSEL_SEM_IMAGEM) +
      posts * (comImagem ? TOKENS_POST_UNICO : TOKENS_CARROSSEL_SEM_IMAGEM)

    /* Multi-marca não cabe no Starter (1 marca só). */
    const plano =
      PLANOS.find((p) => p.tokens >= tokens && (!multiMarca || p.nome !== "Starter")) ??
      PLANOS[PLANOS.length - 1]

    /* Agência: fee mensal + produção por peça. Freela: por peça, com copy. */
    const agencia = 1500 + pecas * 90 + (multiMarca ? 800 : 0)
    const freela = pecas * 75 + carrosseis * 45 + (comImagem ? CUSTO_STACK : 49.9)
    const faca_voce = CUSTO_STACK + (comImagem ? 0 : -79)

    /* ~35 min por peça montando no Canva — média conservadora. */
    const horas = Math.round((pecas * 35) / 60)

    const referencia = quem === "agencia" ? agencia : quem === "freela" ? freela : faca_voce
    const economia = Math.max(0, referencia - plano.preco)

    return { pecas, tokens, plano, agencia, freela, faca_voce, horas, referencia, economia }
  }, [carrosseis, posts, comImagem, multiMarca, quem])

  const linhas = [
    {
      k: "agencia" as Quem,
      titulo: "Agência de social media",
      nota: "Fee mensal + produção por peça",
      valor: conta.agencia,
    },
    {
      k: "freela" as Quem,
      titulo: "Freelancer + IAs avulsas",
      nota: "Designer e copy por peça, ferramentas por fora",
      valor: conta.freela,
    },
    {
      k: "voce" as Quem,
      titulo: "Você mesmo, no braço",
      nota: `${STACK_IAS.map((i) => i.nome).join(" + ")} — e ${conta.horas}h suas por mês`,
      valor: conta.faca_voce,
    },
  ]

  return (
    <div className="grid overflow-hidden rounded-2xl border border-hairline lg:grid-cols-2">
      {/* ── Controles ─────────────────────────────────────────── */}
      <div className="divide-y divide-hairline bg-surface p-7 md:p-9">
        <Bloco titulo="Quanto você publica por mês?">
          <Slider
            label="Carrosséis"
            valor={carrosseis}
            min={0}
            max={40}
            onChange={setCarrosseis}
          />
          <Slider label="Posts únicos" valor={posts} min={0} max={40} onChange={setPosts} />
        </Bloco>

        <Bloco titulo="Como você quer as peças?">
          <Checkbox
            marcado={comImagem}
            onChange={() => setComImagem((v) => !v)}
            label="Com imagem gerada por IA"
            nota="capa e slides no seu território visual"
          />
          <Checkbox
            marcado={multiMarca}
            onChange={() => setMultiMarca((v) => !v)}
            label="Mais de uma marca"
            nota="atende clientes ou toca vários perfis"
          />
        </Bloco>

        <Bloco titulo="Quem faz isso hoje?">
          <div className="grid gap-2">
            {linhas.map((l) => (
              <Radio
                key={l.k}
                marcado={quem === l.k}
                onChange={() => setQuem(l.k)}
                label={l.titulo}
              />
            ))}
          </div>
        </Bloco>
      </div>

      {/* ── Resultado ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 bg-surface-2 p-7 md:p-9">
        <div className="mb-1">
          <h3 className="lp-display text-2xl">O mesmo mês, três contas</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {conta.pecas} peças por mês ≈ {conta.tokens.toLocaleString("pt-BR")} tokens.
            {" "}O plano abaixo é o que cobre esse volume.
          </p>
        </div>

        {linhas.map((l) => (
          <div
            key={l.k}
            className={`rounded-xl border p-5 transition-colors ${
              quem === l.k ? "border-border-accent bg-surface" : "border-hairline bg-surface/60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[15px] font-medium">{l.titulo}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
                  {l.nota}
                </div>
              </div>
              <motion.div
                key={l.valor}
                initial={reduced ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 font-mono text-2xl font-semibold tabular-nums text-text-secondary"
              >
                {brl(l.valor)}
              </motion.div>
            </div>
          </div>
        ))}

        {/* Nexus */}
        <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-primary p-5 text-white">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold">
                Nexus Content {conta.plano.nome}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/75">
                {conta.plano.tokens.toLocaleString("pt-BR")} tokens · tudo num lugar só
              </div>
            </div>
            <motion.div
              key={conta.plano.preco}
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.21, 0.6, 0.35, 1] }}
              className="shrink-0 lp-display text-4xl tabular-nums"
            >
              {brl(conta.plano.preco)}
            </motion.div>
          </div>

          {conta.economia > 0 && (
            <div className="relative mt-4 flex items-center gap-2 border-t border-white/20 pt-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/90">
              <Check className="h-3.5 w-3.5" />
              Economia de {brl(conta.economia)} por mês
            </div>
          )}
        </div>

        <Link
          href="/cadastro"
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition hover:opacity-90"
        >
          Testar de graça antes de decidir
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          Referências de mercado · valores aproximados
        </p>
      </div>
    </div>
  )
}

/* ── Peças de formulário ──────────────────────────────────────── */

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 py-6 first:pt-0 last:pb-0">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {titulo}
      </h3>
      {children}
    </div>
  )
}

function Slider({
  label,
  valor,
  min,
  max,
  onChange,
}: {
  label: string
  valor: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const pct = ((valor - min) / (max - min)) * 100

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="font-mono text-sm tabular-nums text-primary">{valor}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="lp-range w-full"
        style={{ ["--lp-pct" as string]: `${pct}%` }}
      />
    </div>
  )
}

function Checkbox({
  marcado,
  onChange,
  label,
  nota,
}: {
  marcado: boolean
  onChange: () => void
  label: string
  nota: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="checkbox"
      aria-checked={marcado}
      className="flex w-full items-start gap-3 text-left"
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors ${
          marcado ? "border-primary bg-primary text-white" : "border-hairline-strong"
        }`}
      >
        {marcado && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-foreground">{label}</span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
          {nota}
        </span>
      </span>
    </button>
  )
}

function Radio({
  marcado,
  onChange,
  label,
}: {
  marcado: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="radio"
      aria-checked={marcado}
      className="flex w-full items-center gap-3 text-left"
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          marcado ? "border-primary" : "border-hairline-strong"
        }`}
      >
        {marcado && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  )
}
