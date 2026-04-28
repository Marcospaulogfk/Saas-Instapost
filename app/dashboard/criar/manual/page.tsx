"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, PenLine, Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CriarManualPage() {
  const router = useRouter()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/criar"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar
      </Link>

      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <PenLine className="w-7 h-7 text-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Criar carrossel manualmente</h1>
        <p className="text-muted-foreground">
          Você define o roteiro. A IA cuida apenas das imagens.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-2 block">Título do projeto</label>
          <Input placeholder="Ex: Carrossel de dicas de churrasco" />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Marca</label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>Selecione uma marca...</option>
            <option>Culturize-se</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Quantos slides?</label>
          <div className="grid grid-cols-3 gap-3">
            <button className="p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition">
              <div className="text-2xl font-bold tabular-nums">5</div>
              <div className="text-xs text-muted-foreground">slides</div>
            </button>
            <button className="p-4 rounded-xl border-2 border-primary bg-primary/10 transition">
              <div className="text-2xl font-bold tabular-nums">7</div>
              <div className="text-xs text-muted-foreground">slides</div>
            </button>
            <button className="p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition">
              <div className="text-2xl font-bold tabular-nums">10</div>
              <div className="text-xs text-muted-foreground">slides</div>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Você terá controle total</p>
              <p className="text-sm text-muted-foreground">
                No editor, você poderá escrever cada slide manualmente, gerar imagens IA
                slide a slide, escolher templates e ajustar tudo do jeito que quiser.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={() => router.push("/editor")}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar projeto vazio
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
