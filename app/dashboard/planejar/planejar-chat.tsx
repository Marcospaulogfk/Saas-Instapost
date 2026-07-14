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

/** Resposta de um turno do chat IA (/api/planejar/chat). */
interface ChatTurn {
  action: "ask" | "generate"
  message: string
  brief: string
  horizonDays?: number
  count?: number
}

const QUICK_REPLIES = [
  "Esta semana, uns 3 posts",
  "2 semanas, 3 posts por semana",
  "Mês inteiro, 12 posts",
]

export function PlanejarChat({ brand }: { brand: BrandLite }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [phase, setPhase] = useState<"interview" | "generating" | "review">(
    "interview",
  )
  const [thinking, setThinking] = useState(false)
  const [plan, setPlan] = useState<{ resumo: string; ideias: PlanoIdeia[] } | null>(
    null,
  )
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  // Abertura: a própria IA puxa a conversa (com fallback offline).
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void (async () => {
      setThinking(true)
      try {
        const turn = await chatTurn([])
        setMessages([{ role: "assistant", text: turn.message }])
      } catch {
        setMessages([
          {
            role: "assistant",
            text: `Oi! Sou seu parceiro de conteúdo da ${brand.name}. Me conta: o que você quer alcançar com o Instagram nas próximas semanas — e tem algum assunto ou data que precisa entrar no plano?`,
          },
        ])
      } finally {
        setThinking(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, phase, thinking])

  function pushUser(text: string) {
    setMessages((m) => [...m, { role: "user", text }])
  }
  function pushAssistant(text: string) {
    setMessages((m) => [...m, { role: "assistant", text }])
  }

  async function chatTurn(history: ChatMessage[]): Promise<ChatTurn> {
    const res = await fetch("/api/planejar/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: brand.id, messages: history }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "Falha no chat")
    return json as ChatTurn
  }

  function handleSend(textOverride?: string) {
    const value = (textOverride ?? input).trim()
    if (!value || phase !== "interview" || thinking) return
    const history = [...messages, { role: "user" as const, text: value }]
    pushUser(value)
    setInput("")
    setError(null)
    void (async () => {
      setThinking(true)
      try {
        const turn = await chatTurn(history)
        pushAssistant(turn.message)
        if (turn.action === "generate") {
          await generate(turn)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
        pushAssistant(
          "Ops, tive um problema aqui. Manda sua mensagem de novo que eu continuo de onde paramos.",
        )
      } finally {
        setThinking(false)
      }
    })()
  }

  async function generate(turn: ChatTurn) {
    setPhase("generating")
    setError(null)
    try {
      const res = await fetch("/api/planejar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          conversationBrief: turn.brief,
          horizonDays: turn.horizonDays ?? 7,
          count: turn.count ?? 5,
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
        `Ops, deu ruim ao gerar (${message}). Me manda um "gera de novo" que eu tento outra vez.`,
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
    setMessages([
      {
        role: "assistant",
        text: `Bora montar outro plano pra ${brand.name}. O que muda desta vez — objetivo, período ou temas?`,
      },
    ])
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

        {phase === "interview" && thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-background-tertiary/60 border border-border-subtle px-4 py-2.5 text-sm text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              Digitando…
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
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={thinking}
                  className="text-xs px-3 py-1.5 rounded-full border border-border-subtle text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
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
                placeholder="Escreva sua resposta..."
                className="flex-1 resize-none rounded-xl border border-border-subtle bg-background-tertiary/40 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-600/50 max-h-32"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || thinking}
                className="h-11"
              >
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

      </div>
    </div>
  )
}
