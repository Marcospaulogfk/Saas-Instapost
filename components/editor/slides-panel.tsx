"use client"

import { useState } from "react"
import { Plus, MoreVertical, GripVertical, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SlidesPanelProps {
  activeSlide: number
  onSlideSelect: (index: number) => void
}

const slides = [
  { id: 1, color: "bg-gradient-to-br from-orange-600 to-red-700" },
  { id: 2, color: "bg-gradient-to-br from-blue-600 to-purple-700" },
  { id: 3, color: "bg-gradient-to-br from-green-600 to-teal-700" },
  { id: 4, color: "bg-gradient-to-br from-purple-600 to-pink-700" },
  { id: 5, color: "bg-gradient-to-br from-cyan-600 to-blue-700" },
  { id: 6, color: "bg-gradient-to-br from-yellow-600 to-orange-700" },
  { id: 7, color: "bg-gradient-to-br from-slate-600 to-slate-800" },
]

const templates = [
  { id: 1, name: "Wesley Style", color: "bg-gradient-to-br from-cyan-600 to-blue-700" },
  { id: 2, name: "Minimalista", color: "bg-gradient-to-br from-gray-800 to-black" },
  { id: 3, name: "Vibrante", color: "bg-gradient-to-br from-pink-600 to-purple-700" },
  { id: 4, name: "Business", color: "bg-gradient-to-br from-slate-600 to-slate-800" },
  { id: 5, name: "Neon", color: "bg-gradient-to-br from-green-500 to-cyan-600" },
]

export function SlidesPanel({ activeSlide, onSlideSelect }: SlidesPanelProps) {
  const [templatesOpen, setTemplatesOpen] = useState(false)

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <span className="text-sm font-semibold">Slides</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Slides list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSlideSelect(index)}
            className={`group relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer transition-all ${
              activeSlide === index
                ? "ring-2 ring-primary"
                : "ring-1 ring-border hover:ring-primary/50"
            }`}
          >
            {/* Drag handle */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <GripVertical className="w-4 h-4 text-white/60" />
            </div>

            {/* Slide number */}
            <div className="absolute top-2 left-2 w-5 h-5 rounded bg-black/50 text-white text-xs flex items-center justify-center font-medium">
              {index + 1}
            </div>

            {/* Action menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Duplicar</DropdownMenuItem>
                <DropdownMenuItem>Mover para cima</DropdownMenuItem>
                <DropdownMenuItem>Mover para baixo</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Background */}
            <div className={`absolute inset-0 ${slide.color}`} />
          </div>
        ))}
      </div>

      {/* Templates section */}
      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 border-t border-border flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors">
            Templates
            <ChevronDown className={`w-4 h-4 transition-transform ${templatesOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0 grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="aspect-[4/5] rounded-lg overflow-hidden cursor-pointer ring-1 ring-border hover:ring-primary/50 transition-all"
              >
                <div className={`w-full h-full ${template.color} flex items-end p-2`}>
                  <span className="text-[10px] text-white/80 truncate">{template.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  )
}
