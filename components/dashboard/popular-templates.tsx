"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, TrendingUp } from "lucide-react"

const templates = [
  {
    id: 1,
    name: "Wesley Style",
    usageCount: 234,
    color: "bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-700",
  },
  {
    id: 2,
    name: "Minimalista Dark",
    usageCount: 189,
    color: "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black",
  },
  {
    id: 3,
    name: "Vibrante Neon",
    usageCount: 156,
    color: "bg-gradient-to-br from-fuchsia-500 via-pink-600 to-purple-700",
  },
  {
    id: 4,
    name: "Cinematic",
    usageCount: 142,
    color: "bg-gradient-to-br from-violet-700 via-purple-800 to-indigo-900",
  },
]

export function PopularTemplates() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-h3 font-display font-semibold text-text-primary">
            Templates em alta
          </h2>
          <TrendingUp className="w-4 h-4 text-purple-400" />
        </div>
        <Link
          href="/dashboard/templates"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
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
            className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border-subtle hover:border-purple-600/50 hover:shadow-glow-sm transition-all cursor-pointer"
          >
            <div className={`absolute inset-0 ${template.color}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
              <h3 className="font-display font-semibold text-white">{template.name}</h3>
              <p className="text-xs text-white/70 mt-0.5">
                {template.usageCount} criadores usando
              </p>
            </div>

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <span className="text-sm font-medium text-white flex items-center gap-2">
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
