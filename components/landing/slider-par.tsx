"use client"

import { useEffect, useRef, useState, type ComponentType } from "react"
import { ChevronRight } from "lucide-react"

/* ============================================================================
 * SLIDER DE UM PAR DE CARTÕES
 *
 * Porte do `SliderPar` da landing do EverReply. É o molde de DUAS seções desta
 * página, "Por dentro do Nexus" (#recursos) e "A plataforma" (#plataforma),
 * que mudam só as cenas:
 *
 * - À esquerda o CARTÃO DE TEXTO: número, título, parágrafo e, no pé, seta,
 *   pílula de pontos e seta. Os textos ficam empilhados na MESMA célula do
 *   grid, então a altura do cartão é a do texto mais alto e a página não pula
 *   na troca de passo.
 * - À direita o PALCO: fundo azul com grade de pontos e um brilho que deriva
 *   (`.lp-palco` no globals.css). Cada item entrega uma CENA, um componente
 *   que recebe `ativo` e encena o que quiser lá dentro.
 * - Passa sozinho a cada 8s, PAUSA com o mouse em cima ou foco de teclado e
 *   PARA de vez no primeiro clique em seta ou ponto: quem tomou o controle não
 *   pode perder o passo pra máquina 8s depois.
 * - `prefers-reduced-motion`: sem autoplay, e o `useFases` entrega a cena já
 *   na última fase.
 *
 * No celular o palco vem EM CIMA do texto: a demonstração é o argumento.
 *
 * SOBRE O REMOUNT DA CENA. As cenas desta landing são mocks com animação de
 * entrada própria (framer-motion no mount). Se elas ficassem montadas de uma
 * vez, como na versão do EverReply, a entrada rodaria no carregamento da
 * página, muito antes de alguém chegar na seção, e a troca de passo mostraria
 * cenas paradas. Por isso a cena ativa é remontada a cada ativação (a `key`
 * carrega o contador) e a anterior fica na tela só o tempo do cruzamento.
 * ========================================================================== */

export const DUR_AUTO_MS = 8000

export type ItemSlider = {
  n: string
  titulo: string
  texto: string
  cena: ComponentType<{ ativo: boolean }>
}

export function semMovimento() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Relógio de fases de uma cena. Enquanto a cena está ativa, avança de
 * `passoMs` em `passoMs` e volta ao zero no fim. Cena inativa volta pra fase 0
 * e não gasta timer nenhum. Com `prefers-reduced-motion` ela nasce direto na
 * última fase: tudo aceso, nada piscando.
 */
export function useFases(total: number, passoMs: number, ativo: boolean) {
  const [fase, setFase] = useState(0)
  useEffect(() => {
    if (!ativo) {
      setFase(0)
      return
    }
    if (semMovimento()) {
      setFase(total - 1)
      return
    }
    setFase(0)
    let f = 0
    const id = window.setInterval(() => {
      f = (f + 1) % total
      setFase(f)
    }, passoMs)
    return () => window.clearInterval(id)
  }, [ativo, total, passoMs])
  return fase
}

/** Textura tom sobre tom no canto do cartão de texto. Decoração, some do leitor. */
function Textura() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 220"
      className="pointer-events-none absolute -right-[10%] -top-[14%] w-[58%] opacity-50"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    >
      <circle cx="150" cy="70" r="26" />
      <circle cx="150" cy="70" r="52" />
      <circle cx="150" cy="70" r="78" />
      <circle cx="150" cy="70" r="104" />
      <path d="M40 190c30-40 70-60 120-56" />
    </svg>
  )
}

export function SliderPar({
  itens,
  palcoClassName = "",
}: {
  itens: ItemSlider[]
  /** Acrescenta classes ao palco (outra proporção no celular, por exemplo). */
  palcoClassName?: string
}) {
  const raiz = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const [anterior, setAnterior] = useState<number | null>(null)
  /* Sobe a cada troca. Vira a `key` da cena ativa, e é o que faz a animação de
     entrada dela rodar de novo em vez de aparecer trocada no lugar. */
  const [geracao, setGeracao] = useState(0)
  const [auto, setAuto] = useState(true)
  const [pausado, setPausado] = useState(false)
  const [naTela, setNaTela] = useState(false)

  useEffect(() => {
    const el = raiz.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setNaTela(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setNaTela(!!e?.isIntersecting), {
      threshold: 0.25,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const rodando = auto && !pausado && naTela && !semMovimento()

  const irPara = (n: number, porClique: boolean) => {
    const alvo = ((n % itens.length) + itens.length) % itens.length
    if (alvo === i) return
    if (porClique) setAuto(false)
    setAnterior(i)
    setI(alvo)
    setGeracao((g) => g + 1)
  }

  useEffect(() => {
    if (!rodando) return
    const id = window.setTimeout(() => irPara(i + 1, false), DUR_AUTO_MS)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando, i, itens.length])

  /* A barrinha de um passo: fina, e a do passo ativo enche no tempo do
     autoplay. Mora numa função porque os dois grupos de pontos (indicador
     no celular, botões no desktop) desenham exatamente a mesma coisa. */
  const barra = (n: number) => (
    <span
      className={`relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
        n === i ? "w-6 bg-brand-900" : "w-1.5 bg-hairline-strong"
      }`}
    >
      {n === i ? (
        <span
          key={`${geracao}-${auto ? "a" : "m"}`}
          className={`absolute inset-0 rounded-full bg-primary ${auto ? "lp-dotfill" : ""}`}
          style={
            auto
              ? {
                  animationDuration: `${DUR_AUTO_MS}ms`,
                  animationPlayState: rodando ? "running" : "paused",
                }
              : undefined
          }
        />
      ) : null}
    </span>
  )

  return (
    <div
      ref={raiz}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[0.92fr_1.08fr] md:gap-5"
    >
      {/* CARTÃO DE TEXTO. Só o ativo é visível; os outros ficam `invisible`,
          fora do leitor de tela e fora do Tab. */}
      <div className="relative order-2 flex flex-col overflow-hidden rounded-[24px] border border-hairline bg-surface p-7 text-text-muted shadow-card md:order-1 md:p-9">
        <Textura />
        <div className="relative grid">
          {itens.map((it, n) => (
            <div
              key={it.n}
              aria-hidden={n !== i}
              className={`col-start-1 row-start-1 min-w-0 ${n === i ? "lp-in" : "invisible"}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-surface-2 font-mono text-[14px] font-semibold text-primary">
                {it.n}
              </span>
              {/* Menor que o padrão de título de cartão: título de até doze
                  palavras em 1.5rem virava três linhas aqui. */}
              <h3 className="lp-display mt-5 text-[1.25rem] leading-[1.2] text-foreground md:text-[1.45rem]">
                {it.titulo}
              </h3>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-text-secondary">
                {it.texto}
              </p>
            </div>
          ))}
        </div>

        {/* CONTROLES. Seta, pílula de pontos, seta. O ponto ativo é uma
            barrinha que ENCHE no tempo do autoplay (o único relógio visível da
            seção) e congela quando o mouse pausa ou quando o autoplay morreu. */}
        <div className="mt-auto flex items-center gap-2.5 pt-7">
          <button
            type="button"
            onClick={() => irPara(i - 1, true)}
            aria-label="Passo anterior"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-foreground transition-transform duration-200 hover:-translate-y-px"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>

          <div className="flex h-12 items-center gap-0 rounded-full border border-hairline bg-surface-2 px-2.5">
            {/* NO CELULAR OS PONTOS NÃO SÃO BOTÕES (produção, 28e4ccb: o testador
                ainda media 21px de largura em "Ir para o passo 2..5"). O
                `pointer-events-none` anterior tirava o toque mas deixava cinco
                botões de 21px na árvore de acessibilidade e no Tab, e 44px pra
                cada um não cabe na pílula de 390px. Agora são dois grupos:
                abaixo de `md`, um indicador puro (`aria-hidden`, sem botão), e
                quem navega no dedo usa as duas setas de 48px ao lado; a partir
                do `md` (mouse), os botões voltam, com a altura inteira da
                pílula como alvo e só a barrinha de dentro fina. O grupo que
                não vale no tamanho atual fica `display: none`, então some
                também do leitor de tela e do Tab. */}
            <span aria-hidden className="flex items-center md:hidden">
              {itens.map((it, n) => (
                <span key={it.n} className="flex h-12 items-center px-2">
                  {barra(n)}
                </span>
              ))}
            </span>
            {itens.map((it, n) => (
              <button
                key={it.n}
                type="button"
                onClick={() => irPara(n, true)}
                aria-label={`Ir para o passo ${n + 1}`}
                aria-current={n === i ? "true" : undefined}
                className="hidden h-12 shrink-0 items-center px-2 md:flex"
              >
                {barra(n)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => irPara(i + 1, true)}
            aria-label="Próximo passo"
            className="lp-cta-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform duration-200 hover:-translate-y-px"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PALCO. Primeiro no celular, segundo no desktop. Quadrado no celular,
          4:3 do `sm` pra cima e, no desktop, a altura do cartão de texto. */}
      <div
        className={`lp-palco relative order-1 aspect-square overflow-hidden rounded-[24px] border border-hairline bg-[linear-gradient(155deg,rgba(22,104,227,0.10),rgba(22,104,227,0.20)_55%,rgba(13,67,150,0.30))] sm:aspect-[4/3] md:order-2 md:aspect-auto md:min-h-[440px] ${palcoClassName}`}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.30),rgba(255,255,255,0)_96px)]"
        />
        {itens.map((it, n) => {
          const on = n === i
          /* Só a cena ativa e a que está saindo ficam montadas: o resto não
             existe, então nenhum mock roda animação fora da tela. */
          const montar = on || n === anterior
          const Cena = it.cena
          return (
            <div key={it.n} aria-hidden className={`lp-camada ${on ? "on" : ""}`}>
              <div className="flex h-full w-full items-center justify-center p-5 md:p-7">
                {montar ? (
                  <div key={on ? geracao : "saindo"} className="w-full">
                    <Cena ativo={on} />
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SliderPar
