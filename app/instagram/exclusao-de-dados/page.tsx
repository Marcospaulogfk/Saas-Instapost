import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Exclusão de dados do Instagram',
  description:
    'Como pedir a exclusão dos dados da sua conta do Instagram armazenados pelo SyncPost, e status do pedido.',
  alternates: { canonical: '/instagram/exclusao-de-dados' },
}

/**
 * Página pública exigida pela Meta (URL de instruções de exclusão de dados).
 * Também é o destino da `url` devolvida pelo callback /api/instagram/data-deletion:
 * chega com ?codigo=XXXX e confirma que a exclusão já aconteceu.
 */
export default async function ExclusaoDadosPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>
}) {
  const { codigo } = await searchParams

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid-bg-fade fixed inset-0 -z-10 pointer-events-none" />

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-hairline">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <img src="/syncpost-horizontal-branca-trim.png" alt="SyncPost" className="h-6 w-auto" />
          </Link>
          <Link
            href="/privacidade"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary hover:text-foreground transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Privacidade
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted mb-4">
          <span className="text-primary">●</span>
          Legal
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-3">
          Exclusão de dados do Instagram
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted mb-12">
          Última atualização · Agosto de 2026
        </p>

        {codigo && (
          <div className="mb-10 rounded-xl border border-hairline bg-background/60 p-5 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-[15px] leading-relaxed text-text-secondary">
              <p className="text-foreground font-medium">Pedido concluído.</p>
              <p>
                Código de confirmação: <code className="text-foreground">{codigo}</code>. O token de
                acesso e os dados de conexão da sua conta do Instagram foram apagados no momento do
                pedido. Não há fila nem prazo: a exclusão é imediata.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-8 text-[15px] leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold tracking-[-0.01em] mb-3 text-foreground">
              O que guardamos da sua conta do Instagram
            </h2>
            <p>
              Quando você conecta uma conta profissional do Instagram ao SyncPost, guardamos apenas o
              identificador da conta, o nome de usuário, um token de acesso emitido pela Meta e os
              identificadores das publicações feitas pelo SyncPost. Não guardamos senha, mensagens,
              seguidores nem conteúdo do seu feed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-[-0.01em] mb-3 text-foreground">
              Como pedir a exclusão
            </h2>
            <p>Qualquer uma das três opções apaga os mesmos dados, na hora:</p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-foreground">Dentro do SyncPost:</strong> abra a tela de
                publicação ou a página de métricas e clique em <em>Desconectar</em>.
              </li>
              <li>
                <strong className="text-foreground">Pelo Instagram:</strong> em{' '}
                <em>Configurações → Apps e sites</em>, remova o SyncPost. A Meta nos avisa e apagamos os
                dados automaticamente.
              </li>
              <li>
                <strong className="text-foreground">Por e-mail:</strong> escreva para{' '}
                <a href="mailto:contato@nexuscontentai.com.br" className="text-primary hover:underline">
                  contato@nexuscontentai.com.br
                </a>{' '}
                com o nome de usuário do Instagram. Respondemos em até 5 dias úteis.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-[-0.01em] mb-3 text-foreground">
              E a minha conta SyncPost?
            </h2>
            <p>
              A exclusão acima remove só os dados do Instagram. A sua conta SyncPost e o conteúdo criado
              nela continuam. Para apagar a conta inteira, use <em>Configurações</em> dentro do app ou
              peça pelo mesmo e-mail.
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
