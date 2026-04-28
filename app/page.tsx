import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Building2,
  Palette,
  Check,
  Play,
} from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Grid pattern background */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            InstaPost
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#recursos" className="text-muted-foreground hover:text-foreground transition">Recursos</Link>
            <Link href="#como-funciona" className="text-muted-foreground hover:text-foreground transition">Como funciona</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition">Preços</Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/onboarding">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Powered by Nano Banana 2 + Flux
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Crie carrosséis virais em
            <span className="text-primary"> 3 minutos </span>
            com IA
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A primeira IA que entende sua marca e gera carrosséis prontos para viralizar.
            Sem Photoshop. Sem Canva. Sem perder horas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
              <Link href="/onboarding">
                Começar grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link href="#demo">
                <Play className="w-4 h-4 mr-2" />
                Ver demonstração
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> 2 imagens grátis</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-6 py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Da ideia ao post viral em 3 passos</h2>
            <p className="text-lg text-muted-foreground">Sem complicação. Sem aprender ferramenta nova.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, num: "01", title: "Descreva sua marca", desc: "IA analisa seu site e aprende seu tom de voz, público e estilo visual em segundos" },
              { icon: Sparkles, num: "02", title: "Digite o tema", desc: "Em segundos, IA gera roteiro completo + imagens cinematográficas" },
              { icon: Download, num: "03", title: "Edite e exporte", desc: "Ajuste o que quiser no editor visual e exporte em Full HD pra postar" },
            ].map((step) => (
              <div key={step.num} className="rounded-2xl border border-border bg-card p-8 hover:border-primary/30 transition">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-primary text-sm font-bold tabular-nums">{step.num}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <step.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="px-6 py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Tudo que você precisa para escalar conteúdo</h2>
            <p className="text-lg text-muted-foreground">Um produto. Zero distrações.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "Imagens cinematográficas", desc: "Estética profissional gerada por Flux e Nano Banana 2, sem cara de IA" },
              { icon: Layers, title: "Editor de camadas", desc: "Ajuste texto, cores e posições com facilidade total" },
              { icon: Building2, title: "Brand kit inteligente", desc: "IA aprende sua marca uma vez e aplica em todo conteúdo" },
              { icon: Palette, title: "Templates virais", desc: "Layouts inspirados em criadores de sucesso, prontos pra usar" },
              { icon: Download, title: "Export Full HD", desc: "PNG 1080x1350 perfeito para Instagram retrato" },
              { icon: Check, title: "Sem marca dágua", desc: "Conteúdo limpo e profissional nos planos pagos" },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition">
                <feature.icon className="w-7 h-7 text-primary mb-4" />
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Pricing */}
      <section className="px-6 py-24 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Preços simples e transparentes</h2>
          <p className="text-lg text-muted-foreground mb-10">Comece grátis. Cancele quando quiser. Sem letras miúdas.</p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
            <Link href="/pricing">
              Ver todos os planos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Perguntas frequentes</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Quantos carrosséis posso criar por mês?", a: "Depende do plano. Starter inclui 50 imagens (cerca de 7 carrosséis). Pro inclui 200 (cerca de 28 carrosséis). Studio inclui 800 (cerca de 115 carrosséis). No teste grátis você tem 2 imagens." },
              { q: "Posso cancelar a qualquer momento?", a: "Sim. Cancelamento é em 1 clique no painel, sem multa, sem ligação. Você mantém acesso até o fim do período pago." },
              { q: "As imagens têm direitos comerciais?", a: "Sim. Todas as imagens geradas pelo InstaPost são suas, com direitos comerciais inclusos. Você pode usar em qualquer canal, inclusive ads pagos." },
              { q: "Funciona pra qual tipo de negócio?", a: "Criadores de conteúdo, social medias, agências, infoprodutores, e-commerces e empresas. Se você posta no Instagram, o InstaPost funciona pra você." },
              { q: "Preciso saber design pra usar?", a: "Não. A IA gera tudo pronto. Você só ajusta texto e cores se quiser. Templates são clicar e usar." },
              { q: "Como funciona o teste grátis?", a: "Você cadastra (sem cartão) e ganha 2 imagens pra testar. Depois disso, escolhe um plano pra continuar usando." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline py-5">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Pronto para criar seu primeiro carrossel viral?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Cadastre-se em 30 segundos e ganhe 2 imagens grátis
            </p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-10">
              <Link href="/onboarding">
                Começar grátis agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 InstaPost. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="/termos" className="hover:text-foreground transition">Termos</Link>
              <Link href="/privacidade" className="hover:text-foreground transition">Privacidade</Link>
              <Link href="/contato" className="hover:text-foreground transition">Contato</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
