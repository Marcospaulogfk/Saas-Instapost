"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Loader2, Instagram, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  /**
   * Produz as URLs PÚBLICAS das artes finais, na ordem, só na hora de
   * publicar. É callback (e não lista pronta) porque a arte final só existe
   * como HTML no preview: o editor renderiza em PNG, hospeda e devolve as
   * URLs. Lança com mensagem legível se algo falhar. `onProgress` (opcional)
   * recebe quantas já ficaram prontas, pra tela dizer em que slide está.
   */
  getImageUrls: (onProgress?: (feitas: number, total: number) => void) => Promise<string[]>
  /** Quantas imagens vão ser publicadas (só pra mostrar no modal). */
  imageCount: number
  caption: string
  /** Rótulo do conteúdo na mensagem de sucesso. */
  kind?: "carrossel" | "post"
  /** Texto do botão. No celular o editor usa "Publicar" (cabe na barra de baixo). */
  label?: string
  /** Classes extras do botão (ex.: largura total na barra do celular). */
  className?: string
  /**
   * A peça salva. Liga a publicação à pauta do calendário: publicou aqui, a
   * pauta vira 'publicado' e o agendamento não publica de novo.
   */
  tipo?: "carousel" | "single_post"
  pecaId?: string | null
  /** Peça em formato Stories: sai nos stories, uma imagem por story, sem legenda. */
  comoStory?: boolean
}

interface Status {
  connected: boolean
  username: string | null
  configured: boolean
}

/** Sem nenhum slide novo pronto por este tempo, a tela avisa que está demorando. */
const ALERTA_PARADO_MS = 45_000

/**
 * Recado de erro dentro do quadro. O motivo que vem do OAuth
 * (?ig=erro&motivo=...) é uma frase comprida com palavras coladas tipo
 * ig_oauth_state: sem break-words ela vazava pra fora da caixa.
 */
function Aviso({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-destructive break-words whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
      {children}
    </p>
  )
}

/**
 * Botão "Publicar no Instagram" + modal de conexão/publicação.
 * REAL: usa os endpoints /api/instagram/* (OAuth Instagram Login + publish).
 * Se o app da Meta ainda não está configurado (env ausente), mostra estado
 * honesto de "em configuração" em vez de simular.
 */
export function PublishToInstagram({
  getImageUrls,
  imageCount,
  caption,
  kind = "carrossel",
  label,
  className,
  tipo,
  pecaId,
  comoStory = false,
}: Props) {
  const rotulo = label ?? (comoStory ? "Publicar nos stories" : "Publicar no Instagram")
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState<"render" | "publish" | "disconnect" | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Recado de "este post já saiu": publicar de novo só com um segundo clique.
  const [repetir, setRepetir] = useState<string | null>(null)
  // As artes já montadas: confirmar a repetição não monta tudo outra vez.
  const urlsMontadas = useRef<string[] | null>(null)
  // Aba em segundo plano: o navegador congela a renderização das artes e o
  // botão ficava cinza em "Preparando…" sem ninguém saber por quê.
  const [abaEscondida, setAbaEscondida] = useState(false)
  // Andamento da montagem das artes. `desde` é o último instante em que algo
  // andou: se passar de ALERTA_PARADO_MS sem mexer, a tela avisa em vez de
  // deixar o botão cinza sem explicação.
  const [progresso, setProgresso] = useState<{ feitas: number; total: number; desde: number } | null>(null)
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (busy !== "render") return
    const t = window.setInterval(() => setAgora(Date.now()), 3000)
    return () => window.clearInterval(t)
  }, [busy])

  useEffect(() => {
    const on = () => setAbaEscondida(document.hidden)
    on()
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])

  // Mostra resultado do OAuth (redirect ?ig=ok|erro) ao voltar.
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const ig = p.get("ig")
    if (ig === "ok") {
      setOpen(true)
    } else if (ig === "erro") {
      setOpen(true)
      // Mesmo motivo da tela de métricas: o erro precisa aparecer pra alguém.
      const motivo = p.get("motivo")
      setError(
        motivo
          ? `Não deu pra conectar o Instagram. Motivo: ${motivo}`
          : "Não deu pra conectar o Instagram. Tente de novo.",
      )
    }
    if (ig) {
      p.delete("ig")
      const qs = p.toString()
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""))
    }
  }, [])

  useEffect(() => {
    if (!open) return
    fetch("/api/instagram/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, username: null, configured: false }))
  }, [open])

  async function handlePublish(forcar = false) {
    setError(null)
    setRepetir(null)
    try {
      let imageUrls = forcar ? urlsMontadas.current : null
      if (!imageUrls) {
        setBusy("render")
        // Primeiro a arte final vira PNG hospedado; só então a Meta recebe.
        setProgresso({ feitas: 0, total: imageCount, desde: Date.now() })
        imageUrls = await getImageUrls((feitas, total) =>
          setProgresso({ feitas, total, desde: Date.now() }),
        )
      }
      if (!imageUrls.length) {
        setError("Nenhuma imagem pronta pra publicar.")
        return
      }
      urlsMontadas.current = imageUrls
      setBusy("publish")
      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls, caption, tipo, pecaId, forcar, comoStory }),
      })
      const data = await res.json()
      if (res.status === 409 && data.erro === "ja_publicado") {
        setRepetir(data.error || "Este post já foi publicado no Instagram.")
        return
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "Falha ao publicar.")
        return
      }
      setDone(true)
    } catch (e) {
      // A captura da arte pode rejeitar com um Event (foto que não carregou),
      // que não é Error: antes virava "Erro de rede." sem dizer o que fazer.
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Não deu pra montar as artes: uma das fotos não carregou. Troque ou tire a foto que estiver quebrada no editor e tente de novo.",
      )
    } finally {
      setBusy(null)
      setProgresso(null)
    }
  }

  async function handleDisconnect() {
    setBusy("disconnect")
    await fetch("/api/instagram/status", { method: "DELETE" }).catch(() => {})
    setStatus({ connected: false, username: null, configured: status?.configured ?? true })
    setBusy(null)
  }

  function reset() {
    setOpen(false)
    setDone(false)
    setError(null)
    setRepetir(null)
    urlsMontadas.current = null
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Instagram className="w-3.5 h-3.5 mr-1.5" />
        {rotulo}
      </Button>

      {/* No body, e nao aqui dentro: as barras do editor (topo no computador,
          base no celular) tem backdrop-blur, e o blur faz o "fixed" do quadro
          contar a partir da barra, nao da janela. O quadro ficava espremido na
          barra, a area dos slides por cima, e o "Publicar agora" aparecia mas
          o clique caia nos slides (relato do Reinaldo de 13/10). */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={reset}
        >
          {/* max-h + scroll: com recado de erro comprido o quadro crescia, e
              como ele é centralizado na tela o topo (título e X de fechar)
              saía pra fora. */}
          <div
            className="bg-background border border-border rounded-xl max-w-md w-full p-5 space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Instagram className="w-4 h-4 text-brand-400" />
                {comoStory ? "Publicar nos stories" : "Publicar no Instagram"}
              </h2>
              <button
                type="button"
                onClick={reset}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="space-y-3 text-center py-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-text-primary font-medium">
                  Publicado no Instagram
                </p>
                <p className="text-xs text-text-secondary">
                  {comoStory
                    ? "Enviado pra sua conta. Pode levar alguns segundos pra aparecer nos stories."
                    : `O ${kind} foi enviado pra sua conta. Pode levar alguns segundos pra aparecer no feed.`}
                </p>
                <Button type="button" className="w-full" onClick={reset}>
                  Entendi
                </Button>
              </div>
            ) : !status ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            ) : !status.configured ? (
              <div className="space-y-2 py-2">
                <p className="text-sm text-text-primary">
                  Publicação direta em configuração
                </p>
                <p className="text-xs text-text-secondary">
                  Estamos finalizando a integração oficial com a Meta. Por
                  enquanto, use <strong>Baixar carrossel (ZIP)</strong> e poste
                  pelo app do Instagram — em breve dá pra publicar direto daqui.
                </p>
              </div>
            ) : !status.connected ? (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Conecte sua conta do Instagram (Business ou Creator) pra
                  publicar direto daqui.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    // returnTo: o callback devolve pra ESTA página (o post
                    // único não pode cair no editor de carrossel).
                    const back = window.location.pathname + window.location.search
                    window.location.href = `/api/instagram/connect?returnTo=${encodeURIComponent(back)}`
                  }}
                >
                  <Instagram className="w-4 h-4 mr-1.5" />
                  Conectar Instagram
                </Button>
                {error && <Aviso>{error}</Aviso>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-background-tertiary/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-brand-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        @{status.username || "conta"}
                      </p>
                      <p className="text-[10px] text-emerald-400">Conectado</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={busy !== null}
                    className="text-[10px] text-text-muted hover:text-destructive"
                  >
                    Desconectar
                  </button>
                </div>

                {imageCount === 0 ? (
                  <Aviso>
                    Este {kind} está sem slides, então não há o que publicar.
                    Feche esta janela e adicione ao menos um slide no editor.
                    Se os slides tinham sumido, recarregue a página.
                  </Aviso>
                ) : (
                  <p className="text-xs text-text-secondary">
                    {comoStory
                      ? `${imageCount === 1 ? "1 story pronto" : `${imageCount} stories prontos`} pra publicar. Story não leva legenda.`
                      : `${imageCount} imagem(ns) + legenda prontos pra publicar.`}
                  </p>
                )}
                {busy === "render" && (
                  <p className="text-xs text-text-secondary">
                    {abaEscondida
                      ? "A preparação pausou porque esta aba está em segundo plano. Volte pra esta aba pra ela continuar."
                      : progresso && progresso.total > 0
                        ? `Montando o slide ${Math.min(progresso.feitas + 1, progresso.total)} de ${progresso.total}. Deixe esta aba aberta e à frente.`
                        : "Montando cada arte. Pode levar até alguns minutos: deixe esta aba aberta e à frente."}
                  </p>
                )}
                {busy === "render" && !abaEscondida && progresso && agora - progresso.desde > ALERTA_PARADO_MS && (
                  <Aviso>
                    Está demorando mais que o normal neste slide. Se não andar
                    em mais um minuto, feche esta janela, recarregue a página e
                    tente de novo. Se repetir, mande este recado pro suporte:
                    “travou no slide {Math.min(progresso.feitas + 1, progresso.total)}”.
                  </Aviso>
                )}

                {repetir ? (
                  <div className="space-y-3">
                    {/* Âmbar e não vermelho: não deu erro, é uma pergunta. */}
                    <p className="text-xs text-amber-300 break-words rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                      {repetir}
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={reset}>
                        Não publicar
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => handlePublish(true)}
                        disabled={busy !== null}
                      >
                        Publicar de novo
                      </Button>
                    </div>
                  </div>
                ) : (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => handlePublish()}
                  disabled={busy !== null || imageCount === 0}
                >
                  {busy === "render" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Preparando as artes…
                    </>
                  ) : busy === "publish" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Publicando…
                    </>
                  ) : (
                    <>
                      <Instagram className="w-4 h-4 mr-1.5" />
                      Publicar agora
                    </>
                  )}
                </Button>
                )}
                {error && <Aviso>{error}</Aviso>}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
