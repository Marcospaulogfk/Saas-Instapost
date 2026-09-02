// =====================================================================
// Base absoluta do app + montagem da URL do editor, pros dois lados da
// Ponte (a Ponte, 01/09/2026): o GET /status usa pra devolver `editor_url`
// pro card do CRM, e a geração automática (gerar-arte.ts → avisar-crm.ts)
// usa a mesma função pra avisar o CRM assim que a arte fica pronta. Extraído
// de app/api/webhooks/websync-os/status/route.ts pra não ter duas fórmulas
// de URL que podem divergir — se a rota do editor mudar, muda aqui só.
// =====================================================================

export type ArtifactType = "single_post" | "carousel"

/** Base absoluta do app. Env manda; o host de produção é o último recurso. */
export function editorBase(): string {
  const raw =
    process.env.WEBSYNC_EDITOR_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.nexuscontentai.com.br"
  return raw.replace(/\/+$/, "")
}

/** URL absoluta do editor pra um artefato — o CRM nunca monta essa URL sozinho. */
export function editorUrlFor(type: ArtifactType, id: string): string {
  const base = editorBase()
  return type === "single_post"
    ? `${base}/dashboard/editor/post-unico?post=${id}`
    : `${base}/dashboard/carrossel?id=${id}`
}
