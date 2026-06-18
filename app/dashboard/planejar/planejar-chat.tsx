"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  Send,
  Loader2,
  CalendarDays,
  Check,
  RotateCcw,
  CalendarPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveEditorialPlan } from "@/app/actions/scheduled-posts"
import {
  FORMATO_LABEL,
  OBJETIVO_LABEL,
  type PlanoIdeia,
} from "@/lib/planejar"

interface BrandLite {
  id: string
  name: string
  description: string | null
  target_audience: string | null
  tone_of_voice: string | null
  main_objective: string | null
}

interface ChatMessage {
  role: "assistant" | "user"
  text: string
}

/** Roteiro humanizado da entrevista. Cada passo coleta uma resposta. */
interface Step {
  key: string
  ask: (brand: BrandLite) => string
  placeholder: string
}

const STEPS: Step[] = [
  {
    key: "foco",
    ask: (b) =>
      `Oi! Sou seu parceiro de conteúdo da ${b.name}. Vou montar um cronograma de posts pensado pro seu negócio — mas antes quero te entender melhor.\n\nMe conta com suas palavras: o que você mais quer alcançar com o Instagram nas próximas semanas? (mais vendas, mais autoridade, atrair clientes novos...)`,
    placeholder: "Ex: quero atrair clientes novos e mostrar autoridade no meu nicho",
  },
  {
    key: "publico",
    ask: (b) =>
      b.target_audience
        ? `Boa. Anotei que seu público é "${b.target_audience}". Tem algum recorte mais específico que você quer falar agora? (ex: um perfil de cliente, uma região, uma dor concreta) — se tiver, descreve; se não, escreve "tá certo".`
        : `Pra quem você quer falar nesses próximos posts? Descreve o seu cliente ideal em 1-2 frases.`,
    placeholder: "Ex: donas de pequenos negócios que vendem por DM e não têm tempo",
  },
  {
    key: "tema",
    ask: () =>
      `Show. Tem algum assunto, lançamento, promoção ou data importante que você quer destacar nesse período? Se não tiver nada fixo, escreve "deixa com você".`,
    placeholder: "Ex: vou lançar um serviço novo dia 20 / nada fixo, pode sugerir",
  },
  {
    key: "frequencia",
    ask: () =>
      `Última: qual o ritmo que você consegue manter? Escolhe um botão aí embaixo ou me diz quantos posts por semana.`,
    placeholder: "Ex: 3 posts por semana",
  },
]

const HORIZON_OPTIONS = [
  { label: "Esta semana", horizonDays: 7, count: 3 },
  { label: "2 semanas", horizonDays: 14, count: 6 },
  { label: "Mês inteiro", horizonDays: 30, count: 12 },
]

export function PlanejarChat({ brand }: { brand: BrandLite }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [input, setInput] = useState("")
  const [phase, setPhase] = useState<"interview" | "generating" | "review">(
    "interview",
  )
  const [horizon, setHorizon] = useState(HORIZON_OPTIONS[0])
  const [plan, setPlan] = useState<{ resumo: string; ideias: PlanoIdeia[] } | null>(
    null,
  )
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Inicia com a primeira pergunta.
  useEffect(() => {
    setMessages([{ role: "assistant", text: STEPS[0].ask(brand) }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, phase])

  const currentStep = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  function pushUser(text: string) {
    setMessages((m) => [...m, { role: "user", text }])
  }
  function pushAssistant(text: string) {
    setMessages((m) => [...m, { role: "assistant", text }])
  }

  function handleSend() {
    const value = input.trim()
    if (!value || phase !== "interview") return
    pushUser(value)
    const nextAnswers = { ...answers, [currentStep.key]: value }
    setAnswers(nextAnswers)
    setInput("")

    if (!isLastStep) {
      const next = STEPS[stepIndex + 1]
      setStepIndex((i) => i + 1)
      setTimeout(() => pushAssistant(next.ask(brand)), 250)
    } else {
      void generate(nextAnswers)
    }
  }

  async function generate(finalAnswers: Record<string, string>) {
    setPhase("generating")
    setError(null)
    pushAssistant(
      `Perfeito. Vou montar um cronograma de ${horizon.label.toLowerCase()} com a cara da ${brand.name}. Já volto...`,
    )

    const brief = [
      `Objetivo do cliente: ${finalAnswers.foco ?? "-"}`,
      `Público/recorte: ${finalAnswers.publico ?? "-"}`,
      `Assunto/data destaque: ${finalAnswers.tema ?? "-"}`,
      `Ritmo desejado: ${finalAnswers.frequencia ?? "-"}`,
    ].join("\n")

    try {
      const res = await fetch("/api/planejar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          conversationBrief: brief,
          horizonDays: horizon.horizonDays,
          count: horizon.count,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "Falha ao gerar plano")
      }
      const ideias: PlanoIdeia[] = json.ideias ?? []
      setPlan({ resumo: json.resumo ?? "", ideias })
      setSelected(new Set(ideias.map((_, i) => i)))
      setPhase("review")
      pushAssistant(
        json.resumo ||
          "Montei o cronograma abaixo. Confere as ideias, desmarca o que não curtir e salva no calendário.",
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setPhase("interview")
      pushAssistant(
        `Ops, deu ruim ao gerar (${message}). Quer tentar de novo? Clica em "Gerar plano".`,
      )
    }
  }

  function toggle(i: number) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  async function handleSave() {
    if (!plan) return
    const chosen = plan.ideias.filter((_, i) => selected.has(i))
    if (!chosen.length) {
      setError("Selecione pelo menos uma ideia.")
      return
    }
    setSaving(true)
    setError(null)
    const result = await saveEditorialPlan(brand.id, chosen)
    setSaving(false)
    if (result.ok) {
      setSaved(true)
    } else {
      setError(result.error)
    }
  }

  function restart() {
    setMessages([{ role: "assistant", text: STEPS[0].ask(brand) }])
    setStepIndex(0)
    setAnswers({})
    setInput("")
    setPhase("interview")
    setPlan(null)
    setSelected(new Set())
    setError(null)
    setSaved(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-24 lg:pb-8 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Planejar conteúdo
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Um papo rápido pra eu entender a {brand.name} e montar seu cronograma
          da semana.
        </p>
      </div>

      {/* Chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-border-subtle bg-background-secondary/30 p-4 space-y-3 min-h-[320px]"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                m.role === "user"
                  ? "bg-brand-600 text-white rounded-br-sm"
                  : "bg-background-tertiary/60 border border-border-subtle text-text-primary rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {phase === "generating" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-background-tertiary/60 border border-border-subtle px-4 py-2.5 text-sm text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              Montando o cronograma...
            </div>
          </div>
        )}

        {/* Plano de review */}
        {phase === "review" && plan && (
          <div className="space-y-2 pt-2">
            {plan.ideias.map((idea, i) => {
              const on = selected.has(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  className={`w-full text-left rounded-xl border p-3 transition-all flex gap-3 ${
                    on
                      ? "border-brand-600/50 bg-brand-600/5"
                      : "border-border-subtle bg-background-tertiary/30 opacity-60"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      on ? "bg-brand-600 text-white" : "border border-border-medium"
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] tabular-nums text-brand-300 font-medium flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {idea.data.split("-").reverse().slice(0, 2).join("/")}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-secondary">
                        {FORMATO_LABEL[idea.formato] ?? idea.formato}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background-tertiary/60 border border-border-subtle text-text-muted">
                        {OBJETIVO_LABEL[idea.objetivo] ?? idea.objetivo}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {idea.titulo}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {idea.descricao}
                    </p>
                    {idea.motivo && (
                      <p className="text-[11px] text-text-muted mt-1 italic">
                        {idea.motivo}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}

      {/* Composer / ações */}
      <div className="mt-3">
        {phase === "interview" && (
          <>
            {currentStep?.key === "frequencia" && (
              <div className="flex flex-wrap gap-2 mb-2">
                {HORIZON_OPTIONS.map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => setHorizon(h)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      horizon.label === h.label
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {h.label} · {h.count} posts
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder={currentStep?.placeholder ?? "Escreva sua resposta..."}
                className="flex-1 resize-none rounded-xl border border-border-subtle bg-background-tertiary/40 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-600/50 max-h-32"
              />
              <Button onClick={handleSend} disabled={!input.trim()} className="h-11">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {phase === "review" && plan && (
          <div className="flex flex-wrap items-center gap-2">
            {saved ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                  <Check className="w-4 h-4" />
                  Salvo no calendário ({selected.size})
                </span>
                <Button asChild variant="outline" className="ml-auto">
                  <Link href="/dashboard/calendario">
                    <CalendarDays className="w-4 h-4 mr-1.5" />
                    Ver no calendário
                  </Link>
                </Button>
                <Button variant="ghost" onClick={restart}>
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Novo plano
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-text-muted">
                  {selected.size} de {plan.ideias.length} selecionadas
                </span>
                <Button variant="ghost" onClick={restart} className="ml-auto">
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Recomeçar
                </Button>
                <Button onClick={handleSave} disabled={saving || selected.size === 0}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <CalendarPlus className="w-4 h-4 mr-1.5" />
                  )}
                  Pré-agendar no calendário
                </Button>
              </>
            )}
          </div>
        )}

        {phase === "interview" && error && (
          <Button onClick={() => generate(answers)} className="mt-2">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Gerar plano
          </Button>
        )}
      </div>
    </div>
  )
}
