"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { POST_TEMPLATES, CATEGORY_LABELS } from "@/lib/single-posts/catalog"

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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Comece com um modelo testado e personalize com a sua identidade.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const isActive = cat === activeCategory
          const label = cat === "todos" ? "Todos" : CATEGORY_LABELS[cat] ?? cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum template encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template) => (
            <Link
              key={template.id}
              href="/dashboard/criar"
              className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer bg-black"
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
    </div>
  )
}
