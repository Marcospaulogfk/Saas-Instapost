"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, PenLine, ArrowRight, Zap, Brain } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function CriarPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Como você quer criar?</h1>
        <p className="text-lg text-muted-foreground">
          Escolha entre deixar a IA cuidar de tudo ou ter controle total do conteúdo
        </p>
      </div>

      {/* Choice cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Option 1: AI Magic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/dashboard/criar/ia" className="block group">
            <div className="relative h-full rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 hover:border-primary/50 transition-all">
              <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground border-0">
                ⭐ RECOMENDADO
              </Badge>

              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Deixar a IA criar pra mim</h2>
              <p className="text-muted-foreground mb-6">
                Você só dá o tema e o objetivo. A IA escreve o roteiro completo, gera
                imagens cinematográficas e monta tudo seguindo frameworks de marketing
                comprovados.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Roteiro completo em 30 segundos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Estratégia adaptada ao seu objetivo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Imagens cinematográficas inclusas</span>
                </div>
              </div>

              <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                Começar com IA
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Option 2: Manual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/dashboard/criar/manual" className="block group">
            <div className="relative h-full rounded-2xl border border-border bg-card p-8 hover:border-foreground/20 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <PenLine className="w-7 h-7 text-foreground" />
              </div>

              <h2 className="text-2xl font-bold mb-3">Escrever manualmente</h2>
              <p className="text-muted-foreground mb-6">
                Você já tem o conteúdo pronto na cabeça? Crie slide por slide com seu
                próprio texto e use a IA apenas pra gerar as imagens de fundo.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <PenLine className="w-4 h-4 text-foreground/70" />
                  <span>Controle total do texto</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-foreground/70" />
                  <span>IA gera só as imagens</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-foreground/70" />
                  <span>Pra quem já tem o roteiro</span>
                </div>
              </div>

              <div className="flex items-center text-foreground font-medium group-hover:gap-3 gap-2 transition-all">
                Criar manualmente
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Tip */}
      <p className="text-center text-sm text-muted-foreground mt-12">
        💡 Dica: você pode misturar os dois modos no editor depois
      </p>
    </div>
  )
}
