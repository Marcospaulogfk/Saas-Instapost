"use client"

import { Sparkles, Globe, PenLine, Zap, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface WelcomeStepProps {
  onSelectMethod: (method: "url" | "manual") => void
}

export function WelcomeStep({ onSelectMethod }: WelcomeStepProps) {
  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">Vamos conhecer sua marca</h1>
      <p className="text-muted-foreground text-lg mb-12">
        Quanto melhor entendermos seu negocio, melhores serao os carrosseis gerados pela IA
      </p>

      {/* Option cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* URL option */}
        <button
          onClick={() => onSelectMethod("url")}
          className="relative p-6 rounded-xl border border-primary/50 bg-primary/5 text-left transition-all hover:border-primary hover:bg-primary/10 shadow-[0_0_30px_-10px_rgba(0,212,255,0.3)]"
        >
          <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs">
            RECOMENDADO
          </Badge>

          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-primary" />
          </div>

          <h3 className="text-lg font-semibold mb-2">Tenho um site ou Instagram</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cole a URL e nossa IA analisa tudo automaticamente em segundos
          </p>

          <div className="flex items-center gap-2 text-sm text-primary">
            <Zap className="w-4 h-4" />
            30 segundos
          </div>
        </button>

        {/* Manual option */}
        <button
          onClick={() => onSelectMethod("manual")}
          className="p-6 rounded-xl border border-border bg-card text-left transition-all hover:border-primary/50"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <PenLine className="w-6 h-6 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold mb-2">Vou descrever manualmente</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Preencha um formulario com as informacoes da sua marca
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            3 minutos
          </div>
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Voce podera editar tudo depois
      </p>
    </div>
  )
}
