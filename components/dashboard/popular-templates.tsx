"use client"

import Link from "next/link"

const templates = [
  {
    id: 1,
    name: "Wesley Style",
    usageCount: 234,
    color: "bg-gradient-to-br from-cyan-600 to-blue-700",
  },
  {
    id: 2,
    name: "Minimalista Preto",
    usageCount: 189,
    color: "bg-gradient-to-br from-gray-800 to-black",
  },
  {
    id: 3,
    name: "Vibrante Neon",
    usageCount: 156,
    color: "bg-gradient-to-br from-pink-600 to-purple-700",
  },
  {
    id: 4,
    name: "Business Pro",
    usageCount: 142,
    color: "bg-gradient-to-br from-slate-600 to-slate-800",
  },
]

export function PopularTemplates() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Templates em alta esta semana</h2>
        <Link href="/dashboard/templates" className="text-sm text-primary hover:underline">
          Ver todos &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer"
          >
            {/* Background */}
            <div className={`absolute inset-0 ${template.color}`} />

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="font-semibold text-white">{template.name}</h3>
              <p className="text-sm text-white/60">
                Usado por {template.usageCount} pessoas
              </p>
            </div>

            {/* Hover CTA */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                Usar template &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
