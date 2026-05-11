"use client"

import { Check } from "lucide-react"
import { POST_TEMPLATES, CATEGORY_LABELS, templatesByCategory } from "@/lib/single-posts/catalog"
import { DEMO_CONTENT } from "@/lib/single-posts/demo"
import type { PostBrand } from "@/lib/single-posts/types"
import { PostPreview } from "./post-preview"

interface TemplatePickerProps {
  selectedId: string | null
  onSelect: (id: string) => void
  brand: PostBrand
  filterCategory?: string | null
}

export function TemplatePicker({
  selectedId,
  onSelect,
  brand,
  filterCategory,
}: TemplatePickerProps) {
  const grouped = templatesByCategory()
  const categories = filterCategory
    ? [filterCategory]
    : Object.keys(grouped)

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const items = grouped[cat]
        if (!items?.length) return null
        return (
          <section key={cat} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                {CATEGORY_LABELS[cat]}
              </h3>
              <span className="text-[11px] text-text-muted">
                {items.length} {items.length === 1 ? "template" : "templates"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((tpl) => {
                const selected = selectedId === tpl.id
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelect(tpl.id)}
                    className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all ${
                      selected
                        ? "border-purple-500 shadow-glow ring-2 ring-purple-500/30"
                        : "border-border-subtle hover:border-purple-500/40"
                    }`}
                  >
                    <PostPreview
                      templateId={tpl.id}
                      brand={brand}
                      content={DEMO_CONTENT[tpl.id] ?? {}}
                    />
                    {selected && (
                      <span className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-lime flex items-center justify-center shadow-[0_0_12px_rgba(209,254,23,0.6)]">
                        <Check className="w-3.5 h-3.5 text-zinc-950" strokeWidth={3} />
                      </span>
                    )}
                    <div className="p-3 bg-background-secondary/80 backdrop-blur-xl border-t border-border-subtle">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {tpl.label}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {tpl.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export { POST_TEMPLATES }
