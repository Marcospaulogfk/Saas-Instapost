import Script from 'next/script'
import { ClarityGate } from './clarity-gate'

/**
 * MEDIÇÃO DO NEXUS CONTENT — as três camadas de coleta do site.
 *
 * Instalado em 17/08/2026, seguindo o plano de tracking do Grupo Lotus. Até
 * aqui a infraestrutura existia inteira (contêiner publicado, propriedade GA4
 * criada, projeto do Clarity aberto) e nenhuma linha estava no site, então
 * nada chegava.
 *
 * OS IDs SÃO DESTE PRODUTO E DE MAIS NENHUM. O jeito mais fácil de estragar
 * uma medição de três produtos é copiar o bloco de um site para o outro: os
 * dois passam a gravar na mesma propriedade e ninguém percebe, porque a tela
 * do GA4 continua mostrando número.
 *
 *   GTM      GTM-KLNC4RZP
 *   GA4      G-78IXY1KERZ, que entra PELO contêiner e não direto aqui
 *   Clarity  y3m83d05b9, em clarity-gate.tsx
 *
 * O GA4 NÃO É INSTALADO DIRETO, de propósito. A Tag do Google já está
 * publicada dentro do contêiner, e pôr o gtag aqui também faria cada página
 * contar duas vezes. Quem manda no GA4 é o GTM.
 *
 * ESTE ARQUIVO É DE SERVIDOR, e o Clarity mora separado num componente
 * cliente. A divisão não é organização: `beforeInteractive` só funciona em
 * componente de servidor, e o dataLayer PRECISA nascer antes de tudo. Quando
 * este bloco era cliente, o HTML servido saía sem nenhuma tag e só o noscript
 * aparecia. O Clarity é o único que exige saber a rota, então é o único que
 * paga o preço de ser cliente.
 *
 * SÓ RODA EM PRODUÇÃO, mesma regra que o Vercel Analytics já seguia neste
 * repositório. Sem isso, cada `npm run dev` sujaria a propriedade com sessão
 * de desenvolvimento, e a taxa de conversão passaria a medir o desenvolvedor.
 */

const GTM = 'GTM-KLNC4RZP'

/** O product_id que viaja em todo evento, igual ao do CRM. */
export const PRODUTO = 'syncpost'

/**
 * O endereço do CRM, para a medição própria (sem cookie, sem banner).
 *
 * Opcional de propósito: enquanto o CRM não tiver domínio público, esta
 * variável fica vazia e o script não é inserido. Apontar para localhost em
 * produção só produziria erro no console de quem visita.
 */
const CRM = process.env.NEXT_PUBLIC_CRM_URL?.replace(/\/+$/, '') ?? ''

export function Medicao() {
  if (process.env.NODE_ENV !== 'production') return null

  return (
    <>
      {/* O dataLayer nasce antes do GTM para nenhum evento disparado cedo
          demais se perder. Sem isto, um push que aconteça antes do contêiner
          carregar vira erro em vez de evento. */}
      <Script id="datalayer-init" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ product_id: '${PRODUTO}' });`}
      </Script>

      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM}');`}
      </Script>

      <ClarityGate />

      {CRM !== '' && (
        <Script src={`${CRM}/lp.js`} data-produto={PRODUTO} strategy="afterInteractive" />
      )}
    </>
  )
}

/**
 * O noscript do GTM, que precisa ser o primeiro elemento dentro do body.
 *
 * Ele existe para quem navega sem JavaScript. Não mede quase nada, e não custa
 * nada, mas o Tag Assistant reclama quando falta e a reclamação atrapalha
 * quem for depurar de verdade depois.
 */
export function MedicaoNoScript() {
  if (process.env.NODE_ENV !== 'production') return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
