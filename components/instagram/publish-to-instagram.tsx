"use client"

import { useEffect, useState } from "react"
import { Loader2, Instagram, Check, X, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type InstagramConnection,
  getInstagramConnection,
  connectInstagramMock,
  disconnectInstagram,
  publishToInstagramMock,
} from "@/lib/instagram/publish"

interface Props {
  /** URLs públicas das imagens dos slides (na ordem). */
  imageUrls: string[]
  caption: string
}

/**
 * Botão "Publicar no Instagram" + modal de conexão/publicação.
 * ESQUELETO: conexão e publicação são mockadas (ver lib/instagram/publish.ts).
 */
export function PublishToInstagram({ imageUrls, caption }: Props) {
  const [open, setOpen] = useState(false)
  const [conn, setConn] = useState<InstagramConnection | null>(null)
  const [handle, setHandle] = useState("")
  const [busy, setBusy] = useState<"connect" | "publish" | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setConn(getInstagramConnection())
  }, [open])

  async function handleConnect() {
    if (handle.trim().length < 2) {
      setError("Digite o @ da conta")
      return
    }
    setBusy("connect")
    setError(null)
    const c = await connectInstagramMock(handle)
    setConn(c)
    setBusy(null)
  }

  async function handlePublish() {
    setBusy("publish")
    setError(null)
    const res = await publishToInstagramMock({ imageUrls, caption })
    setBusy(null)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDone(true)
  }

  function reset() {
    setOpen(false)
    setDone(false)
    setError(null)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
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
                  Publicação simulada com sucesso ✅
                </p>
                <p className="text-xs text-text-secondary">
                  A publicação real será ativada quando o app da Meta for
                  aprovado. Por enquanto, o fluxo está validado de ponta a ponta.
                </p>
                <Button type="button" className="w-full" onClick={reset}>
                  Entendi
                </Button>
              </div>
            ) : !conn ? (
              // --- Conectar conta (mock) ---
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Conecte a conta do Instagram pra publicar direto daqui. (Conta
                  Business/Creator vinculada a uma Página do Facebook.)
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center rounded-md border border-border-subtle bg-background-tertiary/40 px-2">
                    <span className="text-text-muted text-sm">@</span>
                    <Input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="suaconta"
                      className="border-0 bg-transparent h-9 px-1 focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleConnect}
                    disabled={busy !== null}
                  >
                    {busy === "connect" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-text-muted">
                  ⚠️ Conexão mockada (esqueleto). O login real via Meta entra
                  quando o app for aprovado.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            ) : (
              // --- Conectado → publicar ---
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-background-tertiary/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-brand-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        @{conn.username}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {conn.pendingMetaReview
                          ? "Aguardando aprovação da Meta"
                          : "Conectado"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      disconnectInstagram()
                      setConn(null)
                    }}
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
                  disabled={busy !== null}
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
                <p className="text-[10px] text-text-muted">
                  ⚠️ Publicação simulada por ora — vira real após o App Review da
                  Meta.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
