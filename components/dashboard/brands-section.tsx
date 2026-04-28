"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const brands = [
  {
    id: 1,
    name: "Culturize-se",
    initial: "C",
    color: "bg-gradient-to-br from-orange-500 to-red-600",
    carousels: 12,
  },
  {
    id: 2,
    name: "Agencia X",
    initial: "A",
    color: "bg-gradient-to-br from-blue-500 to-purple-600",
    carousels: 8,
  },
  {
    id: 3,
    name: "FitBrand",
    initial: "F",
    color: "bg-gradient-to-br from-green-500 to-teal-600",
    carousels: 3,
  },
]

export function BrandsSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Suas marcas</h2>
        <Button asChild variant="outline" size="sm" className="hover:border-primary hover:text-primary">
          <Link href="/onboarding">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar marca
          </Link>
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/dashboard/marcas/${brand.id}`}
            className="flex-shrink-0 w-[200px] h-[140px] rounded-xl border border-border bg-card hover:border-primary/30 transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className={`h-20 ${brand.color} flex items-center justify-center`}>
              <span className="text-4xl font-bold text-white">{brand.initial}</span>
            </div>
            <div className="p-3">
              <h3 className="font-semibold truncate">{brand.name}</h3>
              <p className="text-xs text-muted-foreground">
                {brand.carousels} carrosseis criados
              </p>
            </div>
          </Link>
        ))}

        {/* Add brand card */}
        <Link
          href="/onboarding"
          className="flex-shrink-0 w-[200px] h-[140px] rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
        >
          <Plus className="w-8 h-8" />
          <span className="text-sm font-medium">Nova marca</span>
        </Link>
      </div>
    </section>
  )
}
