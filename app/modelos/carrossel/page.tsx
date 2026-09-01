import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { CardNav, type CardNavItem } from "@/components/landing/card-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { Button } from "@/components/ui/button"
import { NICHOS } from "@/lib/seo/nichos"

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

const TITLE = "Modelos de carrossel para Instagram por profissão"
const DESCRIPTION =
  "Modelos de carrossel prontos pra editar, organizados por profissão: nutricionista, advogado, personal trainer, dentista e mais. Escolha a sua, edite e publique grátis."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/modelos/carrossel" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/modelos/carrossel",
    siteName: "Nexus Content",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/nexus-og.png", alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/nexus-og.png"],
  },
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
      <span className="text-primary">●</span>
      {children}
    </div>
  )
}

function ctaGeralHref() {
  const next = "/dashboard/criar?tipo=carrossel&step=2"
  return `/cadastro?next=${encodeURIComponent(next)}`
}

export default function ModelosCarrosselHubPage() {
  return (
    <main className="lp-root min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: TITLE,
            itemListElement: NICHOS.map((n, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `Carrossel para ${n.nome}`,
              url: `https://nexuscontentai.com.br/modelos/carrossel/${n.slug}`,
            })),
          }),
        }}
      />

      <section className="relative px-6 pt-28 pb-16 md:pt-36 md:pb-20 border-b border-hairline">
        <CardNav items={NAV_ITEMS} />

        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-accent bg-surface/60 backdrop-blur px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary mb-7">
            Modelos gratuitos por profissão
          </span>

          <h1 className="lp-display text-[2.3rem] md:text-[3.4rem] leading-[1.06] mb-6">
            Modelos de carrossel para{" "}
            <span className="lp-text-gradient">Instagram</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-9 leading-relaxed">
            Escolha a sua profissão abaixo e veja modelos prontos no visual certo pro seu nicho.
            Edite o texto e a arte com IA e publique sem abrir editor de design nenhum.
          </p>

          <Button
            asChild
            size="lg"
            className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-13 px-7 rounded-full text-[15px]"
          >
            <Link href={ctaGeralHref()}>
              Criar meu primeiro carrossel grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>{NICHOS.length} profissões no piloto</SectionLabel>
            <h2 className="lp-display text-3xl md:text-[2.5rem] leading-[1.1] mt-4 mb-3">
              Encontre a sua profissão
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {NICHOS.map((n) => (
              <Link
                key={n.slug}
                href={`/modelos/carrossel/${n.slug}`}
                className="lp-card group flex flex-col rounded-xl border border-hairline bg-surface p-6 transition-colors hover:border-border-accent"
              >
                <h3 className="font-semibold text-lg text-text-primary mb-1.5">
                  Carrossel para {n.nome}
                </h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary mb-3">
                  {n.keywordPrimaria}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{n.dor}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                  Ver modelos
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28 border-t border-hairline">
        <div className="max-w-4xl mx-auto">
          <div className="lp-noise relative overflow-hidden rounded-3xl border border-border-accent bg-surface border-t-2 border-t-primary p-10 md:p-16 text-center">
            <div className="lp-halo absolute inset-0 pointer-events-none" />
            <div className="relative">
              <SectionLabel>1 carrossel grátis</SectionLabel>
              <h2 className="lp-display text-3xl md:text-[2.75rem] leading-[1.08] mt-4 mb-4">
                Sua profissão não está na lista?
              </h2>
              <p className="text-lg text-text-secondary mb-9 max-w-xl mx-auto">
                A engine funciona pra qualquer nicho: descreva o seu no briefing e gere o primeiro
                carrossel completo, grátis.
              </p>
              <Button
                asChild
                size="lg"
                className="lp-cta-glow bg-primary text-white hover:bg-primary/90 h-13 px-9 rounded-full text-[15px]"
              >
                <Link href="/cadastro">
                  Começar grátis agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
