"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"

/**
 * FAQ EM FORMA DE CONVERSA, no molde do FAQ da landing do EverReply, adaptado
 * ao canal deste produto: em vez de balão de WhatsApp, a gramática é a da DM
 * do Instagram, que é onde o conteúdo do Nexus vai parar.
 *
 * A pergunta é um balão cinza à esquerda (quem pergunta é o visitante) e a
 * resposta é um balão azul à direita, com "visto" embaixo. É o produto
 * explicando o produto no formato em que ele trabalha.
 *
 * DECISÕES QUE VALE ANOTAR:
 * - A PRIMEIRA JÁ NASCE ABERTA: quem chega vê o formato de cara, sem precisar
 *   clicar pra descobrir que ali tem resposta.
 * - SEM BIBLIOTECA. A abertura é `grid-rows-[0fr] -> [1fr]`, que anima altura
 *   sem medir nada em JS; o balão de resposta pousa pelo `.lp-pop` que já
 *   existe no globals.css. O acordeão do Radix continua no app, mas aqui ele
 *   traria o comportamento de acordeão (cabeçalho, fio, chevron) que é
 *   justamente o que a gente está deixando de usar nesta seção.
 * - O botão é a LINHA INTEIRA (balão e sinal), pra área de clique não ser só
 *   o mais e menos de 28px.
 */
export function FaqChat({ items }: { items: { q: string; a: string }[] }) {
  const [aberto, setAberto] = useState<number | null>(0)

  return (
    <div className="flex flex-col gap-7">
      {items.map((f, i) => {
        const on = aberto === i
        return (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => setAberto(on ? null : i)}
              aria-expanded={on}
              className="group flex w-full items-center gap-3 text-left"
            >
              {/* A pergunta NÃO troca de cor quando abre: o que marca o estado
                  é o sinal de menos e a resposta logo abaixo. */}
              <span className="max-w-[85%] rounded-2xl rounded-bl-md border border-hairline bg-surface-2 px-4 py-3 text-[15px] font-medium leading-snug text-foreground transition-colors duration-300 group-hover:border-border-accent md:px-5 md:text-[16px]">
                {f.q}
              </span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-text-muted transition-colors duration-300 group-hover:border-border-accent group-hover:text-foreground"
                aria-hidden
              >
                {on ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex justify-end pl-8 pt-3 md:pl-16">
                  {/* O `key` faz o `.lp-pop` rodar a cada abertura: a resposta
                      entra em vez de aparecer trocada no lugar. */}
                  <div
                    key={on ? "on" : "off"}
                    className={`max-w-[92%] rounded-2xl rounded-br-md bg-[linear-gradient(120deg,#1668E3,#0E52BC)] px-4 py-3 text-white shadow-[0_10px_30px_-14px_rgba(22,104,227,0.8)] md:max-w-[80%] md:px-5 ${
                      on ? "lp-pop" : ""
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed">{f.a}</p>
                    <p className="mt-1.5 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-white/70">
                      Nexus Content · visto
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FaqChat
