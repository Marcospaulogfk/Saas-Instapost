import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronDown, Mail, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Suporte',
  description: 'Central de ajuda do SyncPost — perguntas frequentes e contato com o suporte.',
}

const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '5521994959476'

const FAQ = [
  {
    q: 'Como eu crio um post ou carrossel?',
    a: 'Clique em "Criar conteúdo" no topo do dashboard, escolha o formato (carrossel ou post único), digite o tema e a IA gera o roteiro, o design e as imagens usando os dados da sua marca ativa. Depois é só ajustar no editor e exportar.',
  },
  {
    q: 'Como funciona o carrossel gerado pela IA?',
    a: 'A engine monta um roteiro de até 8 slides — gancho, desenvolvimento e CTA, 1 ideia por slide — e aplica um dos estilos visuais disponíveis com a paleta e o tom de voz da sua marca. Cada slide pode ser editado individualmente: texto, fonte, tamanho, posição e cores.',
  },
  {
    q: 'Como funcionam os créditos e os planos?',
    a: 'Cada plano inclui uma franquia mensal de imagens geradas por IA: Starter tem 50, Pro tem 200 e Studio tem 800. Os créditos renovam a cada ciclo de cobrança e não acumulam. Você acompanha o consumo em Configurações → Plano, e pode fazer upgrade a qualquer momento na página de planos.',
  },
  {
    q: 'Como troco a marca ativa?',
    a: 'Vá em "Marcas" na barra lateral e selecione a marca que quer usar — ou use o seletor de marca no topo. Todo conteúdo novo é gerado com o tom de voz, público e identidade visual da marca ativa. No plano Pro você pode manter até 5 marcas; no Studio, marcas ilimitadas.',
  },
  {
    q: 'Como exporto meus posts?',
    a: 'Dentro do editor, clique em "Exportar". Carrosséis saem em PNG 1080×1350 (4:5, resolução nativa do Instagram), com um arquivo por slide nomeado em ordem, ou o pacote completo em ZIP. Nos planos pagos o export sai sem marca d\'água.',
  },
  {
    q: 'Como agendo ou organizo minhas publicações?',
    a: 'Use o "Calendário" na barra lateral pra planejar seus posts por data e manter a constância. O SyncPost organiza sua fila de conteúdo; a publicação no Instagram é feita por você — exporte o post pronto e publique no app ou na sua ferramenta de agendamento.',
  },
  {
    q: 'A geração de imagem falhou ou veio estranha. O que eu faço?',
    a: 'Primeiro, tente gerar novamente — variações fazem parte do processo de IA. Se a imagem vier fora do estilo, refine o tema com mais contexto (ex.: cenário, clima, objeto principal) ou revise os dados de marca em "Marcas". Falhas repetidas de geração não consomem seus créditos; se persistirem, fale com o suporte.',
  },
  {
    q: 'Como falo com o suporte?',
    a: 'O canal mais rápido é o WhatsApp, no botão abaixo — respondemos em horário comercial (seg–sex). Você também pode escrever para contato@syncpost.com.br descrevendo o problema; se puder, inclua um print da tela.',
  },
]

export default function SuportePage() {
  return (
    <div className="relative p-8 space-y-6 max-w-4xl">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div>
        <h1 className="text-h1 font-display font-bold text-text-primary">Suporte</h1>
        <p className="text-text-secondary mt-1">
          Tire suas dúvidas sobre o SyncPost ou fale direto com a gente.
        </p>
      </div>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Perguntas frequentes</h2>
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-4 cursor-pointer select-none list-none px-6 py-4 text-sm font-medium text-text-primary hover:bg-primary/5 transition [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="w-4 h-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </section>

      {/* CTA WhatsApp */}
      <section className="rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-6 flex-col sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-lg">Não achou sua resposta?</h2>
            <p className="text-sm text-text-secondary mt-1">
              Fale com a gente no WhatsApp — atendimento em horário comercial, seg–sex.
            </p>
          </div>
          <Button asChild className="bg-primary text-white hover:bg-primary/90 rounded-full px-6 shrink-0">
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Falar no WhatsApp
            </a>
          </Button>
        </div>
        <div className="pt-4 border-t border-border-subtle flex items-center gap-2 text-sm text-text-secondary">
          <Mail className="w-4 h-4 shrink-0" />
          <span>
            Prefere e-mail?{' '}
            <a href="mailto:contato@syncpost.com.br" className="text-primary hover:underline">
              contato@syncpost.com.br
            </a>
          </span>
        </div>
      </section>

      {/* Links úteis */}
      <section className="flex items-center gap-6 text-xs text-text-secondary">
        <Link href="/termos" className="hover:text-text-primary transition">
          Termos de uso
        </Link>
        <Link href="/privacidade" className="hover:text-text-primary transition">
          Política de privacidade
        </Link>
        <Link href="/pricing" className="hover:text-text-primary transition">
          Planos
        </Link>
      </section>
    </div>
  )
}
