import Link from "next/link"
import { Layers, Sparkles, Image as ImageIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProjectGradient } from "@/lib/brand-colors"
import { formatRelativeDate } from "@/lib/format-date"
import { CarouselCover } from "@/components/carousel/carousel-cover"
import type { CarouselCoverData } from "@/components/carousel/slide-preview"

export interface RecentItem {
  id: string
  title: string
  href: string
  /** Imagem real (PNG salvo do carrossel / render do post). null = ver `cover`/gradiente. */
  image: string | null
  /** Capa ao vivo do carrossel (slide 1) quando não há PNG salvo. */
  cover?: CarouselCoverData | null
  brand: string | null
  created_at: string
  kind: "Carrossel" | "Post" | "Projeto"
  slideCount?: number
}

const KIND_ICON = {
  Carrossel: Layers,
  Post: ImageIcon,
  Projeto: Sparkles,
} as const

export function RecentProjects({ items }: { items: RecentItem[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-0.5">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
          Recentes
        </h2>
        {items.length > 0 && (
          <Link
            href="/dashboard/projetos"
            className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
          >
            Ver biblioteca
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card-black p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-brand-600/12 text-brand-300 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-text-secondary mb-4">
            Você ainda não criou nenhum conteúdo.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/criar">
              <Plus className="w-4 h-4 mr-1.5" />
              Criar o primeiro
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            const KindIcon = KIND_ICON[item.kind]
            return (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="group card-black card-black-hover relative aspect-[4/5] overflow-hidden block"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : item.cover ? (
                  <CarouselCover cover={item.cover} />
                ) : (
                  <div className={`absolute inset-0 ${getProjectGradient(item.id)}`} />
                )}

                {/* Selo de tipo só pra Post/Projeto — no carrossel o composto já
                    tem handle/pills, então o selo sobreporia. */}
                {item.kind !== "Carrossel" && (
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/55 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                    <KindIcon className="w-3 h-3" />
                    {item.kind}
                  </span>
                )}

                {/* Rodapé só pra Post/Projeto — o carrossel já mostra tudo no
                    slide composto, então fica full-bleed (sem sobrepor). */}
                {item.kind !== "Carrossel" && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-8">
                    <h3 className="text-[13px] font-medium text-white truncate leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[10.5px] text-white/55 truncate mt-0.5">
                      {item.brand
                        ? `${item.brand} · ${formatRelativeDate(item.created_at)}`
                        : formatRelativeDate(item.created_at)}
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
