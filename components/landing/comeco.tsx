"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import {
  BookOpen,
  ChevronRight,
  Link2,
  MessageSquare,
  Palette,
  Rocket,
  Sparkles,
  Wand2,
} from "lucide-react"

import { Reveal } from "./reveal"
import { Wrap } from "./primitivas"

/* ============================================================================
 * COMEÇO: "conta a sua marca uma vez, e o resto é você aprovando"
 *
 * Porte da seção equivalente da landing do EverReply: uma passagem em TRÊS
 * ETAPAS logo depois da Plataforma. A Plataforma mostra o tamanho do produto e
 * levanta na hora a objeção "isso deve dar um trabalho danado pra configurar".
 * Esta seção existe pra responder ela, e por isso mora colada nela.
 *
 * A FORMA é copiada: etapas numeradas com a linha que acende no caminho já
 * percorrido, título da etapa e um par de cartões por etapa, sendo o segundo o
 * destacado. A copy é nossa, e continua debaixo da regra editorial da página:
 * nada de número que a gente não possa defender, nada de contagem de clientes,
 * nada de entrega de serviço que o produto não faz (não existe "time dedicado"
 * nem "a gente monta pra você" aqui: o que existe é onboarding guiado, geração
 * e editor).
 *
 * NADA GIRA SOZINHO. Sem autoplay: a etapa só muda quando alguém pede. Um
 * carrossel que anda sozinho no meio da leitura tira o texto da frente de quem
 * está lendo, e aqui cada etapa tem dois parágrafos, não uma foto.
 * ========================================================================== */

type IconeLucide = ComponentType<{ className?: string; strokeWidth?: number }>

type Cartao = { icone: IconeLucide; titulo: string; texto: string }

type Etapa = {
  titulo: string
  sub: string
  /** Sempre dois: o segundo é o destacado. */
  cartoes: [Cartao, Cartao]
}

const ETAPAS: Etapa[] = [
  {
    titulo: "Você conta a sua marca uma vez",
    sub: "Manda o link do site ou responde às perguntas. Daí pra frente é a engine que carrega isso.",
    cartoes: [
      {
        icone: Link2,
        titulo: "O link do seu site já basta",
        texto:
          "A engine lê a página, tira o tom de voz, o público, a promessa e a paleta, e monta a ficha da marca. Você confere e corrige o que quiser antes de gerar a primeira peça.",
      },
      {
        icone: BookOpen,
        titulo: "O que nunca pode aparecer",
        texto:
          "Termo proibido, promessa que você não pode fazer, assunto que fica fora: entra na ficha e vale em toda geração seguinte. É o que evita o post genérico com a sua logo em cima.",
      },
    ],
  },
  {
    titulo: "Digita a pauta e o carrossel sai pronto",
    sub: "Um tema em uma linha. Roteiro, design e imagem voltam montados na identidade da marca.",
    cartoes: [
      {
        icone: Wand2,
        titulo: "Roteiro, design e imagem de uma vez",
        texto:
          "Não são três ferramentas em sequência: é uma geração. O roteiro sai com gancho, virada e chamada, os slides já vêm diagramados e a imagem nasce no território visual que você configurou.",
      },
      {
        icone: Sparkles,
        titulo: "Você decide onde entra imagem de IA",
        texto:
          "Em cada carrossel você escolhe se quer imagem só na capa ou em todos os slides. É isso que define o gasto de token, e o preview mostra a conta antes de você gerar.",
      },
    ],
  },
  {
    titulo: "Ajusta o que quiser e publica",
    sub: "O que a IA entregou é ponto de partida, não sentença. O ajuste fino é seu, e é de graça.",
    cartoes: [
      {
        icone: Palette,
        titulo: "Clica no elemento e muda na hora",
        texto:
          "Título, cor, foto, posição de cada bloco: tudo continua editável dentro da plataforma, no mesmo lugar onde foi gerado. Editar nunca gasta token, então dá pra insistir até ficar do seu jeito.",
      },
      {
        icone: Rocket,
        titulo: "Do calendário direto pro Instagram",
        texto:
          "A peça aprovada entra no calendário editorial e vai pro Instagram na hora marcada. Sem baixar ZIP, sem passar arquivo pro celular, sem lembrar de postar.",
      },
    ],
  },
]

/**
 * Um cartão da etapa. O `destaque` é o segundo de cada par: azul da marca no
 * fundo, com o quadradinho do ícone em branco. Os dois lêem como um par (um
 * neutro, um da marca), e o azul só entra como FUNDO, nunca como texto, que é
 * a regra da identidade.
 */
function CartaoEtapa({ cartao, destaque }: { cartao: Cartao; destaque?: boolean }) {
  const Icone = cartao.icone
  return (
    <div
      className={`h-full rounded-2xl border p-6 md:p-7 ${
        destaque
          ? "border-brand-600/50 bg-[linear-gradient(150deg,rgba(22,104,227,0.22),rgba(13,67,150,0.16))] shadow-card"
          : "border-hairline bg-surface shadow-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            destaque ? "bg-primary text-white" : "bg-surface-2 text-primary"
          }`}
        >
          <Icone className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </span>
        <h4 className="lp-display text-[1.1rem] leading-tight text-foreground">{cartao.titulo}</h4>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">{cartao.texto}</p>
    </div>
  )
}

export function Comeco({ className = "", id }: { className?: string; id?: string }) {
  const [i, setI] = useState(0)
  const etapa = ETAPAS[i]

  return (
    <section id={id} className={`relative isolate overflow-hidden py-20 md:py-28 ${className}`}>
      {/* FUNDO. O halo da marca em vez de mais um canvas WebGL: o herói já
          carrega um shader, e um segundo na mesma página é GPU gasta duas
          vezes pelo mesmo efeito. `pointer-events-none` porque ele cobre a
          seção e engoliria o clique das etapas; `-z-10` mais `isolate` na
          seção pra ele ficar atrás do conteúdo sem escapar pro body. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="lp-halo absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_100%,rgba(22,104,227,0.14),transparent_70%)]" />
      </div>

      <Wrap>
        {/* SEM CABEÇALHO DE SEÇÃO, de propósito, como na referência: esta é a
            única seção da página sem rótulo e sem título próprio. Ela lê como
            continuação da Plataforma logo acima, não como assunto novo. */}
        <Reveal from="scale">
          {/* As etapas são <button>: dá pra pular direto pra 3 sem passar pela
              2, e o teclado anda nelas em ordem. O traço embaixo da ativa é o
              que marca a posição, porque só a cor do número não basta pra quem
              enxerga pouco contraste. */}
          <div className="flex items-center justify-center gap-3">
            {ETAPAS.map((e, n) => (
              <div key={e.titulo} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setI(n)}
                  aria-current={n === i ? "step" : undefined}
                  aria-label={`Etapa ${n + 1}: ${e.titulo}`}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-xl font-mono text-[15px] font-semibold transition-colors ${
                    n === i
                      ? "border border-brand-400 bg-primary text-white"
                      : "border border-hairline-strong bg-surface text-text-muted hover:text-foreground"
                  }`}
                >
                  {n + 1}
                  {n === i ? (
                    <span className="absolute -bottom-2 left-1 right-1 h-[3px] rounded-full bg-primary" />
                  ) : null}
                </button>
                {/* A linha que liga as etapas ACENDE nos trechos já
                    percorridos: ela conta onde você está. */}
                {n < ETAPAS.length - 1 ? (
                  <span
                    aria-hidden
                    className={`h-[2px] w-10 rounded-full transition-colors duration-300 md:w-16 ${
                      n < i ? "bg-primary" : "bg-hairline-strong"
                    }`}
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* `key={i}`: remonta o bloco a cada troca, então o `.lp-pop` roda de
              novo e a etapa nova entra em vez de aparecer trocada no lugar. */}
          <div key={i} className="lp-pop mt-12 text-center">
            <h3 className="lp-display text-[1.7rem] leading-[1.12] text-foreground sm:text-[2rem]">
              {etapa.titulo}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-text-secondary">
              {etapa.sub}
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 text-left md:grid-cols-2">
              <CartaoEtapa cartao={etapa.cartoes[0]} />
              <CartaoEtapa cartao={etapa.cartoes[1]} destaque />
            </div>
          </div>

          {/* UMA seta só, como na referência, e ela DÁ A VOLTA: na etapa 3 a
              próxima é a 1. Botão que vira beco sem saída no fim do carrossel é
              o jeito mais fácil de fazer a pessoa achar que travou. */}
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setI((n) => (n + 1) % ETAPAS.length)}
              aria-label="Próxima etapa"
              className="lp-cta-glow flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition-transform hover:-translate-y-px"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </Reveal>

        {/* Só a linha de fecho embaixo: o CTA desta parte da página já foi
            dado, e repetir botão no fim de cada seção é o que faz página de
            marketing virar corredor de banner. */}
        <p className="mx-auto mt-10 max-w-md text-center text-[13.5px] leading-relaxed text-text-muted">
          <MessageSquare className="mr-1.5 inline-block h-3.5 w-3.5 align-[-2px]" />
          Da conta criada ao primeiro carrossel exportado, sem instalar nada e sem cartão.
        </p>
      </Wrap>
    </section>
  )
}

export default Comeco
