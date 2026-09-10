"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { irParaSecao } from "./ir-para-secao"

/*
 * Cabeçalho da landing: pílula flutuante, no molde da barra do EverReply.
 *
 * Substituiu o CardNav (a barra que abria três cartões de links). O CardNav
 * escondia "Planos" dentro de um cartão que só abria no clique: quem chega
 * pela primeira vez não sabe que precisa abrir nada, e o link mais importante
 * da página ficava a dois cliques.
 *
 * DOIS ESTADOS, decididos por uma medida só (o deslocamento da página):
 *
 * - NO TOPO ABSOLUTO: pílula sem fundo, sem fio e sem sombra, e a faixa de
 *   anúncio aberta acima dela. O cabeçalho "flutua" em cima do herói.
 * - ROLOU: a faixa colapsa, a pílula ganha corpo (fundo, fio, blur e sombra) e
 *   passa a ler como barra em cima do conteúdo.
 *
 * O ESTADO SEGURO É O OPACO, e é por isso que o `useState` nasce em `false`.
 * É o que o SSR entrega: se o JS não subir, o cabeçalho fica sólido e legível.
 * O inverso seria perigoso: preso no transparente, a barra desapareceria em
 * cima de qualquer bloco claro da página.
 */

const LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#plataforma", label: "Plataforma" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
]

export function SiteNav() {
  /* `true` = página no topo, barra limpa e faixa de anúncio aberta. */
  const [noTopo, setNoTopo] = useState(false)
  /* A transição só é LIGADA depois do primeiro paint. Sem isso o elemento
     nasce opaco (que é o que o SSR entrega) e muda pra transparente no mesmo
     frame em que aparece: a transição começa antes de o elemento assentar e
     fica travada no valor de origem. Com o flag, a primeira pintura é
     instantânea e a transição vale só das viradas seguintes. */
  const [montado, setMontado] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    /* LIMIAR DE 8px, não 0: trackpad e rolagem suave param em frações de
       pixel, e um limiar exato faria a barra piscar entre os dois estados
       parada no lugar. */
    const avaliar = () => setNoTopo(window.scrollY <= 8)

    /* A chamada direta é a que importa: ela acerta o estado na montagem sem
       depender de nenhum evento chegar. */
    avaliar()
    window.addEventListener("scroll", avaliar, { passive: true })
    window.addEventListener("resize", avaliar)

    /* Varredura curta (~3s). Cobre o F5 no MEIO da página e o link com
       âncora: nos dois casos o efeito roda com o documento ainda no topo e o
       navegador só restaura o scroll depois. Sem isto a barra nasceria
       transparente sobre um bloco claro, com os links brancos invisíveis. */
    let quadros = 0
    let raf = 0
    const varrer = () => {
      avaliar()
      if (++quadros < 180) raf = requestAnimationFrame(varrer)
    }
    raf = requestAnimationFrame(varrer)

    /* A transição entra DOIS frames depois, em commit separado do `avaliar()`.
       Junto, o React agruparia os dois states no mesmo commit e o elemento
       saltaria de "opaco sem transição" pra "transparente com transição" de
       uma vez, travando a transição no valor de origem. */
    const ligar = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMontado(true))
    })

    return () => {
      cancelAnimationFrame(ligar)
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", avaliar)
      window.removeEventListener("resize", avaliar)
    }
  }, [])

  /* Trava o corpo enquanto o menu mobile está aberto. */
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [aberto])

  /* Com o menu aberto a pílula volta a ser opaca mesmo no topo: o cartão do
     menu tem fundo sólido, e pílula transparente colada nele lê como dois
     cabeçalhos empilhados. */
  const transparente = noTopo && !aberto

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* FAIXA DE ANÚNCIO. Vive DENTRO do cabeçalho fixo, e não no fluxo da
          página, porque a pílula flutua em `top-3`: no fluxo, a pílula
          passaria por cima dela no scroll 0. Colapsa junto com a virada de
          estado da pílula, então a página tem uma medida só de "topo". */}
      <div
        className={`lp-topbar-flow overflow-hidden text-center text-white transition-[max-height,opacity] duration-300 ease-out ${
          transparente ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em]">
          <TrendingUp className="mr-1.5 -mt-0.5 inline h-3.5 w-3.5" />
          Seu primeiro carrossel completo é grátis, sem cartão
        </p>
      </div>

      <div className="px-4 pt-3 md:px-8 md:pt-4">
        <div className="mx-auto w-full max-w-[1160px]">
          <div
            className={`flex items-center justify-between gap-3 rounded-full border px-4 py-2 lg:pl-5 lg:pr-2 ${
              montado
                ? "transition-[background-color,border-color,box-shadow] duration-300 ease-out"
                : ""
            } ${
              transparente
                ? // Sombra com as MESMAS camadas do estado opaco, só com alfa
                  // 0: de `none` pra sombra o browser corta seco; camada por
                  // camada ele interpola, e a virada lê como fade.
                  "border-transparent bg-surface/0 shadow-[0_10px_24px_-12px_rgba(0,0,0,0),0_2px_6px_-3px_rgba(0,0,0,0)]"
                : "border-hairline bg-background/85 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6),0_2px_6px_-3px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            }`}
          >
            {/* `min-h-11` (44px) porque o lockup tem 22px de altura: sem ele o
                <a> media 22px, metade do alvo de toque mínimo, e quem está no
                celular acertava o logo por sorte. Mesma razão do `h-11` no
                hambúrguer mais abaixo. */}
            <Link
              href="#top"
              aria-label="Nexus Content, início"
              onClick={(e) => irParaSecao(e, "#top")}
              className="flex min-h-11 shrink-0 items-center"
            >
              <Logo size={22} />
            </Link>

            {/* Links no CENTRO da pílula: o `flex-1` empurra o grupo pro meio
                sem depender de posicionamento absoluto. */}
            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => irParaSecao(e, l.href)}
                  className={`rounded-full px-3.5 py-2 text-[14.5px] transition-colors duration-300 ${
                    transparente
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-text-secondary hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href="/login"
                className={`hidden rounded-full px-3 py-2 text-[14.5px] font-medium transition-colors duration-300 sm:block ${
                  transparente
                    ? "text-white/80 hover:text-white"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                Entrar
              </Link>
              {/* O CTA é o ÚNICO elemento que não muda entre os dois estados:
                  azul cheio com texto branco funciona igual sobre o herói e
                  sobre a pílula opaca.
                  SOME NO MOBILE: abaixo de lg o menu do hambúrguer já traz
                  "Teste grátis", e os dois juntos espremiam a pílula. */}
              <Link
                href="/cadastro"
                className="lp-cta-glow hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary/90 lg:inline-flex"
              >
                Teste grátis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-label={aberto ? "Fechar menu" : "Abrir menu"}
                aria-expanded={aberto}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 lg:hidden ${
                  transparente ? "border-white/25 text-white" : "border-hairline-strong text-foreground"
                }`}
              >
                <span className="relative block h-3 w-4">
                  <span
                    className={`absolute left-0 block h-[1.5px] w-4 bg-current transition-transform ${
                      aberto ? "top-[5px] rotate-45" : "top-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 block h-[1.5px] w-4 bg-current transition-transform ${
                      aberto ? "top-[5px] -rotate-45" : "top-[10px]"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* O menu mobile também é cartão solto, não faixa: a pílula não tem
              aresta de baixo pra ele encostar. Fundo sólido, que é o que
              mantém ele legível abrindo em cima do herói. */}
          {aberto && (
            <div className="mt-2 rounded-2xl border border-hairline bg-surface px-4 py-2 shadow-card lg:hidden">
              <nav className="flex flex-col">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={(e) => {
                      setAberto(false)
                      irParaSecao(e, l.href)
                    }}
                    className="flex min-h-11 items-center border-b border-hairline py-3 text-[15px] text-foreground last:border-b-0"
                  >
                    {l.label}
                  </a>
                ))}
                <Link
                  href="/cadastro"
                  onClick={() => setAberto(false)}
                  className="lp-cta-glow mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-3 text-[15px] font-semibold text-white"
                >
                  Teste grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  onClick={() => setAberto(false)}
                  className="flex min-h-11 items-center justify-center py-3.5 text-center text-[15px] font-medium text-text-secondary"
                >
                  Entrar
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
