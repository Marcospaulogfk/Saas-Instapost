"use client"

import { useState } from "react"
import { ChevronLeft, Globe, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface UrlInputStepProps {
  onBack: () => void
  onSubmit: (url: string) => void
}

export function UrlInputStep({ onBack, onSubmit }: UrlInputStepProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>

      <h2 className="text-3xl font-bold mb-2">Qual e a URL da sua marca?</h2>
      <p className="text-muted-foreground mb-8">
        Site oficial, pagina de Instagram, ou qualquer link publico
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://exemplo.com.br"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-12 h-14 text-lg bg-surface"
          />
        </div>

        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() => setUrl("https://instagram.com/")}
          >
            Nao tem site? Use seu @ do Instagram
          </Badge>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!url.trim()}
        >
          Analisar marca
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Vamos analisar apenas informacoes publicamente disponiveis, nada alem
        disso
      </p>
    </div>
  )
}
