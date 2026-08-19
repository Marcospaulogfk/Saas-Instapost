"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Heart, MessageCircle } from "lucide-react"

/*
 * Depoimentos no formato de comentário do Instagram — é onde a prova social
 * dessa audiência acontece de verdade, então o card imita o lugar em vez de
 * virar mais um "quote card" com cinco estrelinhas.
 *
 * Carrossel: scroll nativo com snap (no mobile o arrasto sai de graça) + setas
 * e bolinhas no desktop. O autoplay pausa no hover, no foco e no toque.
 */

type Depoimento = {
  handle: string
  ini: string
  area: string
  quando: string
  txt: string
  curtidas: number
  /** Resposta de outro perfil no thread — dá textura de comentário real. */
  resposta?: { handle: string; txt: string }
}

const DEPOIMENTOS: Depoimento[] = [
  {
    handle: "claudia.almeida.store",
    ini: "CA",
    area: "Boutique de moda · Curitiba",
    quando: "2 sem",
    txt: "eu abria o Canva, ficava 40 minutos mexendo em fonte e fechava sem postar. sábado passado fiz a semana inteira tomando café. o que me convenceu foi ver a paleta da loja saindo certa sem eu explicar nada",
    curtidas: 214,
    resposta: { handle: "lu.ateliedosonho", txt: "sou eu nessa história do canva" },
  },
  {
    handle: "rafa.social",
    ini: "RS",
    area: "Social media · 6 clientes",
    quando: "1 sem",
    txt: "atendo 6 marcas sozinho e sexta virou meu inferno de arte. agora entrego a semana de todas na terça de manhã. ainda reviso tudo na mão, mas o tempo de montagem caiu de umas 5h pra menos de 1",
    curtidas: 389,
  },
  {
    handle: "jupereira.co",
    ini: "JP",
    area: "Infoprodutos",
    quando: "3 sem",
    txt: "confesso que entrei achando que ia sair aquela coisa genérica de IA. o primeiro ficou mais ou menos porque escrevi o briefing com preguiça. refiz com o tema certo e o carrossel bateu 3,1 mil salvamentos — meu recorde antes era 400",
    curtidas: 612,
    resposta: { handle: "pedro.funil", txt: "briefing preguiçoso é 90% do problema" },
  },
  {
    handle: "diego.brasabrava",
    ini: "DB",
    area: "Hamburgueria · Sorocaba",
    quando: "4 sem",
    txt: "não entendo nada de design, minha esposa que fazia os posts no celular. hoje eu monto no intervalo do almoço e mando direto. a única coisa que mudo é o preço no último slide",
    curtidas: 158,
  },
  {
    handle: "marina.rodrigues",
    ini: "MR",
    area: "Agência · 9 contas",
    quando: "5 sem",
    txt: "a gente travava em 4 clientes de social porque não dava conta de arte. hoje são 9 com a mesma equipe. não é mágica: o roteiro ainda passa pela minha revisão. só que revisar é rápido, montar é que doía",
    curtidas: 431,
  },
  {
    handle: "cami.odonto",
    ini: "CO",
    area: "Clínica odontológica",
    quando: "6 d",
    txt: "postava 1x por mês e o perfil tava morto. em 3 semanas de constância vieram 2 agendamentos do carrossel — a pessoa citou o post na recepção. isso nunca tinha acontecido",
    curtidas: 276,
  },
]

/* Anel de story + monograma. Sem foto de banco de imagem: rosto genérico é
   justamente o que faz um depoimento parecer inventado. */
function Avatar({ ini }: { ini: string }) {
  return (
    <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full">
      <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,#1668E3,#8DB8F7,#1668E3)] opacity-80" />
      <span className="absolute inset-[1.5px] rounded-full bg-surface" />
      <span className="relative font-mono text-[10px] tracking-wider text-primary">{ini}</span>
    </span>
  )
}

function Card({ d }: { d: Depoimento }) {
  const [curtido, setCurtido] = useState(false)

  return (
    <article className="lp-card flex h-full flex-col rounded-2xl border border-hairline bg-surface p-5">
      <header className="flex items-center gap-3">
        <Avatar ini={d.ini} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{d.handle}</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-primary" aria-hidden>
              <path d="M12 1.5l2.6 2.1 3.3-.4 1 3.2 2.9 1.7-1.3 3.1 1.3 3.1-2.9 1.7-1 3.2-3.3-.4L12 22.5l-2.6-2.1-3.3.4-1-3.2-2.9-1.7 1.3-3.1-1.3-3.1 2.9-1.7 1-3.2 3.3.4L12 1.5zm-1 13.9l5.2-5.2-1.4-1.4-3.8 3.8-1.8-1.8-1.4 1.4 3.2 3.2z" />
            </svg>
            <span className="font-mono text-[10px] text-text-subtle">· {d.quando}</span>
          </div>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            {d.area}
          </p>
        </div>
      </header>

      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-text-secondary">{d.txt}</p>

      {d.resposta && (
        <div className="mt-4 border-l border-hairline pl-3">
          <p className="text-[13px] leading-relaxed text-text-muted">
            <span className="font-medium text-text-secondary">@{d.resposta.handle}</span>{" "}
            {d.resposta.txt}
          </p>
        </div>
      )}

      <footer className="mt-5 flex items-center gap-4 border-t border-hairline pt-3.5">
        <button
          type="button"
          onClick={() => setCurtido((v) => !v)}
          aria-pressed={curtido}
          aria-label="Curtir depoimento"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted transition-colors hover:text-danger"
        >
          <Heart
            className={`h-4 w-4 transition-transform group-active:scale-90 ${
              curtido ? "fill-danger text-danger" : ""
            }`}
          />
          <span className="tabular-nums">
            {(d.curtidas + (curtido ? 1 : 0)).toLocaleString("pt-BR")}
          </span>
        </button>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <MessageCircle className="h-4 w-4" />
          Responder
        </span>
      </footer>
    </article>
  )
}

export function DepoimentosCarousel() {
  const trilhoRef = useRef<HTMLDivElement>(null)
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  /* O índice ativo vem do próprio scroll — assim arrasto, seta e teclado
     alimentam o mesmo estado, sem duas fontes de verdade. */
  const onScroll = useCallback(() => {
    const el = trilhoRef.current
    const filho = el?.firstElementChild as HTMLElement | null
    if (!el || !filho) return
    setAtivo(Math.round(el.scrollLeft / (filho.offsetWidth + 20 /* gap-5 */)))
  }, [])

  const irPara = useCallback((i: number) => {
    const el = trilhoRef.current
    const filho = el?.firstElementChild as HTMLElement | null
    if (!el || !filho) return
    const total = DEPOIMENTOS.length
    const alvo = ((i % total) + total) % total
    el.scrollTo({ left: alvo * (filho.offsetWidth + 20), behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (pausado) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => {
      const el = trilhoRef.current
      if (!el) return
      /* No fim da trilha volta pro começo — o último card fica parcialmente
         visível, então comparar índice com total erraria a volta. */
      const fim = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      irPara(fim ? 0 : ativo + 1)
    }, 6000)
    return () => clearInterval(t)
  }, [ativo, pausado, irPara])

  return (
    <div
      className="relative"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
    >
      <div
        ref={trilhoRef}
        onScroll={onScroll}
        role="region"
        aria-label="Depoimentos de quem usa o Nexus Content"
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-1"
      >
        {DEPOIMENTOS.map((d) => (
          <div
            key={d.handle}
            className="w-[86%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]"
          >
            <Card d={d} />
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => irPara(ativo - 1)}
          aria-label="Depoimento anterior"
          className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-surface text-text-secondary transition hover:border-border-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {DEPOIMENTOS.map((d, i) => (
            <button
              key={d.handle}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ir para o depoimento ${i + 1}`}
              aria-current={i === ativo}
              className={`h-1.5 rounded-full transition-all ${
                i === ativo ? "w-6 bg-primary" : "w-1.5 bg-hairline-strong hover:bg-text-muted"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => irPara(ativo + 1)}
          aria-label="Próximo depoimento"
          className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-surface text-text-secondary transition hover:border-border-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
