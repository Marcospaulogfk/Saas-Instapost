"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowUp, Loader2, X } from "lucide-react"

/**
 * Assistente de conteúdo — bolha fixa presente em todo o dashboard.
 *
 * Existe pra retenção: a pergunta que trava o social media não é "como uso o
 * editor", é "o que eu posto essa semana". Responder isso de graça, já ciente
 * da marca ativa, é o que traz a pessoa de volta ao produto entre as gerações.
 *
 * O histórico vive em sessionStorage e não no banco: a conversa é descartável
 * por natureza (conselho do dia), e persistir no servidor criaria uma tabela,
 * uma política de retenção e uma tela de gestão pra um dado que ninguém
 * consulta depois. Fechar a aba zera — que é o comportamento esperado.
 */

const CHAVE_HISTORICO = "nexus:assistente:historico"

interface Mensagem {
  role: "user" | "assistant"
  content: string
}

/**
 * Renderiza o `**negrito**` que o modelo usa pra destacar nomes de tela.
 * É o único markdown que aparece com frequência na resposta — puxar uma
 * biblioteca inteira pra isso seria desproporcional, e deixar cru faz o
 * assistente parecer quebrado.
 */
function comNegrito(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? (
      <strong key={i} className="font-semibold text-text-primary">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{parte}</span>
    ),
  )
}

/** Atalhos do estado vazio: tiram a pessoa do "não sei o que perguntar". */
const ATALHOS = [
  "O que eu posto essa semana?",
  "Me dá 5 ideias de post",
  "Como melhorar meu engajamento",
  "Ideia de carrossel educativo",
]

export function AssistenteBolha() {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [rascunho, setRascunho] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Restaura a conversa da sessão só no cliente (sessionStorage não existe no
  // servidor e o componente é renderizado no layout).
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_HISTORICO)
      if (salvo) setMensagens(JSON.parse(salvo) as Mensagem[])
    } catch {
      // histórico corrompido não pode impedir o assistente de abrir
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE_HISTORICO, JSON.stringify(mensagens))
    } catch {
      // quota estourada: a conversa continua na memória
    }
  }, [mensagens])

  useEffect(() => {
    if (aberto) {
      fimRef.current?.scrollIntoView({ block: "end" })
      inputRef.current?.focus()
    }
  }, [aberto, mensagens, carregando])

  // Esc fecha — o painel cobre parte da tela no mobile.
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [aberto])

  async function enviar(texto: string) {
    const conteudo = texto.trim()
    if (!conteudo || carregando) return
    setErro(null)
    setRascunho("")
    const proximas: Mensagem[] = [
      ...mensagens,
      { role: "user", content: conteudo },
    ]
    setMensagens(proximas)
    setCarregando(true)
    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: proximas }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok || !data.reply) {
        setErro(data.error ?? "não consegui responder agora")
        return
      }
      setMensagens((atual) => [
        ...atual,
        { role: "assistant", content: data.reply as string },
      ])
    } catch {
      setErro("falha de conexão")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      {/* Bolha */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-background-secondary shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {aberto ? (
          <X className="h-5 w-5 text-text-primary" />
        ) : (
          <Image
            src="/mascote-nexus.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
        )}
      </button>

      {/* Painel */}
      {aberto && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-2xl">
          <header className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3">
            <Image
              src="/mascote-nexus.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Assistente
              </p>
              <p className="truncate text-[11px] text-text-muted">
                Ideias e estratégia da sua marca
              </p>
            </div>
            {mensagens.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMensagens([])
                  setErro(null)
                }}
                className="ml-auto shrink-0 text-[11px] text-text-muted hover:text-text-primary"
              >
                Limpar
              </button>
            )}
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5">
            {mensagens.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-text-secondary">
                  Pergunta o que quiser sobre o conteúdo da sua marca — pauta,
                  ângulo, o que postar. Não falo de plano nem cobrança; isso é
                  com o suporte.
                </p>
                <div className="space-y-1.5">
                  {ATALHOS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => void enviar(a)}
                      className="block w-full rounded-lg border border-border-subtle px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:border-brand-500/50 hover:text-text-primary"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-background-tertiary/60 text-text-secondary"
                  }`}
                >
                  {m.role === "assistant" ? comNegrito(m.content) : m.content}
                </div>
              </div>
            ))}

            {carregando && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Pensando...
              </div>
            )}
            {erro && <p className="text-xs text-danger">{erro}</p>}
            <div ref={fimRef} />
          </div>

          <div className="border-t border-border-subtle p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onKeyDown={(e) => {
                  // Enter envia; Shift+Enter quebra linha — padrão de chat.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void enviar(rascunho)
                  }
                }}
                rows={1}
                placeholder="Pergunte alguma coisa"
                className="max-h-28 flex-1 resize-none rounded-xl border border-border-subtle bg-background-tertiary/40 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void enviar(rascunho)}
                disabled={!rascunho.trim() || carregando}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
