'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * CLARITY, LIGADO SÓ ONDE PODE GRAVAR.
 *
 * Componente separado do resto da medição por um motivo só: ele precisa saber
 * em qual rota está, e saber a rota exige componente cliente. O GTM não
 * precisa disso e por isso continua no servidor, onde a tag entra já no HTML.
 *
 * A LISTA ABAIXO É DE PERMISSÃO E NÃO DE BLOQUEIO, e essa é a decisão que
 * importa aqui. Uma lista de bloqueio ("não grave /dashboard") deixa qualquer
 * rota nova nascer sendo gravada, e a rota nova é justamente a que ninguém
 * revisou. Com lista de permissão, rota nova nasce fora da gravação e alguém
 * precisa decidir incluí-la: o erro cai para o lado seguro.
 *
 * O que fica de fora: /dashboard, /dashboard-v2, /editor e /onboarding, onde a
 * tela mostra a marca, o conteúdo e as imagens do cliente.
 */

const CLARITY = 'y3m83d05b9'

const ROTAS_PUBLICAS = [
  '/',
  '/pricing',
  '/privacidade',
  '/termos',
  '/login',
  '/cadastro',
  '/recuperar-senha',
]

function ehPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some(base =>
    base === '/' ? caminho === '/' : caminho === base || caminho.startsWith(`${base}/`),
  )
}

export function ClarityGate() {
  const pathname = usePathname()
  const publica = ehPublica(pathname ?? '/')

  /**
   * Desliga o Clarity ao entrar em rota privada, e religa ao voltar.
   *
   * Sem isto o controle vazaria: numa navegação de página única, sair da
   * landing para o painel NÃO descarrega o Clarity já iniciado, então ele
   * continuaria gravando a tela do cliente mesmo com este componente
   * desmontado. Parar de renderizar não é o mesmo que parar de gravar.
   */
  useEffect(() => {
    const clarity = (window as unknown as { clarity?: (acao: string) => void }).clarity
    if (typeof clarity !== 'function') return
    clarity(publica ? 'start' : 'stop')
  }, [publica])

  if (process.env.NODE_ENV !== 'production' || !publica) return null

  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY}");`}
    </Script>
  )
}
