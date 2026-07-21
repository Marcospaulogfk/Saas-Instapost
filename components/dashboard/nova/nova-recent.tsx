"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { getProjectGradient } from "@/lib/brand-colors"
import { formatRelativeDate } from "@/lib/format-date"
import { CarouselCover } from "@/components/carousel/carousel-cover"
import type { CarouselCoverData, PreviewSlide } from "@/components/carousel/slide-preview"

export interface NovaRecentItem {
  id: string
  title: string
  href: string
  /** Imagem real (PNG salvo do carrossel / render do post). */
  image: string | null
  /** Capa ao vivo do carrossel (slide 1) quando não há PNG salvo. */
  cover?: CarouselCoverData | null
  /** Slides completos — permite navegar o preview (setas + pontinhos). */
  slides?: PreviewSlide[]
  brand: string | null
  kind: "Carrossel" | "Post" | "Projeto"
  created_at: string
}

function KindBadge({ kind }: { kind: NovaRecentItem["kind"] }) {
  const cls =
    kind === "Carrossel"
      ? "bg-brand-600/15 text-brand-300 border-brand-600/30"
      : "bg-surface-2 text-text-muted border-hairline"
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${cls}`}
    >
      {kind}
    </span>
  )
}

function NovaRecentCard({ item }: { item: NovaRecentItem }) {
  const slides = item.slides ?? []
  const total = slides.length
  const canNav = item.kind === "Carrossel" && !!item.cover && total > 1
  const [active, setActive] = useState(0)
  const go = (i: number) => setActive((i + total) % total)

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fn()
  }

  return (
    <div
      className="group flex flex-col rounded-xl overflow-hidden nv-card-hover"
      style={{ background: "var(--nv-card-2)", border: "1px solid var(--nv-border)" }}
    >
      {/* Preview */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {item.kind === "Carrossel" && item.cover ? (
          <CarouselCover cover={item.cover} slide={canNav ? slides[active] : undefined} />
        ) : item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className={`absolute inset-0 ${getProjectGradient(item.id)}`} />
        )}

        {/* Setas — aparecem no hover do card */}
        {canNav && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={stop(() => go(active - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.55)", border: "1px solid var(--nv-border-strong)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={stop(() => go(active + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.55)", border: "1px solid var(--nv-border-strong)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Rodapé: título + badge + pontinhos + info + botão */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[13.5px] font-semibold truncate" style={{ color: "var(--nv-text)" }}>
              {item.title || "Sem título"}
            </h3>
            <KindBadge kind={item.kind} />
          </div>
          {canNav && (
            <div className="flex items-center gap-1.5 shrink-0">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ver slide ${i + 1}`}
                  onClick={stop(() => setActive(i))}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === active ? 16 : 6,
                    background: i === active ? "var(--nv-purple)" : "var(--nv-text-subtle)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-[11.5px] truncate" style={{ color: "var(--nv-text-subtle)" }}>
          {item.brand
            ? `${item.brand} · ${formatRelativeDate(item.created_at)}`
            : formatRelativeDate(item.created_at)}
        </p>
        <Link
          href={item.href}
          className="nv-btn-primary mt-auto inline-flex items-center justify-center gap-1.5 h-9 text-[12.5px]"
        >
          Abrir
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export function NovaRecent({ items }: { items: NovaRecentItem[] }) {
  return (
    <div className="nv-card nv-fade p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--nv-text)" }}>
          Projetos recentes
        </h2>
        <Link href="/dashboard/projetos" className="text-[12.5px] font-medium" style={{ color: "#b79dfb" }}>
          Ver todos
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] py-6 text-center" style={{ color: "var(--nv-text-subtle)" }}>
          Nenhum projeto ainda. Crie seu primeiro conteúdo acima.
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <NovaRecentCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
