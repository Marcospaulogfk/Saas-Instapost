"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuickActionCard() {
  return (
    <div className="relative rounded-2xl border border-primary/30 bg-card p-8 shadow-[0_0_60px_-15px_rgba(0,212,255,0.2)]">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">Criar novo carrossel</h2>
          <p className="text-muted-foreground mt-1">
            Do zero ao publicado em menos de 3 minutos
          </p>
        </div>
        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/dashboard/criar">
            Comecar criacao
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
