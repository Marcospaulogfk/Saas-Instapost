'use client'

import dynamic from 'next/dynamic'
import type { EditorialSlide } from '@/components/templates/editorial/editorial.types'

// Konva precisa client-only — dynamic import com ssr: false.
const CapaLayout = dynamic(
  () =>
    import('@/components/templates/editorial/layouts/01-CapaLayout').then(
      (m) => m.CapaLayout,
    ),
  { ssr: false },
)
const ProblemaLayout = dynamic(
  () =>
    import('@/components/templates/editorial/layouts/02-ProblemaLayout').then(
      (m) => m.ProblemaLayout,
    ),
  { ssr: false },
)
const SepiaLayout = dynamic(
  () =>
    import('@/components/templates/editorial/layouts/07-SepiaLayout').then(
      (m) => m.SepiaLayout,
    ),
  { ssr: false },
)
const SerifLayout = dynamic(
  () =>
    import('@/components/templates/editorial/layouts/08-SerifLayout').then(
      (m) => m.SerifLayout,
    ),
  { ssr: false },
)

const brandInfo = {
  name: 'SYNCPOST',
  handle: '@SYNCPOST_',
}

const TEST_SLIDES: EditorialSlide[] = [
  {
    pageNumber: 1,
    totalPages: 4,
    layoutType: 'capa',
    title: ['5 ERROS QUE', 'MATAM SEU', 'CARROSSEL.'],
    highlightWords: ['MATAM'],
    subtitle: '→ E como evitar todos eles',
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080'],
    background: 'photo',
    titlePosition: 'bottom',
    brandInfo,
  },
  {
    pageNumber: 2,
    totalPages: 4,
    layoutType: 'problema',
    tag: 'O PROBLEMA',
    title: ['VOCÊ POSTA', 'E NINGUÉM', 'CURTE.'],
    highlightWords: ['CURTE.'],
    body: 'Não é o conteúdo. É a forma. 95% dos carrosséis falham por falta de estrutura visual.',
    bodyBoldLead: 'A boa notícia:',
    showBigNumber: true,
    background: 'dark',
    titlePosition: 'middle',
    brandInfo,
  },
  {
    pageNumber: 3,
    totalPages: 4,
    layoutType: 'sepia',
    title: [
      'AS REDES',
      'ROUBARAM O ÚNICO',
      'MOMENTO DO DIA EM',
      'QUE O CÉREBRO',
      'APRENDE.',
    ],
    highlightWords: ['ROUBARAM', 'CÉREBRO', 'APRENDE.'],
    images: ['https://images.unsplash.com/photo-1488376986648-2512dfc6f736?w=1080'],
    background: 'photo',
    titlePosition: 'bottom',
    brandInfo,
  },
  {
    pageNumber: 4,
    totalPages: 4,
    layoutType: 'serif',
    title: [
      'Quando a atenção se solta de uma tarefa,',
      'o cérebro não desliga. Ele ativa uma rede',
      'chamada Default Mode Network.',
    ],
    highlightWords: [],
    body: 'Essa rede consolida o que foi aprendido, conecta conceitos distantes e constrói memória.',
    background: 'cream',
    titlePosition: 'middle',
    brandInfo,
  },
]

export default function TestEditorialPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <h1 className="text-2xl font-bold mb-8 text-zinc-900">
        Test Editorial Layouts
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {TEST_SLIDES.map((slide, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4 text-zinc-900">
              {idx + 1}. Layout {slide.layoutType}
            </h2>
            <div className="border border-zinc-200">
              {slide.layoutType === 'capa' && <CapaLayout slide={slide} scale={0.4} />}
              {slide.layoutType === 'problema' && (
                <ProblemaLayout slide={slide} scale={0.4} />
              )}
              {slide.layoutType === 'sepia' && (
                <SepiaLayout slide={slide} scale={0.4} />
              )}
              {slide.layoutType === 'serif' && (
                <SerifLayout slide={slide} scale={0.4} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
