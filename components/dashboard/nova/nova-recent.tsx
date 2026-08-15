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
  // Navy PROFUNDO, não o azul da marca: no tom da logo o selo competia com o
  // botão e com o estado ativo da sidebar.
  const estilo =
    kind === "Carrossel"
      ? { background: "rgba(10,46,122,0.5)", color: "var(--nv-brand-soft)", borderColor: "rgba(13,67,150,0.6)" }
      : { background: "rgba(255,255,255,0.05)", color: "var(--nv-text-muted)", borderColor: "var(--nv-border)" }
  return (
    <span
      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none"
      style={estilo}
    >
      {kind}
    </span>
  )
}

/**
 * Cartão no formato da página de Templates: preview 4:5 INTEIRO em cima (nunca
 * cortado) e o rodapé embaixo com título, tipo, pontinhos e ação. O tamanho é
 * controlado pela largura máxima do cartão, não recortando o preview.
 */
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
      {/* Preview 4:5 completo */}
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
            <h3 className="text-[13px] font-semibold truncate" style={{ color: "var(--nv-text)" }}>
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
                    width: i === active ? 14 : 5,
                    background: i === active ? "var(--nv-brand-bright)" : "var(--nv-text-subtle)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] truncate" style={{ color: "var(--nv-text-subtle)" }}>
          {item.brand
            ? `${item.brand} · ${formatRelativeDate(item.created_at)}`
            : formatRelativeDate(item.created_at)}
        </p>
        <Link
          href={item.href}
          className="nv-btn-primary mt-auto inline-flex items-center justify-center gap-1.5 h-8 text-[12px]"
        >
          Abrir
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

/** Quantos cartões ficam visíveis por página do carrossel. */
const POR_PAGINA = 4

/**
 * Projetos recentes em CARROSSEL: mostra quantos cartões couberem na linha e
 * pagina o resto. As setas somem quando tudo cabe numa página só.
 */
export function NovaRecent({ items }: { items: NovaRecentItem[] }) {
  const [pagina, setPagina] = useState(0)
  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas - 1)
  const visiveis = items.slice(paginaAtual * POR_PAGINA, paginaAtual * POR_PAGINA + POR_PAGINA)
  const podePaginar = totalPaginas > 1

  const irPara = (p: number) => setPagina((p + totalPaginas) % totalPaginas)

  return (
    <div className="nv-card nv-fade p-5 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--nv-text)" }}>
          Projetos recentes
        </h2>

        <div className="flex items-center gap-3">
          {podePaginar && (
            <>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPaginas }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Página ${i + 1}`}
                    aria-current={i === paginaAtual}
                    onClick={() => setPagina(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === paginaAtual ? 16 : 6,
                      background:
                        i === paginaAtual ? "var(--nv-brand-bright)" : "var(--nv-text-subtle)",
                    }}
                  />
                ))}
              </div>
              {/* Setas no cabeçalho: com cartão de largura fixa, ancoradas nas
                  bordas do bloco elas ficavam longe do conteúdo. */}
              <div className="flex items-center gap-1">
                <SetaPagina label="Projetos anteriores" onClick={() => irPara(paginaAtual - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </SetaPagina>
                <SetaPagina label="Próximos projetos" onClick={() => irPara(paginaAtual + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </SetaPagina>
              </div>
            </>
          )}
          <Link
            href="/dashboard/projetos"
            className="text-[12.5px] font-medium"
            style={{ color: "var(--nv-brand-soft)" }}
          >
            Ver todos
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] py-6 text-center" style={{ color: "var(--nv-text-subtle)" }}>
          Nenhum projeto ainda. Crie seu primeiro conteúdo acima.
        </p>
      ) : (
        /* auto-fit + minmax: cabem quantos cartões a largura permitir e eles se
           esticam pra ocupar a linha toda — nada de sobra à direita. O mínimo de
           190px é o que segura a altura, já que o preview é 4:5 e não pode ser
           recortado. */
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
        >
          {visiveis.map((item) => (
            <NovaRecentCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function SetaPagina({
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
