"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBrandGradient } from "@/lib/brand-colors"

interface BrandCard {
  id: string
  name: string
  project_count: number
}

interface BrandsSectionProps {
  brands: BrandCard[]
}

export function BrandsSection({ brands }: BrandsSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h3 font-display font-semibold text-text-primary">Suas marcas</h2>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-border-medium hover:border-purple-600/50 hover:bg-purple-600/5"
        >
          <Link href="/onboarding">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar marca
          </Link>
        </Button>
      </div>

      {brands.length === 0 ? (
        <Link
          href="/onboarding"
          className="block rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors p-8 text-center text-muted-foreground hover:text-primary"
        >
          <Plus className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Crie sua primeira marca</p>
          <p className="text-sm mt-1">
            A marca define identidade visual, tom de voz e publico-alvo dos
            seus carrosseis.
          </p>
        </Link>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/dashboard/marcas/${brand.id}`}
              className="flex-shrink-0 w-[200px] h-[140px] rounded-xl border border-border-subtle bg-gradient-card backdrop-blur-xl hover:border-purple-600/50 hover:shadow-glow-sm transition-all hover:-translate-y-1 overflow-hidden"
            >
              <div
                className={`h-20 ${getBrandGradient(brand.id)} flex items-center justify-center`}
              >
                <span className="text-4xl font-bold text-white">
                  {brand.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-text-primary truncate">{brand.name}</h3>
                <p className="text-xs text-text-muted">
                  {brand.project_count}{" "}
                  {brand.project_count === 1 ? "carrossel" : "carrosseis"}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href="/onboarding"
            className="flex-shrink-0 w-[200px] h-[140px] rounded-xl border border-dashed border-border-medium hover:border-purple-600/50 transition-colors flex flex-col items-center justify-center gap-2 text-text-muted hover:text-purple-300"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Nova marca</span>
          </Link>
        </div>
      )}
    </section>
  )
}
