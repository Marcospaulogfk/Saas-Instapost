import type { ComponentType, CSSProperties } from "react"
import {
  CalendarDays,
  Download,
  Images,
  Instagram,
  Layers,
  Palette,
  PenLine,
  Sparkles,
  Type,
  Users,
  Wand2,
} from "lucide-react"

/*
 * ESTEIRAS: as duas fitas em loop da página, no molde das duas da landing do
 * EverReply.
 *
 * `Esteira` são pílulas e fecha o herói ("e tem mais isso tudo").
 * `EsteiraCartoes` são cartões de duas linhas e fecha a faixa do diferencial.
 *
 * As duas são SERVER COMPONENTS, sem estado e sem JS: o loop inteiro é CSS
 * (`.lp-esteira*` no globals.css). Marquee com JS acima da dobra custa
 * hidratação e main thread justamente onde o LCP acontece, e aqui não há nada
 * pra reagir. A fita só anda.
 *
 * O CONTEÚDO É DUPLICADO NO DOM de propósito: é o que faz o loop não dar
 * salto. A segunda cópia leva `aria-hidden` pro leitor de tela não ler a lista
 * duas vezes, e ela some de vez no `prefers-reduced-motion`, onde a fita vira
 * lista com rolagem.
 *
 * REGRA DA PÁGINA: nada que a gente não possa defender. Todo rótulo aqui é
 * CAPACIDADE do produto hoje, nunca resultado de cliente.
 */

type IconeLucide = ComponentType<{ className?: string; strokeWidth?: number }>

export type ItemEsteira = { icone: IconeLucide; rotulo: string }

const ITENS_PADRAO: ItemEsteira[] = [
  { icone: Wand2, rotulo: "Carrossel completo a partir de uma pauta" },
  { icone: PenLine, rotulo: "Roteiro com gancho, virada e CTA" },
  { icone: Sparkles, rotulo: "Imagem gerada por IA" },
  { icone: Palette, rotulo: "Oito territórios visuais" },
  { icone: Type, rotulo: "Editor dentro da plataforma" },
  { icone: CalendarDays, rotulo: "Calendário editorial" },
  { icone: Instagram, rotulo: "Publica no Instagram" },
  { icone: Images, rotulo: "Post único e carrossel" },
  { icone: Users, rotulo: "Várias marcas na mesma conta" },
  { icone: Download, rotulo: "Export em 1080x1350" },
  { icone: Layers, rotulo: "Editar nunca gasta token" },
]

function Pilula({ icone: Icone, rotulo }: ItemEsteira) {
  return (
    <li className="lp-esteira-item flex items-center gap-2.5 rounded-full border border-hairline-strong bg-white/[0.03] py-2.5 pl-4 pr-5 text-[13.5px] leading-none text-foreground">
      <Icone className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
      {rotulo}
    </li>
  )
}

export function Esteira({
  className = "",
  itens = ITENS_PADRAO,
}: {
  className?: string
  itens?: ItemEsteira[]
}) {
  const pilulas = itens.map((item) => <Pilula key={item.rotulo} {...item} />)

  return (
    /* Sem arredondamento fixo: a esteira sangra de ponta a ponta da tela, e
       canto arredondado em faixa full-bleed desenha um vinco no meio do nada.
       Quem quiser a versão em cartão passa o raio pelo `className`. */
    <div className={`bg-surface/40 py-6 ${className}`}>
      <div className="lp-esteira">
        <div className="lp-esteira-fita">
          <ul className="lp-esteira-grupo">{pilulas}</ul>
          <ul className="lp-esteira-grupo" aria-hidden="true">
            {pilulas}
          </ul>
        </div>
      </div>
    </div>
  )
}

export type ItemCartao = { icone: IconeLucide; nome: string; nota: string }

function Cartao({ icone: Icone, nome, nota }: ItemCartao) {
  return (
    <li className="lp-esteira-item flex items-center gap-3 rounded-2xl border border-hairline bg-surface py-3 pl-3.5 pr-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
        <Icone className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium leading-tight text-foreground">{nome}</span>
        <span className="mt-0.5 block text-[12.5px] leading-tight text-text-muted">{nota}</span>
      </span>
    </li>
  )
}

/**
 * A irmã da esteira do herói: mesma mecânica, item em CARTÃO de duas linhas
 * (o que a peça é, e o que ela resolve pra você).
 *
 * A duração é maior por volta com menos conteúdo porque cartão é mais largo
 * que pílula: a mesma velocidade aparente pede menos tempo. Abaixo de ~28s
 * a fita vira enjoo visual.
 */
export function EsteiraCartoes({
  itens,
  className = "",
}: {
  itens: ItemCartao[]
  className?: string
}) {
  const cartoes = itens.map((item) => <Cartao key={item.nome} {...item} />)
  const knobs = { "--lp-esteira-dur": "34s", "--lp-esteira-respiro": "12px" } as CSSProperties

  return (
    <div className={`lp-esteira ${className}`} style={knobs}>
      <div className="lp-esteira-fita">
        <ul className="lp-esteira-grupo">{cartoes}</ul>
        <ul className="lp-esteira-grupo" aria-hidden="true">
          {cartoes}
        </ul>
      </div>
    </div>
  )
}

export default Esteira
