import Link from "next/link"
import {
  ArrowRight,
  Brush,
  CalendarCheck,
  Check,
  History,
  Image as ImageIcon,
  MousePointerClick,
  Palette,
  Play,
  Sparkles,
  Type,
  Users,
  Wand2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { SiteNav } from "@/components/landing/site-nav"
import { LinkSecao } from "@/components/landing/link-secao"
import { HeroBackdrop } from "@/components/landing/hero-backdrop"
import { HeroPainel } from "@/components/landing/hero-painel"
import { Esteira, EsteiraCartoes, type ItemCartao } from "@/components/landing/esteira"
import { SliderPar, type ItemSlider } from "@/components/landing/slider-par"
import { Comeco } from "@/components/landing/comeco"
import { Urgencia } from "@/components/landing/urgencia"
import { FaqChat } from "@/components/landing/faq-chat"
import { CardLp, Marca, SectionHead, Wrap } from "@/components/landing/primitivas"
import { Reveal, RevealWords } from "@/components/landing/reveal"
import { EditorLive } from "@/components/landing/editor-live"
import { CalculadoraCusto } from "@/components/landing/calculadora-custo"
import { PricingCards } from "@/components/landing/pricing-cards"
import { PlanosBackdrop } from "@/components/landing/planos-backdrop"
import { MascoteCta } from "@/components/landing/mascote-cta"
import { SiteFooter } from "@/components/landing/site-footer"
import {
  MockEstilos,
  MockExport,
  MockImagem,
  MockMarca,
  MockRoteiro,
} from "@/components/landing/feature-showcase"
import {
  CenaBiblioteca,
  CenaCalendario,
  CenaMarcas,
  CenaPautas,
  CenaPublicacao,
} from "@/components/landing/cenas-plataforma"

/* ══════════════════════════════════════════════════════════════════════════
   LANDING DO NEXUS CONTENT
   ══════════════════════════════════════════════════════════════════════════
   A ESTRUTURA desta página é a da landing do EverReply, na mesma ordem:
   herói com painel, esteira, mecanismo em slider, faixa do diferencial,
   plataforma em slider, começo em etapas, urgência, benefícios, planos, FAQ
   em conversa, fecho e rodapé. O que NÃO se copia é a identidade: aqui o
   fundo é o preto do Nexus, o acento é o azul #1668E3 e o produto é outro.

   REGRA DE FUNDO. Escuro é a base e claro é a PONTUAÇÃO (no EverReply é o
   contrário). Duas faixas claras nunca se encostam, e o `.lp-light` é o que
   troca os tokens: qualquer utilitário que use `bg-surface` ou
   `text-foreground` vira modo claro dentro do container, sem reescrever uma
   classe.

   REGRA EDITORIAL. Nada de número que a gente não possa defender. Os preços e
   os tokens saem de `lib/tokens.ts` pelo `PricingCards`, nunca escritos na
   mão. A página não tem depoimento, não tem contagem de clientes e não tem
   resultado medido: quando houver caso real com autorização, ele entra no
   cartão da seção de urgência, com nome e negócio.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── FAQ ─────────────────────────────────────────────────────────
   Usado na seção e no JSON-LD (FAQPage), então a lista é uma só. */
const FAQ_ITEMS = [
  /* A objeção mais forte vem PRIMEIRO, e por isso é a que nasce aberta: é o
     equivalente do "e se ela não souber responder?" do EverReply. Quem chega
     desconfiado de IA quer saber o que acontece quando o resultado não presta
     antes de querer saber quantos carrosséis cabem no plano. */
  {
    q: "E se o carrossel sair ruim?",
    a: "Ele não sai como sentença. Tudo que a IA montou continua editável dentro da plataforma: você reescreve o título, troca a cor, a foto e a posição de cada bloco, e editar nunca gasta token. Se preferir outra versão do zero, é só gerar de novo, e a tela mostra quantos tokens a nova geração vai custar antes de você confirmar. No teste grátis você julga isso com a sua marca, sem cartão.",
  },
  {
    q: "Quantos carrosséis posso criar por mês?",
    a: "Depende do plano e de quantas imagens de IA você usa. Com imagem em todos os slides: Starter faz cerca de 7, Pro cerca de 25 e Studio cerca de 75 por mês. Só com a capa, que é o mais comum, o Pro faz cerca de 35. Editar o que foi gerado nunca custa token.",
  },
  {
    q: "Preciso saber design pra usar?",
    a: "Não. A IA monta o roteiro e o design prontos. Você só ajusta texto e cor se quiser, e os templates são clicar e usar.",
  },
  {
    q: "As imagens têm direitos comerciais?",
    a: "Sim. Tudo que o Nexus Content gera é seu, com direitos comerciais inclusos. Pode usar em qualquer canal, inclusive em anúncios pagos.",
  },
  {
    q: "Funciona pra qual tipo de negócio?",
    a: "Criadores, social medias, agências, infoprodutores, e-commerces e pequenas empresas. Se você posta carrossel no Instagram, o Nexus Content funciona pra você.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Cancelamento em 1 clique no painel, sem multa e sem ligação. Você mantém o acesso até o fim do período pago.",
  },
  {
    q: "Como funciona o teste grátis?",
    a: "Você cria a conta sem cartão e testa o Nexus Content com a sua própria marca, antes de pagar qualquer coisa. Se gostar do resultado, é só escolher um plano pra continuar.",
  },
]

/* Dados estruturados (schema.org). Os preços aqui são os mesmos do
   `PricingCards`; se um mudar, o outro muda junto. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Nexus Content",
      url: "https://nexuscontentai.com.br",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description:
        "Plataforma de geração de conteúdo para Instagram com IA. Aprende sua marca e entrega carrosséis prontos pra postar: roteiro, design e imagem em minutos.",
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

/* ── Mecanismo (#recursos) ───────────────────────────────────────
   As cenas são os mocks do `feature-showcase`, que são a tela real do
   produto peça por peça. Cada passo é uma etapa do que acontece depois que
   você digita a pauta. */
const MECANISMO: ItemSlider[] = [
  {
    n: "01",
    titulo: "Ele lê a sua marca antes de escrever a primeira linha",
    texto:
      "Você manda o link do site e a engine tira dali o tom de voz, o público, a promessa e a paleta. É por isso que o resultado não sai com aquela cara de post de IA: ele já nasce sabendo o que a sua marca fala e o que ela nunca diria.",
    cena: MockMarca,
  },
  {
    n: "02",
    titulo: "O roteiro sai com gancho, virada e chamada",
    texto:
      "Não é um texto solto cortado em pedaços. Cada slide tem função na sequência, do gancho que segura o primeiro segundo até a chamada do último, e você lê tudo antes de qualquer imagem ser gerada.",
    cena: MockRoteiro,
  },
  {
    n: "03",
    titulo: "A imagem nasce no território visual da marca",
    texto:
      "A engine monta o prompt a partir da ficha da marca, com espaço negativo no lugar certo pro título caber. Você decide se quer imagem só na capa ou em todos os slides, e o preview mostra o custo em token antes de gerar.",
    cena: MockImagem,
  },
  {
    n: "04",
    titulo: "Oito territórios visuais, nenhum template de banco",
    texto:
      "Do dark vibrante ao minimal suíço, os estilos são os mesmos que aparecem no seletor do editor. Você troca de território e o carrossel inteiro se rediagrama, sem refazer o roteiro nem gastar token de novo.",
    cena: MockEstilos,
  },
  {
    n: "05",
    titulo: "Sai em Full HD, nomeado na ordem dos slides",
    texto:
      "PNG em 1080x1350, um arquivo por slide, na ordem certa, ou o ZIP do carrossel completo. Sem aquela meia hora renomeando arquivo antes de subir.",
    cena: MockExport,
  },
]

/* ── Plataforma (#plataforma) ────────────────────────────────────
   O mesmo molde do mecanismo, cenas diferentes: aqui não é o que a engine
   faz com uma pauta, é onde tudo isso fica depois de pronto. */
const PLATAFORMA: ItemSlider[] = [
  {
    n: "01",
    titulo: "A semana inteira decidida numa sentada",
    texto:
      "O calendário editorial mostra o mês do jeito que ele vai sair no feed. Você preenche os dias vazios, arrasta o que mudou de lugar e para de descobrir na quarta que não tem post pra quinta.",
    cena: CenaCalendario,
  },
  {
    n: "02",
    titulo: "Do calendário direto pro Instagram",
    texto:
      "A conta conectada uma vez, e a peça aprovada sai na hora marcada. Sem baixar ZIP, sem mandar arquivo pro celular e sem depender de você lembrar de postar no meio do expediente.",
    cena: CenaPublicacao,
  },
  {
    n: "03",
    titulo: "Várias marcas sem misturar nenhuma",
    texto:
      "Cada marca tem a própria ficha, paleta e lista do que não pode aparecer. Trocar de marca troca o contexto inteiro num clique, que é o que faz isso servir pra quem atende cliente e não só pro próprio perfil.",
    cena: CenaMarcas,
  },
  {
    n: "04",
    titulo: "Tudo que você gerou fica salvo e reeditável",
    texto:
      "A biblioteca guarda carrossel, post único e rascunho. Peça de três meses atrás abre no editor do jeito que estava, então material antigo vira base do próximo em vez de virar arquivo perdido no computador.",
    cena: CenaBiblioteca,
  },
  {
    n: "05",
    titulo: "Quando faltar assunto, a pauta vem sugerida",
    texto:
      "A plataforma propõe temas a partir da sua marca e do que já foi publicado. Você escolhe um e ele já entra na geração, então o branco na frente da tela deixa de ser o gargalo da semana.",
    cena: CenaPautas,
  },
]

/* ── Esteira do diferencial ──────────────────────────────────────
   Cada cartão é uma coisa que o editor faz por dentro. Nota de uma linha, e
   ela diz o que aquilo resolve pra você, não o nome do recurso. */
const RECURSOS_EDITOR: ItemCartao[] = [
  { icone: MousePointerClick, nome: "Clica e muda", nota: "Seleciona o bloco e edita na hora" },
  { icone: Type, nome: "Reescrever com IA", nota: "Só o trecho que você marcou" },
  { icone: Palette, nome: "Cor da marca", nota: "Troca em todos os slides de uma vez" },
  { icone: ImageIcon, nome: "Trocar a imagem", nota: "Sobe a sua foto ou gera outra" },
  { icone: History, nome: "Histórico", nota: "Volta pra versão anterior sem medo" },
  { icone: Sparkles, nome: "Editar é grátis", nota: "Token só sai na geração" },
]

/* ── Benefícios ──────────────────────────────────────────────────
   Cada item termina na CONSEQUÊNCIA pra você, não na característica do
   software. Nenhum deles promete número. */
const BENEFICIOS = [
  {
    icone: CalendarCheck,
    titulo: "Você volta a postar todo dia",
    texto:
      "A semana de conteúdo sai numa sentada, e o feed para de ter aquele buraco de três semanas que aparece justamente quando alguém vai no seu perfil decidir se compra.",
  },
  {
    icone: Brush,
    titulo: "Sai com a cara da sua marca",
    texto:
      "A engine trabalha com a ficha que você configurou: tom, paleta, público e o que nunca pode ser dito. É o oposto do post genérico com a sua logo colada no canto.",
  },
  /* O 3º e o 4º foram reescritos na revisão contra o EverReply: o 3º era
     OBJEÇÃO ("você não precisa saber design"), não consequência, e o 4º
     repetia palavra por palavra o título da faixa do diferencial. */
  {
    icone: Wand2,
    titulo: "Seu perfil para de parecer amador",
    texto:
      "Os slides saem diagramados, com hierarquia, respiro e a paleta certa. Quem chega no perfil encontra uma marca que se leva a sério, e você não abriu o Canva pra isso.",
  },
  {
    icone: Users,
    titulo: "Você atende mais clientes com o mesmo time",
    texto:
      "Cada marca tem a própria ficha, e trocar de uma pra outra é um clique. Quem faz social media pra vários negócios entrega a semana de todos sem contratar mais gente pra montar arte.",
  },
]

/* Canal humano do cartão Agência. É o MESMO número do suporte do painel
   (app/dashboard/suporte), pela mesma variável: se o número mudar, muda nos
   dois lugares. O cartão promete "a gente monta o pacote junto com você", e
   essa promessa só se cumpre com uma pessoa do outro lado, não com o
   formulário de cadastro. */
const WHATSAPP_SUPORTE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "5521994959476"
const LINK_AGENCIA = `https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(
  "Oi! Quero falar sobre o plano Agência do Nexus Content.",
)}`

/* O `overflow-x-clip` do <main> logo abaixo é `clip` e NÃO `hidden`, e a troca
   conserta bug real: com `hidden` no eixo X o navegador PROMOVE o overflow-y de
   `visible` pra `auto` (os dois eixos não podem discordar assim). O <main>
   virava container de rolagem, e aí clicar em "Planos" ou "FAQ" no menu mudava
   a URL e a página não mexia: o navegador rolava o <main>, que não rola
   (scrollHeight igual ao clientHeight), em vez de rolar o documento. O `clip`
   corta igual e não cria container de rolagem, então a âncora volta a
   funcionar no desktop e no celular. */
export default function HomePage() {
  return (
    <main id="top" className="lp-root min-h-screen overflow-x-clip bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <SiteNav />

      {/* ───────────────────────── HERÓI ─────────────────────────
          CENTRALIZADO, no molde do herói do EverReply. Era um split com o
          texto à esquerda e a parede de peças à direita; o visual passou a ser
          o PAINEL inteiro da plataforma, e painel não cabe em meia largura.
          Então o texto sobe pro centro, o produto ocupa a largura toda embaixo
          e o celular sobreposto é o que impede a página de virar "mais um
          dashboard" e lembra que o destino disso é o Instagram.

          COMO AS CAMADAS SE EMPILHAM (de trás pra frente): o preto do
          `.lp-root`, o canvas do shader em `-z-10`, o véu de legibilidade e o
          conteúdo. O `isolate` cria o contexto de empilhamento: sem ele o
          `-z-10` escaparia da seção e passaria por baixo do <main>.

          O `pt` grande é o cabeçalho fixo mais a faixa de anúncio que ele
          carrega: a pílula flutua, então quem reserva o espaço dela é a seção. */}
      <section
        id="heroi"
        className="lp-noise isolate relative overflow-hidden px-6 pt-32 md:pt-40"
      >
        <div aria-hidden className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="lp-veil-mask relative h-[115%] w-[min(1500px,120%)]">
            <HeroBackdrop />
          </div>
          {/* Véu: o chapado assenta o contraste do título sobre as cristas
              claras do shader, e o degradê de rodapé apaga o shader ANTES da
              esteira, pra ela assentar em preto liso e não em imagem. */}
          <div className="pointer-events-none absolute inset-0 bg-background/40" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-background" />
        </div>

        <Wrap>
          <div className="mx-auto max-w-5xl text-center">
            <Reveal>
              <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-border-accent bg-surface/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="lp-ring-pulse absolute inline-flex h-full w-full rounded-full bg-primary" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Engine de conteúdo · Nano Banana 2 + Flux
              </span>
            </Reveal>

            {/* O título ataca a dor na moeda de quem lê (o conteúdo que não
                sai) e entrega o resultado no mesmo fôlego. O subtítulo carrega
                as três objeções de uma vez: "vai sair genérico" (aprende a
                marca), "não sei design" (design pronto) e "vou ficar preso ao
                que a IA fez" (editor por dentro). */}
            {/* UMA FRASE SÓ, sem <br> forçado (revisão contra o EverReply). O <br>
                com `max-w-4xl` quebrava o título em quatro linhas no desktop,
                com "seu lugar" órfão na última, e no celular virava sete linhas
                a 37,6px. Agora a caixa é `max-w-5xl`, o `text-balance` reparte
                as linhas por igual e o celular usa 1.85rem, o mesmo corpo do
                título do EverReply. */}
            <h1 className="lp-display text-balance text-[1.85rem] leading-[1.1] sm:text-[3.2rem] md:text-[3.8rem]">
              <RevealWords
                text="O software que escreve, desenha e publica o Instagram da sua marca no seu lugar"
                highlight={[3, 4, 5, 6]}
              />
              <span
                className="lp-caret ml-2 inline-block h-[0.8em] w-[0.45em] bg-primary align-[-0.02em]"
                aria-hidden
              />
            </h1>

            <Reveal delay={0.3}>
              <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-text-secondary md:text-[18px]">
                Digite a pauta e o Nexus Content devolve o carrossel completo: roteiro, design e
                imagem no território visual da sua marca. Depois você ajusta o que quiser dentro da
                plataforma, sem Canva, sem designer e sem passar o domingo montando post.
              </p>
            </Reveal>

            <Reveal delay={0.42}>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="lp-cta-glow h-[52px] rounded-full bg-primary px-7 text-[15px] text-white hover:bg-primary/90"
                >
                  <Link href="/cadastro">
                    Começar teste grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-[52px] rounded-full border-hairline-strong px-7 text-[15px]"
                >
                  <LinkSecao href="#recursos">
                    <Play className="mr-2 h-4 w-4" />
                    Ver como funciona
                  </LinkSecao>
                </Button>
              </div>

              <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                Teste grátis · Sem cartão · Cancela em 1 clique
              </p>
            </Reveal>
          </div>

          {/* O painel NÃO entra em <Reveal>: é o LCP da página. Quem se move
              aqui é o conteúdo de dentro, a coluna de peças rolando.
              O halo azul atrás existe porque, sem nada em volta, a janela
              ficava recortada com tesoura em cima do fundo: ele não desenha
              borda, só faz o preto ao redor ser um pouco menos preto. */}
          <div className="relative mt-14 md:mt-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-10 h-[75%] bg-[radial-gradient(58%_58%_at_50%_42%,rgba(22,104,227,0.24),transparent_72%)] blur-2xl"
            />
            <HeroPainel />
          </div>
        </Wrap>

        {/* ESTEIRA. FORA do <Wrap> de propósito: a faixa vai de ponta a ponta
            da tela. É a única coisa da página que não respeita a coluna de
            1160px, e é o que faz ela ler como esteira e não como mais um
            cartão. Os dois fios delimitam a faixa, e o corte pro mecanismo é
            seco: a faixa termina numa linha reta e o bloco claro começa na
            linha seguinte. */}
        <Reveal className="mt-16 md:mt-24">
          <div className="border-y border-hairline">
            <Esteira />
          </div>
        </Reveal>
      </section>

      {/* ───────────────────────── MECANISMO ─────────────────────────
          SEGUNDA SEÇÃO DA PÁGINA, colada no herói: ali a pessoa viu o painel,
          aqui vê o que acontece por baixo quando ela digita uma pauta. É a
          seção que separa este produto de um gerador de texto com template, e
          mecanismo escondido no meio da página não separa nada.
          Ela carrega a âncora `#recursos` do menu e do rodapé. */}
      <section id="recursos" className="lp-light scroll-mt-24 px-6 py-20 md:py-28">
        <Wrap>
          <SectionHead
            eyebrow="Por dentro do Nexus"
            title={
              <>
                Uma pauta entra. Um carrossel pronto{" "}
                <span className="lp-text-gradient">pra postar sai.</span>
              </>
            }
            sub="Cinco etapas que rodam numa geração só. Você lê o roteiro, escolhe onde entra imagem de IA e recebe os slides diagramados."
          />
          <Reveal from="scale" className="mt-12 md:mt-16" delay={0.12}>
            <SliderPar itens={MECANISMO} />
          </Reveal>
        </Wrap>
      </section>

      {/* ───────────────────────── O DIFERENCIAL ─────────────────────────
          FAIXA ESCURA entre dois blocos claros, e é a pontuação do ritmo da
          página. Aqui a página para de contar e MOSTRA: a mesma tela do
          produto rodando o fluxo inteiro (pauta, geração, editor) e, no fim,
          alguém editando. O diferencial é esse fim, e ele não pode esperar a
          metade da landing pra aparecer.
          RODAPÉ DA FAIXA: a esteira de cartões do editor. Ela fecha esta faixa
          do mesmo jeito que a esteira de pílulas fecha o herói. */}
      <section id="prova" className="scroll-mt-24 border-y border-hairline py-20 md:py-28">
        <Wrap>
          <SectionHead
            eyebrow="O que só a gente faz"
            title={
              <>
                A IA monta o carrossel inteiro.{" "}
                <Marca>E você continua mandando em cada pixel.</Marca>
              </>
            }
            sub="Todo gerador entrega um arquivo e te larga. O que ninguém entrega é o que vem depois: título, cor, foto e posição de cada bloco continuam editáveis dentro da plataforma, no mesmo lugar onde foram gerados."
          />

          <Reveal delay={0.12} className="mt-12">
            <EditorLive />
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-3">
              {[
                { n: "Fluxo inteiro", l: "Pauta, roteiro, design e imagem" },
                { n: "Editor por dentro", l: "Clica no elemento e muda na hora" },
                { n: "Editar é grátis", l: "Token só sai na geração" },
              ].map((s) => (
                <div key={s.n} className="bg-surface p-5">
                  <div className="font-mono text-[15px] font-medium">{s.n}</div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </Wrap>

        <Reveal className="mt-14 border-t border-hairline pt-8">
          <EsteiraCartoes itens={RECURSOS_EDITOR} />
        </Reveal>
      </section>

      {/* ───────────────────────── PLATAFORMA ─────────────────────────
          Colada no diferencial: ali a pessoa vê o que a engine FAZ, aqui vê
          onde isso tudo fica. É o argumento de consolidação, o que exigiria
          quatro assinaturas numa só. */}
      <section id="plataforma" className="lp-light scroll-mt-24 px-6 py-20 md:py-28">
        <Wrap>
          <SectionHead
            eyebrow="A plataforma"
            title="A sua operação de conteúdo inteira em um lugar"
            sub="Pauta, geração, editor, calendário editorial, biblioteca e publicação no Instagram. O que exigiria quatro ferramentas e um drive compartilhado, você tem numa assinatura."
          />
          <Reveal from="scale" className="mt-12 md:mt-16" delay={0.12}>
            <SliderPar itens={PLATAFORMA} />
          </Reveal>
        </Wrap>
      </section>

      {/* ───────────────────────── COMEÇO ─────────────────────────
          As três etapas de como o conteúdo entra no ar. Colada na Plataforma
          de propósito: a Plataforma mostra o tamanho do produto e levanta na
          hora a objeção "isso deve dar um trabalho danado pra configurar", e
          esta responde. É a única seção sem título próprio, pelo mesmo motivo
          da referência: ela lê como continuação da de cima. */}
      <Comeco id="comeco" className="scroll-mt-24 border-b border-hairline" />

      {/* ───────────────────────── URGÊNCIA ─────────────────────────
          Faixa clara com o cartão de peso por dentro. Ela vem depois do
          "como começa" porque só faz sentido apressar quem já entendeu o que
          está sendo oferecido. */}
      <Urgencia id="urgencia" className="lp-light scroll-mt-24 px-6" />

      {/* ───────────────────────── BENEFÍCIOS ───────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <Wrap>
          <SectionHead
            eyebrow="O que muda no seu dia"
            title={
              <>
                Quantos clientes decidem não te seguir{" "}
                <Marca>porque o seu feed parou?</Marca>
              </>
            }
            sub="Você deixa de ser o gargalo da produção de conteúdo e passa a cuidar do que precisa mesmo de gente: a pauta, a oferta e a conversa com quem chegou."
          />
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
            {BENEFICIOS.map((b, i) => (
              <Reveal key={b.titulo} delay={i * 0.08} className="h-full">
                <CardLp className="lp-card h-full p-6 shadow-card md:p-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900/40 text-primary">
                    <b.icone className="h-[19px] w-[19px]" strokeWidth={1.8} />
                  </span>
                  <h3 className="lp-display mt-4 text-[1.3rem] leading-tight">{b.titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{b.texto}</p>
                </CardLp>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ───────────────────────── PLANOS ─────────────────────────
          Os preços e a conta de tokens vêm de `lib/tokens.ts` pelo
          `PricingCards`. Nada de número escrito na mão aqui: a landing
          prometendo o que o produto não entrega já foi bug real quando a
          tabela de tokens mudou. */}
      <section
        id="planos"
        className="isolate relative scroll-mt-24 overflow-hidden border-y border-hairline px-6 py-20 md:py-28"
      >
        <PlanosBackdrop />
        <div className="relative">
          <Wrap>
            <SectionHead
              eyebrow="Planos"
              title="Comece grátis. Suba quando crescer."
              sub="Teste grátis, sem cartão. Sem fidelidade e cobrança em BRL."
            />
            <Reveal className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
              <span>Garantia de 7 dias</span>
              <span aria-hidden>·</span>
              <span>Cancele quando quiser</span>
              <span aria-hidden>·</span>
              <span>Cobrança em BRL</span>
            </Reveal>

            <div className="mt-14">
              <PricingCards />
            </div>

            {/* AGÊNCIA: um cartão de largura inteira, sem preço, no lugar do
                Enterprise da referência. Quem precisa de volume fora da
                tabela, marca ilimitada e API fala com uma pessoa. */}
            <Reveal from="scale" className="mt-6">
              <div className="flex flex-col gap-6 rounded-2xl border border-border-accent bg-surface p-6 shadow-card md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <span className="lp-display text-[1.4rem] leading-tight">Agência</span>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-text-secondary">
                    Volume fora da tabela, marcas ilimitadas, usuários da sua equipe e API pra
                    plugar no seu fluxo. A gente monta o pacote junto com você.
                  </p>
                </div>
                <a
                  href={LINK_AGENCIA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-cta-glow inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Falar com a gente no WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.15} className="mt-6 text-center">
              <Link
                href="/pricing"
                className="inline-flex min-h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary transition hover:text-primary"
              >
                Ver comparação completa <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Reveal>
          </Wrap>
        </div>
      </section>

      {/* ───────────────────────── FAÇA AS CONTAS ─────────────────────────
          Depois dos planos, e não antes: a comparação com o custo de fazer na
          mão só convence quem já viu o preço. Bloco claro, que é a pontuação
          entre a faixa dos planos e o FAQ. */}
      <section className="lp-light px-6 py-20 md:py-28">
        <Wrap>
          <SectionHead
            eyebrow="Faça as contas"
            title="Quanto você pagaria separado por tudo isso?"
            sub="Monte o seu mês e compare: agência, freelancer com IAs avulsas ou tudo num lugar só."
          />
          <Reveal className="mt-12">
            <CalculadoraCusto />
          </Reveal>
          {/* FORA do <Reveal> (pendência da revisão): é um botão pequeno logo
              acima do FAQ, e num pulo de rolagem era sempre ele que ficava na
              borda da tela, apagado atrás da pílula fixa até a pessoa rolar. */}
          <div className="mt-8 text-center">
            <Button
              asChild
              size="lg"
              className="lp-cta-glow h-12 rounded-full bg-primary px-8 text-white hover:bg-primary/90"
            >
              <LinkSecao href="#planos">
                Ver planos
                <ArrowRight className="ml-2 h-4 w-4" />
              </LinkSecao>
            </Button>
          </div>
        </Wrap>
      </section>

      {/* ───────────────────────── FAQ ─────────────────────────
          Em forma de conversa: pergunta em balão à esquerda, resposta em balão
          da marca à direita. É o produto explicando o produto no formato em
          que ele trabalha (a DM do Instagram). O cartão da esquerda é a saída
          pra quem tem uma dúvida que não está na lista. */}
      <section id="faq" className="scroll-mt-24 px-6 py-20 md:py-28">
        <Wrap>
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <Reveal from="left">
              <div className="lp-gradient-live relative h-full overflow-hidden rounded-3xl p-8 text-white shadow-[0_18px_50px_-24px_rgba(11,27,51,0.8)] md:p-9">
                {/* véu escuro: mantém o texto legível por cima dos blobs em
                    movimento */}
                <div className="pointer-events-none absolute inset-0 bg-[#06122A]/25" />
                <div className="relative flex h-full flex-col">
                  <span className="self-start rounded-full bg-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    Teste grátis
                  </span>

                  <h2 className="lp-display mt-6 text-[2rem] leading-[1.08] md:text-[2.4rem]">
                    Ficou uma dúvida
                    <br />
                    que não está aqui?
                  </h2>

                  <p className="mt-4 text-[15px] leading-relaxed text-white/85">
                    A resposta mais rápida é ver funcionando. Cria a conta, digita um tema e julga o
                    resultado com a sua marca, não com a demo de outra pessoa.
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/20 bg-white/20">
                    {[
                      { n: "Teste grátis", l: "Sem cartão" },
                      { n: "1 clique", l: "Pra cancelar" },
                    ].map((s) => (
                      <div key={s.l} className="bg-[#06122A]/35 p-4 backdrop-blur-sm">
                        <div className="lp-display text-xl tabular-nums">{s.n}</div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/75">
                          {s.l}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="mt-8 h-11 w-fit rounded-full bg-[#0B0B0F] px-6 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#0B0B0F]/90"
                  >
                    <Link href="/cadastro">
                      Criar conta grátis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal from="right" delay={0.12}>
              <FaqChat items={FAQ_ITEMS} />
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ───────────────────────── FECHO ─────────────────────────
          Cartão de peso dentro da seção, e não a seção inteira pintada: assim
          o fecho ganha corpo sem colar um bloco diferente no rodapé. */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-4xl">
          <Reveal from="scale">
            <div className="lp-noise relative overflow-hidden rounded-3xl border border-border-accent border-t-2 border-t-primary bg-surface p-10 text-center md:p-16">
              <div className="lp-halo pointer-events-none absolute inset-0" />
              <div className="relative">
                <h2 className="lp-display text-[2rem] leading-[1.08] md:text-[3rem]">
                  Comece a publicar com{" "}
                  <span className="lp-text-gradient">constância de verdade</span>
                </h2>
                <p className="mx-auto mt-4 mb-9 max-w-xl text-[17px] leading-relaxed text-text-secondary">
                  Conta a sua marca, digita o tema e vê o carrossel pronto em minutos. O
                  teste é grátis e sem cartão, pra você julgar o resultado com a sua marca na
                  tela, não com a demo de outra pessoa.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="lp-cta-glow h-[52px] rounded-full bg-primary px-9 text-[15px] text-white hover:bg-primary/90"
                  >
                    <Link href="/cadastro">
                      Começar grátis agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-[52px] rounded-full border-hairline-strong px-7 text-[15px]"
                  >
                    <LinkSecao href="#planos">Ver os planos</LinkSecao>
                  </Button>
                </div>
                <p className="mt-6 flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  Acesso imediato · Conteúdo pronto em minutos
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <MascoteCta />

      <SiteFooter />
    </main>
  )
}
