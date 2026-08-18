import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Playfair_Display, Anton } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Medicao, MedicaoNoScript } from '@/components/tracking/medicao'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const playfair = Playfair_Display({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://nexuscontentai.com.br'),
  title: {
    default: 'Nexus Content — Conteúdo pra Instagram com IA',
    template: '%s | Nexus Content',
  },
  description:
    'Crie carrosséis e posts virais para Instagram em minutos com IA. A engine aprende sua marca e entrega roteiro, design e imagem prontos pra postar — tudo em português.',
  generator: 'Nexus Content',
  applicationName: 'Nexus Content',
  keywords: [
    'nexus content',
    'syncpost',
    'carrossel instagram',
    'conteúdo com IA',
    'inteligência artificial',
    'gerador de posts',
    'social media',
    'marketing digital',
  ],
  robots: {
    index: true,
    follow: true,
  },
  // DUAS metatags, e as duas precisam continuar aqui.
  //
  // A primeira sustenta a propriedade ANTIGA (syncpost.com.br), que segue
  // verificada no Search Console e é onde mora todo o histórico de busca de
  // antes do rebrand. Remover ela perderia esse histórico.
  //
  // A segunda verifica https://nexuscontentai.com.br/, cadastrada em
  // 17/08/2026 e pendente até esta linha subir para produção. Depois do
  // deploy, volte ao Search Console e clique em Verificar.
  //
  // Google diz explicitamente para não remover a metatag depois de verificar:
  // ele revalida de tempos em tempos e a propriedade cai se ela sumir.
  verification: {
    google: [
      'fA61f3OZcsdXlM2Qg4yA4PFG3EPZqJulDFlWCTvL4kw',
      '0l7i5OUyasOh3ebVeJYZMK6oO8LT9Nqg3kfl9mkWVXc',
    ],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://nexuscontentai.com.br',
    siteName: 'Nexus Content',
    title: 'Nexus Content — Conteúdo pra Instagram com IA',
    description:
      'A IA que aprende a sua marca e entrega carrosséis e posts prontos pra postar no Instagram — roteiro, design e imagem em minutos.',
    images: [
      {
        url: '/nexus-og.png',
        alt: 'Nexus Content — Conteúdo pra Instagram com IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus Content — Conteúdo pra Instagram com IA',
    description:
      'A IA que aprende a sua marca e entrega carrosséis e posts prontos pra postar no Instagram — roteiro, design e imagem em minutos.',
    images: ['/nexus-og.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0e0e0e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${bebasNeue.variable} ${playfair.variable} ${anton.variable}`}
    >
      <head>
        {/*
          Google Fonts via <link> com nomes literais — Konva renderiza no <canvas>
          e não resolve CSS variables (next/font gera nomes internos tipo
          __Anton_abc). Sem essa duplicação, o canvas cai pro fallback.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat:wght@500;600;700&family=Playfair+Display:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        {/* Primeiro elemento do body por exigência do GTM. */}
        <MedicaoNoScript />
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Medicao />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
