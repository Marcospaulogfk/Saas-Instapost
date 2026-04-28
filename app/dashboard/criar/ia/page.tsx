"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  DollarSign,
  BookOpen,
  Heart,
  Users,
  Loader2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

type Objective = "vender" | "informar" | "engajar" | "comunidade"
type SlideCount = 5 | 7 | 10
type Step = "tema" | "objetivo" | "tamanho" | "marca" | "gerando"

const OBJECTIVES = [
  {
    id: "vender" as Objective,
    icon: DollarSign,
    title: "Vender",
    desc: "Conversão pra produto, serviço ou oferta",
    framework: "AIDA (Atenção, Interesse, Desejo, Ação)",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  {
    id: "informar" as Objective,
    icon: BookOpen,
    title: "Informar",
    desc: "Educar, ensinar, construir autoridade",
    framework: "Lista de tópicos com payoff educativo",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
  },
  {
    id: "engajar" as Objective,
    icon: Heart,
    title: "Engajar",
    desc: "Curtidas, comentários, compartilhamentos",
    framework: "Pergunta provocativa + storytelling",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/30",
  },
  {
    id: "comunidade" as Objective,
    icon: Users,
    title: "Construir comunidade",
    desc: "Conexão emocional, identificação",
    framework: "Vulnerabilidade + chamado coletivo",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/30",
  },
]

export default function CriarIAPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("tema")
  const [tema, setTema] = useState("")
  const [objetivo, setObjetivo] = useState<Objective | null>(null)
  const [slides, setSlides] = useState<SlideCount>(7)

  const stepIndex = ["tema", "objetivo", "tamanho", "marca", "gerando"].indexOf(step)

  const handleGerar = () => {
    setStep("gerando")
    // Simulação - na integração real, chama a Edge Function
    setTimeout(() => {
      router.push("/editor")
    }, 4000)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= stepIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Tema */}
        {step === "tema" && (
          <motion.div
            key="tema"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Qual é o tema do seu carrossel?</h1>
              <p className="text-muted-foreground">
                Pode ser uma frase ou um parágrafo. Quanto mais contexto, melhor.
              </p>
            </div>

            <Textarea
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: 5 erros que destroem seu churrasco / Como criar capas virais com Gemini / Por que sua dieta não funciona"
              className="min-h-[160px] text-base resize-none"
              autoFocus
            />

            <div className="flex justify-end mt-8">
              <Button
                onClick={() => setStep("objetivo")}
                disabled={tema.trim().length < 10}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Objetivo */}
        {step === "objetivo" && (
          <motion.div
            key="objetivo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-2">Qual é o objetivo do post?</h1>
              <p className="text-muted-foreground">
                A IA aplica frameworks de marketing diferentes para cada objetivo
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setObjetivo(obj.id)}
                  className={`text-left p-6 rounded-2xl border-2 transition-all ${
                    objetivo === obj.id
                      ? `${obj.border} ${obj.bg}`
                      : "border-border bg-card hover:border-foreground/20"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${obj.bg} flex items-center justify-center mb-4`}>
                    <obj.icon className={`w-6 h-6 ${obj.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{obj.title}</h3>
                    {objetivo === obj.id && <Check className={`w-4 h-4 ${obj.color}`} />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{obj.desc}</p>
                  <Badge variant="secondary" className="text-xs">
                    {obj.framework}
                  </Badge>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button onClick={() => setStep("tema")} variant="ghost" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setStep("tamanho")}
                disabled={!objetivo}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Tamanho */}
        {step === "tamanho" && (
          <motion.div
            key="tamanho"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-2">Quantos slides?</h1>
              <p className="text-muted-foreground">
                Carrosséis de 7 slides têm o melhor desempenho no Instagram
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[5, 7, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setSlides(n as SlideCount)}
                  className={`p-8 rounded-2xl border-2 transition-all ${
                    slides === n
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-foreground/20"
                  }`}
                >
                  <div className="text-4xl font-bold mb-2 tabular-nums">{n}</div>
                  <div className="text-sm text-muted-foreground">
                    {n === 5 && "Conciso e direto"}
                    {n === 7 && "Recomendado ⭐"}
                    {n === 10 && "Mais profundidade"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Custa {n} imagens
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button onClick={() => setStep("objetivo")} variant="ghost" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={() => setStep("marca")}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirmação */}
        {step === "marca" && (
          <motion.div
            key="marca"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-2">Confirme antes de gerar</h1>
              <p className="text-muted-foreground">
                Última checagem. Você poderá editar tudo depois.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs text-muted-foreground mb-1">Tema</div>
                <div className="text-foreground">{tema}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs text-muted-foreground mb-1">Objetivo</div>
                <div className="text-foreground capitalize">
                  {OBJECTIVES.find((o) => o.id === objetivo)?.title}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs text-muted-foreground mb-1">Slides</div>
                <div className="text-foreground">{slides} slides ({slides} imagens)</div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button onClick={() => setStep("tamanho")} variant="ghost" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleGerar}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar carrossel
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Gerando */}
        {step === "gerando" && (
          <motion.div
            key="gerando"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-2">Criando sua mágica...</h1>
            <p className="text-muted-foreground">
              Aguarde uns segundos enquanto a IA monta tudo
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
