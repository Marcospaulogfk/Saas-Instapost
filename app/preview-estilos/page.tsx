"use client"

/**
 * Página DEV — preview visual dos estilos de carrossel com dados mockados.
 * Não linkada na navegação; usada pra validar novos estilos sem gerar nada.
 */

import { Inter } from "next/font/google"
import {
  SlidePreview,
  type PreviewSlide,
  type EditorialStyle,
} from "@/components/carousel/slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/500`

function mockSlide(i: number, total: number): PreviewSlide {
  const titles = [
    "5 erros que matam seu carrossel",
    "Você posta e ninguém vê",
    "O gancho decide tudo",
    "Design não é enfeite",
    "Constância vence talento",
    "Comece hoje, ajuste depois",
  ]
  return {
    order_index: i,
    title: titles[i % titles.length],
    highlight_words: i === 0 ? ["matam"] : i === 2 ? ["gancho"] : ["Constância"],
    subtitle: "E como evitar cada um deles na prática",
    body:
      i === 0
        ? undefined
        : i === 3
          ? "Defina o gancho antes de tudo\nUse no máximo 20 palavras por slide\nFeche com CTA de salvar\nPoste no horário do seu público"
          : "O algoritmo premia quem prende atenção nos 3 primeiros segundos. Um bom gancho segura o dedo do usuário e faz ele arrastar pro próximo slide.",
    cta_badge: i === total - 1 ? "Salve este post" : "Conteúdo",
    image: {
      url: IMG(`syncpost-${i}`),
      source: "ai",
      attribution: null,
      error: null,
    },
  }
}

const STYLES: { style: EditorialStyle; name: string }[] = [
  { style: "gradient", name: "Gradiente (dark/vibrante)" },
  { style: "minimal", name: "Minimal (branco/clean)" },
  { style: "seamless", name: "Seamless (panorâmico)" },
  { style: "notes", name: "Notes (nativo/orgânico)" },
]

const TOTAL = 5

export default function PreviewEstilosPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 space-y-12">
      <h1 className="text-2xl font-bold">Preview de estilos (dev)</h1>
      {STYLES.map(({ style, name }) => (
        <section key={style}>
          <h2 className="text-lg font-semibold mb-4">{name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i}>
                <SlidePreview
                  slide={mockSlide(i, TOTAL)}
                  totalSlides={TOTAL}
                  template="editorial"
                  brandColors={["#7320E6", "#1A1A1A", "#FAF8F5"]}
                  fontClass={inter.className}
                  showDevBadges={false}
                  editorialStyle={style}
                  handle="@syncpost"
                  brandLabel="SyncPost"
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
