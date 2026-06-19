import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowRight,
  Sparkles,
  Brain,
  Layers,
  Download,
  Palette,
  Check,
  Play,
  Star,
  X,
  Wand2,
  Building2,
} from "lucide-react"

/* ── Helpers de marca ─────────────────────────────────────────── */

// Label de seção: Geist Mono, caixa alta, espaçado, com bolinha ● roxa.
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
      <span className="text-primary">●</span>
      {children}
    </div>
  )
}

// Régua roxa de topo (2px) — sal nº3.
const ruleTop = "border-t-2 border-t-primary"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Grid hairline sutil de fundo */}
      <div className="grid-bg-fade fixed inset-0 -z-10 pointer-events-none" />

      {/* ── Navegação ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-hairline">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <img
              src="/syncpost-horizontal-branca-trim.png"
              alt="SyncPost"
              className="h-6 w-auto"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <Link href="#como-funciona" className="hover:text-foreground transition">Como funciona</Link>
            <Link href="#recursos" className="hover:text-foreground transition">Recursos</Link>
            <Link href="#planos" className="hover:text-foreground transition">Planos</Link>
            <Link href="#faq" className="hover:text-foreground transition">FAQ</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-white hover:bg-primary/90">
              <Link href="/onboarding">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          {/* Coluna texto */}
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-border-accent px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary">
                <span className="text-primary">●</span>
                Engine de carrosséis · Nano Banana 2 + Flux
              </span>
            </div>

            <h1 className="text-[2.6rem] md:text-6xl font-semibold tracking-[-0.03em] leading-[1.04] mb-6">
              Carrosséis que param o feed,
              <br className="hidden md:block" />{" "}
              em <span className="text-brand-300">3 minutos</span>
              <span className="inline-block w-[0.5em] h-[0.85em] align-[-0.05em] bg-primary ml-1.5" aria-hidden />
            </h1>

            <p className="text-lg text-text-secondary max-w-xl mb-9 leading-relaxed">
              A IA que aprende a sua marca e entrega o carrossel pronto pra postar —
              roteiro, design e imagem no seu estilo. Sem Canva, sem Photoshop, sem travar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-7">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 h-12 px-7">
                <Link href="/onboarding">
                  Começar grátis — 2 imagens
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-7 border-hairline-strong">
                <Link href="#como-funciona">
                  <Play className="w-4 h-4 mr-2" />
                  Ver como funciona
                </Link>
              </Button>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
              Sem cartão · Pronto em 5 min · Cancela quando quiser
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-12 border border-hairline rounded-xl overflow-hidden bg-hairline">
              {[
                { n: "3 min", l: "Da ideia ao post" },
                { n: "8 slides", l: "Por carrossel" },
                { n: "Full HD", l: "Export 4:5 nativo" },
                { n: "PT-BR", l: "Roteiro de verdade" },
              ].map((s) => (
                <div key={s.l} className="bg-surface p-4">
                  <div className="font-mono text-xl font-medium text-foreground tabular-nums tracking-tight">{s.n}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna mockup — carrossel sendo gerado pela engine */}
          <div className="relative">
            <div className={`relative rounded-2xl border border-border-accent bg-surface ${ruleTop} p-4 shadow-card`}>
              {/* chrome */}
              <div className="flex items-center justify-between px-1 pb-3 border-b border-hairline">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">SyncPost / Engine</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary flex items-center gap-1.5">
                  <span className="animate-pulse">●</span> Gerando
                </span>
              </div>

              {/* slide 4:5 */}
              <div className="mt-4 aspect-[4/5] rounded-xl border border-hairline bg-background overflow-hidden flex flex-col">
                <div className="flex-1 grid-bg-fade relative flex items-center justify-center">
                  <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">01 / 08</div>
                  <Wand2 className="w-10 h-10 text-primary/70" />
                  <div className="absolute bottom-0 inset-x-0 p-6">
                    <div className="h-2.5 w-2/3 rounded bg-foreground/90 mb-2.5" />
                    <div className="h-2.5 w-5/6 rounded bg-foreground/70 mb-2.5" />
                    <div className="h-2 w-1/2 rounded bg-text-muted/60" />
                  </div>
                </div>
              </div>

              {/* dots */}
              <div className="flex items-center gap-1.5 mt-3 px-1">
                <span className="h-1.5 w-5 rounded-full bg-primary" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-hairline-strong" />
                ))}
              </div>

              {/* metadata footer mono */}
              <div className="mt-3 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                PT-BR · 8 slides · 4:5 · 4.2s
              </div>
            </div>

            {/* card flutuante: marca aprendida */}
            <div className={`absolute -bottom-6 -left-4 hidden sm:block rounded-xl border border-border-accent bg-surface-2 ${ruleTop} p-3.5 w-52 shadow-card`}>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-2">Marca aprendida</div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-primary" />
                <span className="text-sm font-medium">Tom · Público · Visual</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── O problema ────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>O problema</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-3">
              Postar todo dia trava quem não é designer
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Constância é o que faz o perfil crescer. E é exatamente onde quase todo mundo desiste.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: "O Canva come suas horas", d: "Cada carrossel vira uma hora fuçando template, fonte e alinhamento. Tempo que devia virar venda." },
              { t: "Sem constância, o alcance morre", d: "O algoritmo premia quem aparece todo dia. Você some uma semana e o perfil esfria por um mês." },
              { t: "Tudo com cara de template", d: "Os mesmos layouts prontos de todo mundo. Seu conteúdo se dilui no meio do feed e ninguém para." },
            ].map((p) => (
              <div key={p.t} className="rounded-2xl border border-hairline bg-surface p-7">
                <div className="w-8 h-8 rounded-lg border border-danger/30 flex items-center justify-center mb-5">
                  <X className="w-4 h-4 text-danger" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{p.t}</h3>
                <p className="text-text-secondary text-[15px] leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────── */}
      <section id="como-funciona" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Como funciona</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-3">
              No feed em 3 passos, sem design
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Da configuração à IA montando o carrossel sozinha.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, num: "01", title: "Conte a sua marca", desc: "Manda o link do site ou responde 3 perguntas. A IA aprende seu tom de voz, público e estilo visual em segundos." },
              { icon: Sparkles, num: "02", title: "Digite o tema", desc: "Em segundos a engine devolve um roteiro de 8 slides + imagens cinematográficas no seu estilo." },
              { icon: Download, num: "03", title: "Ajuste e exporte", desc: "Refine texto, cor e posição no editor visual e exporte em Full HD, pronto pro Instagram." },
            ].map((step) => (
              <div key={step.num} className={`rounded-2xl border border-border-accent bg-surface ${ruleTop} p-7`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-xs font-medium text-primary tabular-nums tracking-widest">{step.num}</span>
                  <div className="h-px flex-1 bg-hairline" />
                </div>
                <step.icon className="w-9 h-9 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-text-secondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recursos ──────────────────────────────────────────── */}
      <section id="recursos" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Recursos</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-3">
              Mais que um gerador: uma engine de marca
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Cada recurso mostrado em ação — não em promessa.
            </p>
          </div>

          {/* dois blocos grandes "em ação" */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Brand kit */}
            <div className={`rounded-2xl border border-border-accent bg-surface ${ruleTop} p-8`}>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-4">Aprende uma vez</div>
              <h3 className="text-2xl font-semibold mb-3">Sua marca, aplicada em todo carrossel</h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                A IA mapeia tom de voz, paleta, público e referências uma vez. Depois é só pedir o tema:
                tudo já sai com a sua cara.
              </p>
              <div className="rounded-xl border border-hairline bg-background p-4 space-y-2.5">
                {["Tom de voz · direto e confiante", "Paleta · roxo + neutros", "Público · criadores e PMEs"].map((r) => (
                  <div key={r} className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Imagens */}
            <div className={`rounded-2xl border border-border-accent bg-surface ${ruleTop} p-8 flex flex-col`}>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-4">Sem cara de IA</div>
              <h3 className="text-2xl font-semibold mb-3">Imagens cinematográficas no seu território</h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                Flux e Nano Banana 2 geram arte atmosférica e escura, tratada pra viver no clima da sua marca —
                não aquele visual genérico de banco de imagem.
              </p>
              <div className="mt-auto grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="aspect-[4/5] rounded-lg border border-hairline grid-bg-fade flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary/60" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* grid de recursos menores */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Layers, title: "Editor de camadas", desc: "Ajuste texto, cor e posição de cada slide com controle total." },
              { icon: Palette, title: "Templates virais", desc: "Layouts inspirados em quem viraliza, prontos pra usar." },
              { icon: Download, title: "Export Full HD", desc: "PNG 1080×1350, formato 4:5 nativo do Instagram retrato." },
              { icon: Check, title: "Sem marca d'água", desc: "Conteúdo limpo e profissional nos planos pagos." },
              { icon: Sparkles, title: "Roteiro que prende", desc: "Gancho, desenvolvimento e CTA — 1 ideia por slide." },
              { icon: Building2, title: "Multi-marca", desc: "Gerencie várias marcas e troque de contexto num clique." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-hairline bg-surface p-6 hover:border-border-accent transition">
                <f.icon className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ───────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Quem usa</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-3">
              Perfis que pararam de sumir do feed
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { ini: "CM", nome: "Cláudia M.", area: "Boutique de moda", txt: "Eu travava no Canva e postava 1x por semana. Agora saio com 4 carrosséis por dia, todos com a minha cara." },
              { ini: "RT", nome: "Rafael T.", area: "Social media", txt: "Atendo 6 clientes sozinho. O que levava uma tarde por marca agora sai em minutos — e fica melhor." },
              { ini: "JP", nome: "Juliana P.", area: "Infoprodutos", txt: "O roteiro já vem pronto pra vender. Colei, exportei e o engajamento subiu na primeira semana." },
            ].map((t) => (
              <div key={t.nome} className="rounded-2xl border border-hairline bg-surface p-7">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-[15px] text-foreground leading-relaxed mb-6">"{t.txt}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-surface-2 border border-border-accent flex items-center justify-center font-mono text-[11px] tracking-wider text-primary">
                    {t.ini}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.nome}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* tags de segmento */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {["Criadores", "Social medias", "Agências", "Infoprodutos", "E-commerce", "Clínicas", "Restaurantes"].map((s) => (
              <span key={s} className="rounded-full border border-hairline px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ────────────────────────────────────────────── */}
      <section id="planos" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Planos</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-3">
              Comece grátis. Suba quando crescer.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              2 imagens grátis pra testar, sem cartão. Sem fidelidade, cobrança em BRL.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              { name: "Starter", price: 47, tag: "Pra quem está começando", feats: ["50 imagens / mês", "1 marca configurada", "Templates básicos", "Flux Schnell"], popular: false },
              { name: "Pro", price: 97, tag: "O favorito de quem posta todo dia", feats: ["200 imagens / mês", "5 marcas configuradas", "Flux + Nano Banana 2", "Sem marca d'água", "Export em lote"], popular: true },
              { name: "Studio", price: 247, tag: "Pra agências e operações", feats: ["800 imagens / mês", "Marcas ilimitadas", "Nano Banana Pro", "API + white-label", "Até 3 usuários"], popular: false },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border bg-surface p-7 ${
                  p.popular ? `border-border-accent ${ruleTop}` : "border-hairline"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-7 rounded-md bg-primary text-white font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1">
                    Mais escolhido
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-sm text-text-secondary mt-1 mb-5">{p.tag}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-semibold tabular-nums">R$ {p.price}</span>
                  <span className="font-mono text-xs text-text-muted">/mês</span>
                </div>
                <Button
                  asChild
                  className={`w-full mb-6 ${p.popular ? "bg-primary text-white hover:bg-primary/90" : "border border-hairline-strong bg-transparent hover:border-primary hover:text-primary"}`}
                >
                  <Link href="/onboarding">Começar agora</Link>
                </Button>
                <ul className="space-y-3">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-primary transition inline-flex items-center gap-1.5">
              Ver comparação completa <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Dúvidas</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4">
              Perguntas frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Quantos carrosséis posso criar por mês?", a: "Depende do plano. Starter inclui 50 imagens (cerca de 7 carrosséis), Pro inclui 200 (cerca de 28) e Studio inclui 800 (cerca de 115). No teste grátis você tem 2 imagens pra experimentar." },
              { q: "Preciso saber design pra usar?", a: "Não. A IA monta o roteiro e o design prontos. Você só ajusta texto e cor se quiser — os templates são clicar e usar." },
              { q: "As imagens têm direitos comerciais?", a: "Sim. Tudo que o SyncPost gera é seu, com direitos comerciais inclusos. Pode usar em qualquer canal, inclusive em anúncios pagos." },
              { q: "Funciona pra qual tipo de negócio?", a: "Criadores, social medias, agências, infoprodutores, e-commerces e PMEs. Se você posta carrossel no Instagram, o SyncPost funciona pra você." },
              { q: "Posso cancelar quando quiser?", a: "Sim. Cancelamento em 1 clique no painel, sem multa e sem ligação. Você mantém o acesso até o fim do período pago." },
              { q: "Como funciona o teste grátis?", a: "Você cria a conta sem cartão e ganha 2 imagens pra testar. Depois é só escolher um plano pra continuar." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-hairline rounded-xl px-6 bg-surface">
                <AccordionTrigger className="text-left hover:no-underline py-5">{item.q}</AccordionTrigger>
                <AccordionContent className="text-text-secondary pb-5 leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-3xl border border-border-accent bg-surface ${ruleTop} p-10 md:p-14 text-center`}>
            <SectionLabel>2 imagens grátis</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] mt-4 mb-4">
              Coloque seu Instagram pra rodar hoje
            </h2>
            <p className="text-lg text-text-secondary mb-9 max-w-xl mx-auto">
              Conta sua marca, digita o tema e exporta o primeiro carrossel em minutos. Sem cartão, sem código.
            </p>
            <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 h-12 px-9">
              <Link href="/onboarding">
                Começar grátis agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="px-6 py-14 border-t border-hairline">
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <img src="/syncpost-horizontal-branca-trim.png" alt="SyncPost" className="h-6 w-auto mb-4" />
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              A engine de carrosséis com IA. Aprende sua marca e entrega conteúdo pronto pra postar — em minutos.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-4">Produto</div>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="#como-funciona" className="hover:text-foreground transition">Como funciona</Link></li>
              <li><Link href="#recursos" className="hover:text-foreground transition">Recursos</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition">Planos</Link></li>
              <li><Link href="#faq" className="hover:text-foreground transition">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted mb-4">Legal</div>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/termos" className="hover:text-foreground transition">Termos de uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-foreground transition">Privacidade</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition">Entrar</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-hairline">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            SyncPost · Engine de carrosséis com IA · Feito no Brasil · © 2026
          </p>
        </div>
      </footer>
    </main>
  )
}
