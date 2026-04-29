"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const categories = ["Todos", "Educacional", "Vendas", "Storytelling", "Listas", "Tutorial"]

const templates = [
  { id: 1, name: "Wesley Style", category: "Educacional", usageCount: 234, color: "bg-gradient-to-br from-cyan-600 to-blue-700" },
  { id: 2, name: "Minimalista Preto", category: "Storytelling", usageCount: 189, color: "bg-gradient-to-br from-gray-800 to-black" },
  { id: 3, name: "Vibrante Neon", category: "Vendas", usageCount: 156, color: "bg-gradient-to-br from-pink-600 to-purple-700" },
  { id: 4, name: "Business Pro", category: "Educacional", usageCount: 142, color: "bg-gradient-to-br from-slate-600 to-slate-800" },
  { id: 5, name: "Lista Top 10", category: "Listas", usageCount: 128, color: "bg-gradient-to-br from-amber-500 to-orange-700" },
  { id: 6, name: "Tutorial Passo-a-passo", category: "Tutorial", usageCount: 117, color: "bg-gradient-to-br from-emerald-600 to-teal-800" },
  { id: 7, name: "Story Cards", category: "Storytelling", usageCount: 94, color: "bg-gradient-to-br from-rose-500 to-red-700" },
  { id: 8, name: "Oferta Relampago", category: "Vendas", usageCount: 81, color: "bg-gradient-to-br from-yellow-500 to-orange-600" },
]

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [query, setQuery] = useState("")

  const filtered = templates.filter((t) => {
    const matchesCategory = activeCategory === "Todos" || t.category === activeCategory
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase())
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
              {cat}
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
            <div
              key={template.id}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className={`absolute inset-0 ${template.color}`} />
              <Badge
                variant="secondary"
                className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white border-0 text-xs"
              >
                {template.category}
              </Badge>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="font-semibold text-white">{template.name}</h3>
                <p className="text-sm text-white/60">
                  Usado por {template.usageCount} pessoas
                </p>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  Usar template &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
