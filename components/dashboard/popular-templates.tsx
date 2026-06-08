"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, TrendingUp } from "lucide-react"

const templates = [
  { id: 1, name: "Wesley Style", usageCount: 234 },
  { id: 2, name: "Minimalista Dark", usageCount: 189 },
  { id: 3, name: "Cinematic", usageCount: 156 },
  { id: 4, name: "Bold Roxo", usageCount: 142 },
]

export function PopularTemplates() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-h3 font-display font-semibold text-text-primary">
            Templates em alta
          </h2>
          <TrendingUp className="w-4 h-4 text-[var(--brand-400)]" />
        </div>
        <Link
          href="/dashboard/templates"
          className="text-small font-mono uppercase tracking-[0.1em] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-2 transition-colors cursor-pointer"
            style={{ borderTop: "var(--rule-top)", boxShadow: "inset 0 0 0 1px var(--hairline)" }}
          >
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="font-display font-semibold text-text-primary">{template.name}</h3>
              <p className="text-tiny font-mono uppercase tracking-[0.1em] text-text-muted mt-1">
                {template.usageCount} criadores
              </p>
            </div>

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-small font-medium text-white flex items-center gap-2">
                Usar template
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
