"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Maximize2, Minimize2, Send, Trash2, X } from "lucide-react"

/**
 * Nexus — assistente de conteúdo. Bolha fixa presente em todo o dashboard.
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

interface Props {
  /** Nome da marca ativa — vira o subtítulo do cabeçalho do chat. */
  marcaAtiva?: string | null
}

export function AssistenteBolha({ marcaAtiva = null }: Props) {
  const [aberto, setAberto] = useState(false)
  const [ampliado, setAmpliado] = useState(false)
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
      {/* Bolha: mascote grande + CTA. Só o ícone não dizia o que era — quem
          nunca clicou não descobria que ali mora um assistente. */}
      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Falar com o Nexus"
          className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-border-subtle bg-background-secondary/95 py-1.5 pl-1.5 pr-4 shadow-xl backdrop-blur transition-all hover:border-brand-500/60 hover:shadow-2xl active:scale-95"
        >
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <Image
              src="/mascote-nexus.png"
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 object-contain transition-transform group-hover:scale-105"
              priority
            />
            {/* Ponto de "disponível" — o mesmo sinal de chat de suporte. */}
            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-background-secondary bg-success" />
          </span>
          <span className="text-sm font-semibold text-text-primary">
            Fale com o Nexus
          </span>
        </button>
      )}

      {/* Painel */}
      {aberto && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary shadow-2xl ${
            ampliado
              ? "h-[calc(100vh-2.5rem)] w-[min(560px,calc(100vw-2.5rem))]"
              : "h-[min(600px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-2.5rem))]"
          }`}
        >
          <header className="flex items-center gap-2.5 border-b border-border-subtle bg-background-tertiary/40 px-4 py-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600/15">
              <Image
                src="/mascote-nexus.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background-secondary bg-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">Nexus</p>
              <p className="truncate text-[11px] text-text-muted">
                {marcaAtiva ? `Assistente · ${marcaAtiva}` : "Assistente de conteúdo"}
              </p>
            </div>
            {mensagens.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMensagens([])
                  setErro(null)
                }}
                aria-label="Limpar conversa"
                title="Limpar conversa"
                className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setAmpliado((v) => !v)}
              aria-label={ampliado ? "Reduzir" : "Ampliar"}
              title={ampliado ? "Reduzir" : "Ampliar"}
              className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
            >
              {ampliado ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar assistente"
              title="Fechar"
              className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
            {mensagens.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <Image
                    src="/mascote-nexus.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 object-contain"
                  />
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-background-tertiary/60 px-3.5 py-2.5 text-sm leading-relaxed text-text-secondary">
                    Oi, eu sou o Nexus. Pergunta o que quiser sobre o conteúdo da
                    sua marca — pauta, ângulo, o que postar. Não falo de plano nem
                    cobrança; isso é com o suporte.
                  </div>
                </div>
                <div className="space-y-1.5 pl-9">
                  {ATALHOS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => void enviar(a)}
                      className="block w-full rounded-xl border border-border-subtle px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:border-brand-500/50 hover:text-text-primary"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <Image
                    src="/mascote-nexus.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 object-contain"
                  />
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-background-tertiary/60 px-3.5 py-2.5 text-sm leading-relaxed text-text-secondary">
                    {comNegrito(m.content)}
                  </div>
                </div>
              ),
            )}

            {carregando && (
              <div className="flex items-center gap-2 pl-9 text-xs text-text-muted">
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
                placeholder="Digite sua mensagem..."
                className="max-h-28 flex-1 resize-none rounded-full border border-border-subtle bg-background-tertiary/40 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void enviar(rascunho)}
                disabled={!rascunho.trim() || carregando}
                aria-label="Enviar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
