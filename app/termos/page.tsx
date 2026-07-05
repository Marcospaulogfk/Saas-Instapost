import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Termos de uso da plataforma SyncPost — condições de acesso, planos, conteúdo gerado por IA e responsabilidades.',
  alternates: { canonical: '/termos' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold tracking-[-0.01em] mb-3 text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-text-secondary">{children}</div>
    </section>
  )
}

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid-bg-fade fixed inset-0 -z-10 pointer-events-none" />

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-hairline">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <img src="/syncpost-horizontal-branca-trim.png" alt="SyncPost" className="h-6 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-foreground transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted mb-4">
          <span className="text-primary">●</span>
          Legal
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-3">Termos de Uso</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-12">
          Última atualização · Julho de 2026
        </p>

        <Section title="1. Objeto">
          <p>
            O SyncPost é uma plataforma de software como serviço (SaaS) operada pela <strong className="text-foreground">WebSync</strong>,
            destinada à geração de conteúdo para redes sociais — em especial carrosséis, posts e roteiros
            para Instagram — com auxílio de inteligência artificial.
          </p>
          <p>
            Ao criar uma conta ou utilizar qualquer funcionalidade do SyncPost, você declara ter lido,
            compreendido e aceitado integralmente estes Termos de Uso. Se você não concorda com qualquer
            condição aqui prevista, não utilize a plataforma.
          </p>
        </Section>

        <Section title="2. Conta e cadastro">
          <p>
            Para usar o SyncPost você precisa criar uma conta com informações verdadeiras, completas e
            atualizadas. Você é o único responsável pela guarda das suas credenciais de acesso e por toda
            atividade realizada a partir da sua conta.
          </p>
          <p>
            O cadastro é permitido a pessoas físicas maiores de 18 anos e a pessoas jurídicas devidamente
            representadas. Contas criadas com dados falsos, ou utilizadas para fins ilícitos, poderão ser
            suspensas ou encerradas sem aviso prévio.
          </p>
        </Section>

        <Section title="3. Planos, pagamento e créditos">
          <p>
            O SyncPost oferece um período de teste gratuito limitado e planos pagos com cobrança recorrente
            em reais (BRL), conforme descrito na página de planos. Os valores, limites de geração de imagens
            e recursos de cada plano podem ser atualizados a qualquer momento, sempre com comunicação prévia
            aos assinantes ativos.
          </p>
          <p>
            Os créditos de geração (imagens/mês) são renovados a cada ciclo de cobrança e não são cumulativos:
            créditos não utilizados dentro do ciclo não se transferem para o ciclo seguinte, salvo indicação
            expressa em contrário.
          </p>
          <p>
            O cancelamento pode ser feito a qualquer momento pelo painel, sem multa. Após o cancelamento,
            o acesso aos recursos pagos permanece ativo até o fim do período já pago.
          </p>
        </Section>

        <Section title="4. Conteúdo gerado por inteligência artificial">
          <p>
            Os textos, roteiros e imagens produzidos pelo SyncPost são gerados por modelos de inteligência
            artificial a partir das informações fornecidas por você (briefing, dados de marca, temas).
            Por sua natureza, o conteúdo gerado por IA pode conter imprecisões, informações desatualizadas
            ou resultados inesperados.
          </p>
          <p>
            É sua responsabilidade revisar todo conteúdo antes de publicá-lo, garantindo que ele esteja
            correto, adequado ao seu público e em conformidade com a legislação aplicável e com as políticas
            das plataformas onde será veiculado (como as diretrizes do Instagram/Meta).
          </p>
          <p>
            É vedado utilizar o SyncPost para gerar conteúdo ilegal, difamatório, discriminatório,
            enganoso, que infrinja direitos de terceiros ou que viole políticas das redes sociais.
          </p>
        </Section>

        <Section title="5. Propriedade intelectual">
          <p>
            O conteúdo gerado por você através da plataforma (textos, imagens e carrosséis exportados) é
            seu, incluindo direitos de uso comercial, na máxima extensão permitida pela legislação e pelos
            termos dos provedores de IA utilizados.
          </p>
          <p>
            A plataforma SyncPost em si — código, marca, identidade visual, templates, interfaces e demais
            elementos — é de titularidade da WebSync e protegida pela legislação de propriedade intelectual.
            É proibido copiar, reproduzir, fazer engenharia reversa ou explorar comercialmente qualquer
            parte da plataforma sem autorização expressa.
          </p>
          <p>
            Ao fornecer materiais da sua marca (logotipos, textos, referências), você declara possuir os
            direitos necessários sobre eles e autoriza seu processamento exclusivamente para a prestação
            do serviço.
          </p>
        </Section>

        <Section title="6. Disponibilidade e limitação de responsabilidade">
          <p>
            Empregamos esforços razoáveis para manter o SyncPost disponível e estável, mas o serviço é
            fornecido &quot;no estado em que se encontra&quot;, podendo sofrer interrupções para manutenção,
            atualizações ou por falhas de terceiros (provedores de infraestrutura, modelos de IA e meios
            de pagamento).
          </p>
          <p>
            Na máxima extensão permitida pela lei, a WebSync não se responsabiliza por danos indiretos,
            lucros cessantes, perda de dados ou prejuízos decorrentes do uso do conteúdo gerado, do mau uso
            da plataforma ou de indisponibilidades temporárias. Nada nestes termos exclui responsabilidades
            que não possam ser limitadas nos termos do Código de Defesa do Consumidor.
          </p>
        </Section>

        <Section title="7. Rescisão">
          <p>
            Você pode encerrar sua conta a qualquer momento pelo painel de configurações. A WebSync pode
            suspender ou encerrar contas que violem estes Termos, mediante notificação quando cabível.
            Em caso de encerramento, seus dados serão tratados conforme a nossa{' '}
            <Link href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </Section>

        <Section title="8. Alterações destes termos">
          <p>
            Estes Termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas por
            e-mail ou aviso na plataforma. O uso continuado do SyncPost após a atualização implica
            concordância com a nova versão.
          </p>
        </Section>

        <Section title="9. Lei aplicável e foro">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do
            domicílio do consumidor para dirimir controvérsias decorrentes destes Termos, conforme a
            legislação consumerista aplicável.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Dúvidas sobre estes Termos podem ser enviadas para{' '}
            <a href="mailto:contato@syncpost.com.br" className="text-primary hover:underline">
              contato@syncpost.com.br
            </a>
            .
          </p>
        </Section>

        <div className="mt-14 pt-6 border-t border-hairline flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            SyncPost · WebSync · Feito no Brasil
          </p>
          <Link
            href="/privacidade"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-primary transition"
          >
            Política de Privacidade →
          </Link>
        </div>
      </article>
    </main>
  )
}
