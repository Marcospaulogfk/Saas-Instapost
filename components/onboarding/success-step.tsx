"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, Plus, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface SuccessStepProps {
  brandName: string
  brandColors: string[]
  tones: string
}

export function SuccessStep({
  brandName,
  brandColors,
  tones,
}: SuccessStepProps) {
  const initial = brandName.charAt(0).toUpperCase() || "?"
  const accent = brandColors[0] || "#E84D1E"
  const dark = brandColors[1] || "#1A1A1A"

  const toneList = tones
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4)

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-8"
      >
        <Check className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <h2 className="text-4xl font-bold mb-2">Marca criada com sucesso!</h2>
      <p className="text-muted-foreground text-lg mb-12">
        Tudo pronto pra gerar conteudo viral em segundos
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-sm mx-auto rounded-xl border border-border bg-surface/50 backdrop-blur-sm p-6 mb-12"
      >
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${dark})`,
          }}
        >
          <span className="text-2xl font-bold text-white">{initial}</span>
        </div>
        <h3 className="text-xl font-bold mb-3">{brandName}</h3>

        {toneList.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {toneList.map((tone) => (
              <Badge key={tone} variant="secondary">
                {tone}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-2">
          {brandColors.map((color, i) => (
            <div
              key={`${color}-${i}`}
              className="w-6 h-6 rounded-full border border-border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </motion.div>

      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          asChild
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/dashboard">
            Ir para o painel
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full">
          <Link href="/dashboard/criar">
            <Plus className="w-4 h-4 mr-2" />
            Criar primeiro carrossel
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-12 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <span>Dica: comece com um tema que voce domina pra ver a IA brilhando</span>
      </div>
    </div>
  )
}
