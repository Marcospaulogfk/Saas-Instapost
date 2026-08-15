import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowRight, Check, Play, Star, TrendingUp, X } from "lucide-react"

import { CardNav, type CardNavItem } from "@/components/landing/card-nav"
import { DarkVeil } from "@/components/landing/dark-veil"
import { StickyCta } from "@/components/landing/sticky-cta"
import { SiteFooter } from "@/components/landing/site-footer"
import { HeroEngine } from "@/components/landing/hero-engine"
import { ProofWall } from "@/components/landing/proof-wall"
import { StepsFlow } from "@/components/landing/steps-flow"
import { FeatureShowcase } from "@/components/landing/feature-showcase"
import { CostStack } from "@/components/landing/cost-stack"
import { PricingCards } from "@/components/landing/pricing-cards"
import { Reveal, RevealWords } from "@/components/landing/reveal"

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

// FAQ da landing — usado no accordion e no JSON-LD (FAQPage).
const FAQ_ITEMS = [
  { q: "Quantos carrosséis posso criar por mês?", a: "Depende do plano e de quantas imagens de IA você usa. Com imagem em todos os slides: Starter faz ~7, Pro ~24 e Studio ~73 por mês. Sem imagem de IA, um carrossel custa só 4 tokens — o Pro faz 250. No teste grátis você monta 1 carrossel completo." },
  { q: "Preciso saber design pra usar?", a: "Não. A IA monta o roteiro e o design prontos. Você só ajusta texto e cor se quiser — os templates são clicar e usar." },
  { q: "As imagens têm direitos comerciais?", a: "Sim. Tudo que o Nexus Content gera é seu, com direitos comerciais inclusos. Pode usar em qualquer canal, inclusive em anúncios pagos." },
  { q: "Funciona pra qual tipo de negócio?", a: "Criadores, social medias, agências, infoprodutores, e-commerces e PMEs. Se você posta carrossel no Instagram, o Nexus Content funciona pra você." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Cancelamento em 1 clique no painel, sem multa e sem ligação. Você mantém o acesso até o fim do período pago." },
  { q: "Como funciona o teste grátis?", a: "Você cria a conta sem cartão e monta 1 carrossel completo, com capa gerada por IA. Depois é só escolher um plano pra continuar." },
]

// Dados estruturados (schema.org) — SoftwareApplication + FAQPage.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Nexus Content",
      url: "https://syncpost.com.br",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description:
        "Plataforma de geração de conteúdo para Instagram com IA. Aprende sua marca e entrega carrosséis prontos pra postar — roteiro, design e imagem em minutos.",
      offers: [
        { "@type": "Offer", name: "Starter", price: "47.00", priceCurrency: "BRL", category: "subscription" },
        { "@type": "Offer", name: "Pro", price: "97.00", priceCurrency: "BRL", category: "subscription" },
        { "@type": "Offer", name: "Studio", price: "247.00", priceCurrency: "BRL", category: "subscription" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
}

// Segmentos que aparecem no marquee de social proof.
const MARQUEE_SEGMENTS = [
  "Criadores",
  "Social medias",
  "Agências",
  "Infoprodutos",
  "E-commerce",
  "Clínicas",
  "Restaurantes",
  "Moda",
  "Fitness",
  "Educação",
  "Coaches",
  "Imobiliárias",
]

// Cards do header — abrem no clique do menu.
const NAV_ITEMS: CardNavItem[] = [
  {
    label: "Produto",
    bgColor: "var(--background-tertiary)",
    textColor: "var(--text-primary)",
    links: [
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Recursos", href: "#recursos" },
      { label: "A engine por dentro", href: "#prova" },
    ],
  },
  {
    label: "Planos",
    bgColor: "var(--brand-800)",
    textColor: "#FFFFFF",
    links: [
      { label: "Ver planos", href: "#planos" },
      { label: "Comparação completa", href: "/pricing" },
      { label: "Testar grátis", href: "/onboarding" },
    ],
  },
  {
    label: "Conta",
    bgColor: "var(--brand-600)",
    textColor: "#FFFFFF",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta", href: "/cadastro" },
      { label: "Dúvidas frequentes", href: "#faq" },
    ],
  },
]

const DORES = [
  {
    t: "O Canva come suas horas",
    d: "Cada carrossel vira uma hora fuçando template, fonte e alinhamento. Tempo que devia virar venda.",
  },
  {
    t: "Sem constância, o alcance morre",
    d: "O algoritmo premia quem aparece todo dia. Você some uma semana e o perfil esfria por um mês.",
  },
  {
    t: "Tudo com cara de template",
    d: "Os mesmos layouts prontos de todo mundo. Seu conteúdo se dilui no meio do feed e ninguém para.",
  },
]

// Quebra de objeção. Cada item é uma desculpa real que trava a compra, seguida
// da resposta que o produto de fato entrega — nada de promessa que a engine não
// cumpre hoje.
const OBJECOES = [
  {
    desculpa: "“Meu perfil é pequeno demais.”",
    resposta:
      "Carrossel é o formato que o Instagram mais entrega pra quem ainda não te segue. Alcance não sai do tamanho do perfil, sai do formato e da frequência.",
  },
  {
    desculpa: "“Eu não sei escrever.”",
    resposta:
      "Você dá o tema. A engine escreve os 8 slides — gancho, desenvolvimento e chamada — no tom da sua marca, em português de gente.",
  },
  {
    desculpa: "“Não tenho tempo pra isso.”",
    resposta:
      "São 3 minutos por carrossel, do briefing ao arquivo pronto pra postar. O tempo que você levava pra escolher a fonte no Canva.",
  },
  {
    desculpa: "“Vai ficar com cara de IA.”",
    resposta:
      "A engine lê a sua marca antes de criar: paleta, tipografia, tom de voz e enquadramento. Sai a sua cara, não a de um template genérico.",
  },
]

// Bifurcação de fim de página: os dois cenários possíveis daqui a 90 dias.
const CENARIOS = {
  parado: [
    "O feed segue com o mesmo post de três semanas atrás.",
    "Você continua abrindo o Canva no domingo à noite pra dar conta da semana.",
    "O alcance cai de novo e você culpa o algoritmo.",
    "Seu concorrente publicou 90 carrosséis nesse intervalo.",
  ],
  andando: [
    "90 carrosséis publicados, todos com a identidade da sua marca.",
    "Sua semana de conteúdo sai numa sentada de meia hora.",
    "O perfil aparece pra quem ainda não te segue, todo dia.",
    "Você discute pauta e oferta — não fonte e alinhamento.",
  ],
}

const DEPOIMENTOS = [
  { ini: "CM", nome: "Cláudia M.", area: "Boutique de moda", txt: "Eu travava no Canva e postava 1x por semana. Agora saio com 4 carrosséis por dia, todos com a minha cara." },
  { ini: "RT", nome: "Rafael T.", area: "Social media", txt: "Atendo 6 clientes sozinho. O que levava uma tarde por marca agora sai em minutos — e fica melhor." },
  { ini: "JP", nome: "Juliana P.", area: "Infoprodutos", txt: "O roteiro já vem pronto pra vender. Colei, exportei e o engajamento subiu na primeira semana." },
]

export default function HomePage() {
  return (
    <main className="lp-root min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Dados estruturados pra rich results (Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* ── Barra de anúncio ──────────────────────────────────── */}
      <div className="lp-topbar-flow text-white text-center px-4 py-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
          <TrendingUp className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
          Carrossel completo — copy, design e imagem — em menos de 3 minutos
        </p>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      {/* `isolate`: sem stacking context próprio, as camadas -z-10 cairiam atrás
          do fundo opaco do <main> e sumiriam. */}
      <section className="lp-noise isolate relative px-6 pt-28 pb-20 md:pt-36 md:pb-24 overflow-hidden">
        {/* Fundo WebGL + véu de legibilidade por cima */}
        {/* hueShift 18° foi medido lendo os pixels do shader: é onde o véu (magenta
            por padrão) fica mais alinhado ao azul da marca sem virar ciano. O shader
            já é escuro, então o overlay é leve — só assenta o contraste e costura a
            borda de baixo com o resto da página. */}
        {/* O véu fica centralizado: uma faixa no meio do hero com máscara radial,
            pra luz nascer no centro e morrer no preto das bordas. */}
        <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
          <div className="lp-veil-mask relative h-[115%] w-[min(1500px,120%)]">
            <DarkVeil hueShift={18} speed={0.4} warpAmount={0.06} />
          </div>
          <div className="absolute inset-0 bg-background/25" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
        </div>

        <CardNav items={NAV_ITEMS} />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-14 items-center">
          {/* Coluna texto */}
          <div>
            <Reveal from="left">
              <span className="inline-flex items-center gap-2 rounded-full border border-border-accent bg-surface/60 backdrop-blur px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary mb-7">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="lp-ring-pulse absolute inline-flex h-full w-full rounded-full bg-primary" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Engine de carrosséis · Nano Banana 2 + Flux
              </span>
            </Reveal>

            <h1 className="lp-display text-[2.7rem] md:text-[4.2rem] leading-[1.02] mb-6">
              <RevealWords text="Carrosséis que param o feed," highlight={[2, 3, 4]} />
              <br />
              <RevealWords text="em 3 minutos" highlight={[1, 2]} />
              <span className="lp-caret inline-block w-[0.45em] h-[0.8em] align-[-0.02em] bg-primary ml-2" aria-hidden />
            </h1>

            <Reveal delay={0.35}>
              <p className="text-lg text-text-secondary max-w-xl mb-9 leading-relaxed">
                A IA que aprende a sua marca e entrega o carrossel pronto pra postar —
                roteiro, design e imagem no seu estilo.{" "}
                <span className="text-foreground font-medium">
                  Sem Canva. Sem designer. Sem perder horas.
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.45}>
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <Button
                  asChild
                  size="lg"
                  className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-13 px-7 rounded-full text-[15px]"
                >
                  <Link href="/onboarding">
                    Quero criar carrosséis virais
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-13 px-7 border-hairline-strong rounded-full text-[15px]"
                >
                  <Link href="#como-funciona">
                    <Play className="w-4 h-4 mr-2" />
                    Ver como funciona
                  </Link>
                </Button>
              </div>

              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                Sem cartão · Acesso imediato · Cancela quando quiser
              </p>
            </Reveal>

          </div>

          {/* Coluna prova — carrosséis reais rolando */}
          <Reveal from="right" delay={0.2}>
            <ProofWall className="h-[420px] md:h-[560px] lg:h-[620px]" />
          </Reveal>
        </div>
      </section>

      {/* ── Marquee de segmentos ──────────────────────────────── */}
      <section className="py-8 border-t border-hairline overflow-hidden">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted mb-6">
          Feito pra quem publica todo dia
        </p>
        <div className="lp-fade-x">
          <div className="lp-marquee gap-3 pr-3">
            {[...MARQUEE_SEGMENTS, ...MARQUEE_SEGMENTS].map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="shrink-0 rounded-full border border-hairline bg-surface px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-secondary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── A engine por dentro ───────────────────────────────── */}
      <section id="prova" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-12 items-center">
          <Reveal from="left">
            <SectionLabel>A engine por dentro</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[2.75rem] leading-[1.1] mt-4 mb-4">
              Um tema entra.{" "}
              <span className="lp-text-gradient">Oito slides saem.</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Nada de template genérico com foto de banco de imagem: a engine lê a marca,
              escreve o roteiro e gera cada imagem com a paleta, o tom e o enquadramento
              de quem pediu.
            </p>
            <div className="grid grid-cols-2 gap-px border border-hairline rounded-xl overflow-hidden bg-hairline max-w-sm">
              {[
                { n: "7 nichos", l: "Testados na engine" },
                { n: "8 estilos", l: "De carrossel" },
              ].map((s, i) => (
                <div key={i} className="bg-surface p-4">
                  <div className="font-mono text-lg font-medium tabular-nums">{s.n}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal from="right" delay={0.15}>
            <HeroEngine />
          </Reveal>
        </div>
      </section>

      {/* ── A verdade (algoritmo) ─────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <SectionLabel>A verdade que ninguém te conta</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-4">
              O algoritmo premia carrossel.
              <br className="hidden md:block" /> E pune quem some do feed.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Carrossel é o formato com mais alcance do Instagram. Enquanto você gasta
              horas no Canva pra fazer 1 post, tem gente publicando 10 no mesmo tempo — com IA.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {DORES.map((p, i) => (
              <Reveal key={p.t} delay={i * 0.12}>
                <div className="lp-card h-full rounded-2xl border border-hairline bg-surface p-7">
                  <div className="w-8 h-8 rounded-lg border border-danger/30 flex items-center justify-center mb-5">
                    <X className="w-4 h-4 text-danger" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{p.t}</h3>
                  <p className="text-text-secondary text-[15px] leading-relaxed">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="text-center mt-10">
            <p className="text-text-secondary mb-5">
              A diferença entre quem vende e quem só posta bonito?{" "}
              <span className="text-foreground font-semibold">Velocidade + constância.</span>
            </p>
            <Button
              asChild
              size="lg"
              className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-12 px-8 rounded-full"
            >
              <Link href="/onboarding">
                Quero parar de perder tempo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── Como funciona (bloco claro) ───────────────────────── */}
      <section id="como-funciona" className="lp-light px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <SectionLabel>Como funciona</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-3">
              Três passos. Três minutos.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Do briefing ao arquivo pronto pra subir — sem sair da plataforma.
            </p>
          </Reveal>

          <StepsFlow />

          <Reveal delay={0.15} className="text-center mt-12">
            <Button
              asChild
              size="lg"
              className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-12 px-8 rounded-full"
            >
              <Link href="/onboarding">
                Criar meu primeiro carrossel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── Recursos em ação ──────────────────────────────────── */}
      <section id="recursos" className="px-6 py-20 md:py-28 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-12">
            <SectionLabel>Recursos</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-3">
              Mais que um gerador: uma engine de marca
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Clique em cada recurso e veja funcionando — não em promessa.
            </p>
          </Reveal>

          <FeatureShowcase />

          {/* Complementos rápidos */}
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {[
              { t: "8 estilos de carrossel", d: "Do dark vibrante ao minimal suíço — layouts inspirados em quem viraliza." },
              { t: "Multi-marca", d: "Gerencie várias marcas e troque de contexto num clique." },
              { t: "Sem marca d'água", d: "Conteúdo limpo e profissional nos planos pagos." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.1}>
                <div className="lp-card h-full rounded-xl border border-hairline bg-surface p-6">
                  <div className="lp-rule w-10 mb-4" />
                  <h3 className="font-semibold mb-1.5">{f.t}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quebra de objeção ─────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <SectionLabel>Sem desculpa</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-4">
              O que te trava não é falta de tempo.
              <br className="hidden md:block" />{" "}
              <span className="lp-text-gradient">É falta de sistema.</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Quatro frases que você já falou pra si mesmo — e o que acontece com cada
              uma quando a engine assume o trabalho braçal.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            {OBJECOES.map((o, i) => (
              <Reveal key={o.desculpa} delay={i * 0.1}>
                <div className="lp-card h-full rounded-2xl border border-hairline bg-surface p-7">
                  <p className="text-text-muted text-[15px] italic leading-relaxed mb-4">
                    {o.desculpa}
                  </p>
                  <div className="flex gap-3">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <p className="text-[15px] leading-relaxed">{o.resposta}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Faça as contas (bloco claro) ──────────────────────── */}
      <section className="lp-light px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <SectionLabel>Faça as contas</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-3">
              Quanto você pagaria separado por tudo isso?
            </h2>
            <p className="text-lg text-text-secondary">
              Pra fazer o que o Nexus Content faz, você precisaria montar (e pagar) esse arsenal:
            </p>
          </Reveal>

          <CostStack />

          <Reveal delay={0.15} className="text-center mt-8">
            <Button
              asChild
              size="lg"
              className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-12 px-8 rounded-full"
            >
              <Link href="#planos">
                Ver planos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── Depoimentos ───────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <SectionLabel>Quem usa</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[2.75rem] leading-[1.1] mt-4">
              Perfis que pararam de sumir do feed
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {DEPOIMENTOS.map((t, i) => (
              <Reveal key={t.nome} delay={i * 0.12}>
                <div className="lp-card h-full rounded-2xl border border-hairline bg-surface p-7">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-[15px] text-foreground leading-relaxed mb-6">&ldquo;{t.txt}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-surface-2 border border-border-accent flex items-center justify-center font-mono text-[11px] tracking-wider text-primary">
                      {t.ini}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.nome}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                        {t.area}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ────────────────────────────────────────────── */}
      <section id="planos" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <SectionLabel>Planos</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-3">
              Comece grátis. Suba quando crescer.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              1 carrossel completo grátis, sem cartão. Sem fidelidade, cobrança em BRL.
            </p>
          </Reveal>

          <PricingCards />

          <Reveal delay={0.2} className="text-center mt-10">
            <Link
              href="/pricing"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-primary transition inline-flex items-center gap-1.5"
            >
              Ver comparação completa <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.82fr_1.18fr] gap-6">
          {/* Card destacado */}
          <Reveal from="left">
            <div className="lp-noise relative h-full overflow-hidden rounded-3xl border border-hairline bg-surface p-8 md:p-9">
              <div className="lp-halo absolute inset-0 opacity-70 pointer-events-none" />
              <div className="relative flex h-full flex-col">
                <span className="self-start rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                  Teste grátis
                </span>

                <h2 className="lp-display mt-6 text-[2rem] leading-[1.08] md:text-[2.4rem]">
                  Ficou uma dúvida
                  <br />
                  que não está aqui?
                </h2>

                <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
                  A resposta mais rápida é ver funcionando. Cria a conta, digita um tema e
                  julga o resultado com a sua marca — não com a demo de outra pessoa.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline">
                  {[
                    { n: "1 carrossel", l: "Grátis, sem cartão" },
                    { n: "1 clique", l: "Pra cancelar" },
                  ].map((s) => (
                    <div key={s.l} className="bg-surface-2 p-4">
                      <div className="lp-display text-xl tabular-nums">{s.n}</div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="mt-8 h-11 w-fit rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
                >
                  <Link href="/onboarding">
                    Criar conta grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>

          {/* Grade de perguntas */}
          <Reveal from="right" delay={0.12}>
            <Accordion type="single" collapsible className="grid gap-3 sm:grid-cols-2">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="h-fit rounded-2xl border border-hairline bg-surface px-5 transition-colors data-[state=open]:border-border-accent data-[state=open]:bg-surface-2"
                >
                  <AccordionTrigger className="py-5 text-left text-[15px] leading-snug hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-text-secondary">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ── Bifurcação: os dois cenários de 90 dias ───────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <SectionLabel>Daqui a 90 dias</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-4">
              Os dois feeds que você pode ter em dezembro
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              A diferença entre eles não é talento nem orçamento. É ter decidido hoje.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            <Reveal from="left">
              <div className="h-full rounded-2xl border border-hairline bg-surface p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted mb-6">
                  Se nada mudar
                </p>
                <ul className="space-y-4">
                  {CENARIOS.parado.map((linha) => (
                    <li key={linha} className="flex gap-3 text-text-secondary text-[15px] leading-relaxed">
                      <X className="w-4 h-4 text-danger shrink-0 mt-1" />
                      {linha}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal from="right" delay={0.12}>
              <div className="lp-card h-full rounded-2xl border border-brand-600/40 bg-surface p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary mb-6">
                  Com o Nexus Content
                </p>
                <ul className="space-y-4">
                  {CENARIOS.andando.map((linha) => (
                    <li key={linha} className="flex gap-3 text-[15px] leading-relaxed">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                      {linha}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="text-center mt-10">
            <p className="text-text-secondary mb-5">
              Os 90 dias passam de qualquer jeito.{" "}
              <span className="text-foreground font-semibold">
                A única variável é o que sobra no fim.
              </span>
            </p>
            <Button
              asChild
              size="lg"
              className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-12 px-8 rounded-full"
            >
              <Link href="/onboarding">
                Começar o primeiro carrossel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 border-t border-hairline">
        <div className="max-w-4xl mx-auto">
          <Reveal from="scale">
            <div className="lp-noise relative overflow-hidden rounded-3xl border border-border-accent bg-surface border-t-2 border-t-primary p-10 md:p-16 text-center">
              <div className="lp-halo absolute inset-0 pointer-events-none" />
              <div className="relative">
                <SectionLabel>1 carrossel grátis</SectionLabel>
                <h2 className="lp-display text-3xl md:text-[3rem] leading-[1.08] mt-4 mb-4">
                  Comece a publicar com{" "}
                  <span className="lp-text-gradient">constância de verdade</span>
                </h2>
                <p className="text-lg text-text-secondary mb-9 max-w-xl mx-auto">
                  Conta sua marca, digita o tema e exporta o primeiro carrossel em minutos.
                  Sem cartão, sem código.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-13 px-9 rounded-full text-[15px]"
                >
                  <Link href="/onboarding">
                    Começar grátis agora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mt-6">
                  Acesso imediato · Conteúdo pronto em minutos
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />

      <StickyCta />
    </main>
  )
}
