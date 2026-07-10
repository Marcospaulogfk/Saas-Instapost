"use client"

import { useEffect, useState } from "react"
import { Loader2, Instagram, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  /** URLs públicas das imagens dos slides (na ordem). */
  imageUrls: string[]
  caption: string
}

interface Status {
  connected: boolean
  username: string | null
  configured: boolean
}

/**
 * Botão "Publicar no Instagram" + modal de conexão/publicação.
 * REAL: usa os endpoints /api/instagram/* (OAuth Instagram Login + publish).
 * Se o app da Meta ainda não está configurado (env ausente), mostra estado
 * honesto de "em configuração" em vez de simular.
 */
export function PublishToInstagram({ imageUrls, caption }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState<"publish" | "disconnect" | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mostra resultado do OAuth (redirect ?ig=ok|erro) ao voltar.
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = new URLSearchParams(window.location.search)
    const ig = p.get("ig")
    if (ig === "ok") {
      setOpen(true)
    } else if (ig === "erro") {
      setOpen(true)
      setError("Não deu pra conectar o Instagram. Tente de novo.")
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

  async function handlePublish() {
    setBusy("publish")
    setError(null)
    try {
      const res = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls, caption }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || "Falha ao publicar.")
        return
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de rede.")
    } finally {
      setBusy(null)
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
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Instagram className="w-3.5 h-3.5 mr-1.5" />
        Publicar no Instagram
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={reset}
        >
          <div
            className="bg-background border border-border rounded-xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Instagram className="w-4 h-4 text-brand-400" />
                Publicar no Instagram
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
                  Publicado no Instagram ✅
                </p>
                <p className="text-xs text-text-secondary">
                  O carrossel foi enviado pra sua conta. Pode levar alguns
                  segundos pra aparecer no feed.
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
                  Publicação direta em configuração 🛠️
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
                    window.location.href = "/api/instagram/connect"
                  }}
                >
                  <Instagram className="w-4 h-4 mr-1.5" />
                  Conectar Instagram
                </Button>
                {error && <p className="text-xs text-destructive">{error}</p>}
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

                <p className="text-xs text-text-secondary">
                  {imageUrls.length} imagem(ns) + legenda prontos pra publicar.
                </p>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handlePublish}
                  disabled={busy !== null || imageUrls.length === 0}
                >
                  {busy === "publish" ? (
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
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
