/**
 * Helpers de CLIENT pra publicar no Instagram: a API da Meta só aceita URLs
 * públicas, e a arte final (texto + marca + foto) só existe como HTML no
 * preview. Então o caminho é sempre: html-to-image → PNG → upload → URL.
 *
 * Sem isso o que ia pro feed era a foto de fundo crua, sem texto nenhum.
 */

/** Sobe um PNG (data URL) pro storage público e devolve a URL. Lança em falha. */
export async function uploadPngDataUrl(dataUrl: string, name: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const fd = new FormData()
  fd.append("file", new File([blob], name, { type: "image/png" }))
  const res = await fetch("/api/editorial/upload-image", { method: "POST", body: fd })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.success || typeof data.url !== "string") {
    throw new Error(data?.error || "falha ao hospedar a imagem pra publicar")
  }
  return data.url
}

/** Renderiza um nó do DOM em PNG no tamanho final do Instagram. */
export async function renderNodeToPng(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  const { toPng } = await import("html-to-image")
  return toPng(node, {
    cacheBust: true,
    // Sem isso a chave de cache do html-to-image ignora a query string e toda
    // imagem proxiada (/api/proxy-image?url=…) colide numa chave só.
    includeQueryParams: true,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio: 1,
  })
}
