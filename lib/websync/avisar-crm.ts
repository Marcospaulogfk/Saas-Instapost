import { editorUrlFor } from "@/lib/websync/editor-url"

// =====================================================================
// Avisa o CRM (WebSync-OS) que uma arte terminou de nascer sozinha aqui
// (a Ponte, geração automática — 01/09/2026).
//
// Hoje o CRM descobre isso fazendo polling em GET /status. Isso continua
// funcionando — este aviso é só pra ele não precisar esperar o próximo
// tick do polling pra mover o card. BEST-EFFORT: se o CRM estiver fora do
// ar, sem env configurada, ou responder erro, a arte já está salva e
// `pronto` de qualquer forma — não vale a pena arriscar o fluxo por causa
// de um POST que é só um atalho de UX.
// =====================================================================

const SECRET_HEADER = "x-websync-secret"
const TIMEOUT_MS = 10_000

export interface AvisoArteCrm {
  externo_id: string
  artifact_type: "carousel"
  artifact_id: string
  thumb_url: string | null
}

export async function avisarCrmArtePronta(aviso: AvisoArteCrm): Promise<void> {
  const base = (process.env.WEBSYNC_CRM_URL || process.env.NEXT_PUBLIC_CRM_URL || "").replace(
    /\/+$/,
    "",
  )
  const secret = process.env.WEBSYNC_WEBHOOK_SECRET
  if (!base || !secret) {
    console.info(
      "[websync-os/gerar] WEBSYNC_CRM_URL/NEXT_PUBLIC_CRM_URL ou WEBSYNC_WEBHOOK_SECRET ausente — aviso ao CRM pulado (o /status ainda encontra a arte no próximo polling)",
    )
    return
  }

  try {
    const res = await fetch(`${base}/api/cockpit/conteudo/arte`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [SECRET_HEADER]: secret,
      },
      body: JSON.stringify({
        externo_id: aviso.externo_id,
        artifact_type: aviso.artifact_type,
        artifact_id: aviso.artifact_id,
        editor_url: editorUrlFor(aviso.artifact_type, aviso.artifact_id),
        thumb_url: aviso.thumb_url,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    console.log(
      `[websync-os/gerar] aviso ao CRM (pauta ${aviso.externo_id.slice(0, 8)}): HTTP ${res.status}`,
    )
  } catch (err) {
    console.warn(
      `[websync-os/gerar] aviso ao CRM falhou (pauta ${aviso.externo_id.slice(0, 8)}):`,
      err instanceof Error ? err.message : err,
    )
  }
}
