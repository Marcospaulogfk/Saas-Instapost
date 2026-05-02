"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, PenLine, ArrowRight, Zap, Brain } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function CriarPage() {
  return (
    <div className="relative p-8 max-w-5xl mx-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-h1 font-display font-bold text-text-primary mb-3">
          Como você quer <span className="gradient-text">criar?</span>
        </h1>
        <p className="text-lg text-text-secondary">
          Escolha entre deixar a IA cuidar de tudo ou ter controle total do conteúdo
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
        >
          <Link href="/dashboard/criar/ia" className="block group">
            <div className="relative h-full rounded-2xl border-2 border-purple-600/40 bg-gradient-to-br from-purple-600/15 via-purple-700/8 to-transparent p-8 hover:border-purple-600/70 hover:shadow-glow transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

              <Badge className="absolute -top-3 left-6 bg-gradient-purple text-white border-0 shadow-glow-sm">
                ⭐ RECOMENDADO
              </Badge>

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-purple shadow-glow-sm flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-h3 font-display font-bold text-text-primary mb-3">
                  Deixar a IA criar pra mim
                </h2>
                <p className="text-text-secondary mb-6">
                  Você só dá o tema e o objetivo. A IA escreve o roteiro completo, gera
                  imagens cinematográficas e monta tudo seguindo frameworks de marketing
                  comprovados.
                </p>

                <div className="space-y-2 mb-6 text-text-secondary">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Roteiro completo em 30 segundos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span>Estratégia adaptada ao seu objetivo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Imagens cinematográficas inclusas</span>
                  </div>
                </div>

                <div className="flex items-center text-purple-400 font-medium gap-2 group-hover:gap-3 transition-all">
                  Começar com IA
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Manual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
        >
          <Link href="/dashboard/criar/manual" className="block group">
            <div className="relative h-full rounded-2xl border border-border-subtle bg-gradient-card backdrop-blur-xl p-8 hover:border-border-medium hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 rounded-2xl bg-background-tertiary border border-border-medium flex items-center justify-center mb-6">
                <PenLine className="w-7 h-7 text-text-primary" />
              </div>

              <h2 className="text-h3 font-display font-bold text-text-primary mb-3">
                Escrever manualmente
              </h2>
              <p className="text-text-secondary mb-6">
                Você já tem o conteúdo pronto na cabeça? Crie slide por slide com seu
                próprio texto e use a IA apenas pra gerar as imagens de fundo.
              </p>

              <div className="space-y-2 mb-6 text-text-secondary">
                <div className="flex items-center gap-2 text-sm">
                  <PenLine className="w-4 h-4 text-text-muted" />
                  <span>Controle total do texto</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-text-muted" />
                  <span>IA gera só as imagens</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-text-muted" />
                  <span>Pra quem já tem o roteiro</span>
                </div>
              </div>

              <div className="flex items-center text-text-primary font-medium gap-2 group-hover:gap-3 transition-all">
                Criar manualmente
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      <p className="text-center text-sm text-text-muted mt-12">
        💡 Dica: você pode misturar os dois modos no editor depois
      </p>
    </div>
  )
}
