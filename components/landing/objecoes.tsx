"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"

/*
 * Antes: quatro cards iguais, cada um com a desculpa em itálico e a resposta
 * embaixo — o leitor batia os olhos e pulava. Agora é uma conversa: a pessoa
 * escolhe a própria desculpa na lista e a resposta entra do lado, com a frase
 * sendo riscada. O clique é o que faz a objeção virar dela, não do site.
 */

type Objecao = {
  desculpa: string
  resposta: string
  prova: string
}

const OBJECOES: Objecao[] = [
  {
    desculpa: "Meu perfil é pequeno demais.",
    resposta:
      "Carrossel é o formato que o Instagram mais entrega pra quem ainda não te segue. Alcance não sai do tamanho do perfil, sai do formato e da frequência.",
    prova: "Perfis com menos de 1k são a maioria dos testes da engine",
  },
  {
    desculpa: "Eu não sei escrever.",
    resposta:
      "Você dá o tema. A engine escreve os 8 slides — gancho, desenvolvimento e chamada — no tom da sua marca, em português de gente.",
    prova: "Gancho, corpo e CTA saem prontos no primeiro passe",
  },
  {
    desculpa: "Não tenho tempo pra isso.",
    resposta:
      "São 3 minutos por carrossel, do briefing ao arquivo pronto pra postar. O tempo que você levava pra escolher a fonte no Canva.",
    prova: "Uma semana de conteúdo cabe numa sentada de meia hora",
  },
  {
    desculpa: "Vai ficar com cara de IA.",
    resposta:
      "A engine lê a sua marca antes de criar: paleta, tipografia, tom de voz e enquadramento. Sai a sua cara, não a de um template genérico.",
    prova: "Paleta, tipografia e tom vêm da sua marca, não de um preset",
  },
]

export function Objecoes() {
  const [ativa, setAtiva] = useState(0)
  const reduced = useReducedMotion()
  const atual = OBJECOES[ativa]

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
      {/* Lista de desculpas */}
      <ul className="flex flex-col gap-2.5">
        {OBJECOES.map((o, i) => {
          const on = i === ativa
          return (
            <li key={o.desculpa}>
              <button
                type="button"
                onClick={() => setAtiva(i)}
                aria-pressed={on}
                className={`group flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors ${
                  on
                    ? "border-border-accent bg-surface-2"
                    : "border-hairline bg-surface hover:border-hairline-strong"
                }`}
              >
                <span
                  className={`font-mono text-[11px] tabular-nums transition-colors ${
                    on ? "text-primary" : "text-text-subtle"
                  }`}
                >
                  0{i + 1}
                </span>

                <span className="relative min-w-0 flex-1">
                  <span
                    className={`block text-[15px] italic leading-snug transition-colors ${
                      on ? "text-text-muted" : "text-text-secondary"
                    }`}
                  >
                    &ldquo;{o.desculpa}&rdquo;
                  </span>
                  {/* risco que corre por cima da frase escolhida */}
                  <motion.span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-px bg-primary"
                    initial={false}
                    animate={{ width: on ? "100%" : "0%" }}
                    transition={reduced ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
                  />
                </span>

                <ArrowRight
                  className={`h-4 w-4 shrink-0 transition-all ${
                    on
                      ? "text-primary opacity-100"
                      : "text-text-subtle opacity-0 group-hover:opacity-60"
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Resposta */}
      <div className="lp-noise relative overflow-hidden rounded-2xl border border-hairline bg-surface p-7 md:p-9">
        <div className="lp-halo pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative flex h-full flex-col">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            O que acontece de verdade
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={atual.desculpa}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.21, 0.6, 0.35, 1] }}
              className="mt-5 flex flex-1 flex-col"
            >
              <p className="text-lg leading-relaxed text-foreground md:text-xl">
                {atual.resposta}
              </p>

              <div className="mt-auto flex items-center gap-3 pt-8">
                <span className="lp-rule w-10 shrink-0" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                  {atual.prova}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
