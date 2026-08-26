"use client"

import { useEffect, useState } from "react"
import { FreePostRenderer } from "@/components/single-posts/free-post-renderer"
import type { FreePostSpec } from "@/lib/single-posts/free-spec"

// =============================================================================
// Página DEV-ONLY do piloto bitmap → spec editável: original do nano-banana à
// esquerda, spec renderizado à direita, mesmo tamanho, pro juiz comparar.
// Apagar junto com app/api/dev/pilot quando o piloto terminar.
// =============================================================================

interface PilotState {
  artUrl?: string
  cleanUrl?: string
  spec?: FreePostSpec
  log: string[]
}

export default function PilotPage() {
  const [state, setState] = useState<PilotState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dev/pilot", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setState(d)))
      .catch((e) => setError(String(e)))
  }, [])

  // Captura: renderiza o spec em PNG 1080x1350 (mesmo caminho do export do
  // produto) e manda pro disco via API — o juiz lê o arquivo. Exposta em
  // window.__pilotCapture pra rodar sob demanda via devtools/automação.
  useEffect(() => {
    if (!state?.spec) return
    const capture = async (): Promise<string> => {
      try {
        const node = document.querySelector<HTMLElement>("[data-pilot-render]")
        if (!node) return "sem node"
        const { toPng } = await import("html-to-image")
        const dataUrl = await toPng(node, {
          cacheBust: true,
          includeQueryParams: true,
          canvasWidth: 1080,
          canvasHeight: 1350,
          pixelRatio: 1,
        })
        const r = await fetch("/api/dev/pilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-render", dataUrl }),
        })
        const msg = `render.png salvo (status ${r.status})`
        setCaptured(msg)
        return msg
      } catch (e) {
        const msg = `captura falhou: ${e instanceof Error ? e.message : e}`
        setCaptured(msg)
        return msg
      }
    }
    ;(window as unknown as Record<string, unknown>).__pilotCapture = capture
    const t = setTimeout(capture, 2500)
    return () => clearTimeout(t)
  }, [state])

  if (error) return <p style={{ padding: 24, color: "red" }}>{error}</p>
  if (!state) return <p style={{ padding: 24 }}>carregando...</p>

  // ?only=render: página vira SÓ o canvas em 1080px, pro screenshot headless
  // (chrome --headless --screenshot --window-size=1080,1350).
  const only =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("only")
  if (only === "render" && state.spec) {
    return (
      <div style={{ width: 1080, height: 1350, overflow: "hidden" }} data-pilot-render>
        {/* esconde o badge de dev do Next no screenshot headless */}
        <style>{`nextjs-portal{display:none}`}</style>
        <FreePostRenderer spec={state.spec} format="post" />
      </div>
    )
  }

  const W = 540

  return (
    <div style={{ padding: 16, background: "#111", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
            ORIGINAL (nano-banana)
          </figcaption>
          {state.artUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.artUrl} alt="original" width={W} style={{ display: "block" }} />
          ) : (
            <p style={{ color: "#888" }}>sem arte ainda</p>
          )}
        </figure>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
            SPEC EDITÁVEL (render)
          </figcaption>
          {state.spec ? (
            <div style={{ width: W }} data-pilot-render>
              <FreePostRenderer spec={state.spec} format="post" />
            </div>
          ) : (
            <p style={{ color: "#888" }}>sem spec ainda</p>
          )}
        </figure>
        <figure style={{ margin: 0 }}>
          <figcaption style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
            CLEAN PLATE
          </figcaption>
          {state.cleanUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.cleanUrl} alt="clean" width={260} style={{ display: "block" }} />
          ) : (
            <p style={{ color: "#888" }}>sem clean plate</p>
          )}
        </figure>
      </div>
      <pre style={{ color: "#6a6", fontSize: 11, marginTop: 12 }}>
        {state.log.join("\n")}
        {captured ? `\n${captured}` : ""}
      </pre>
    </div>
  )
}
