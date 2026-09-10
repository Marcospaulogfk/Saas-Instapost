import {
  Bookmark,
  CalendarDays,
  Check,
  Heart,
  Images,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react"

import { Logo } from "@/components/brand/logo"

/*
 * PAINEL DO HERÓI: a janela do produto embaixo do título, no lugar que na
 * landing do EverReply é ocupado pelo print do inbox com o celular sobreposto.
 *
 * São duas peças, e a divisão de trabalho entre elas é o ponto:
 * - A JANELA é a plataforma. É ela que mostra que isso não é um gerador solto,
 *   é uma operação de conteúdo (calendário, marcas, peças prontas).
 * - O CELULAR é o destino. Sem ele a página vira "mais um dashboard", e o que
 *   se vende aqui é o post no ar, não a tela de admin.
 *
 * SERVER COMPONENT, sem estado e sem JS. É o LCP da página: o que se move aqui
 * é a coluna de peças, e ela anda por CSS (`.lp-marquee-y`, o mesmo motor do
 * ProofWall). Nada aqui entra em <Reveal> por isso mesmo.
 */

const MENU = [
  { icone: LayoutDashboard, rotulo: "Painel" },
  { icone: Wand2, rotulo: "Criar" },
  { icone: CalendarDays, rotulo: "Calendário", ativo: true },
  { icone: Images, rotulo: "Biblioteca" },
  { icone: Users, rotulo: "Marcas" },
]

/* A semana do calendário editorial. `estado` decide a cara da célula:
   publicado (fio da marca), agendado (fio neutro) e vazio (tracejado). */
const SEMANA = [
  { dia: "Seg", peca: "5 erros que esvaziam a agenda", estado: "publicado" },
  { dia: "Ter", peca: "Antes e depois: o que muda em 7 dias", estado: "publicado" },
  { dia: "Qua", peca: "Sua pele não precisa de 10 produtos", estado: "agendado" },
  { dia: "Qui", peca: "Prova social: a Marina falou", estado: "agendado" },
  { dia: "Sex", peca: "", estado: "vazio" },
] as const

/* As imagens vêm de /refs-posts-unicos: são as REFERÊNCIAS de design que
   alimentam os templates, não peças geradas pela engine. Enquanto não houver
   export real aqui, a página não pode chamar isso de output nosso, e por isso
   nenhum rótulo desta janela diz "gerado pelo Nexus". */
const PECAS = [
  "/refs-posts-unicos/beauty/01/referencia.jpg",
  "/refs-posts-unicos/Profissional/01/referencia.jpg",
  "/refs-posts-unicos/fitness/02/referencia.jpg",
  "/refs-posts-unicos/informativo/01/referencia.jpg",
  "/refs-posts-unicos/comercial/01/referencia.jpg",
  "/refs-posts-unicos/beauty/03/referencia.jpg",
]

function ColunaPecas() {
  const lista = [...PECAS, ...PECAS]
  return (
    <div className="lp-fade-y relative h-full overflow-hidden">
      {/* duplicado: o loop de -50% precisa da lista repetida */}
      <div className="lp-marquee-y" style={{ ["--lp-speed" as string]: "38s" }}>
        {lista.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="mb-2.5 overflow-hidden rounded-lg border border-hairline bg-surface-2"
          >
            <img
              src={src}
              alt=""
              loading={i < 2 ? "eager" : "lazy"}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** O celular com o post no ar. Estático de propósito: é o destino, não a demo. */
function Celular() {
  return (
    <div className="w-[228px] rounded-[28px] border border-hairline-strong bg-background p-2 shadow-[0_28px_60px_-20px_rgba(0,0,0,0.75)]">
      <div className="overflow-hidden rounded-[22px] border border-hairline bg-surface">
        {/* Cabeçalho do post */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="h-7 w-7 shrink-0 rounded-full bg-[linear-gradient(135deg,#12A5F5,#1668E3)]" />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-foreground">
              suaclinica
            </span>
            <span className="block truncate font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-muted">
              publicado agora
            </span>
          </span>
        </div>

        <div className="relative">
          <img
            src="/refs-posts-unicos/beauty/03/referencia.jpg"
            alt="Exemplo de carrossel publicado no Instagram"
            className="aspect-[4/5] w-full object-cover"
          />
          {/* Os pontinhos do carrossel: é o que diz que ali tem mais de um
              slide, e o formato é o assunto da página. */}
          <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                className={`h-1 w-1 rounded-full ${n === 0 ? "bg-white" : "bg-white/45"}`}
              />
            ))}
          </span>
        </div>

        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3 text-text-secondary">
            <Heart className="h-3.5 w-3.5" />
            <MessageCircle className="h-3.5 w-3.5" />
            <Send className="h-3.5 w-3.5" />
            <Bookmark className="ml-auto h-3.5 w-3.5" />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-text-secondary">
            <span className="font-semibold text-foreground">suaclinica</span> Arrasta pro lado: os 5
            erros que fazem a clínica perder cliente no Instagram.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeroPainel({ className = "" }: { className?: string }) {
  return (
    /* O `lg:pb-16` reserva, no desktop, o espaço que o celular ocupa FORA da
       janela. Reservar aqui (em vez de deixar o telefone estourar o contêiner)
       é o que impede a sobreposição de encostar na esteira logo abaixo, e o que
       evita barra de rolagem horizontal, porque nada escapa pelos lados. */
    <div className={`relative lg:pb-16 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-hairline-strong bg-surface shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
        {/* Barra da janela, com a rota do app de verdade. */}
        <div className="flex items-center gap-3 border-b border-hairline bg-background/60 px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-hairline-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-hairline-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-hairline-strong" />
          </span>
          {/* A rota inteira não cabe em 390px: lá ela vira só o domínio. Cortar
              com reticências seria pior, porque o que interessa é reconhecer o
              endereço, não a página. */}
          <span className="mx-auto max-w-[70%] truncate rounded-full border border-hairline bg-surface-2 px-3 py-1 font-mono text-[10px] text-text-muted">
            app.nexuscontentai.com.br
            <span className="hidden sm:inline">/dashboard/calendario</span>
          </span>
        </div>

        <div className="flex h-[380px] md:h-[440px] lg:h-[520px]">
          {/* SIDEBAR. Some abaixo de `md`: numa tela de 390px ela comeria
              metade da largura útil, e o assunto da janela é o calendário. */}
          <aside className="hidden w-[188px] shrink-0 flex-col border-r border-hairline bg-background/40 p-3 md:flex">
            <div className="px-1.5 py-2">
              <Logo size={18} />
            </div>
            <nav className="mt-3 flex flex-col gap-0.5">
              {MENU.map((m) => (
                <span
                  key={m.rotulo}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] ${
                    "ativo" in m && m.ativo
                      ? "bg-surface-2 text-foreground"
                      : "text-text-muted"
                  }`}
                >
                  <m.icone className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  {m.rotulo}
                </span>
              ))}
            </nav>

            {/* O saldo de tokens: é assim que o produto cobra, e dizer isso na
                primeira tela evita a surpresa depois. */}
            <div className="mt-auto rounded-xl border border-hairline bg-surface p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                Tokens do mês
              </p>
              <p className="mt-1.5 font-mono text-[15px] tabular-nums text-foreground">
                1.240 <span className="text-[10px] text-text-muted">/ 1.500</span>
              </p>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-hairline-strong">
                <span className="block h-full w-[82%] rounded-full bg-primary" />
              </span>
            </div>
          </aside>

          {/* ÁREA DE TRABALHO. Calendário à esquerda, peças à direita: as duas
              dividem uma superfície só, separadas por um fio, e não são dois
              cartões soltos. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
              <span className="text-[13px] font-semibold text-foreground">Calendário editorial</span>
              <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-muted">
                Sua Clínica
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-white">
                <Plus className="h-3 w-3" />
                Nova pauta
              </span>
            </div>

            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1 space-y-2 overflow-hidden p-3.5">
                {SEMANA.map((d) => (
                  <div
                    key={d.dia}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                      d.estado === "vazio"
                        ? "border border-dashed border-hairline-strong"
                        : d.estado === "publicado"
                          ? "border border-brand-600/40 bg-brand-900/20"
                          : "border border-hairline bg-background"
                    }`}
                  >
                    <span className="w-8 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                      {d.dia}
                    </span>
                    {d.estado === "vazio" ? (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-muted">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Gerar carrossel pra este dia
                      </span>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">
                          {d.peca}
                        </span>
                        {d.estado === "publicado" ? (
                          <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
                            <Check className="h-3 w-3" />
                            no ar
                          </span>
                        ) : (
                          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
                            agendado
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* A COLUNA DE PEÇAS. Some abaixo de `sm` pelo mesmo motivo da
                  sidebar: no celular a janela mostra o calendário, e o
                  telefone logo abaixo mostra a peça publicada. */}
              <div className="hidden w-[150px] shrink-0 border-l border-hairline p-3 sm:block lg:w-[178px]">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                  Peças da marca
                </p>
                <div className="h-[calc(100%-1.5rem)]">
                  <ColunaPecas />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* O CELULAR.
          Desktop (lg+): absoluto sobre o canto inferior direito da janela, com
          a origem no canto. A sombra larga é o que descola ele do painel; sem
          ela a sobreposição lê como print colado.
          Mobile: ele NÃO cobre nada. Sai do absoluto, volta pro fluxo e fica
          embaixo da janela, centralizado. Telefone sobreposto numa tela de
          390px taparia justamente o calendário. */}
      <div className="mt-8 flex justify-center lg:absolute lg:-bottom-2 lg:right-2 lg:mt-0 lg:block lg:scale-[0.92] lg:[transform-origin:bottom_right] lg:drop-shadow-[0_28px_46px_rgba(0,0,0,0.55)]">
        <Celular />
      </div>
    </div>
  )
}

export default HeroPainel
