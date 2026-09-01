import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { CardNav, type CardNavItem } from "@/components/landing/card-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { PlanosBackdrop } from "@/components/landing/planos-backdrop"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { NichoCarouselGallery } from "@/components/modelos/nicho-carousel-gallery"
import {
  NICHOS,
  nichoPorSlug,
  seoTitleNicho,
  seoDescriptionNicho,
  type NichoSeo,
} from "@/lib/seo/nichos"
import { TEMPLATES_NICHO, templatesDoNicho } from "@/lib/seo/templates-nicho"

const NAV_ITEMS: CardNavItem[] = [
  {
    label: "Produto",
    bgColor: "var(--background-tertiary)",
    textColor: "var(--text-primary)",
    links: [
      { label: "Página inicial", href: "/" },
      { label: "Como funciona", href: "/#como-funciona" },
      { label: "Recursos", href: "/#recursos" },
    ],
  },
  {
    label: "Planos",
    bgColor: "var(--brand-800)",
    textColor: "#FFFFFF",
    links: [
      { label: "Ver planos", href: "/pricing" },
      { label: "Testar grátis", href: "/cadastro" },
    ],
  },
  {
    label: "Conta",
    bgColor: "var(--brand-600)",
    textColor: "#FFFFFF",
    links: [
      { label: "Entrar", href: "/login" },
      { label: "Criar conta", href: "/cadastro" },
    ],
  },
]

function ctaGeralHref() {
  const next = "/dashboard/criar?tipo=carrossel&step=2"
  return `/cadastro?next=${encodeURIComponent(next)}`
}

export function generateStaticParams() {
  return NICHOS.map((n) => ({ nicho: n.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nicho: string }>
}): Promise<Metadata> {
  const { nicho: slug } = await params
  const nicho = nichoPorSlug(slug)
  if (!nicho) return {}

  const title = seoTitleNicho(nicho)
  const description = seoDescriptionNicho(nicho)
  const path = `/modelos/carrossel/${nicho.slug}`

  return {
    // absolute: sem o template "| Nexus Content" do layout raiz, que
    // estouraria os ~60 chars e o Google cortaria o gancho do title.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: path,
      siteName: "Nexus Content",
      title,
      description,
      images: [{ url: "/nexus-og.png", alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/nexus-og.png"],
    },
  }
}

function buildJsonLd(nicho: NichoSeo) {
  const path = `https://nexuscontentai.com.br/modelos/carrossel/${nicho.slug}`
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: "https://nexuscontentai.com.br/" },
          {
            "@type": "ListItem",
            position: 2,
            name: "Modelos de carrossel",
            item: "https://nexuscontentai.com.br/modelos/carrossel",
          },
          { "@type": "ListItem", position: 3, name: nicho.nome, item: path },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: nicho.faq.map((item) => ({
          "@type": "Question",
          name: item.pergunta,
          acceptedAnswer: { "@type": "Answer", text: item.resposta },
        })),
      },
      {
        "@type": "ItemList",
        name: `Modelos de carrossel para ${nicho.nome}`,
        itemListElement: templatesDoNicho(nicho.slug).map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.nome,
        })),
      },
    ],
  }
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
      <span className="text-primary">●</span>
      {children}
    </div>
  )
}

export default async function NichoCarrosselPage({
  params,
}: {
  params: Promise<{ nicho: string }>
}) {
  const { nicho: slug } = await params
  const nicho = nichoPorSlug(slug)
  if (!nicho) notFound()

  const outrosNichos = NICHOS.filter((n) => n.slug !== nicho.slug)

  return (
    <main className="lp-root min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(nicho)) }}
      />

      {/* ── Hero (compacto, estilo Adobe Express: hero curto + galeria
          já visível na primeira dobra) ───────────────────────── */}
      <section className="isolate relative overflow-hidden px-6 pt-24 pb-8 md:pt-28 md:pb-10">
        <PlanosBackdrop />
        <CardNav items={NAV_ITEMS} />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-accent bg-surface/60 backdrop-blur px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary mb-5">
            Modelos gratuitos · {nicho.nome}
          </span>

          <h1 className="lp-display text-[2rem] md:text-[2.9rem] leading-[1.08] mb-4">
            Carrossel para {nicho.nome.toLowerCase()}
            <span className="lp-text-gradient">: pronto em segundos</span>
          </h1>

          {/* Dor + proposta condensadas — a proposta completa fica pro CTA final */}
          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-6 leading-relaxed">
            {nicho.dor}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
            <Button
              asChild
              size="lg"
              className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-13 px-7 rounded-full text-[15px]"
            >
              <Link href={ctaGeralHref()}>
                Criar meu carrossel de {nicho.nome.toLowerCase()} grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            1 carrossel completo grátis · Sem cartão · Escolha o modelo abaixo
          </p>
        </div>
      </section>

      {/* ── Barra estilo Adobe: contagem + chips de outras profissões ──
          Substitui a antiga seção "Outras profissões" do fim da página:
          aqui ela também funciona como navegação de topo, sem quebrar a
          primeira dobra em mais uma seção cheia de texto. */}
      <section className="px-6 py-3.5 border-y border-hairline bg-surface/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2.5">
          <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            {TEMPLATES_NICHO.length} modelos de carrossel · filtre pela sua profissão abaixo
          </p>
          <div className="flex items-center gap-2 overflow-x-auto sm:ml-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {outrosNichos.map((n) => (
              <Link
                key={n.slug}
                href={`/modelos/carrossel/${n.slug}`}
                className="shrink-0 whitespace-nowrap rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
              >
                {n.nome}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galeria de estilos ao vivo ────────────────────────── */}
      <section className="px-6 py-10 md:py-12">
        <div className="max-w-6xl mx-auto">
          <NichoCarouselGallery nichoAtualSlug={nicho.slug} />
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────── */}
      <section className="lp-light px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Como funciona</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[2.75rem] leading-[1.1] mt-4 mb-3">
              Três passos. Três minutos.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Do briefing sobre {nicho.nome.toLowerCase()} ao carrossel pronto pra postar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                t: "Descreva o briefing",
                d: `Digite o tema do dia (ex.: um dos temas que ${nicho.nome.toLowerCase()} mais posta) em uma frase. Sem roteiro pronto, sem estrutura pra decorar.`,
              },
              {
                n: "02",
                t: "A IA gera copy e arte",
                d: "O roteiro, o design e a imagem saem prontos, no estilo visual que você escolheu na galeria acima.",
              },
              {
                n: "03",
                t: "Edite e poste",
                d: "Ajuste texto, cor ou imagem se quiser (editar é sempre grátis) e exporte pronto pro Instagram.",
              },
            ].map((s) => (
              <div key={s.n} className="lp-card h-full rounded-xl border border-hairline bg-surface p-6">
                <div className="font-mono text-[11px] text-primary mb-3">{s.n}</div>
                <h3 className="font-semibold mb-2 text-lg">{s.t}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Temas que o nicho posta ────────────────────────────── */}
      <section className="px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Ideias prontas</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[2.5rem] leading-[1.1] mt-4 mb-3">
              O que postar como {nicho.nome.toLowerCase()}
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Os quatro tipos de carrossel que mais funcionam pra quem busca{" "}
              {nicho.keywordsSecundarias[0]} e {nicho.keywordsSecundarias[1]}.
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 gap-4">
            {nicho.temas.map((tema) => (
              <li
                key={tema}
                className="flex gap-3 rounded-xl border border-hairline bg-surface p-5 text-[15px] leading-relaxed"
              >
                <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                {tema}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="lp-light px-6 py-20 md:py-24 border-t border-hairline">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Dúvidas frequentes</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[2.5rem] leading-[1.1] mt-4 mb-3">
              Perguntas de {nicho.nome.toLowerCase()} sobre a ferramenta
            </h2>
          </div>

          <Accordion type="single" collapsible className="grid gap-3">
            {nicho.faq.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-hairline bg-surface px-5 transition-colors data-[state=open]:border-border-accent data-[state=open]:bg-surface-2"
              >
                <AccordionTrigger className="py-5 text-left text-[15px] leading-snug hover:no-underline">
                  {item.pergunta}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-text-secondary">
                  {item.resposta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 border-t border-hairline">
        <div className="max-w-4xl mx-auto">
          <div className="lp-noise relative overflow-hidden rounded-3xl border border-border-accent bg-surface border-t-2 border-t-primary p-10 md:p-16 text-center">
            <div className="lp-halo absolute inset-0 pointer-events-none" />
            <div className="relative">
              <SectionLabel>1 carrossel grátis</SectionLabel>
              <h2 className="lp-display text-3xl md:text-[2.75rem] leading-[1.08] mt-4 mb-4">
                Comece a postar como {nicho.nome.toLowerCase()} hoje
              </h2>
              <p className="text-lg text-text-secondary mb-9 max-w-xl mx-auto">
                {nicho.propostaDeValor}
              </p>
              <Button
                asChild
                size="lg"
                className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-13 px-9 rounded-full text-[15px]"
              >
                <Link href={ctaGeralHref()}>
                  Começar grátis agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mt-6">
                Acesso imediato · Sem cartão · Cancela em 1 clique
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
