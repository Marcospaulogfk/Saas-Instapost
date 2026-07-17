"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { POST_TEMPLATES, CATEGORY_LABELS } from "@/lib/single-posts/catalog"
import {
  CAROUSEL_STYLES,
  CarouselStyleCard,
} from "@/components/carousel/carousel-style-gallery"

// Categorias reais derivadas do catálogo (ordem estável).
const CATEGORY_ORDER = [
  "profissional",
  "informativo",
  "comercial",
  "fitness",
  "beauty",
  "empresa",
]

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("todos")
  const [query, setQuery] = useState("")

  const categories = useMemo(() => {
    const present = CATEGORY_ORDER.filter((c) =>
      POST_TEMPLATES.some((t) => t.category === c),
    )
    return ["todos", ...present]
  }, [])

  const filtered = POST_TEMPLATES.filter((t) => {
    const matchesCategory =
      activeCategory === "todos" || t.category === activeCategory
    const matchesQuery = t.label.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const filteredStyles = CAROUSEL_STYLES.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.desc.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          Templates
        </h1>
        <p className="text-text-muted mt-1">
          Modelos prontos — escolha um estilo, navegue pelos slides e comece a criar.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Buscar templates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {/* Estilos de carrossel */}
      {filteredStyles.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Estilos de carrossel
            </h2>
            <p className="text-sm text-text-muted">
              Capa, tipografia e composição prontas — aplicadas em todos os slides.
              Passe pelos pontinhos pra ver capa, conteúdo e CTA.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStyles.map((s) => (
              <CarouselStyleCard
                key={s.style}
                style={s.style}
                name={s.name}
                desc={s.desc}
                badge={s.badge}
                href={`/dashboard/criar?estilo=${s.style}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Posts únicos */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Posts únicos</h2>
          <p className="text-sm text-text-muted">
            Modelos de imagem 4:5 pra comunicados, ofertas, autoridade e mais.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const isActive = cat === activeCategory
            const label =
              cat === "todos" ? "Todos" : CATEGORY_LABELS[cat] ?? cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-text-muted hover:bg-background-quaternary hover:text-text-secondary"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-12 text-center">
            <p className="text-text-muted">Nenhum template encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((template) => (
              <Link
                key={template.id}
                href="/dashboard/criar"
                className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-hairline hover:border-border-accent transition-colors cursor-pointer bg-background"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.reference_image}
                  alt={template.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs"
                >
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </Badge>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                  <h3 className="font-semibold text-white leading-tight">
                    {template.label}
                  </h3>
                  {template.use_when?.[0] && (
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                      {template.use_when[0]}
                    </p>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    Usar template &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
