"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  CAROUSEL_STYLES,
  DEMO_SLIDES,
  ScaledPreview,
} from "@/components/carousel/carousel-style-gallery"
import { SlidePreview } from "@/components/carousel/slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

/**
 * Faixa de exemplos no topo do dashboard, no formato do feed de comunidade do
 * BestContent (miniaturas em linha, viewer em tela cheia ao clicar).
 *
 * Diferença deliberada: eles mostram posts recém-criados por outros usuários
 * ("1min atrás") como prova social. Nós ainda não temos base instalada, e
 * inventar "Juliana G. · 2min atrás" seria prova social falsa — o tipo de coisa
 * que queima confiança justamente com o público de agência. Então a faixa é
 * assumidamente uma VITRINE: cada peça leva o selo "Exemplo" e os cartões são
 * renderizados pelo mesmo `SlidePreview` do produto, com dados de demonstração.
 *
 * Quando houver volume real de posts públicos (com opt-in), esta faixa troca a
 * fonte de dados e vira o feed de verdade — o formato já está pronto.
 */

interface Exemplo {
  id: string
  /** Estilo do catálogo — é ele que muda a cara do cartão. */
  estilo: (typeof CAROUSEL_STYLES)[number]["style"]
  nicho: string
  marca: string
  handle: string
  cores: string[]
}

const EXEMPLOS: Exemplo[] = [
  {
    id: "arq",
    estilo: CAROUSEL_STYLES[0].style,
    nicho: "Arquitetura",
    marca: "Estúdio Volume",
    handle: "@estudiovolume",
    cores: ["#C9A572", "#1A1712", "#F5F1EA"],
  },
  {
    id: "fit",
    estilo: CAROUSEL_STYLES[1].style,
    nicho: "Fitness",
    marca: "Power Academy",
    handle: "@poweracademy",
    cores: ["#E63946", "#101014", "#F7F7F7"],
  },
  {
    id: "adv",
    estilo: CAROUSEL_STYLES[2].style,
    nicho: "Advocacia",
    marca: "Prado & Associados",
    handle: "@pradoadv",
    cores: ["#1B3A5C", "#0C1620", "#EEF2F6"],
  },
  {
    id: "beauty",
    estilo: CAROUSEL_STYLES[3].style,
    nicho: "Estética",
    marca: "Clínica Aurora",
    handle: "@clinicaaurora",
    cores: ["#D98BA6", "#1C1418", "#FBF3F6"],
  },
  {
    id: "food",
    estilo: CAROUSEL_STYLES[4 % CAROUSEL_STYLES.length].style,
    nicho: "Gastronomia",
    marca: "Casa Fermento",
    handle: "@casafermento",
    cores: ["#8C5A2B", "#14100C", "#F6EEE3"],
  },
  {
    id: "tech",
    estilo: CAROUSEL_STYLES[5 % CAROUSEL_STYLES.length].style,
    nicho: "Tecnologia",
    marca: "Norte Digital",
    handle: "@nortedigital",
    cores: ["#1668E3", "#0A0A0F", "#F2F5FA"],
  },
]

export function NovaComunidade() {
  const trilhaRef = useRef<HTMLDivElement>(null)
  const [aberto, setAberto] = useState<Exemplo | null>(null)

  function rolar(dir: 1 | -1) {
    trilhaRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" })
  }

  return (
    <section
      className="rounded-2xl p-4 md:p-5"
      style={{ background: "var(--nv-card)", border: "1px solid var(--nv-border)" }}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold leading-tight"
            style={{ color: "var(--nv-text)" }}
          >
            Feito com o Nexus
          </h2>
          <p className="text-[12.5px]" style={{ color: "var(--nv-text-muted)" }}>
            Exemplos por nicho — clique pra ver de perto
          </p>
        </div>
        <div className="ml-auto hidden shrink-0 items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => rolar(-1)}
            aria-label="Anterior"
            className="nv-pill flex h-8 w-8 items-center justify-center"
            style={{ color: "var(--nv-text)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => rolar(1)}
            aria-label="Próximo"
            className="nv-pill flex h-8 w-8 items-center justify-center"
            style={{ color: "var(--nv-text)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trilhaRef}
        className="nova-scroll flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {EXEMPLOS.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => setAberto(ex)}
            className="nv-card-hover group flex w-[124px] shrink-0 flex-col gap-1.5 rounded-xl p-1.5 text-left"
            style={{
              background: "var(--nv-card-2)",
              border: "1px solid var(--nv-border)",
            }}
          >
            <div className="relative">
              <ScaledPreview className="rounded-lg">
                <SlidePreview
                  slide={DEMO_SLIDES[0]}
                  totalSlides={DEMO_SLIDES.length}
                  template="editorial"
                  brandColors={ex.cores}
                  fontClass={inter.className}
                  showDevBadges={false}
                  editorialStyle={ex.estilo}
                  handle={ex.handle}
                  brandLabel={ex.marca}
                />
              </ScaledPreview>
              {/* Selo permanente: nunca deixar um exemplo passar por post real
                  de usuário — é a linha entre vitrine e prova social falsa. */}
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                Exemplo
              </span>
            </div>
            <span
              className="truncate px-1 pb-0.5 text-[11.5px] font-medium"
              style={{ color: "var(--nv-text-muted)" }}
            >
              {ex.nicho}
            </span>
          </button>
        ))}
      </div>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() => setAberto(null)}
          role="presentation"
        >
          <div
            className="flex w-full max-w-[340px] flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="overflow-hidden rounded-2xl">
              <SlidePreview
                slide={DEMO_SLIDES[0]}
                totalSlides={DEMO_SLIDES.length}
                template="editorial"
                brandColors={aberto.cores}
                fontClass={inter.className}
                showDevBadges={false}
                editorialStyle={aberto.estilo}
                handle={aberto.handle}
                brandLabel={aberto.marca}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {aberto.nicho}
                </p>
                <p className="truncate text-xs text-white/60">
                  Exemplo de demonstração — não é post de usuário
                </p>
              </div>
              <Link
                href="/dashboard/criar"
                className="nv-btn-primary ml-auto inline-flex h-9 shrink-0 items-center px-3.5 text-[13px]"
              >
                Criar o meu
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAberto(null)}
            aria-label="Fechar"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  )
}
