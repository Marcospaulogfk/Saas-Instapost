import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de privacidade do SyncPost — como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD.',
  alternates: { canonical: '/privacidade' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold tracking-[-0.01em] mb-3 text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-text-secondary">{children}</div>
    </section>
  )
}

export default function PrivacidadePage() {
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
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-3">
          Política de Privacidade
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-12">
          Última atualização · Julho de 2026
        </p>

        <Section title="1. Quem somos">
          <p>
            O SyncPost é operado pela <strong className="text-foreground">WebSync</strong>, que atua como
            controladora dos dados pessoais tratados na plataforma, nos termos da Lei Geral de Proteção de
            Dados Pessoais (Lei nº 13.709/2018 — LGPD).
          </p>
          <p>
            Esta política explica quais dados coletamos, por que coletamos, com quem compartilhamos e
            quais são os seus direitos como titular.
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Coletamos apenas o necessário para prestar o serviço:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Dados de cadastro:</strong> nome, e-mail e senha
              (armazenada de forma criptografada). No login com Google, recebemos nome, e-mail e foto de
              perfil da sua conta Google.
            </li>
            <li>
              <strong className="text-foreground">Dados de marca e briefing:</strong> informações que você
              fornece sobre a sua marca — nome, site, tom de voz, público-alvo, paleta de cores, temas e
              textos de referência — usadas exclusivamente para gerar o seu conteúdo.
            </li>
            <li>
              <strong className="text-foreground">Conteúdo gerado:</strong> roteiros, textos e imagens
              criados na plataforma, armazenados para que você possa editar e exportar seus projetos.
            </li>
            <li>
              <strong className="text-foreground">Dados de uso e técnicos:</strong> registros de acesso,
              métricas de utilização e dados analíticos agregados, para segurança e melhoria do produto.
            </li>
            <li>
              <strong className="text-foreground">Dados de pagamento:</strong> processados diretamente
              pelos nossos provedores de pagamento. Não armazenamos números de cartão.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalidades e bases legais">
          <p>Tratamos seus dados para:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Criar e gerenciar sua conta e autenticação (execução de contrato);</li>
            <li>Gerar conteúdo com IA a partir do seu briefing e dados de marca (execução de contrato);</li>
            <li>Processar pagamentos e gerenciar assinaturas (execução de contrato e obrigação legal);</li>
            <li>Enviar comunicações sobre o serviço, como avisos de cobrança e mudanças relevantes (execução de contrato);</li>
            <li>Melhorar o produto e garantir a segurança da plataforma (legítimo interesse);</li>
            <li>Enviar novidades e conteúdo de marketing, quando você consentir (consentimento — revogável a qualquer momento).</li>
          </ul>
        </Section>

        <Section title="4. Compartilhamento com operadores">
          <p>
            Não vendemos seus dados. Compartilhamos dados apenas com operadores essenciais à prestação do
            serviço, que os tratam sob nossas instruções:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Supabase</strong> — hospedagem do banco de dados,
              autenticação e armazenamento de arquivos;
            </li>
            <li>
              <strong className="text-foreground">Anthropic</strong> — processamento dos briefings e dados
              de marca para geração de textos e roteiros por IA;
            </li>
            <li>
              <strong className="text-foreground">Fal.ai</strong> e provedores similares de geração de
              imagem — processamento dos prompts para criação das imagens;
            </li>
            <li>
              <strong className="text-foreground">Provedores de pagamento</strong> — processamento das
              cobranças das assinaturas;
            </li>
            <li>
              <strong className="text-foreground">Provedores de infraestrutura e analytics</strong> —
              hospedagem da aplicação e métricas de uso.
            </li>
          </ul>
          <p>
            Alguns desses operadores estão localizados fora do Brasil. Nesses casos, a transferência
            internacional ocorre com salvaguardas adequadas, conforme os artigos 33 e seguintes da LGPD.
          </p>
        </Section>

        <Section title="5. Retenção e segurança">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa ou enquanto forem necessários para as
            finalidades descritas nesta política e para cumprimento de obrigações legais. Ao excluir sua
            conta, seus dados pessoais e projetos são removidos ou anonimizados em prazo razoável, salvo
            retenção exigida por lei.
          </p>
          <p>
            Adotamos medidas técnicas e organizacionais de segurança, como criptografia em trânsito,
            controle de acesso e isolamento de dados por usuário. Nenhum sistema é 100% imune, mas
            trabalhamos continuamente para proteger suas informações.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            Utilizamos cookies estritamente necessários para autenticação e funcionamento da plataforma,
            além de cookies analíticos para entender o uso do produto de forma agregada. Você pode
            gerenciar cookies nas configurações do seu navegador; desativar os essenciais pode impedir o
            funcionamento do login.
          </p>
        </Section>

        <Section title="7. Seus direitos (LGPD)">
          <p>Como titular de dados, você pode, a qualquer momento, solicitar:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
            <li>Portabilidade dos dados a outro fornecedor;</li>
            <li>Eliminação dos dados tratados com base no seu consentimento;</li>
            <li>Informação sobre com quem compartilhamos seus dados;</li>
            <li>Revogação do consentimento, quando aplicável.</li>
          </ul>
          <p>
            Para exercer qualquer direito, escreva para{' '}
            <a href="mailto:contato@syncpost.com.br" className="text-primary hover:underline">
              contato@syncpost.com.br
            </a>
            . Responderemos dentro dos prazos previstos na LGPD. Você também pode apresentar reclamação à
            Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </Section>

        <Section title="8. Alterações desta política">
          <p>
            Esta política pode ser atualizada para refletir mudanças no serviço ou na legislação.
            Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma, sempre com a data de
            atualização indicada no topo desta página.
          </p>
        </Section>

        <Section title="9. Contato">
          <p>
            Encarregado pelo tratamento de dados (DPO): WebSync —{' '}
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
            href="/termos"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-primary transition"
          >
            Termos de Uso →
          </Link>
        </div>
      </article>
    </main>
  )
}
