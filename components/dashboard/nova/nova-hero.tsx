"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Inter } from "next/font/google"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import {
  CAROUSEL_STYLES,
  DEMO_SLIDES,
  ScaledPreview,
} from "@/components/carousel/carousel-style-gallery"
import { SlidePreview } from "@/components/carousel/slide-preview"

// Mesma fonte da galeria de estilos — os pesos display do template editorial.
const inter = Inter({ subsets: ["latin"], weight: ["900"] })

/* O LiquidEther arrasta o three.js junto (~150KB gz) e só existe no cliente —
   carregar sob demanda evita esse peso no bundle inicial do dashboard. Ele já
   pausa sozinho fora da viewport e com a aba oculta (IntersectionObserver +
   visibilitychange), então não fica queimando GPU quando ninguém está vendo. */
const LiquidEther = dynamic(() => import("@/components/backgrounds/liquid-ether"), {
  ssr: false,
})

interface NovaHeroProps {
  greeting: string
  name: string
}

const SLIDES = ["boas-vindas", "modelos"] as const

/** Tempo de cada slide no giro automático. */
const INTERVALO_MS = 7000

/**
 * Abertura do dashboard, em dois slides: boas-vindas com o CTA de criação e a
 * vitrine de modelos. Passa sozinho e PARA enquanto o mouse está em cima (ou
 * enquanto algo dentro dele tem foco pelo teclado).
 *
 * A ilustração é ESTÁTICA de propósito — os cards flutuando e o glow pulsando
 * foram removidos.
 */
export function NovaHero({ greeting, name }: NovaHeroProps) {
  const [slide, setSlide] = useState(0)
  const [pausado, setPausado] = useState(false)
  const ir = (i: number) => setSlide((i + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    if (pausado) return
    // Quem pediu menos movimento no sistema não recebe carrossel automático.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), INTERVALO_MS)
    return () => clearInterval(t)
  }, [pausado])

  return (
    <section
      className="nv-hero nv-fade relative flex flex-col p-7 md:p-8"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <HeroFluido />

      <div className="relative z-10 flex-1">
        {SLIDES[slide] === "boas-vindas" ? (
          <SlideBoasVindas greeting={greeting} name={name} />
        ) : (
          <SlideModelos />
        )}
      </div>

      {/* Navegação entre slides */}
      <div className="relative z-10 mt-5 flex items-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s}
            type="button"
            aria-label={`Ir para o slide ${i + 1}`}
            aria-current={i === slide}
            onClick={() => setSlide(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === slide ? 20 : 7,
              background: i === slide ? "var(--nv-brand-bright)" : "var(--nv-text-subtle)",
            }}
          />
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <SetaSlide label="Slide anterior" onClick={() => ir(slide - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </SetaSlide>
          <SetaSlide label="Próximo slide" onClick={() => ir(slide + 1)}>
            <ChevronRight className="h-4 w-4" />
          </SetaSlide>
        </div>
      </div>
    </section>
  )
}

function SetaSlide({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full transition-colors"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid var(--nv-border)",
        color: "var(--nv-text-muted)",
      }}
    >
      {children}
    </button>
  )
}

/* ── Slide 1: boas-vindas ───────────────────────────────────────── */

function SlideBoasVindas({ greeting, name }: NovaHeroProps) {
  return (
    <div className="relative">
      <div className="max-w-2xl">
        <p className="text-[14px] mb-1.5" style={{ color: "var(--nv-text-muted)" }}>
          {greeting}, {name}.
        </p>
        <h1
          className="text-[28px] md:text-[34px] font-bold leading-[1.1] tracking-tight mb-2"
          style={{ color: "var(--nv-text)" }}
        >
          Vamos criar algo incrível hoje.
        </h1>
        <p className="text-[14px] mb-6" style={{ color: "var(--nv-text-muted)" }}>
          Gere conteúdo de alta qualidade pra Instagram com o poder da IA.
        </p>

        <Link
          href="/dashboard/criar"
          className="nv-btn-primary inline-flex items-center gap-2 h-11 px-6 text-[14px]"
        >
          <Plus className="w-4 h-4" />
          Criar conteúdo
        </Link>
      </div>

      <HeroArt />
    </div>
  )
}

/* ── Slide 2: vitrine de modelos ────────────────────────────────── */

/** Quantos previews cabem sem espremer. */
const MODELOS_VISIVEIS = 4

function SlideModelos() {
  const modelos = CAROUSEL_STYLES.slice(0, MODELOS_VISIVEIS)

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-7">
      <div className="md:max-w-[280px]">
        <p className="text-[14px] mb-1.5" style={{ color: "var(--nv-text-muted)" }}>
          Vitrine de modelos
        </p>
        <h2
          className="text-[22px] md:text-[26px] font-bold leading-[1.15] tracking-tight mb-2"
          style={{ color: "var(--nv-text)" }}
        >
          {CAROUSEL_STYLES.length} estilos prontos.
        </h2>
        <p className="text-[13.5px] mb-4" style={{ color: "var(--nv-text-muted)" }}>
          Cada um adapta paleta, tipografia e enquadramento à sua marca.
        </p>
        <Link
          href="/dashboard/templates"
          className="nv-btn-primary inline-flex h-9 items-center gap-1.5 px-4 text-[13px]"
        >
          Ver todos os modelos
        </Link>
      </div>

      {/* Mesmo preview da página de Templates, só menor */}
      <div className="grid flex-1 grid-cols-4 gap-3">
        {modelos.map((m) => (
          <Link
            key={m.style}
            href={`/dashboard/templates?estilo=${m.style}`}
            className="nv-card-hover group flex flex-col gap-1.5 rounded-xl p-1.5"
            style={{ background: "var(--nv-card-2)", border: "1px solid var(--nv-border)" }}
          >
            <ScaledPreview className="rounded-lg">
              <SlidePreview
                slide={DEMO_SLIDES[0]}
                totalSlides={DEMO_SLIDES.length}
                template="editorial"
                brandColors={["#1668E3", "#1A1A1A", "#FAF8F5"]}
                fontClass={inter.className}
                showDevBadges={false}
                editorialStyle={m.style}
                handle="@suamarca"
                brandLabel="Sua Marca"
              />
            </ScaledPreview>
            <span
              className="truncate px-1 pb-0.5 text-[11.5px] font-medium"
              style={{ color: "var(--nv-text-muted)" }}
            >
              {m.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Fundo fluido ───────────────────────────────────────────────── */

/**
 * Camada de fluido atrás do conteúdo do hero.
 *
 * Fica em `z-0` sob o texto (`z-10`) e não recebe ponteiro — o próprio
 * LiquidEther escuta o mouse em `window`, então o efeito segue o cursor mesmo
 * com o título e o botão por cima. O véu escuro em cima existe pra segurar o
 * contraste do texto: sem ele, o pico claro do fluido passa por baixo da frase
 * e o branco some.
 */
function HeroFluido() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-[20px]" aria-hidden>
      <LiquidEther
        colors={["#5227FF", "#FF9FFC", "#B497CF"]}
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,12,0.82)_0%,rgba(5,7,12,0.62)_45%,rgba(5,7,12,0.35)_100%)]" />
    </div>
  )
}

/* ── Ilustração (estática) ──────────────────────────────────────── */

function HeroArt() {
  return (
    <div className="hidden lg:block absolute right-2 top-1/2 -translate-y-1/2 z-0 pointer-events-none">
      <div className="relative w-[280px] h-[230px]">
        {/* Halo do post — fixo, sem pulsar */}
        <div
          className="absolute"
          style={{
            inset: "10% 8% 10% 30%",
            background:
              "radial-gradient(circle, rgba(18,165,245,0.28) 0%, rgba(10,46,122,0.16) 45%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
        <svg width="280" height="230" viewBox="0 0 280 230" fill="none" aria-hidden className="relative">
          <defs>
            <linearGradient id="nvImg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0D4396" />
              <stop offset="55%" stopColor="#1668E3" />
              <stop offset="100%" stopColor="#12A5F5" />
            </linearGradient>
            <linearGradient id="nvAvatar" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#12A5F5" />
              <stop offset="100%" stopColor="#0E52BC" />
            </linearGradient>
            <linearGradient id="nvStack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0A2A63" />
              <stop offset="100%" stopColor="#0E52BC" />
            </linearGradient>
            <filter id="nvSoft" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Pilha do carrossel (slides atrás) */}
          <g>
            <rect x="70" y="66" width="128" height="150" rx="16" fill="url(#nvStack)" opacity="0.45" transform="rotate(-9 134 141)" />
            <rect x="82" y="58" width="130" height="152" rx="16" fill="url(#nvStack)" opacity="0.7" transform="rotate(-4.5 147 134)" />
          </g>

          {/* Post da frente (mockup do que o app gera) */}
          <g filter="url(#nvSoft)">
            <rect x="96" y="40" width="134" height="166" rx="16" fill="#f6f7fb" />

            {/* Header: avatar + handle */}
            <circle cx="118" cy="62" r="9" fill="url(#nvAvatar)" />
            <rect x="134" y="56" width="52" height="6" rx="3" fill="#c9d2e0" />
            <rect x="134" y="66" width="34" height="5" rx="2.5" fill="#dde3ec" />

            {/* Imagem gerada */}
            <rect x="108" y="82" width="110" height="66" rx="9" fill="url(#nvImg)" />

            {/* Legenda */}
            <rect x="108" y="158" width="110" height="6" rx="3" fill="#ccd5e2" />
            <rect x="108" y="170" width="88" height="6" rx="3" fill="#dde3ec" />
            <rect x="108" y="182" width="66" height="6" rx="3" fill="#dde3ec" />

            {/* Pontinhos do carrossel */}
            <rect x="108" y="196" width="14" height="4" rx="2" fill="#1668E3" />
            <circle cx="132" cy="198" r="2" fill="#c3cbd8" />
            <circle cx="140" cy="198" r="2" fill="#c3cbd8" />
          </g>
        </svg>
      </div>
    </div>
  )
}
