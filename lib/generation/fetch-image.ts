// =====================================================================
// lib/generation/fetch-image.ts
// Baixa uma imagem e devolve em base64 pra mandar INLINE pro Claude.
//
// Por que existe: mandar `{ type: "image", source: { type: "url", ... } }`
// delega o download pra Anthropic — e a Anthropic NÃO consegue baixar
// upload.wikimedia.org. A chamada volta com
//   invalid_request_error: "Unable to download the file."
// e, no `composeSpec`, isso não aparece como erro de imagem: conta como falha
// de rede, queima as 3 tentativas e devolve `null`. O post cai calado no
// skeleton de 2 blocos.
//
// Ou seja: TODA peça de foto real (a rota de melhor qualidade, capa de sujeito
// nomeável) nunca chegou a ser composta. Baixar aqui e mandar inline é o que
// devolve essa rota ao produto.
//
// O mesmo endereço baixa normalmente por curl — o bloqueio é do fetcher da
// Anthropic, não do Wikimedia. Por isso mandamos um User-Agent descritivo,
// que é o que a política de bots do Wikimedia pede de quem consome os assets.
// =====================================================================

/** Formatos que a API de visão aceita. */
export type InlineMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"

export interface InlineImage {
  data: string
  mediaType: InlineMediaType
}

/**
 * Teto de 5 MB da API — acima disso a chamada é recusada. Cortar aqui evita
 * gastar a chamada pra descobrir do outro lado.
 */
const MAX_BYTES = 5 * 1024 * 1024

const UA =
  "NexusContentBot/1.0 (https://syncpost.com.br; contato@syncpost.com.br) node-fetch"

function normalizeMediaType(raw: string | null): InlineMediaType | null {
  const t = (raw ?? "").split(";")[0].trim().toLowerCase()
  if (t === "image/jpeg" || t === "image/jpg") return "image/jpeg"
  if (t === "image/png") return "image/png"
  if (t === "image/gif") return "image/gif"
  if (t === "image/webp") return "image/webp"
  return null
}

/**
 * Baixa a imagem e devolve base64. `null` em QUALQUER falha — quem chama
 * degrada pro bloco de URL, que é o comportamento antigo. Um problema de
 * download não pode derrubar a geração inteira.
 */
export async function fetchImageAsBase64(
  url: string,
  timeoutMs = 15_000,
): Promise<InlineImage | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) {
      console.warn(`[fetch-image] HTTP ${res.status} em ${url.slice(0, 80)}`)
      return null
    }

    const mediaType = normalizeMediaType(res.headers.get("content-type"))
    if (!mediaType) {
      console.warn(
        `[fetch-image] content-type não suportado: ${res.headers.get("content-type")}`,
      )
      return null
    }

    // Checa o Content-Length antes de materializar o corpo quando o servidor
    // informa — evita puxar 40 MB pra descobrir que não cabe.
    const declared = Number(res.headers.get("content-length") ?? "0")
    if (declared > MAX_BYTES) {
      console.warn(`[fetch-image] imagem grande demais (${declared} bytes)`)
      return null
    }

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > MAX_BYTES) {
      console.warn(`[fetch-image] imagem grande demais (${buf.byteLength} bytes)`)
      return null
    }
    if (buf.byteLength === 0) return null

    return { data: buf.toString("base64"), mediaType }
  } catch (err) {
    console.warn(`[fetch-image] falhou em ${url.slice(0, 80)}:`, err)
    return null
  }
}

/**
 * Monta o bloco de imagem pro Claude: base64 quando o download der certo, URL
 * quando não der. Degradar pra URL mantém exatamente o comportamento anterior
 * — não piora nada em nenhum caso.
 */
export async function imageBlockFor(url: string): Promise<{
  type: "image"
  source:
    | { type: "base64"; media_type: InlineMediaType; data: string }
    | { type: "url"; url: string }
}> {
  const inline = await fetchImageAsBase64(url)
  return inline
    ? {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: inline.mediaType,
          data: inline.data,
        },
      }
    : { type: "image" as const, source: { type: "url" as const, url } }
}
