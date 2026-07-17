"use client"

import {
  useState,
  useRef,
  useLayoutEffect,
  type ReactNode,
} from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { ChevronLeft, ChevronRight, ArrowRight, Check } from "lucide-react"
import {
  SlidePreview,
  type EditorialStyle,
  type PreviewSlide,
} from "./slide-preview"

const inter = Inter({ subsets: ["latin"], weight: ["900"] })

export type StyleBadgeTone = "brand" | "new" | "neutral"

export interface CarouselStyleMeta {
  style: EditorialStyle
  name: string
  desc: string
  badge?: { label: string; tone: StyleBadgeTone }
}

// Estilos de carrossel (mesmo motor do editor). Cada um vira um card com preview
// ao vivo + navegação pelos slides (capa → conteúdo → CTA).
export const CAROUSEL_STYLES: CarouselStyleMeta[] = [
  {
    style: "minimal",
    name: "Minimalista",
    desc: "Branco suíço, tipografia gigante e hairlines. Versátil pra listas, dicas e conteúdo educativo de qualquer nicho.",
    badge: { label: "Mais popular", tone: "brand" },
  },
  {
    style: "perfil",
    name: "Perfil",
    desc: "Imita um post nativo de rede social: avatar, selo e texto. Ideal pra autoridade, threads e conteúdo de criador.",
    badge: { label: "Estilo Twitter/X", tone: "neutral" },
  },
  {
    style: "gradient",
    name: "Gradiente",
    desc: "Dark vibrante com destaque em gradiente. Moderno e impactante pra quem quer se destacar no feed.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "cards",
    name: "Cards",
    desc: "Capa com foto e título em vidro; conteúdo em cards brancos flutuantes. Clean e bem organizado.",
    badge: { label: "Novo", tone: "new" },
  },
  {
    style: "wesley",
    name: "Impacto",
    desc: "Dark de alto impacto, título em caixa alta e foto de fundo. Pra manchetes que param o scroll.",
  },
  {
    style: "brandsdecoded",
    name: "Revista",
    desc: "Editorial de revista: título massivo, colunas e numeração fantasma. Sofisticado e autoral.",
  },
  {
    style: "bolo",
    name: "Lista Cream",
    desc: "Lista em fundo creme, leve e acolhedor. Perfeito pra passo a passo, receitas e checklists.",
  },
  {
    style: "seamless",
    name: "Seamless",
    desc: "Panorâmico: a linha de progresso avança slide a slide. Continuidade que prende até o final.",
  },
  {
    style: "mypostflow",
    name: "MyPostFlow",
    desc: "Clean com CTA forte no último slide. Equilíbrio entre conteúdo e chamada pra ação.",
  },
  {
    style: "auto",
    name: "Automático",
    desc: "A IA alterna layouts dark/light e escolhe o melhor pra cada slide. Deixa no piloto automático.",
  },
]

// Slides de demonstração — capa, conteúdo e CTA. Os pontinhos navegam por eles
// pra mostrar como o estilo se comporta em cada tipo de slide.
// Sem foto real (igual MyPostFlow): as zonas de imagem viram placeholder "IMAGEM".
const NO_IMAGE = { url: null, source: null, attribution: null, error: null } as const

export const DEMO_SLIDES: PreviewSlide[] = [
  {
    order_index: 0,
    title: "3 erros que travam o seu crescimento no Instagram",
    highlight_words: ["travam"],
    subtitle: "O que separa quem cresce de quem estaciona — e como virar o jogo.",
    cta_badge: "Crescimento",
    image: { ...NO_IMAGE },
  },
  {
    order_index: 1,
    title: "Poste com constância, não com intensidade",
    highlight_words: ["constância"],
    subtitle: "O algoritmo premia quem aparece toda semana.",
    body: "Escolha 3 formatos, monte um calendário simples e rode sem falhar. Consistência bate volume — todo dia um passo pequeno soma mais que um surto isolado.",
    cta_badge: "Dica 01",
    image: { ...NO_IMAGE },
  },
  {
    order_index: 2,
    title: "Salve este post e comece hoje mesmo",
    highlight_words: ["hoje"],
    subtitle: "Toque em salvar e volte quando for criar.",
    cta_badge: "Siga @suamarca",
    image: { ...NO_IMAGE },
  },
]

const TOTAL_DEMO = DEMO_SLIDES.length

// Largura de design em que as fontes dos slides foram calibradas. O preview é
// renderizado nessa largura e escalado pra caber na coluna do card — assim as
// proporções tipográficas ficam idênticas ao produto final, em qualquer tela.
const DESIGN_W = 400

/**
 * Renderiza qualquer conteúdo numa largura fixa de design e escala pra preencher
 * a largura real do container (via ResizeObserver), mantendo o frame 4:5.
 */
function ScaledPreview({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / DESIGN_W)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`relative w-full aspect-[4/5] overflow-hidden bg-background ${className}`}
    >
      {scale != null && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: DESIGN_W, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function StyleBadge({ label, tone }: { label: string; tone: StyleBadgeTone }) {
  const cls =
    tone === "brand"
      ? "bg-brand-600/15 text-brand-300 border-brand-600/30"
      : tone === "new"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-surface-2 text-text-muted border-hairline"
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${cls}`}
    >
      {label}
    </span>
  )
}

/**
 * Card de estilo com preview ao vivo + navegação (pontinhos + setas no hover).
 * Dois modos:
 *  - `href`  → modo LINK (página de Templates): CTA "Usar template" navega.
 *  - `onSelect`/`selected` → modo SELEÇÃO (wizard): CTA seleciona o estilo e o
 *    card inteiro é clicável (menos os controles de navegação).
 */
export function CarouselStyleCard({
  style,
  name,
  desc,
  badge,
  href,
  selected = false,
  onSelect,
  ctaLabel,
}: CarouselStyleMeta & {
  href?: string
  selected?: boolean
  onSelect?: (style: EditorialStyle) => void
  ctaLabel?: string
}) {
  const [active, setActive] = useState(0)
  const go = (i: number) => setActive((i + TOTAL_DEMO) % TOTAL_DEMO)
  const selectable = !href && !!onSelect

  return (
    <div
      onClick={selectable ? () => onSelect?.(style) : undefined}
      className={`group flex flex-col rounded-xl border bg-card overflow-hidden transition-colors ${
        selectable ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-brand-500 ring-1 ring-brand-500/40"
          : "border-hairline hover:border-border-accent"
      }`}
    >
      {/* Preview ao vivo + navegação */}
      <div className="relative">
        <ScaledPreview>
          <SlidePreview
            slide={DEMO_SLIDES[active]}
            totalSlides={TOTAL_DEMO}
            template="editorial"
            brandColors={["#7320E6", "#1A1A1A", "#FAF8F5"]}
            fontClass={inter.className}
            showDevBadges={false}
            editorialStyle={style}
            handle="@suamarca"
            brandLabel="Sua Marca"
          />
        </ScaledPreview>

        {selected && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Setas — aparecem no hover do card */}
        <button
          type="button"
          aria-label="Slide anterior"
          onClick={(e) => {
            e.stopPropagation()
            go(active - 1)
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full bg-background/70 border border-hairline text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-background hover:text-text-primary transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Próximo slide"
          onClick={(e) => {
            e.stopPropagation()
            go(active + 1)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full bg-background/70 border border-hairline text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-background hover:text-text-primary transition-all backdrop-blur-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Rodapé: nome + badge + pontinhos + descrição + CTA */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-semibold text-text-primary truncate">
              {name}
            </h3>
            {badge && <StyleBadge label={badge.label} tone={badge.tone} />}
          </div>
          {/* Pontinhos de navegação */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {DEMO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setActive(i)
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === active
                    ? "w-4 bg-brand-500"
                    : "w-1.5 bg-text-subtle hover:bg-text-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-text-muted leading-relaxed line-clamp-3">
          {desc}
        </p>

        {href ? (
          <Link
            href={href}
            className="mt-auto inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-medium transition-colors"
          >
            {ctaLabel ?? "Usar template"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(style)
            }}
            className={`mt-auto inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors ${
              selected
                ? "bg-brand-600 text-white"
                : "border border-hairline text-text-secondary hover:border-border-accent hover:text-text-primary"
            }`}
          >
            {selected ? (
              <>
                <Check className="w-4 h-4" />
                Selecionado
              </>
            ) : (
              ctaLabel ?? "Usar este estilo"
            )}
          </button>
        )}
      </div>
    </div>
  )
}
