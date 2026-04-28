"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const filters = ["Todos", "Wesley Style", "Minimalista", "Vibrante", "Business", "Churrasco"]

const templates = [
  { id: 1, name: "Wesley Classic", color: "bg-gradient-to-br from-cyan-600 to-blue-700" },
  { id: 2, name: "Dark Minimal", color: "bg-gradient-to-br from-gray-800 to-black" },
  { id: 3, name: "Neon Pop", color: "bg-gradient-to-br from-pink-600 to-purple-700" },
  { id: 4, name: "Corporate", color: "bg-gradient-to-br from-slate-600 to-slate-800" },
  { id: 5, name: "Fire", color: "bg-gradient-to-br from-orange-600 to-red-700" },
  { id: 6, name: "Ocean", color: "bg-gradient-to-br from-teal-600 to-cyan-700" },
  { id: 7, name: "Sunset", color: "bg-gradient-to-br from-yellow-500 to-orange-600" },
  { id: 8, name: "Forest", color: "bg-gradient-to-br from-green-600 to-emerald-700" },
]

export function TemplatesPanel() {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [applyToAll, setApplyToAll] = useState(false)

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-surface"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Badge
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              activeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Badge>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-all"
          >
            <div className={`absolute inset-0 ${template.color}`} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <span className="text-xs text-white">{template.name}</span>
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-medium text-primary">Usar</span>
            </div>
          </div>
        ))}
      </div>

      {/* Apply to all toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Label className="text-sm">Aplicar a todos os slides</Label>
        <Switch checked={applyToAll} onCheckedChange={setApplyToAll} />
      </div>
    </div>
  )
}
