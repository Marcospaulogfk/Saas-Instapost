"use client"

/**
 * Página DEV — visualizador slide-a-slide dos estilos de carrossel com dados
 * mockados. Não linkada na navegação; usada pra validar estilos sem gerar nada
 * e sem login. Escolhe o estilo e navega slide por slide em tamanho grande.
 */

import { useState } from "react"
import { Inter } from "next/font/google"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  SlidePreview,
  type PreviewSlide,
  type EditorialStyle,
} from "@/components/carousel/slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/500`

function mockSlide(i: number, total: number, bg?: string): PreviewSlide {
  const titles = [
    "Tom Cruise está correndo pro Oscar de novo",
    "Você posta e ninguém vê o seu conteúdo",
    "O gancho decide absolutamente tudo",
    "Design não é enfeite, é estratégia",
    "Constância vence talento todo santo dia",
    "Comece hoje e ajuste depois no caminho",
  ]
  return {
    order_index: i,
    title: titles[i % titles.length],
    highlight_words: i === 0 ? ["Oscar"] : i === 2 ? ["gancho"] : ["Constância"],
    subtitle:
      "E dessa vez não é Missão Impossível — o filme mais caro da carreira dele estreia em outubro",
    body:
      i === 0
        ? undefined
        : i === 3
          ? "Defina o gancho antes de tudo\nUse no máximo 20 palavras por slide\nFeche com CTA de salvar\nPoste no horário do seu público"
          : "O algoritmo premia quem prende atenção nos 3 primeiros segundos. Um bom gancho segura o dedo do usuário e faz ele arrastar pro próximo slide.",
    cta_badge: i === total - 1 ? "Salve este post" : "Conteúdo",
    bg,
    image: {
      url: IMG(`syncpost-${i}`),
      source: "ai",
      attribution: null,
      error: null,
    },
  }
}

// Swatches pra testar o override "Fundo do Slide" (dev).
const BG_SWATCHES: { label: string; value?: string }[] = [
  { label: "Auto", value: undefined },
  { label: "Roxo", value: "#7320E6" },
  { label: "Preto", value: "#0A0A0F" },
  { label: "Creme", value: "#F5F2EC" },
  { label: "Branco", value: "#FFFFFF" },
  { label: "Verde", value: "#0F5132" },
  { label: "Rosa", value: "#FCE7F3" },
]

const STYLES: { style: EditorialStyle; name: string }[] = [
  { style: "gradient", name: "Gradiente (dark/vibrante)" },
  { style: "minimal", name: "Minimal (branco/clean)" },
  { style: "seamless", name: "Seamless (panorâmico)" },
  { style: "wesley", name: "Wesley (dark/impacto)" },
  { style: "brandsdecoded", name: "Revista (editorial)" },
  { style: "bolo", name: "Bolo (lista cream)" },
  { style: "mypostflow", name: "MyPostFlow" },
  { style: "auto", name: "Auto (alternado)" },
]

const TOTAL = 5

export default function PreviewEstilosPage() {
  const [styleIdx, setStyleIdx] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)
  const [bg, setBg] = useState<string | undefined>(undefined)
  const { style, name } = STYLES[styleIdx]

  const go = (d: number) =>
    setSlideIdx((s) => Math.min(TOTAL - 1, Math.max(0, s + d)))

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center gap-6">
      <h1 className="text-xl font-bold">Preview de estilos (dev) — slide a slide</h1>

      {/* Seletor de estilo */}
      <div className="flex flex-wrap gap-2 justify-center">
        {STYLES.map((s, i) => (
          <button
            key={s.style}
            onClick={() => {
              setStyleIdx(i)
              setSlideIdx(0)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              i === styleIdx
                ? "bg-white text-black"
                : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Override de fundo do slide (dev) */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <span className="text-xs text-white/50 mr-1">Fundo:</span>
        {BG_SWATCHES.map((s) => (
          <button
            key={s.label}
            onClick={() => setBg(s.value)}
            title={s.label}
            style={s.value ? { backgroundColor: s.value } : undefined}
            className={`w-7 h-7 rounded-md border text-[8px] flex items-center justify-center transition-all ${
              bg === s.value
                ? "ring-2 ring-white border-transparent"
                : "border-white/25 hover:border-white/50"
            } ${!s.value ? "bg-zinc-800 text-white/70" : ""}`}
          >
            {!s.value ? "A" : ""}
          </button>
        ))}
      </div>

      {/* Navegação slide a slide */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          disabled={slideIdx === 0}
          className="p-2 rounded-full bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-white/60 tabular-nums w-24 text-center">
          Slide {slideIdx + 1} / {TOTAL}
        </span>
        <button
          onClick={() => go(1)}
          disabled={slideIdx === TOTAL - 1}
          className="p-2 rounded-full bg-zinc-800 disabled:opacity-30 hover:bg-zinc-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide grande */}
      <div className="w-full max-w-[440px]">
        <SlidePreview
          slide={mockSlide(slideIdx, TOTAL, bg)}
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

      {/* Miniaturas pra pular */}
      <div className="flex gap-2">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideIdx(i)}
            className={`w-8 h-10 rounded border-2 text-[10px] flex items-center justify-center transition-colors ${
              i === slideIdx
                ? "border-white bg-white/10"
                : "border-zinc-700 text-white/40 hover:border-zinc-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/40 text-center max-w-md">
        Estilo: <span className="text-white/70">{name}</span> · dados de teste
        (Tom Cruise) pra estressar título/subtítulo longos.
      </p>
    </main>
  )
}
